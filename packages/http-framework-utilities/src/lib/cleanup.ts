import { container } from '@wolfstar/http-framework';
import { Routes, type APIActionRowComponent, type APIComponentInMessageActionRow } from 'discord-api-types/v10';
import { describeRestError } from './errors.js';
import { disableMessageComponents } from './expire.js';

/**
 * How long an interaction token is used to edit a response, in milliseconds: one minute below Discord's 15-minute
 * token lifetime. Sessions whose only edit credential is the token cap their absolute lifetime at this bound.
 */
export const MaximumTokenLifetime = 14 * 60_000;

/**
 * What happens to the controls of a timed-out message: `'disable'` keeps them greyed out, `'remove'` deletes them.
 */
export type TimeoutBehavior = 'disable' | 'remove';

/**
 * The message a cleanup edits. JSON-serializable, stored in the session.
 */
export interface CleanupTarget {
	/**
	 * The message id, or `'@original'` for the interaction's original response when the real id is unknown.
	 */
	messageId: string;
	channelId: string | null;
	ephemeral: boolean;
}

/**
 * The interaction token a cleanup edits with. Process-local: never stored in a `SessionStore`, never logged.
 */
export interface CleanupCredentials {
	applicationId: string;
	token: string;
	/**
	 * When the token stops being used, in milliseconds since the epoch.
	 */
	tokenExpiresAt: number;
}

export interface CleanupRecord {
	target: CleanupTarget;
	credentials: CleanupCredentials | null;
	/**
	 * The last rendered components, disabled by `'disable'` cleanups.
	 */
	components: APIActionRowComponent<APIComponentInMessageActionRow>[];
	behavior: TimeoutBehavior;
	/**
	 * When to clean up, in milliseconds since the epoch.
	 */
	deadline: number;
	/**
	 * Called at the deadline; return a later deadline to reschedule, or `null` to clean up now.
	 */
	recheck?: () => Promise<number | null>;
	/**
	 * Always called once the record is released (cleanup done, failed, or cancelled).
	 */
	onRelease?: () => void;
}

interface CleanupEntry {
	record: CleanupRecord;
	timer: ReturnType<typeof setTimeout> | null;
}

// `setTimeout` overflows past 2^31 - 1 ms (~24.8 days); longer deadlines are re-armed when the timer fires early.
const MaximumTimerDelay = 2 ** 31 - 1;

const entries = new Map<string, CleanupEntry>();

function arm(sessionId: string, entry: CleanupEntry): void {
	if (entry.timer !== null) clearTimeout(entry.timer);
	const delay = Math.min(Math.max(entry.record.deadline - Date.now(), 0), MaximumTimerDelay);
	entry.timer = setTimeout(() => void fire(sessionId, entry), delay);
	entry.timer.unref?.();
}

function release(entry: CleanupEntry): void {
	if (entry.timer !== null) clearTimeout(entry.timer);
	entry.timer = null;
	try {
		entry.record.onRelease?.();
	} catch (error) {
		container.logger.error('[http-framework-utilities] Failed to release a cleanup record', describeRestError(error));
	}
}

async function fire(sessionId: string, entry: CleanupEntry): Promise<void> {
	entry.timer = null;
	if (entries.get(sessionId) !== entry) return;

	if (Date.now() < entry.record.deadline) return arm(sessionId, entry);

	if (entry.record.recheck) {
		let next: number | null;
		try {
			next = await entry.record.recheck();
		} catch (error) {
			container.logger.error('[http-framework-utilities] Failed to recheck an expiring session', {
				sessionId,
				error: describeRestError(error)
			});
			next = null;
		}

		// Cancelled, replaced, or refreshed while the store was being read.
		if (entries.get(sessionId) !== entry || entry.timer !== null) return;
		if (next !== null && next > Date.now()) {
			entry.record.deadline = next;
			return arm(sessionId, entry);
		}
	}

	await runCleanup(sessionId);
}

/**
 * Schedules the cleanup of a session's message at `record.deadline`, replacing (and releasing) any previous record
 * for the same session. The timer is unref'd and independent of the session store's expiry.
 */
export function scheduleCleanup(sessionId: string, record: CleanupRecord): void {
	const previous = entries.get(sessionId);
	const entry: CleanupEntry = { record, timer: null };
	entries.set(sessionId, entry);
	if (previous !== undefined) release(previous);
	arm(sessionId, entry);
}

/**
 * Moves a scheduled cleanup to a new deadline, optionally with the components now shown. No-op when this process
 * has no record for the session.
 */
export function refreshCleanup(sessionId: string, deadline: number, components?: CleanupRecord['components']): void {
	const entry = entries.get(sessionId);
	if (entry === undefined) return;

	entry.record.deadline = deadline;
	if (components !== undefined) entry.record.components = components;
	arm(sessionId, entry);
}

/**
 * Replaces the components a scheduled cleanup disables, without moving its deadline.
 * @internal
 */
export function updateCleanupComponents(sessionId: string, components: CleanupRecord['components']): void {
	const entry = entries.get(sessionId);
	if (entry !== undefined) entry.record.components = components;
}

/**
 * Releases a session's cleanup record without editing its message.
 */
export function cancelCleanup(sessionId: string): void {
	const entry = entries.get(sessionId);
	if (entry === undefined) return;

	entries.delete(sessionId);
	release(entry);
}

function route(record: CleanupRecord): { path: `/${string}`; auth: boolean } | null {
	const { target, credentials } = record;
	if (credentials !== null && Date.now() < credentials.tokenExpiresAt) {
		return { path: Routes.webhookMessage(credentials.applicationId, credentials.token, target.messageId), auth: false };
	}

	if (!target.ephemeral && target.channelId !== null && target.messageId !== '@original') {
		return { path: Routes.channelMessage(target.channelId, target.messageId), auth: true };
	}

	return null;
}

/**
 * Edits the session's message now and releases its record. Best effort: failures are logged with the session id and
 * a sanitised error, never thrown.
 * @internal Exported for tests; the scheduled timer calls it.
 */
export async function runCleanup(sessionId: string): Promise<void> {
	const entry = entries.get(sessionId);
	if (entry === undefined) return;
	entries.delete(sessionId);

	const { record } = entry;
	try {
		const target = route(record);
		if (target === null) return;

		const body = { components: record.behavior === 'remove' ? [] : disableMessageComponents(record.components) };
		await container.rest.patch(target.path, target.auth ? { body } : { body, auth: false });
	} catch (error) {
		container.logger.error('[http-framework-utilities] Failed to clean up an expired message', { sessionId, error: describeRestError(error) });
	} finally {
		release(entry);
	}
}
