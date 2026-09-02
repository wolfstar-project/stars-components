import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import type { Builder, BuilderEvents, BuildOutcome } from '../src/lib/builders/types.js';
import { loadStarsConfig } from '@wolfstar/http-framework/config';
import { DevService } from '../src/lib/dev-service.js';
import { displayWidth, fit, stripAnsi, truncate } from '../src/renderers/ansi.js';
import { createPlainRenderer } from '../src/renderers/plain.js';
import { createTuiRenderer, formatDuration } from '../src/renderers/tui.js';
import { createFixture, wait, type Fixture } from './helpers.js';

const ESC = '\u001B';

class IdleBuilder extends EventEmitter<BuilderEvents> implements Builder {
	public readonly tool = 'none' as const;
	public build(): Promise<BuildOutcome> {
		return Promise.resolve({ ok: true, durationMs: 0, message: null });
	}
	public watch(): Promise<void> {
		return Promise.resolve();
	}
	public close(): Promise<void> {
		return Promise.resolve();
	}
}

class FakeStdout extends EventEmitter {
	public output = '';
	public constructor(
		public columns: number,
		public rows: number
	) {
		super();
	}
	public write(chunk: string): boolean {
		this.output += chunk;
		return true;
	}
	public frames(): string[][] {
		// Frames start with cursor-home; each line ends with erase-line.
		return this.output
			.split(`${ESC}[H`)
			.slice(1)
			.map((frame) =>
				frame
					.replace(`${ESC}[J`, '')
					.split(`${ESC}[K\n`)
					.map((line) => line.replace(`${ESC}[K`, ''))
			);
	}
}

class FakeStdin extends EventEmitter {
	public isTTY = false;
	public raw: boolean | null = null;
	public setRawMode(value: boolean) {
		this.raw = value;
		return this;
	}
	public resume() {
		return this;
	}
	public pause() {
		return this;
	}
	public press(name: string, extra: Record<string, unknown> = {}) {
		this.emit('keypress', undefined, { name, ctrl: false, meta: false, shift: false, sequence: name, ...extra });
	}
}

describe('ansi helpers', () => {
	test('strips escapes and measures width', () => {
		expect(stripAnsi(`${ESC}[31mred${ESC}[39m`)).toBe('red');
		expect(displayWidth(`${ESC}[1mab${ESC}[22m`)).toBe(2);
		expect(displayWidth('日本')).toBe(4);
	});

	test('truncates and fits to a width', () => {
		expect(truncate('hello world', 5)).toBe('hell…');
		expect(truncate('hi', 5)).toBe('hi');
		expect(fit('hi', 5)).toBe('hi   ');
		expect(fit(`${ESC}[31mhello world${ESC}[39m`, 6)).toBe('hello…');
		expect(displayWidth(fit('日本語テキスト', 5))).toBeLessThanOrEqual(5);
	});

	test('formats durations', () => {
		expect(formatDuration(5_000)).toBe('00:05');
		expect(formatDuration(65_000)).toBe('01:05');
		expect(formatDuration(3_600_000 + 61_000)).toBe('1:01:01');
	});
});

describe('renderers', () => {
	let fixture: Fixture;
	let service: DevService;

	beforeEach(async () => {
		fixture = await createFixture({ 'src/main.js': '', 'package.json': '{ "name": "my-bot" }' });
		const config = await loadStarsConfig({ cwd: fixture.root, env: { HTTP_PORT: '3000' } });
		service = new DevService(config, { builder: new IdleBuilder() });
	});

	afterEach(async () => {
		await service.stop();
		await fixture.cleanup();
	});

	test('plain renderer prefixes stars and build lines and passes app output through', async () => {
		const stdout = new PassThrough();
		let output = '';
		stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));
		const renderer = createPlainRenderer(service, { stdout, color: false });
		void renderer.start();

		service.log('stars', 'info', 'Starting');
		service.log('build', 'error', 'TS1005');
		service.log('app', 'info', 'Ready');
		service.clearLogs();
		renderer.stop();
		service.log('app', 'info', 'ignored');
		await wait(10);

		expect(output.split('\n').filter(Boolean)).toEqual(['stars Starting', 'build TS1005', 'Ready', 'stars logs cleared']);
	});

	test('TUI renders frames that fit the terminal and reacts to keys', async () => {
		const stdout = new FakeStdout(80, 12);
		const stdin = new FakeStdin();
		const renderer = createTuiRenderer(service, { stdout: stdout as never, stdin: stdin as never, color: false, reducedMotion: true, fps: 1000 });
		const quit = renderer.start();

		expect(stdout.output).toContain(`${ESC}[?1049h`);
		const [first] = stdout.frames();
		expect(first).toHaveLength(12);
		for (const line of first!) expect(displayWidth(line)).toBe(80);
		expect(first!.join('\n')).toContain('my-bot');
		expect(first!.join('\n')).toContain('http://localhost:3000');
		expect(first!.join('\n')).toContain('no logs yet');

		service.log('app', 'info', 'x'.repeat(200));
		service.log('build', 'error', 'bad');
		await wait(20);
		let frame = stdout.frames().at(-1)!;
		expect(frame.join('\n')).toContain('…');
		expect(frame.join('\n')).toContain('bad');

		stdin.press('f'); // app only
		await wait(20);
		frame = stdout.frames().at(-1)!;
		expect(frame.join('\n')).toContain('filter app');
		expect(frame.join('\n')).not.toContain('bad');

		stdin.press('h');
		await wait(20);
		expect(stdout.frames().at(-1)!.join('\n')).toContain('restart the bot now');
		stdin.press('escape'); // closes help, does not quit
		await wait(20);
		expect(stdout.frames().at(-1)!.join('\n')).not.toContain('restart the bot now');

		stdin.press('c');
		await wait(20);
		expect(service.logs.entries()).toHaveLength(0);

		stdin.press('q');
		await quit;
		renderer.stop();
		expect(stdout.output.endsWith(`${ESC}[?25h${ESC}[?1049l`)).toBe(true);
		expect(stdin.listenerCount('keypress')).toBe(0);
	});

	test('TUI collapses the header and footer on narrow terminals', () => {
		const stdout = new FakeStdout(30, 8);
		const stdin = new FakeStdin();
		const renderer = createTuiRenderer(service, { stdout: stdout as never, stdin: stdin as never, color: false, reducedMotion: true });
		void renderer.start();

		const [frame] = stdout.frames();
		expect(frame).toHaveLength(8);
		for (const line of frame!) expect(displayWidth(line)).toBe(30);
		expect(frame!.at(-1)).toContain('q quit');
		expect(frame!.join('\n')).not.toContain('source');

		stdin.press('c', { ctrl: true });
		renderer.stop();
	});
});
