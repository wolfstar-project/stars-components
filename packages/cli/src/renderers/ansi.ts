const ESC = '\u001B[';

export const ansi = {
	enterAlternateScreen: `${ESC}?1049h`,
	exitAlternateScreen: `${ESC}?1049l`,
	hideCursor: `${ESC}?25l`,
	showCursor: `${ESC}?25h`,
	cursorHome: `${ESC}H`,
	eraseLine: `${ESC}K`,
	eraseDown: `${ESC}J`,
	clearScreen: `${ESC}2J`
} as const;

// CSI sequences (colours, cursor movement) and OSC sequences (hyperlinks, titles).
// oxlint-disable-next-line no-control-regex
const ANSI_PATTERN = /\u001B(?:\[[0-?]*[ -/]*[@-~]|\][^\u0007\u001B]*(?:\u0007|\u001B\\))/g;

export function stripAnsi(text: string): string {
	return text.replace(ANSI_PATTERN, '');
}

/**
 * Approximate display width: strips escapes and counts code points, treating wide CJK/emoji as 2 cells.
 */
export function displayWidth(text: string): number {
	let width = 0;
	for (const character of stripAnsi(text)) {
		const code = character.codePointAt(0)!;
		if (code < 0x20 || (code >= 0x7f && code < 0xa0) || (code >= 0x300 && code <= 0x36f) || code === 0xfe0f) continue;
		width += isWide(code) ? 2 : 1;
	}
	return width;
}

/**
 * Truncates text to `width` cells, appending `…` when cut. Escapes are stripped from truncated text.
 */
export function truncate(text: string, width: number): string {
	if (width <= 0) return '';
	if (displayWidth(text) <= width) return text;

	let result = '';
	let used = 0;
	for (const character of stripAnsi(text)) {
		const characterWidth = isWide(character.codePointAt(0)!) ? 2 : 1;
		if (used + characterWidth > width - 1) break;
		result += character;
		used += characterWidth;
	}
	return `${result}…`;
}

/**
 * Pads (or truncates) a line to exactly `width` cells.
 */
export function fit(text: string, width: number): string {
	const truncated = truncate(text, width);
	const missing = width - displayWidth(truncated);
	return missing > 0 ? `${truncated}${' '.repeat(missing)}` : truncated;
}

function isWide(code: number): boolean {
	return (
		(code >= 0x1100 && code <= 0x115f) ||
		(code >= 0x2e80 && code <= 0xa4cf) ||
		(code >= 0xac00 && code <= 0xd7a3) ||
		(code >= 0xf900 && code <= 0xfaff) ||
		(code >= 0xfe30 && code <= 0xfe4f) ||
		(code >= 0xff00 && code <= 0xff60) ||
		(code >= 0xffe0 && code <= 0xffe6) ||
		(code >= 0x1f300 && code <= 0x1faff) ||
		(code >= 0x20000 && code <= 0x3fffd)
	);
}
