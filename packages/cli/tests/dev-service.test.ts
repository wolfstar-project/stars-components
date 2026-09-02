import { EventEmitter } from 'node:events';
import { join } from 'node:path';
import type { Builder, BuilderEvents, BuildOutcome } from '../src/lib/builders/types.js';
import { loadStarsConfig, type ResolvedStarsConfig } from '@wolfstar/http-framework/config';
import { DevService } from '../src/lib/dev-service.js';
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
		fixture = await createFixture({ 'src/main.js': script, 'stars.config.mjs': 'export default { dev: { debounce: 10, killTimeout: 1000 } };' });
		config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		builder = new FakeBuilder();
		service = new DevService(config, { builder });
		return service;
	}

	afterEach(async () => {
		await service?.stop();
		await fixture?.cleanup();
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

	test('sets STARS_DEV in the bot environment', async () => {
		await setup("console.log('dev=' + process.env.STARS_DEV); setInterval(() => {}, 1000);");
		await service.start();
		builder.succeed();
		await waitFor(() => service.logs.entries().some((entry) => entry.text === 'dev=1'));
	});
});
