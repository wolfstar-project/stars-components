import { EventEmitter } from 'node:events';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import type { Builder, BuilderEvents, BuildOutcome } from '../src/builders/types.js';
import { loadStarsConfig, type ResolvedStarsConfig } from '@wolfstar/schema';
import { DevService } from '../src/dev/dev-service.js';
import { createPlainRenderer } from '../src/dev/tui/plain.js';
import { Tunnel } from '../src/dev/tunnel.js';
import { createStarsHooks } from '../src/utils/hooks.js';
import { CRASH_SCRIPT, KEEPALIVE_SCRIPT, createFixture, waitFor, type Fixture } from './helpers.js';

class FakeBuilder extends EventEmitter<BuilderEvents> implements Builder {
	public readonly tool = 'none' as const;
	public watching = false;
	public closed = false;

	public build(): Promise<BuildOutcome> {
		return Promise.resolve(this.succeed());
	}

	public watch(): Promise<void> {
		this.watching = true;
		return Promise.resolve();
	}

	public close(): Promise<void> {
		this.closed = true;
		return Promise.resolve();
	}

	public succeed(durationMs = 12): BuildOutcome {
		const outcome: BuildOutcome = { ok: true, durationMs, message: null };
		this.emit('start');
		this.emit('success', outcome);
		return outcome;
	}

	public fail(message = 'TS2322: boom'): void {
		this.emit('start');
		this.emit('failure', { ok: false, durationMs: 5, message });
	}
}

describe('DevService', () => {
	let fixture: Fixture;
	let config: ResolvedStarsConfig;
	let builder: FakeBuilder;
	let service: DevService;

	async function setup(script: string) {
		fixture = await createFixture({
			'src/main.js': script,
			'stars.config.mjs': "export default { dev: { debounce: 10, killTimeout: 1000, env: { NODE_ENV: 'production' } } };"
		});
		config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		builder = new FakeBuilder();
		service = new DevService(config, { builder });
		return service;
	}

	afterEach(async () => {
		await service?.stop();
		await fixture?.cleanup();
	});

	test('runs the build and restart hooks, and logs a failing hook instead of stopping', async () => {
		fixture = await createFixture({
			'src/main.js': KEEPALIVE_SCRIPT,
			'stars.config.mjs': 'export default { dev: { debounce: 10, killTimeout: 1000 } };'
		});
		config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		builder = new FakeBuilder();
		const hooks = createStarsHooks(config);
		const calls: string[] = [];
		hooks.hook('build:before', () => void calls.push('build:before'));
		hooks.hook('build:done', (outcome) => void calls.push(`build:done:${outcome.ok}`));
		hooks.hook('dev:restart', (reason) => void calls.push(`dev:restart:${reason}`));
		hooks.hook('dev:restart', () => {
			throw new Error('broken hook');
		});
		service = new DevService(config, { builder, hooks });

		await service.start();
		builder.succeed();
		await waitFor(() => service.status.process === 'running');
		builder.fail();
		await waitFor(() => calls.includes('build:done:false'));

		expect(calls).toEqual(['build:before', 'build:done:true', 'dev:restart:initial', 'build:before', 'build:done:false']);
		expect(
			service.logs
				.entries()
				.some((entry) => entry.level === 'error' && entry.text.includes('dev:restart') && entry.text.includes('broken hook'))
		).toBe(true);
	});

	test('runs async build hooks one after another, and dev:restart only once they settle', async () => {
		fixture = await createFixture({
			'src/main.js': KEEPALIVE_SCRIPT,
			'stars.config.mjs': 'export default { dev: { debounce: 10, killTimeout: 1000 } };'
		});
		config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		builder = new FakeBuilder();
		const hooks = createStarsHooks(config);
		const events: string[] = [];
		hooks.hook('build:done', async (outcome) => {
			events.push(`build:done:${outcome.durationMs}:start`);
			await new Promise((resolve) => setTimeout(resolve, 50));
			events.push(`build:done:${outcome.durationMs}:end`);
		});
		hooks.hook('dev:restart', (reason) => void events.push(`dev:restart:${reason}`));
		service = new DevService(config, { builder, hooks });

		await service.start();
		builder.succeed(1);
		builder.succeed(2);
		await waitFor(() => service.status.process === 'running' && events.includes('build:done:2:end'));

		expect(events.slice(0, 5)).toEqual([
			'build:done:1:start',
			'build:done:1:end',
			'build:done:2:start',
			'build:done:2:end',
			'dev:restart:initial'
		]);
	});

	async function setupWithHooks() {
		fixture = await createFixture({
			'src/main.js': KEEPALIVE_SCRIPT,
			'stars.config.mjs': 'export default { dev: { debounce: 10, killTimeout: 1000 } };'
		});
		config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		builder = new FakeBuilder();
		const hooks = createStarsHooks(config);
		service = new DevService(config, { builder, hooks });
		return hooks;
	}

	test('runs build:before at the build start boundary, even behind a slow hook', async () => {
		const hooks = await setupWithHooks();
		const calls: string[] = [];
		hooks.hook('build:done', () => new Promise((resolve) => setTimeout(resolve, 50)));
		hooks.hook('build:before', () => void calls.push('build:before'));

		builder.emit('start');
		// A builder like `none` completes in the same call stack as `start`: the hook's synchronous part must not wait.
		expect(calls).toEqual(['build:before']);
		builder.emit('success', { ok: true, durationMs: 1, message: null });
		builder.emit('start');
		expect(calls).toEqual(['build:before', 'build:before']);
	});

	test('build:done reports the final outcome when copying locales fails', async () => {
		const hooks = await setupWithHooks();
		const outcomes: boolean[] = [];
		hooks.hook('build:done', (outcome) => void outcomes.push(outcome.ok));
		vi.spyOn(service.locales, 'copy').mockImplementation(() => {
			throw new Error('EACCES');
		});

		builder.succeed();
		await waitFor(() => outcomes.length === 1);
		expect(outcomes).toEqual([false]);
		expect(service.status.build).toBe('failed');
	});

	test('runHook waits for the hooks already running, so dev:close sees build:done settle', async () => {
		const hooks = await setupWithHooks();
		const events: string[] = [];
		hooks.hook('build:done', async () => {
			await new Promise((resolve) => setTimeout(resolve, 50));
			events.push('build:done');
		});
		hooks.hook('dev:close', () => void events.push('dev:close'));

		builder.fail();
		await service.runHook('dev:close', config);
		expect(events).toEqual(['build:done', 'dev:close']);
	});

	test('starts the bot after the first successful build and restarts after the next one', async () => {
		await setup(KEEPALIVE_SCRIPT);
		await service.start();
		expect(builder.watching).toBe(true);
		expect(service.status.process).toBe('idle');

		builder.succeed();
		await waitFor(() => service.status.process === 'running');
		expect(service.status.lastRestartReason).toBe('initial');
		expect(service.status.restarts).toBe(0);
		expect(service.status.build).toBe('ok');
		const firstPid = service.status.pid;
		await waitFor(() => service.logs.entries().some((entry) => entry.source === 'app' && entry.text === 'ready'));

		builder.succeed();
		await waitFor(() => service.status.pid !== null && service.status.pid !== firstPid && service.status.process === 'running');
		expect(service.status.restarts).toBe(1);
		expect(service.status.lastRestartReason).toBe('build');
		expect(service.config.build.output).toBe(join(fixture.root, 'src', 'main.js'));
	});

	test('keeps the bot running when a build fails, and exposes the failure', async () => {
		await setup(KEEPALIVE_SCRIPT);
		await service.start();
		builder.succeed();
		await waitFor(() => service.status.process === 'running');
		const pid = service.status.pid;

		builder.fail();
		expect(service.status.build).toBe('failed');
		expect(service.status.lastBuild?.message).toBe('TS2322: boom');
		expect(service.status.process).toBe('running');
		expect(service.status.pid).toBe(pid);
		expect(service.logs.entries().at(-1)).toMatchObject({ source: 'stars', level: 'error' });
	});

	test('reports crashes and allows a manual restart', async () => {
		await setup(CRASH_SCRIPT);
		await service.start();
		builder.succeed();
		await waitFor(() => service.status.process === 'crashed');
		expect(service.status.lastExit).toMatchObject({ code: 1, requested: false });

		await service.restart('manual');
		expect(service.status.lastRestartReason).toBe('manual');
		await waitFor(() => service.status.process === 'crashed');
	});

	test('stop() closes the watcher and the bot', async () => {
		await setup(KEEPALIVE_SCRIPT);
		await service.start();
		builder.succeed();
		await waitFor(() => service.status.process === 'running');

		await service.stop();
		expect(builder.closed).toBe(true);
		expect(service.status.process).toBe('stopped');
		expect(service.status.lastExit?.requested).toBe(true);

		// Builds after stop() never start the bot again.
		builder.succeed();
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(service.status.process).toBe('stopped');
	});

	test('sets STARS_DEV and forces development mode in the bot environment', async () => {
		await setup("console.log('dev=' + process.env.STARS_DEV + ',mode=' + process.env.NODE_ENV); setInterval(() => {}, 1000);");
		await service.start();
		builder.succeed();
		await waitFor(() => service.logs.entries().some((entry) => entry.text === 'dev=1,mode=development'));
	});

	test('advances only on real milestones and resets the next build', async () => {
		await setup(KEEPALIVE_SCRIPT);
		builder.emit('start');
		builder.emit('progress', 0.5, 'finishing build');
		expect(service.status.progress).toMatchObject({ fraction: 0.5, message: 'finishing build', readyMs: null });
		builder.emit('progress', 0.25, 'bundling app');
		expect(service.status.progress.fraction).toBe(0.5);
		builder.emit('success', { ok: true, durationMs: 30, message: null });
		expect(service.status.progress.fraction).toBe(0.75);
		await waitFor(() => service.status.process === 'running');
		expect(service.status.progress.fraction).toBe(1);
		expect(service.status.progress.readyMs).toEqual(expect.any(Number));
		builder.emit('start');
		expect(service.status.progress).toMatchObject({ fraction: 0, readyMs: null });
	});
	describe('restarts during a build', () => {
		const outcome: BuildOutcome = { ok: true, durationMs: 1, message: null };
		const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

		test('never start the bot while the build is still writing its output', async () => {
			await setup(KEEPALIVE_SCRIPT);
			const start = vi.spyOn(service.supervisor, 'start').mockImplementation(() => {});
			await service.start();

			// A restart armed by one build must not fire in the middle of the next one.
			builder.succeed();
			builder.emit('start');
			await pause(60);
			expect(start).not.toHaveBeenCalled();

			// Nor does one that is asked for: it waits for the build to finish.
			const manual = service.restart('manual');
			await pause(30);
			expect(start).not.toHaveBeenCalled();
			builder.emit('success', outcome);
			await manual;
			expect(start).toHaveBeenCalled();
		});

		test('drop a restart the build it waited for failed to make worth doing', async () => {
			await setup(KEEPALIVE_SCRIPT);
			const start = vi.spyOn(service.supervisor, 'start').mockImplementation(() => {});
			await service.start();

			builder.emit('start');
			const pending = service.restart('build');
			await pause(30);
			builder.emit('failure', { ok: false, durationMs: 1, message: 'boom' });
			await pending;
			await pause(60);
			expect(start).not.toHaveBeenCalled();
		});

		test('stopping does not wait for a build that never ends', async () => {
			await setup(KEEPALIVE_SCRIPT);
			vi.spyOn(service.supervisor, 'start').mockImplementation(() => {});
			await service.start();
			builder.emit('start');
			const pending = service.restart('manual');
			await service.stop();
			await pending;
			expect(builder.closed).toBe(true);
		});
	});

	describe('bridge', () => {
		/** As `stars dev` prints it: relative to the project, with the separators of the platform. */
		const PING = join('src', 'commands', 'ping.js');
		const bridge = (message: Record<string, unknown>) => service.supervisor.emit('message', { source: 'stars:bridge', ...message });
		const last = (channel: string) =>
			service.logs
				.entries()
				.filter((entry) => entry.channel === channel)
				.at(-1);
		const commands = (description: string, extra: Record<string, unknown>[] = []) =>
			bridge({ type: 'commands', global: [{ name: 'ping', description }, ...extra], guilds: {} });

		async function setupWith(dev: string) {
			fixture = await createFixture({
				'src/main.js': KEEPALIVE_SCRIPT,
				'src/commands/ping.js': '',
				'stars.config.mjs': `export default { dev: { debounce: 10, killTimeout: 1000, ${dev} } };`
			});
			config = await loadStarsConfig({ cwd: fixture.root, env: {} });
			builder = new FakeBuilder();
			service = new DevService(config, { builder });
			return service;
		}

		test('turns what the bot reports into entries on their own channels', async () => {
			await setupWith('');
			bridge({ type: 'ready', clientId: '1', port: 6967 });
			expect(service.status).toMatchObject({ ready: true, port: 6967 });
			expect(last('lifecycle')).toMatchObject({ level: 'success', text: 'Listening on port 6967' });

			bridge({ type: 'pieces', store: 'commands', pieces: [{ name: 'ping', path: join(fixture.root, 'src/commands/ping.js') }] });
			expect(last('commands')).toMatchObject({ level: 'debug', text: 'Loaded commands: 1 piece', detail: [`ping ${PING}`] });

			bridge({ type: 'dispatch', phase: 'run', route: 'slash:ping', piece: 'Ping' });
			expect(last('interactions')).toMatchObject({ level: 'debug', text: 'Processing slash:ping with Ping' });
			bridge({ type: 'dispatch', phase: 'success', route: 'slash:ping', piece: 'Ping', ms: 360 });
			expect(last('interactions')).toMatchObject({ level: 'trace', text: 'slash:ping handled in 360ms' });
			bridge({ type: 'dispatch', phase: 'error', route: 'slash:ping', piece: 'Ping', ms: 440, error: { message: 'boom', stack: ['at run'] } });
			expect(last('interactions')).toMatchObject({ level: 'error', text: 'slash:ping failed in 440ms: boom', detail: ['at run'] });

			bridge({ type: 'request', method: 'POST', path: '/', status: 200, ms: 3 });
			expect(last('http')).toMatchObject({ level: 'trace', text: 'POST / 200 in 3ms' });
			bridge({ type: 'request', method: 'POST', path: '/', status: 401, ms: 1 });
			expect(last('http')).toMatchObject({ level: 'warn' });
			bridge({ type: 'request', method: 'POST', path: '/', status: 500, ms: 1 });
			expect(last('http')).toMatchObject({ level: 'error' });

			bridge({ type: 'hmr', event: 'reloaded', store: 'commands', names: ['ping'], path: join(fixture.root, 'src/commands/ping.js') });
			expect(last('hmr')).toMatchObject({ level: 'debug', text: `Reloaded ping from ${PING}` });
			bridge({ type: 'hmr', event: 'error', path: join(fixture.root, 'src/commands/ping.js'), message: 'Unexpected token', stack: [] });
			expect(last('hmr')).toMatchObject({ level: 'error', text: `Could not reload ${PING}: Unexpected token` });

			// A plugin's own channel, and an unknown level falling back to info.
			bridge({ type: 'log', channel: 'gateway', level: 'verbose', text: 'Shard 0 ready' });
			expect(last('gateway')).toMatchObject({ source: 'app', level: 'info', text: 'Shard 0 ready' });

			// Anything else on the channel belongs to the bot.
			const count = service.logs.entries().length;
			service.supervisor.emit('message', { type: 'ready', port: 1 });
			expect(service.logs.entries()).toHaveLength(count);
		});

		test('asks before refreshing changed commands, only when a UI can answer', async () => {
			await setupWith('');
			const send = vi.spyOn(service.supervisor, 'send').mockReturnValue(true);
			bridge({ type: 'ready', clientId: '1', port: 3000 });

			// The first report of a session is the baseline.
			commands('Ping');
			expect(service.status.prompt).toBeNull();
			expect(last('commands')).toMatchObject({ text: 'Loaded commands: 1 global, 0 guild groups', detail: ['ping'] });
			commands('Ping');
			expect(service.status.prompt).toBeNull();

			// Without an interactive UI nothing could answer: the change is reported instead.
			commands('Pong');
			expect(service.status.prompt).toBeNull();
			expect(last('commands')).toMatchObject({ level: 'warn', detail: expect.arrayContaining(['changed ping']) });

			// What counts is the difference with what Discord has, not with the report before.
			service.promptable = true;
			commands('Pang');
			expect(service.status.prompt).toEqual({ kind: 'commands', changes: [{ kind: 'changed', name: 'ping', type: 1, guild: null }] });
			// A second change before the answer is one question about both.
			commands('Pang', [{ name: 'echo' }]);
			expect(service.status.prompt?.changes.map((change) => `${change.kind} ${change.name}`)).toEqual(['changed ping', 'added echo']);

			service.answerPrompt(false);
			expect(service.status.prompt).toBeNull();
			expect(send).not.toHaveBeenCalled();

			commands('Pong');
			service.answerPrompt(true);
			expect(send).toHaveBeenCalledWith({ source: 'stars:cli', type: 'commands:refresh', clearGuilds: [] });
			bridge({ type: 'refreshed', ok: true, global: 1, guilds: 0, cleared: 0 });
			expect(last('commands')).toMatchObject({ level: 'success', text: 'Deployed 1 global command' });
			bridge({ type: 'refreshed', ok: false, message: 'Missing Access', stack: [] });
			expect(last('commands')).toMatchObject({ level: 'error', text: 'Could not refresh the commands: Missing Access' });
		});

		test('a partial report followed by the full one leaves nothing to ask about', async () => {
			await setupWith('');
			service.promptable = true;
			const send = vi.spyOn(service.supervisor, 'send').mockReturnValue(true);
			const report = (names: string[]) => bridge({ type: 'commands', global: names.map((name) => ({ name })), guilds: {} });
			bridge({ type: 'ready', clientId: '1', port: 3000 });
			report(['ping', 'echo', 'kick']);

			// A restart that caught the output half written: everything looks removed...
			report(['ping']);
			expect(service.status.prompt?.changes.map((change) => `${change.kind} ${change.name}`)).toEqual(['removed echo', 'removed kick']);

			// ...and the next complete start is the same as what Discord has, so the question goes away instead of asking again.
			report(['ping', 'echo', 'kick']);
			expect(service.status.prompt).toBeNull();
			expect(last('commands')).toMatchObject({ text: 'The commands match the deployed ones again' });
			service.answerPrompt(true);
			expect(send).not.toHaveBeenCalled();
		});

		test('does not redeploy while a build is rewriting the output, and asks again afterwards', async () => {
			await setupWith('');
			service.promptable = true;
			const send = vi.spyOn(service.supervisor, 'send').mockReturnValue(true);
			bridge({ type: 'ready', clientId: '1', port: 3000 });
			commands('Ping');
			commands('Pong');

			builder.emit('start');
			service.answerPrompt(true);
			expect(send).not.toHaveBeenCalled();
			expect(last('commands')).toMatchObject({
				level: 'warn',
				text: 'A build is running, the commands of the bot may be incomplete: answer again once it has finished'
			});
			expect(service.status.prompt).not.toBeNull();

			builder.emit('success', { ok: true, durationMs: 1, message: null });
			service.answerPrompt(true);
			expect(send).toHaveBeenCalledWith({ source: 'stars:cli', type: 'commands:refresh', clearGuilds: [] });
		});

		test("dev.commands.refresh 'auto' redeploys right away and 'off' never does", async () => {
			await setupWith("commands: { refresh: 'auto' }");
			service.promptable = true;
			const send = vi.spyOn(service.supervisor, 'send').mockReturnValue(false);
			bridge({ type: 'ready', clientId: '1', port: 3000 });
			commands('Ping');
			commands('Pong');
			expect(send).toHaveBeenCalledTimes(1);
			expect(service.status.prompt).toBeNull();
			// The bot is not there to hear it: that is said, not swallowed.
			expect(last('commands')).toMatchObject({ level: 'warn', text: 'Could not reach the bot to refresh its commands' });
			await service.stop();
			await fixture.cleanup();

			await setupWith("commands: { refresh: 'off' }");
			service.promptable = true;
			const never = vi.spyOn(service.supervisor, 'send');
			commands('Ping');
			commands('Pong');
			expect(never).not.toHaveBeenCalled();
			expect(service.status.prompt).toBeNull();
			expect(last('commands')?.detail).toContain('dev.commands.refresh is off');
		});

		test('a guild that lost its last command is cleared by the refresh, once', async () => {
			await setupWith("commands: { refresh: 'auto' }");
			const send = vi.spyOn(service.supervisor, 'send').mockReturnValue(true);
			const report = (guilds: Record<string, unknown[]>) => bridge({ type: 'commands', global: [{ name: 'ping' }], guilds });
			bridge({ type: 'ready', clientId: '1', port: 3000 });
			report({ '7': [{ name: 'admin' }], '8': [{ name: 'mod' }] });

			// Nothing registers guild 7 any more, so pushing the registry alone would leave `admin` deployed there.
			report({ '8': [{ name: 'mod' }] });
			expect(send).toHaveBeenLastCalledWith({ source: 'stars:cli', type: 'commands:refresh', clearGuilds: ['7'] });
			bridge({ type: 'refreshed', ok: true, global: 1, guilds: 1, cleared: 1 });
			expect(last('commands')).toMatchObject({ text: 'Deployed 1 global command, 1 guild group, cleared 1 guild' });

			// What was deployed is the new baseline: guild 7 is not cleared again.
			report({ '8': [{ name: 'moderation' }] });
			expect(send).toHaveBeenLastCalledWith({ source: 'stars:cli', type: 'commands:refresh', clearGuilds: [] });
		});

		test('a refresh accepted while the bot is stopped is sent when it listens again', async () => {
			await setupWith('');
			service.promptable = true;
			const send = vi.spyOn(service.supervisor, 'send').mockReturnValue(true);
			bridge({ type: 'ready', clientId: '1', port: 3000 });
			commands('Ping');
			commands('Pong');
			// The bot goes away with the question still open.
			service.supervisor.emit('exit', { code: 0, signal: null, requested: true });

			service.answerPrompt(true);
			expect(send).not.toHaveBeenCalled();
			expect(last('commands')).toMatchObject({ text: 'Refreshing commands when the bot starts again…' });
			bridge({ type: 'ready', clientId: '1', port: 3000 });
			expect(send).toHaveBeenCalledWith({ source: 'stars:cli', type: 'commands:refresh', clearGuilds: [] });
		});

		test('a message that cannot be handled is reported, not thrown', async () => {
			await setupWith('');
			vi.spyOn(service.logs, 'push').mockImplementationOnce(() => {
				throw new Error('renderer exploded');
			});
			expect(() => bridge({ type: 'log', channel: 'gateway', level: 'info', text: 'hello' })).not.toThrow();
			expect(service.logs.entries().at(-1)).toMatchObject({ level: 'warn', text: 'Ignored a log message from the bot: renderer exploded' });

			// A message without the shape of its type never reaches the handler.
			const count = service.logs.entries().length;
			bridge({ type: 'log', channel: 'gateway', level: 'info' });
			expect(service.logs.entries()).toHaveLength(count);
		});

		test('leaves a change to the bot when it hot reloads every file the build rewrote, and restarts otherwise', async () => {
			await setupWith('');
			await service.start();
			builder.succeed();
			await waitFor(() => service.status.process === 'running');
			const pid = service.status.pid;

			// Without hot reload in the bot, a build restarts it.
			await fixture.write('src/commands/ping.js', '// 1');
			builder.succeed();
			await waitFor(() => service.status.pid !== null && service.status.pid !== pid && service.status.process === 'running');
			const hotPid = service.status.pid;

			const hot = () => {
				bridge({ type: 'hmr', event: 'start', paths: [join(fixture.root, 'src/commands')] });
				bridge({ type: 'pieces', store: 'commands', pieces: [{ name: 'ping', path: join(fixture.root, PING) }] });
			};
			hot();
			expect(service.status.hmr).toBe(true);
			await fixture.write('src/commands/ping.js', '// 2');
			// A file the bot never loaded, which could be a piece: its store loads it.
			await fixture.write('src/commands/echo.js', '// new');
			builder.succeed();
			await new Promise((resolve) => setTimeout(resolve, 100));
			expect(service.status.pid).toBe(hotPid);
			expect(service.status.restarts).toBe(1);
			expect(service.status.progress.fraction).toBe(1);
			expect(
				service.logs
					.entries()
					.filter((entry) => entry.channel === 'hmr' && entry.level === 'trace')
					.map((entry) => entry.text)
					.sort()
			).toEqual([`UPDATE ${join('src', 'commands', 'echo.js')}`, `UPDATE ${PING}`]);

			// A file outside the stores cannot be hot reloaded.
			await fixture.write('src/main.js', `${KEEPALIVE_SCRIPT} // changed`);
			await fixture.write('src/commands/ping.js', '// 3');
			builder.succeed();
			await waitFor(() => service.status.pid !== null && service.status.pid !== hotPid && service.status.process === 'running');
			// The new process has not reported hot reload yet.
			expect(service.status.hmr).toBe(false);
		});

		test('a helper next to the pieces is not a piece: changing it restarts the bot', async () => {
			await setupWith('');
			await fixture.write('src/commands/_shared.js', '// 1');
			await fixture.write('src/commands/format.js', '// 1');
			await service.start();
			builder.succeed();
			await waitFor(() => service.status.process === 'running');

			for (const helper of ['src/commands/_shared.js', 'src/commands/format.js']) {
				const pid = service.status.pid;
				bridge({ type: 'hmr', event: 'start', paths: [join(fixture.root, 'src/commands')] });
				// The bot loaded a piece from `ping.js` only: the two other files are modules that pieces import.
				bridge({ type: 'pieces', store: 'commands', pieces: [{ name: 'ping', path: join(fixture.root, PING) }] });
				await fixture.write(helper, '// 2');
				builder.succeed();
				await waitFor(() => service.status.pid !== null && service.status.pid !== pid && service.status.process === 'running');
			}
		});

		test('a bot that stopped its hot reload is restarted again', async () => {
			await setupWith('');
			await service.start();
			builder.succeed();
			await waitFor(() => service.status.process === 'running');
			const pid = service.status.pid;
			bridge({ type: 'hmr', event: 'start', paths: [join(fixture.root, 'src/commands')] });
			bridge({ type: 'pieces', store: 'commands', pieces: [{ name: 'ping', path: join(fixture.root, PING) }] });
			bridge({ type: 'hmr', event: 'stop' });
			expect(service.status.hmr).toBe(false);
			expect(last('hmr')).toMatchObject({ text: 'Hot reload off' });

			await fixture.write('src/commands/ping.js', '// 2');
			builder.succeed();
			await waitFor(() => service.status.pid !== null && service.status.pid !== pid && service.status.process === 'running');
		});

		test('dev.hmr false always restarts', async () => {
			await setupWith('hmr: false');
			await service.start();
			builder.succeed();
			await waitFor(() => service.status.process === 'running');
			const pid = service.status.pid;
			bridge({ type: 'hmr', event: 'start', paths: [join(fixture.root, 'src/commands')] });
			await fixture.write('src/commands/ping.js', '// 2');
			builder.succeed();
			await waitFor(() => service.status.pid !== null && service.status.pid !== pid && service.status.process === 'running');
		});

		test('a rewritten but unchanged output is not hot reloaded: it restarts, as a build with no visible reason does', async () => {
			await setupWith('');
			await service.start();
			builder.succeed();
			await waitFor(() => service.status.process === 'running');
			const pid = service.status.pid;
			bridge({ type: 'hmr', event: 'start', paths: [join(fixture.root, 'src/commands')] });
			await fixture.write('src/commands/ping.js', '');
			builder.succeed();
			await waitFor(() => service.status.pid !== null && service.status.pid !== pid && service.status.process === 'running');
		});

		test('a prompt survives a restart, and a refresh asked while the bot restarts waits for it to listen', async () => {
			await setupWith('');
			service.promptable = true;
			await service.start();
			builder.succeed();
			await waitFor(() => service.status.process === 'running');
			const send = vi.spyOn(service.supervisor, 'send').mockReturnValue(true);
			bridge({ type: 'ready', clientId: '1', port: 3000 });
			commands('Ping');
			commands('Pong');
			expect(service.status.prompt).not.toBeNull();

			const pid = service.status.pid;
			await service.restart('manual');
			await waitFor(() => service.status.pid !== null && service.status.pid !== pid && service.status.process === 'running');
			// The new process reports the same commands: nothing new to ask, but the question still stands.
			commands('Pong');
			expect(service.status.prompt?.changes).toEqual([{ kind: 'changed', name: 'ping', type: 1, guild: null }]);

			service.answerPrompt(true);
			expect(send).not.toHaveBeenCalled();
			expect(last('commands')).toMatchObject({ text: 'Refreshing commands once the bot is ready…' });
			bridge({ type: 'ready', clientId: '1', port: 3000 });
			expect(send).toHaveBeenCalledWith({ source: 'stars:cli', type: 'commands:refresh', clearGuilds: [] });
		});

		test('disconnect stops the bot until a manual restart, whatever builds in between', async () => {
			await setupWith('');
			await service.start();
			builder.succeed();
			await waitFor(() => service.status.process === 'running');

			await service.disconnect();
			expect(service.status).toMatchObject({ process: 'stopped', paused: true });
			builder.succeed();
			await new Promise((resolve) => setTimeout(resolve, 80));
			expect(service.status.process).toBe('stopped');

			await service.restart('manual');
			await waitFor(() => service.status.process === 'running');
			expect(service.status.paused).toBe(false);
		});
	});
});

describe('DevService tunnel at start', () => {
	let fixture: Fixture;
	let service: DevService;

	async function setup(devConfig: string, openTunnel?: boolean) {
		fixture = await createFixture({ 'src/main.js': '', 'stars.config.mjs': `export default { dev: ${devConfig} };` });
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		const startTunnel = vi.fn().mockResolvedValue({
			getURL: vi.fn().mockResolvedValue('https://foo.trycloudflare.com'),
			close: vi.fn().mockResolvedValue(undefined)
		});
		service = new DevService(config, { builder: new FakeBuilder(), tunnel: new Tunnel(config, { startTunnel }), openTunnel });
		return startTunnel;
	}

	afterEach(async () => {
		await service?.stop();
		await fixture?.cleanup();
	});

	test('opens a quick tunnel with --tunnel although dev.tunnel is off', async () => {
		const startTunnel = await setup('{ typecheck: false }', true);
		await service.start();
		await waitFor(() => service.tunnel.state === 'up');

		expect(startTunnel).toHaveBeenCalledOnce();
		expect(service.tunnel.url).toBe('https://foo.trycloudflare.com');
	});

	test('keeps the tunnel closed with --no-tunnel although dev.tunnel enables it, and t still opens it', async () => {
		const startTunnel = await setup('{ typecheck: false, tunnel: true }', false);
		await service.start();

		expect(startTunnel).not.toHaveBeenCalled();
		expect(service.tunnel.state).toBe('off');

		await service.toggleTunnel();
		expect(startTunnel).toHaveBeenCalledOnce();
		expect(service.tunnel.state).toBe('up');
	});

	test('leaves the tunnel to dev.tunnel without the flag', async () => {
		const off = await setup('{ typecheck: false }');
		await service.start();
		expect(off).not.toHaveBeenCalled();
		await service.stop();
		await fixture.cleanup();

		const on = await setup('{ typecheck: false, tunnel: true }');
		await service.start();
		await waitFor(() => service.tunnel.state === 'up');
		expect(on).toHaveBeenCalledOnce();
	});

	test('prints the URL of the tunnel in plain output, where there is no key to press', async () => {
		await setup('{ typecheck: false }', true);
		const stream = new PassThrough();
		let output = '';
		stream.on('data', (chunk: Buffer) => (output += chunk.toString()));
		const renderer = createPlainRenderer(service, { stdout: stream, color: false });
		void renderer.start();

		await service.start();
		await waitFor(() => output.includes('Tunnel ready at'));
		renderer.stop();

		expect(output).toContain('tunnel Tunnel ready at https://foo.trycloudflare.com');
	});
});
