import { execFile } from 'node:child_process';

/** Called only on an explicit `o` keypress, with no shell interpolation. */
export function openDevUrl(value: string | null): Promise<void> {
	if (!value) return Promise.resolve();
	const url = new URL(value);
	if (url.protocol !== 'http:' && url.protocol !== 'https:') return Promise.reject(new Error('Only HTTP(S) URLs can be opened.'));
	const [command, args] =
		process.platform === 'win32'
			? (['rundll32', ['url.dll,FileProtocolHandler', url.href]] as const)
			: process.platform === 'darwin'
				? (['open', [url.href]] as const)
				: (['xdg-open', [url.href]] as const);
	return new Promise((resolve, reject) =>
		execFile(command, [...args], (error) => (error ? reject(new Error(`Could not open the browser: ${error.message}`)) : resolve()))
	);
}
