import { PassThrough } from 'node:stream';
import { createMouseInput, parseMouse, type MouseEvent } from '../src/dev/tui/mouse.js';

describe('parseMouse', () => {
	test('reads a press and its release, counting cells from 0', () => {
		const { events, rest } = parseMouse('\u001B[<0;12;5M\u001B[<0;12;5m');

		expect(rest).toBe('');
		expect(events).toEqual([
			{ kind: 'press', button: 'left', wheel: 0, column: 11, row: 4, shift: false, alt: false, ctrl: false },
			{ kind: 'release', button: 'left', wheel: 0, column: 11, row: 4, shift: false, alt: false, ctrl: false }
		]);
	});

	test('reads the buttons, the wheel and the modifiers', () => {
		const kinds = (chunk: string) => parseMouse(chunk).events.map(({ kind, button, wheel }) => ({ kind, button, wheel }));

		expect(kinds('\u001B[<1;1;1M')).toEqual([{ kind: 'press', button: 'middle', wheel: 0 }]);
		expect(kinds('\u001B[<2;1;1M')).toEqual([{ kind: 'press', button: 'right', wheel: 0 }]);
		expect(kinds('\u001B[<64;1;1M')).toEqual([{ kind: 'wheel', button: 'none', wheel: -1 }]);
		expect(kinds('\u001B[<65;1;1M')).toEqual([{ kind: 'wheel', button: 'none', wheel: 1 }]);
		expect(parseMouse('\u001B[<8;1;1M').events[0]).toMatchObject({ button: 'left', alt: true, ctrl: false, shift: false });
		expect(parseMouse('\u001B[<16;1;1M').events[0]).toMatchObject({ button: 'left', alt: false, ctrl: true, shift: false });
		expect(parseMouse('\u001B[<4;1;1M').events[0]).toMatchObject({ button: 'left', shift: true });
	});

	test('keeps what the user typed around a report, and drops motion', () => {
		expect(parseMouse('a\u001B[<0;3;2Mb\u001B[A')).toMatchObject({ rest: 'ab\u001B[A', events: [{ column: 2, row: 1 }] });
		expect(parseMouse('\u001B[<32;3;2M')).toEqual({ events: [], rest: '' });
	});

	test('ignores the sideways wheel and the extra buttons', () => {
		expect(parseMouse('\u001B[<66;3;2M\u001B[<67;3;2M').events).toEqual([]);
		expect(parseMouse('\u001B[<128;3;2M\u001B[<129;3;2M')).toEqual({ events: [], rest: '' });
	});
});

describe('createMouseInput', () => {
	function setup() {
		const source = Object.assign(new PassThrough(), { isTTY: true, setRawMode: vi.fn(), ref: vi.fn(), unref: vi.fn() });
		const input = createMouseInput(source as never);
		const events: MouseEvent[] = [];
		input.subscribe((event) => events.push(event));
		let keys = '';
		input.stdin.on('data', (chunk: Buffer) => (keys += chunk.toString()));
		return { source, input, events, typed: () => keys };
	}

	test('hands the keys to the UI and the mouse to its listeners', async () => {
		const { source, input, events, typed } = setup();
		source.write('q\u001B[<0;5;9M');
		await new Promise((resolve) => setImmediate(resolve));

		expect(typed()).toBe('q');
		expect(events).toMatchObject([{ kind: 'press', column: 4, row: 8 }]);
		input.dispose();
	});

	test('puts a report split across two chunks back together', async () => {
		const { source, input, events, typed } = setup();
		source.write('\u001B[<0;5');
		await new Promise((resolve) => setImmediate(resolve));
		expect(typed()).toBe('');
		source.write(';9Mx');
		await new Promise((resolve) => setImmediate(resolve));

		expect(typed()).toBe('x');
		expect(events).toMatchObject([{ kind: 'press', column: 4, row: 8 }]);
		input.dispose();
	});

	test('lets a lone escape through, and the raw mode of the terminal', async () => {
		const { source, input, typed } = setup();
		source.write('\u001B');
		await new Promise((resolve) => setImmediate(resolve));
		expect(typed()).toBe('\u001B');

		input.stdin.setRawMode(true);
		expect(source.setRawMode).toHaveBeenCalledWith(true);
		input.dispose();
	});

	test('puts a character split across two reads back together', async () => {
		const { source, input, typed } = setup();
		const bytes = Buffer.from('è');
		source.write(bytes.subarray(0, 1));
		source.write(bytes.subarray(1));
		await new Promise((resolve) => setImmediate(resolve));

		expect(typed()).toBe('è');
		input.dispose();
	});

	test('stops listening on dispose', async () => {
		const { source, input, events } = setup();
		input.dispose();
		source.write('\u001B[<0;5;9M');
		await new Promise((resolve) => setImmediate(resolve));

		expect(events).toEqual([]);
	});
});
