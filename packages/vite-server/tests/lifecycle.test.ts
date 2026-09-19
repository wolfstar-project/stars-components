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
