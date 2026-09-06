import { Terminal } from '@xterm/headless';
import { loadStarsConfig } from '@wolfstar/http-framework/config';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import type { Builder, BuilderEvents, BuildOutcome } from '../src/lib/builders/types.js';
import { DevService } from '../src/lib/dev-service.js';
import { createPlainRenderer, type Renderer } from '../src/renderers/plain.js';
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

/** A real terminal parser: assertions concern what a user sees, not old frames in the output stream. */
class FakeStdout extends EventEmitter {
	public output = '';
	public readonly isTTY = true;
	public readonly terminal: Terminal;
	public constructor(
		public columns = 100,
		public rows = 24
	) {
		super();
		this.terminal = new Terminal({ cols: columns, rows, allowProposedApi: true, convertEol: true });
	}
	public write(chunk: string): boolean {
		this.output += chunk;
		this.terminal.write(chunk);
		return true;
	}
	public screen(): string {
		const b = this.terminal.buffer.active;
		return Array.from({ length: this.rows }, (_, i) => b.getLine(b.baseY + i)?.translateToString(true) ?? '').join('\n');
	}
	public resize(columns: number, rows: number) {
		this.columns = columns;
		this.rows = rows;
		this.terminal.resize(columns, rows);
		this.emit('resize');
	}
}

function createFakeStdin() {
	const stream = new PassThrough();
	return Object.assign(stream, {
		isTTY: true,
		setRawMode: vi.fn(() => stream),
		ref: () => stream,
		unref: () => stream,
		press: (sequence: string) => void stream.write(sequence)
	});
}

describe('renderers', () => {
	let fixture: Fixture;
	let service: DevService;
	let renderer: Renderer | undefined;
	let stdout: FakeStdout;
	let stdin: ReturnType<typeof createFakeStdin>;
	beforeEach(async () => {
		fixture = await createFixture({ 'src/main.js': 'setInterval(() => {}, 1000);', 'package.json': '{ "name": "my-bot" }' });
		const config = await loadStarsConfig({ cwd: fixture.root, env: { HTTP_PORT: '3000' } });
		service = new DevService(config, { builder: new IdleBuilder() });
		stdout = new FakeStdout();
		stdin = createFakeStdin();
	});
	afterEach(async () => {
		renderer?.stop();
		renderer = undefined;
		await service.stop();
		await fixture.cleanup();
		stdout.terminal.dispose();
	});
	async function start() {
		renderer = createTuiRenderer(service, { stdout: stdout as never, stdin: stdin as never, color: false, reducedMotion: true });
		void renderer.start();
		await waitFor(() => stdout.screen().includes('Stars'));
	}
	async function ready() {
		service.builder.emit('start');
		service.builder.emit('success', { ok: true, durationMs: 20, message: null });
		await waitFor(() => stdout.screen().includes('READY'));
	}

	test('plain renderer prefixes sources and passes app output through', async () => {
		const stream = new PassThrough();
		let output = '';
		stream.on('data', (chunk: Buffer) => (output += chunk.toString()));
		renderer = createPlainRenderer(service, { stdout: stream, color: false });
		void renderer.start();
		service.log('stars', 'info', 'Starting');
		service.log('build', 'error', 'TS1005');
		service.log('app', 'info', 'Ready');
		service.clearLogs();
		renderer.stop();
		service.log('app', 'info', 'ignored');
		expect(output.split('\n').filter(Boolean)).toEqual(['stars Starting', 'build TS1005', 'Ready', 'stars logs cleared']);
	});
	test('pins a spaced panel to the bottom and folds away logs, including banners', async () => {
		await start();
		expect(stdout.terminal.buffer.active.type).toBe('normal');
		expect(stdout.screen()).toContain('Local');
		expect(stdout.screen()).toContain('http://localhost:3000');
		expect(
			stdout
				.screen()
				.split('\n')
				.findIndex((line) => line.includes('Stars'))
		).toBeGreaterThan(10);
		service.log('app', 'info', 'an enormous application banner');
		for (let i = 0; i < 100; i++) service.log('app', 'info', `hello from the bot ${i}`);
		await wait(80);
		expect(stdout.output).not.toContain('hello from the bot');
		expect(stdout.output).not.toContain('enormous');
		expect(stdout.screen().match(/Stars/g)).toHaveLength(1);
	});
	test('shows real phase progress, then ready timing; rebuilds reset progress', async () => {
		await start();
		service.builder.emit('start');
		service.builder.emit('progress', 0.25, 'bundling app');
		await waitFor(() => stdout.screen().includes('25%'));
		expect(stdout.screen()).toContain('━━━━━');
		expect(stdout.screen()).toContain('STARTING');
		expect(stdout.screen()).toContain('bundling app');
		await wait(150);
		expect(stdout.screen()).toContain('25%');
		await ready();
		expect(stdout.screen()).toContain('ready in');
		expect(stdout.screen()).not.toContain('%');
		service.builder.emit('start');
		await waitFor(() => stdout.screen().includes('BUILDING'));
		expect(stdout.screen()).toContain('0%');
		expect(stdout.screen()).not.toContain('ready in');
	});
	test('opens alternate-buffer logs and returns to one clean panel repeatedly', async () => {
		await start();
		await ready();
		service.log('app', 'info', 'hello from the bot');
		for (let i = 0; i < 3; i++) {
			stdin.press('l');
			await waitFor(() => stdout.screen().includes('hello from the bot'));
			expect(stdout.terminal.buffer.active.type).toBe('alternate');
			stdin.press('q');
			await waitFor(() => stdout.screen().includes('Stars'));
			expect(stdout.terminal.buffer.active.type).toBe('normal');
			expect(stdout.screen()).not.toContain('hello from the bot');
			expect(stdout.screen().match(/Stars/g)).toHaveLength(1);
		}
	});
	test('jumps to the last error with context and counts stack frames only once', async () => {
		await start();
		await ready();
		service.log('app', 'info', 'before the error');
		service.log('app', 'error', 'Error: boom');
		service.log('app', 'error', '    at main (main.js:1:1)');
		await waitFor(() => stdout.screen().includes('1 error'));
		expect(stdout.screen()).toContain('ERROR');
		expect(stdout.screen()).not.toContain('READY');
		stdin.press('e');
		await waitFor(() => stdout.screen().includes('▎'));
		expect(stdout.screen()).toContain('Error: boom');
		expect(stdout.screen()).toContain('before the error');
		expect(stdout.screen()).toContain('all levels');
		stdin.press('e');
		await waitFor(() => stdout.screen().includes('error+ only'));
		expect(stdout.screen()).not.toContain('before the error');
		stdin.press('x');
		await waitFor(() => stdout.screen().includes('no matching logs'));
		stdin.press('q');
		await waitFor(() => stdout.screen().includes('READY'));
		expect(stdout.screen()).not.toContain('1 error');
	});
	test('searches logs without letting typed shortcuts affect the process', async () => {
		await start();
		service.log('app', 'info', 'needle');
		service.log('build', 'warn', 'haystack');
		stdin.press('l');
		await waitFor(() => stdout.screen().includes('haystack'));
		stdin.press('/');
		await wait(30);
		stdin.press('needle');
		await waitFor(() => stdout.screen().includes('search needle'));
		expect(stdout.screen()).not.toContain('haystack');
		stdin.press('\r');
		await wait(30);
		stdin.press('q');
		await waitFor(() => stdout.screen().includes('Stars'));
	});
	test('offers help and session info without dumping either into scrollback', async () => {
		await start();
		stdin.press('?');
		await waitFor(() => stdout.screen().includes('keyboard shortcuts'));
		expect(stdout.screen()).toContain('restart the bot now');
		stdin.press('?');
		await waitFor(() => stdout.screen().includes('Stars'));
		stdin.press('i');
		await waitFor(() => stdout.screen().includes('session info'));
		expect(stdout.screen()).toContain('my-bot');
		stdin.press('q');
		await waitFor(() => stdout.screen().includes('Stars'));
	});
	test('confirms q during a build and Ctrl+C always quits, including in overlays', async () => {
		await start();
		stdin.press('q');
		await waitFor(() => stdout.screen().includes('QUIT?'));
		stdin.press('\u001b');
		await waitFor(() => !stdout.screen().includes('QUIT?'));
		stdin.press('l');
		await waitFor(() => stdout.terminal.buffer.active.type === 'alternate');
		const finished = renderer!.start();
		stdin.press('\u0003');
		await finished;
		renderer!.stop();
		await waitFor(() => stdout.terminal.buffer.active.type === 'normal');
		expect(stdin.setRawMode).toHaveBeenLastCalledWith(false);
	});
	test('adapts to a narrow, short pane without losing help or leaking overlay rows', async () => {
		await start();
		stdout.resize(35, 8);
		await waitFor(() => stdout.screen().includes('? help'));
		expect(
			stdout
				.screen()
				.split('\n')
				.every((line) => line.length <= 35)
		).toBe(true);
		stdin.press('l');
		await waitFor(() => stdout.terminal.buffer.active.type === 'alternate');
		stdout.resize(60, 12);
		stdin.press('q');
		await waitFor(() => stdout.screen().includes('Stars'));
		expect(stdout.screen().match(/Stars/g)).toHaveLength(1);
	});
	test('supports a custom wordmark and hiding it entirely', async () => {
		service = new DevService(
			{ ...service.config, dev: { ...service.config.dev, banner: ['MY BOT', 'custom banner'] } },
			{ builder: new IdleBuilder() }
		);
		renderer = createTuiRenderer(service, { stdout: stdout as never, stdin: stdin as never });
		await waitFor(() => stdout.screen().includes('MY BOT'));
		expect(stdout.screen()).toContain('custom banner');
		expect(stdout.screen()).not.toContain('Stars');
		renderer.stop();
		service = new DevService({ ...service.config, dev: { ...service.config.dev, banner: false } }, { builder: new IdleBuilder() });
		renderer = createTuiRenderer(service, { stdout: stdout as never, stdin: stdin as never });
		await waitFor(() => stdout.screen().includes('STARTING') && !stdout.screen().includes('MY BOT'));
	});
});
