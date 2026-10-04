import { Terminal } from '@xterm/headless';
import { loadStarsConfig } from '@wolfstar/schema';
import { EventEmitter } from 'node:events';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import type { Builder, BuilderEvents, BuildOutcome } from '../src/builders/types.js';
import { DevService } from '../src/dev/dev-service.js';
import { createPlainRenderer, type Renderer } from '../src/dev/tui/plain.js';
import { initialLogView } from '../src/dev/tui/log-view.js';
import { createTuiRenderer } from '../src/dev/tui/tui.js';
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
		renderer = createTuiRenderer(service, { stdout: stdout as never, stdin: stdin as never, color: false, reducedMotion: true, layout: 'panel' });
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
	test('plain renderer prefixes other channels, prints detail lines and honours the filter', () => {
		const stream = new PassThrough();
		let output = '';
		stream.on('data', (chunk: Buffer) => (output += chunk.toString()));
		renderer = createPlainRenderer(service, { stdout: stream, color: false });
		void renderer.start();
		service.log('stars', 'debug', 'Reloaded Ping from src/commands/Ping.js', { channel: 'hmr' });
		service.log('stars', 'info', 'Commands updated', { channel: 'commands', detail: ['changed ping'] });
		// `trace` is hidden unless asked for: one line per request would drown everything else.
		service.log('stars', 'trace', 'POST / 200 in 3ms', { channel: 'http' });
		renderer.stop();
		expect(output.split('\n').filter(Boolean)).toEqual([
			'hmr Reloaded Ping from src/commands/Ping.js',
			'commands Commands updated',
			'commands   changed ping'
		]);

		output = '';
		renderer = createPlainRenderer(service, {
			stdout: stream,
			color: false,
			filter: initialLogView(service.config, { channels: ['http,hmr'], level: 'trace' })
		});
		void renderer.start();
		service.log('stars', 'trace', 'POST / 200 in 3ms', { channel: 'http' });
		service.log('stars', 'info', 'Commands updated', { channel: 'commands' });
		expect(output.split('\n').filter(Boolean)).toEqual(['http POST / 200 in 3ms']);
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
	test('previews themes live, saves the chosen one and restores on cancel', async () => {
		const onThemeSave = vi.fn();
		renderer = createTuiRenderer(service, {
			stdout: stdout as never,
			stdin: stdin as never,
			color: true,
			theme: 'dark',
			onThemeSave,
			layout: 'panel'
		});
		void renderer.start();
		await waitFor(() => stdout.screen().includes('Stars'));
		expect(stdout.screen()).toContain('theme');
		stdin.press('T');
		await waitFor(() => stdout.screen().includes('colour theme'));
		expect(stdout.terminal.buffer.active.type).toBe('alternate');
		expect(stdout.screen()).toContain('dark-daltonized');
		expect(stdout.screen()).toContain('(current)');
		stdin.press('\u001b[B');
		await wait(30);
		stdin.press('\u001b');
		await waitFor(() => stdout.screen().includes('Stars'));
		expect(onThemeSave).not.toHaveBeenCalled();
		stdin.press('T');
		await waitFor(() => stdout.screen().includes('colour theme'));
		stdin.press('j');
		await wait(30);
		stdin.press('\r');
		await waitFor(() => stdout.screen().includes('Stars'));
		expect(onThemeSave).toHaveBeenCalledTimes(1);
		expect(onThemeSave).toHaveBeenCalledWith('light');
		expect(stdout.terminal.buffer.active.type).toBe('normal');
	});
	test('toggles the tunnel with t', async () => {
		const toggle = vi.spyOn(service, 'toggleTunnel').mockResolvedValue();
		await start();
		stdin.press('t');
		await waitFor(() => toggle.mock.calls.length === 1);
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
		renderer = createTuiRenderer(service, { stdout: stdout as never, stdin: stdin as never, layout: 'panel' });
		await waitFor(() => stdout.screen().includes('MY BOT'));
		expect(stdout.screen()).toContain('custom banner');
		expect(stdout.screen()).not.toContain('Stars');
		renderer.stop();
		service = new DevService({ ...service.config, dev: { ...service.config.dev, banner: false } }, { builder: new IdleBuilder() });
		renderer = createTuiRenderer(service, { stdout: stdout as never, stdin: stdin as never, layout: 'panel' });
		await waitFor(() => stdout.screen().includes('STARTING') && !stdout.screen().includes('MY BOT'));
	});
	describe('dashboard', () => {
		beforeEach(() => {
			stdout.terminal.dispose();
			stdout = new FakeStdout(120, 30);
		});
		async function dashboard(options: Parameters<typeof createTuiRenderer>[1] = {}) {
			renderer = createTuiRenderer(service, { stdout: stdout as never, stdin: stdin as never, color: false, reducedMotion: true, ...options });
			void renderer.start();
			await waitFor(() => stdout.screen().includes('channels'));
		}
		const line = (text: string) =>
			stdout
				.screen()
				.split('\n')
				.find((row) => row.includes(text));

		test('is the default on a roomy terminal: status sidebar, filters and the log stream on one screen', async () => {
			await dashboard();
			expect(stdout.terminal.buffer.active.type).toBe('alternate');
			service.log('stars', 'info', 'Watching src/main.js');
			service.log('app', 'info', 'hello from the bot');
			await waitFor(() => stdout.screen().includes('hello from the bot'));
			const screen = stdout.screen();
			expect(screen).toContain('my-bot');
			expect(screen).toContain('port    3000');
			expect(screen).toContain('tunnel  off');
			expect(screen).toContain(`logs    ${join('.stars', 'dev.log')}`);
			expect(screen).toContain('▾ channels');
			expect(screen).toContain('▾ levels');
			expect(screen).toContain('error warn info debug trace');
			expect(screen).toContain('● live');
			// Level badge, clock, right-aligned channel, dot, message.
			expect(line('hello from the bot')).toMatch(/\[I\]\s+\d\d:\d\d:\d\d\s+bot ● hello from the bot/);
			expect(line('Watching src/main.js')).toMatch(/cli ● Watching/);
			expect(
				stdout
					.screen()
					.split('\n')
					.every((row) => row.length <= 120)
			).toBe(true);
		});

		test('reports the running state and the ready line once the bot is up', async () => {
			await dashboard();
			expect(stdout.screen()).toContain('starting');
			service.builder.emit('start');
			service.builder.emit('success', { ok: true, durationMs: 20, message: null });
			await waitFor(() => stdout.screen().includes('running'));
			expect(stdout.screen()).toContain('my-bot is ready!');
			expect(stdout.screen()).toMatch(/up\s+\ds/);
		});

		test('filters the stream by channel and level from the sidebar', async () => {
			await dashboard();
			service.log('app', 'info', 'from the bot');
			service.log('build', 'warn', 'from the build');
			service.log('stars', 'trace', 'a traced request', { channel: 'http' });
			await waitFor(() => stdout.screen().includes('from the build'));
			// `trace` starts hidden.
			expect(stdout.screen()).not.toContain('a traced request');

			// channels are sorted: bot, build, http. Space hides the selected one, here `bot`.
			stdin.press(' ');
			await waitFor(() => !stdout.screen().includes('from the bot'));
			expect(stdout.screen()).toContain('from the build');
			stdin.press(' ');
			await waitFor(() => stdout.screen().includes('from the bot'));

			// Solo the second channel, then every channel again.
			stdin.press('\u001b[C');
			await wait(30);
			stdin.press('s');
			await waitFor(() => !stdout.screen().includes('from the bot'));
			expect(stdout.screen()).toContain('from the build');
			stdin.press('s');
			await waitFor(() => stdout.screen().includes('from the bot'));

			// Levels: error warn info debug trace. Tab moves there, four steps right reach `trace`.
			stdin.press('\t');
			await wait(30);
			for (let i = 0; i < 4; i++) {
				stdin.press('\u001b[C');
				await wait(30);
			}
			stdin.press(' ');
			await waitFor(() => stdout.screen().includes('a traced request'));
			expect(line('a traced request')).toMatch(/\[T\].*http ● a traced request/);
		});

		test('starts with the channels and levels it was given', async () => {
			await dashboard({ filter: initialLogView(service.config, { channels: ['build'], level: 'warn' }) });
			service.log('app', 'error', 'bot error');
			service.log('build', 'info', 'build info');
			service.log('build', 'warn', 'build warning');
			await waitFor(() => stdout.screen().includes('build warning'));
			expect(stdout.screen()).not.toContain('bot error');
			expect(stdout.screen()).not.toContain('build info');
		});

		test('sets a block apart with rules, shows its detail lines and folds stack frames under their error', async () => {
			await dashboard();
			service.log('stars', 'info', 'before');
			service.log('stars', 'debug', 'Loaded 1 commands', { channel: 'commands', detail: ['ping src/commands/Ping.ts'] });
			service.log('app', 'error', 'Error: boom');
			service.log('app', 'error', '    at main (main.js:1:1)');
			await waitFor(() => stdout.screen().includes('at main'));
			const rows = stdout.screen().split('\n');
			const block = rows.findIndex((row) => row.includes('Loaded 1 commands'));
			expect(rows[block - 1]).toContain('────');
			expect(rows[block + 1]).toMatch(/│ ping src\/commands\/Ping\.ts/);
			expect(rows[block + 2]).toContain('────');
			expect(line('at main')).toMatch(/│ at main/);
			expect(line('at main')).not.toContain('[E]');
			// One error, counted once.
			expect(stdout.screen()).toContain('✖ 1');
		});

		test('scrolls back, stops following and returns to live', async () => {
			await dashboard();
			for (let i = 0; i < 80; i++) service.log('app', 'info', `line ${i}`);
			await waitFor(() => stdout.screen().includes('line 79'));
			stdin.press('g');
			await waitFor(() => stdout.screen().includes('line 0'));
			expect(stdout.screen()).toContain('● paused');
			expect(stdout.screen()).not.toContain('line 79');
			service.log('app', 'info', 'arrived while scrolled back');
			await wait(60);
			expect(stdout.screen()).not.toContain('arrived while scrolled back');
			stdin.press('G');
			await waitFor(() => stdout.screen().includes('arrived while scrolled back'));
			expect(stdout.screen()).toContain('● live');
		});

		test('searches without treating the typed text as shortcuts', async () => {
			const restart = vi.spyOn(service, 'restart').mockResolvedValue();
			const disconnect = vi.spyOn(service, 'disconnect').mockResolvedValue();
			await dashboard();
			service.log('app', 'info', 'needle');
			service.log('app', 'info', 'haystack');
			await waitFor(() => stdout.screen().includes('haystack'));
			stdin.press('/');
			await wait(30);
			stdin.press('neer');
			await wait(30);
			stdin.press('\u007f');
			await wait(30);
			stdin.press('d');
			await wait(30);
			stdin.press('le');
			await waitFor(() => stdout.screen().includes('/ needle'));
			expect(stdout.screen()).not.toContain('haystack');
			expect(restart).not.toHaveBeenCalled();
			expect(disconnect).not.toHaveBeenCalled();
			stdin.press('\u001b');
			await waitFor(() => stdout.screen().includes('haystack'));
		});

		test('asks before refreshing the commands, and answers through the service', async () => {
			await dashboard();
			const send = vi.spyOn(service.supervisor, 'send').mockReturnValue(true);
			const report = (description: string) =>
				service.supervisor.emit('message', {
					source: 'stars:bridge',
					type: 'commands',
					global: [{ name: 'ping', description }],
					guilds: {}
				});
			report('Ping');
			report('Pong');
			await waitFor(() => stdout.screen().includes('Refresh commands?'));
			expect(stdout.screen()).toContain('Commands updated:');
			expect(stdout.screen()).toContain('- ping changed');
			stdin.press('y');
			await waitFor(() => !stdout.screen().includes('Refresh commands?'));
			expect(send).toHaveBeenCalledWith({ source: 'stars:cli', type: 'commands:refresh' });

			report('Ping again');
			await waitFor(() => stdout.screen().includes('Refresh commands?'));
			stdin.press('n');
			await waitFor(() => !stdout.screen().includes('Refresh commands?'));
			expect(send).toHaveBeenCalledTimes(1);
		});

		test('d disconnects the bot and v switches to the panel and back', async () => {
			const disconnect = vi.spyOn(service, 'disconnect').mockResolvedValue();
			await dashboard();
			stdin.press('d');
			await waitFor(() => disconnect.mock.calls.length === 1);
			stdin.press('v');
			await waitFor(() => stdout.screen().includes('Stars') && stdout.terminal.buffer.active.type === 'normal');
			expect(stdout.screen()).not.toContain('▾ channels');
			stdin.press('v');
			await waitFor(() => stdout.screen().includes('▾ channels'));
			expect(stdout.terminal.buffer.active.type).toBe('alternate');
		});

		test('keeps its filters under an overlay and falls back to the panel when the terminal shrinks', async () => {
			await dashboard();
			service.log('app', 'info', 'from the bot');
			await waitFor(() => stdout.screen().includes('from the bot'));
			stdin.press(' ');
			await waitFor(() => !stdout.screen().includes('from the bot'));
			stdin.press('?');
			await waitFor(() => stdout.screen().includes('keyboard shortcuts'));
			stdin.press('?');
			await waitFor(() => stdout.screen().includes('▾ channels'));
			expect(stdout.screen()).not.toContain('from the bot');

			stdout.resize(70, 16);
			await waitFor(() => stdout.screen().includes('Stars') && stdout.terminal.buffer.active.type === 'normal');
			expect(stdout.screen()).not.toContain('▾ channels');
			stdout.resize(120, 30);
			await waitFor(() => stdout.screen().includes('▾ channels'));
		});

		test('leaves the alternate buffer on stop', async () => {
			await dashboard();
			renderer!.stop();
			await waitFor(() => stdout.terminal.buffer.active.type === 'normal');
		});
	});
});
