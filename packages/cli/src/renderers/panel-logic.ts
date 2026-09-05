import type { DevStatus } from '../lib/dev-service.js';

export type Badge = 'starting' | 'building' | 'restarting' | 'ready' | 'error';

/**
 * The badge and standing description for the panel's status row, mirroring the states Nuxt CLI v4's own dev panel
 * cycles through (`STARTING`/`BUILDING`/`RESTART`/`READY`/`ERROR`).
 */
export function describeBadge(status: DevStatus): { badge: Badge; note: string } {
	if (status.build === 'building') return { badge: 'building', note: 'compiling changes' };
	if (status.process === 'starting') return { badge: 'starting', note: 'starting the bot' };
	if (status.process === 'stopping') return { badge: 'restarting', note: 'restarting the bot' };
	if (status.build === 'failed') return { badge: 'error', note: 'build failed, waiting for changes' };
	if (status.process === 'crashed') return { badge: 'error', note: 'the bot crashed, press r to restart' };
	if (status.process === 'running') return { badge: 'ready', note: 'watching for changes' };
	return { badge: 'starting', note: 'waiting for the first build' };
}

/** Formats a duration the way a dev session reads it: `mm:ss` under an hour, `h:mm:ss` above. */
export function formatDuration(milliseconds: number): string {
	const total = Math.max(0, Math.floor(milliseconds / 1000));
	const seconds = total % 60;
	const minutes = Math.floor(total / 60) % 60;
	const hours = Math.floor(total / 3600);
	const pad = (value: number) => value.toString().padStart(2, '0');

	return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}
