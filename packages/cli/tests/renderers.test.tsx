import { loadStarsConfig } from '@wolfstar/http-framework/config';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import type { Builder, BuilderEvents, BuildOutcome } from '../src/lib/builders/types.js';
import { DevService } from '../src/lib/dev-service.js';
import { createPlainRenderer } from '../src/renderers/plain.js';
import { createTuiRenderer, formatDuration } from '../src/renderers/tui.js';
import { createFixture, wait, waitFor, type Fixture } from './helpers.js';

const ESCAPE = '';

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

/** The minimum of a `WriteStream` Ink needs, collecting everything it paints. */
class FakeStdout extends EventEmitter {
	public output = '';
	public readonly isTTY = true;
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
	/** Everything painted so far, without the escape sequences Ink uses to move the cursor around. */
	public frame(): string {
		return this.output.replaceAll(new RegExp(`${ESCAPE}\\[[0-9;?]*[A-Za-z]`, 'g'), '');
	}
}

/**
 * The minimum of a `ReadStream` Ink needs to deliver key presses. Ink 7 reads through `readable`/`read()`, which a
 * `PassThrough` already implements — only the TTY bits have to be faked.
 */
function createFakeStdin() {
	const stream = new PassThrough();
	return Object.assign(stream, {
		isTTY: true,
		setRawMode: () => stream,
		ref: () => stream,
		unref: () => stream,
		press: (sequence: string) => void stream.write(sequence)
	});
}

describe('formatDuration', () => {
	test('formats durations as mm:ss and h:mm:ss', () => {
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

	test('TUI renders the status and reacts to keys', async () => {
		const stdout = new FakeStdout(100, 14);
		const stdin = createFakeStdin();
		const renderer = createTuiRenderer(service, { stdout: stdout as never, stdin: stdin as never, color: false, reducedMotion: true });
		const quit = renderer.start();

		await waitFor(() => stdout.frame().includes('stars dev'));
		expect(stdout.frame()).toContain('my-bot');
		expect(stdout.frame()).toContain('http://localhost:3000');
		expect(stdout.frame()).toContain('no logs yet');

		service.log('app', 'info', 'hello from the bot');
		service.log('build', 'error', 'a build problem');
		await waitFor(() => stdout.frame().includes('a build problem'));
		expect(stdout.frame()).toContain('hello from the bot');

		// `f` cycles the source filter to `app`, which hides the build line.
		stdin.press('f');
		await waitFor(() => stdout.frame().includes('filter app'));

		stdin.press('h');
		await waitFor(() => stdout.frame().includes('restart the bot now'));
		// Escape closes the help instead of quitting.
		stdin.press(ESCAPE);
		await wait(50);

		stdin.press('c');
		await waitFor(() => service.logs.entries().length === 0);

		stdin.press('q');
		await quit;
		renderer.stop();
	});

	test('TUI collapses the footer on narrow terminals', async () => {
		const stdout = new FakeStdout(38, 10);
		const stdin = createFakeStdin();
		const renderer = createTuiRenderer(service, { stdout: stdout as never, stdin: stdin as never, color: false, reducedMotion: true });
		void renderer.start();

		await waitFor(() => stdout.frame().includes('q quit'));
		expect(stdout.frame()).not.toContain('source');
		expect(stdout.frame()).not.toContain('restart');

		renderer.stop();
	});
});
