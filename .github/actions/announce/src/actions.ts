import { appendFileSync } from 'node:fs';
import { EOL } from 'node:os';

/** Reads an `INPUT_*` variable the composite action sets from its inputs. */
export function input(name: string, fallback = ''): string {
	const value = process.env[`INPUT_${name.toUpperCase().replaceAll('-', '_')}`];
	return value === undefined || value.trim() === '' ? fallback : value.trim();
}

export function booleanInput(name: string, fallback = false): boolean {
	const value = input(name).toLowerCase();
	if (value === '') return fallback;
	return value === 'true' || value === '1' || value === 'yes';
}

export function setOutput(name: string, value: string | number | boolean): void {
	const file = process.env.GITHUB_OUTPUT;
	if (!file) return;
	const text = String(value);
	const delimiter = `ghadelimiter_${crypto.randomUUID()}`;
	appendFileSync(file, `${name}<<${delimiter}${EOL}${text}${EOL}${delimiter}${EOL}`);
}

export function appendSummary(markdown: string): void {
	const file = process.env.GITHUB_STEP_SUMMARY;
	if (file) appendFileSync(file, `${markdown}${EOL}`);
	else console.log(markdown);
}

export function warning(message: string): void {
	console.log(`::warning::${escapeCommand(message)}`);
}

export function notice(message: string): void {
	console.log(`::notice::${escapeCommand(message)}`);
}

function escapeCommand(message: string): string {
	return message.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
}

/** The URL of the current workflow run, or `null` outside GitHub Actions. */
export function runUrl(): string | null {
	const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env;
	if (!GITHUB_SERVER_URL || !GITHUB_REPOSITORY || !GITHUB_RUN_ID) return null;
	return `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`;
}
