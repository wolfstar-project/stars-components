import { PassThrough } from 'node:stream';

/**
 * Asks the terminal to report button presses and the wheel (`1000`), with coordinates in the SGR form (`1006`),
 * which is not limited to 223 columns. Motion is left off: nothing here reacts to a hover, and it is one sequence
 * per cell the pointer crosses. A terminal that knows neither ignores both.
 */
export const ENABLE_MOUSE = '\u001B[?1000h\u001B[?1006h';
export const DISABLE_MOUSE = '\u001B[?1006l\u001B[?1000l';

export type MouseButton = 'left' | 'middle' | 'right' | 'none';

export interface MouseEvent {
	kind: 'press' | 'release' | 'wheel';
	/** The button of a press or a release; `none` for the wheel. */
	button: MouseButton;
	/** Where the wheel turned: `-1` up, `1` down, `0` for a button. */
	wheel: -1 | 0 | 1;
	/** The cell under the pointer, counted from 0 at the top-left corner. */
	column: number;
	row: number;
	shift: boolean;
	alt: boolean;
	ctrl: boolean;
}

export type MouseListener = (event: MouseEvent) => void;

// ESC [ < button ; column ; row, then `M` for a press and `m` for a release.
// oxlint-disable-next-line no-control-regex
const SGR_MOUSE = /\u001B\[<(\d+);(\d+);(\d+)([Mm])/g;
/** The start of a report whose end has not arrived yet, at the end of a chunk. */
// oxlint-disable-next-line no-control-regex
const PARTIAL_SGR_MOUSE = /\u001B(?:\[(?:<[\d;]*)?)?$/;
const BUTTONS: readonly MouseButton[] = ['left', 'middle', 'right', 'none'];

/**
 * Splits what the terminal sent into the mouse reports and everything else.
 *
 * @param chunk - A chunk read from the terminal.
 * @returns The mouse events of the chunk, and the chunk without their sequences: the keys the user typed.
 */
export function parseMouse(chunk: string): { events: MouseEvent[]; rest: string } {
	const events: MouseEvent[] = [];
	const rest = chunk.replace(SGR_MOUSE, (_match, code: string, column: string, row: string, final: string) => {
		const bits = Number(code);
		// Bit 5 is motion, which is not asked for; a terminal that sends it anyway is ignored.
		if ((bits & 32) !== 0) return '';

		const wheel = (bits & 64) !== 0;
		const event = {
			column: Number(column) - 1,
			row: Number(row) - 1,
			shift: (bits & 4) !== 0,
			alt: (bits & 8) !== 0,
			ctrl: (bits & 16) !== 0
		};
		if (wheel) events.push({ ...event, kind: 'wheel', button: 'none', wheel: (bits & 1) === 0 ? -1 : 1 });
		else events.push({ ...event, kind: final === 'M' ? 'press' : 'release', button: BUTTONS[bits & 3]!, wheel: 0 });
		return '';
	});

	return { events, rest };
}

export interface MouseInput {
	/** What the UI reads its keys from: the terminal's input without the mouse reports. */
	readonly stdin: NodeJS.ReadStream;
	/** Listens to the mouse; the returned function stops listening. */
	subscribe(listener: MouseListener): () => void;
	/** Stops reading the terminal's input. */
	dispose(): void;
}

/**
 * Reads the terminal's input ahead of the UI, so that a mouse report is never taken for typed text: Ink would
 * otherwise hand `ESC[<0;12;5M` to its key handlers, and a click while searching would type it into the query.
 *
 * @param source - The terminal's input.
 */
export function createMouseInput(source: NodeJS.ReadStream): MouseInput {
	const filtered = new PassThrough();
	const listeners = new Set<MouseListener>();
	let pending = '';

	const onData = (data: Buffer | string) => {
		const { events, rest } = parseMouse(pending + data.toString());
		// A lone ESC is the Escape key: only what looks like the start of a report waits for the next chunk.
		const partial = rest.length > 1 ? PARTIAL_SGR_MOUSE.exec(rest) : null;
		const held = partial && partial[0].length > 1 ? partial[0] : '';
		pending = held;
		const keys = held ? rest.slice(0, -held.length) : rest;
		if (keys) filtered.write(keys);
		for (const event of events) for (const listener of listeners) listener(event);
	};
	source.on('data', onData);

	const stdin = Object.assign(filtered, {
		isTTY: source.isTTY,
		setRawMode(mode: boolean) {
			source.setRawMode?.(mode);
			return stdin;
		},
		ref() {
			source.ref?.();
			return stdin;
		},
		unref() {
			source.unref?.();
			return stdin;
		}
	}) as unknown as NodeJS.ReadStream;

	return {
		stdin,
		subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		dispose() {
			source.off('data', onData);
			source.pause?.();
			listeners.clear();
			filtered.end();
		}
	};
}
