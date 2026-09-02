/**
 * Formats a duration the way a dev session reads it: `mm:ss` under an hour, `h:mm:ss` above.
 */
export function formatDuration(milliseconds: number): string {
	const total = Math.max(0, Math.floor(milliseconds / 1000));
	const seconds = total % 60;
	const minutes = Math.floor(total / 60) % 60;
	const hours = Math.floor(total / 3600);
	const pad = (value: number) => value.toString().padStart(2, '0');

	return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}
