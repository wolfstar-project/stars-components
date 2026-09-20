import { ServerBuilder } from '../src/lifecycle.js';
import { fixture } from './helpers.js';

test('close drains an active build and suppresses late success notifications', async () => {
	const f = await fixture();
	let release!: () => void;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	class Builder extends ServerBuilder {
		constructor() {
			super(f.config);
		}
		protected async compile() {
			await gate;
		}
		protected async startWatching() {}
	}
	const builder = new Builder();
	const success = vi.fn();
	builder.on('success', success);
	const build = builder.build();
	const close = builder.close();
	release();
	await build;
	await close;
	expect(success).not.toHaveBeenCalled();
	await f.cleanup();
});

test('a throwing afterBuild hook turns a successful build into a reported failure', async () => {
	const f = await fixture();
	class Builder extends ServerBuilder {
		constructor() {
			super(f.config, undefined, {
				afterBuild: () => {
					throw new Error('afterBuild boom');
				}
			});
		}
		protected async compile() {}
		protected async startWatching() {}
	}
	const builder = new Builder();
	const failure = vi.fn();
	builder.on('failure', failure);
	const outcome = await builder.build();
	expect(outcome).toMatchObject({ ok: false, message: 'afterBuild boom' });
	expect(failure).toHaveBeenCalledTimes(1);
	await builder.close();
	await f.cleanup();
});

test('watch() rejects and clears its state when startWatching() throws', async () => {
	const f = await fixture();
	class Builder extends ServerBuilder {
		constructor() {
			super(f.config);
		}
		protected async compile() {}
		protected async startWatching(): Promise<void> {
			throw new Error('startWatching boom');
		}
	}
	const builder = new Builder();
	await expect(builder.watch()).rejects.toThrow('startWatching boom');
	// A fresh call must not reuse the rejected promise and must reject again the same way.
	await expect(builder.watch()).rejects.toThrow('startWatching boom');
	await builder.close();
	await f.cleanup();
});
