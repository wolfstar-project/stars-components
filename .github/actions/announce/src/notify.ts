import { createHmac } from 'node:crypto';
import { runUrl, warning } from './actions.ts';

// Signed lifecycle callbacks, after the release notifier of discord.js'
// prepare-release workflow (discordjs/discord.js#11673). A receiver (a Cloudflare
// Worker, or a Discord app such as Ring) can verify where an event came from and
// react to it without holding any Discord or Claude secret itself.

export type ReleaseEvent = 'started' | 'drafted' | 'completed' | 'failed';

export interface Notifier {
	(event: ReleaseEvent, details?: Record<string, unknown>): Promise<void>;
}

interface NotifierOptions {
	url?: string;
	secret?: string;
	mode: string;
	repository: string;
	fetch?: typeof fetch;
	sleep?: (ms: number) => Promise<void>;
}

const RETRY_DELAYS = [500, 1000];

export function sign(secret: string, timestamp: string, body: string): string {
	return `sha256=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`;
}

export function createNotifier(options: NotifierOptions): Notifier {
	const { url, secret } = options;
	const noop: Notifier = async () => {};
	if (!url && !secret) return noop;
	if (!url || !secret) {
		warning('Release callbacks are off: callback-url and callback-secret must be set together.');
		return noop;
	}

	let target: URL;
	try {
		target = new URL(url);
	} catch {
		warning('Release callbacks are off: callback-url is not a valid URL.');
		return noop;
	}
	if (target.protocol !== 'https:' || target.username || target.password) {
		warning('Release callbacks are off: callback-url must be HTTPS and carry no credentials.');
		return noop;
	}

	const send = options.fetch ?? fetch;
	const sleep = options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
	let sequence = 0;

	return async (event, details = {}) => {
		const timestamp = new Date().toISOString();
		const id = crypto.randomUUID();
		const body = JSON.stringify({
			schemaVersion: 1,
			id,
			timestamp,
			sequence: ++sequence,
			event,
			mode: options.mode,
			repository: options.repository,
			runId: process.env.GITHUB_RUN_ID ?? null,
			runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
			runUrl: runUrl(),
			workflow: process.env.GITHUB_WORKFLOW ?? null,
			...details
		});
		const headers = {
			'content-type': 'application/json',
			'user-agent': 'wolfstar-announce-action',
			'x-release-delivery': id,
			'x-release-timestamp': timestamp,
			'x-release-signature-256': sign(secret, timestamp, body)
		};

		for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
			try {
				const response = await send(target, {
					method: 'POST',
					headers,
					body,
					redirect: 'error',
					signal: AbortSignal.timeout(5000)
				});
				if (response.ok) return;
				if (response.status !== 429 && response.status < 500) break;
			} catch {
				// Network error or timeout: retried below.
			}
			const delay = RETRY_DELAYS[attempt];
			if (delay === undefined) break;
			await sleep(delay);
		}
		// The URL is a secret: it never goes into the log.
		warning(`Release callback "${event}" could not be delivered.`);
	};
}
