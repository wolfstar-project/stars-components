import { loadStarsConfig } from '@wolfstar/http-framework/config';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import type { Builder, BuilderEvents, BuildOutcome } from '../src/lib/builders/types.js';
import { DevService } from '../src/lib/dev-service.js';
import { createPlainRenderer } from '../src/renderers/plain.js';
import { createTuiRenderer } from '../src/renderers/tui.js';
import { createFixture, wait, waitFor, type Fixture } from './helpers.js';

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

	test('TUI streams logs to the real scrollback and pins a compact panel below them', async () => {
		const stdout = new FakeStdout(100, 20);
		const stdin = createFakeStdin();
		const renderer = createTuiRenderer(service, { stdout: stdout as never, stdin: stdin as never, color: false, reducedMotion: true });
		const quit = renderer.start();

		await waitFor(() => stdout.output.includes('stars dev'));
		expect(stdout.output).toContain('my-bot');
		expect(stdout.output).toContain('http://localhost:3000');

		service.log('app', 'info', 'hello from the bot');
		await waitFor(() => stdout.output.includes('hello from the bot'));

		stdin.press('q');
		await quit;
		renderer.stop();
	});

	test('TUI opens the log browser with l and the help overlay with ?', async () => {
		const stdout = new FakeStdout(100, 20);
		const stdin = createFakeStdin();
		const renderer = createTuiRenderer(service, { stdout: stdout as never, stdin: stdin as never, color: false, reducedMotion: true });
		void renderer.start();

		await waitFor(() => stdout.output.includes('stars dev'));
		service.log('build', 'error', 'a build problem');
		await waitFor(() => stdout.output.includes('a build problem'));

		stdin.press('l');
		await waitFor(() => stdout.output.includes('stars dev logs'));
		stdin.press('l');
		await wait(20);

		stdin.press('?');
		await waitFor(() => stdout.output.includes('restart the bot now'));
		stdin.press('h');
		await wait(20);

		renderer.stop();
	});
});
