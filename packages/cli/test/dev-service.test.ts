import { EventEmitter } from 'node:events';
import { join } from 'node:path';
import type { Builder, BuilderEvents, BuildOutcome } from '../src/builders/types.js';
import { loadStarsConfig, type ResolvedStarsConfig } from '@wolfstar/schema';
import { DevService } from '../src/dev/dev-service.js';
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
});
