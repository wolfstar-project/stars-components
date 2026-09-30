import { applyEnvOptions, createStarsHooks, loadProject } from '../src/utils/hooks.js';
import { createFixture, type Fixture } from './helpers.js';

const WITH_ENV_UTILITIES = JSON.stringify({ name: 'bot', dependencies: { '@wolfstar/env-utilities': '^2.2.1' } });

describe('stars hooks', () => {
	let fixture: Fixture;

	afterEach(async () => {
		await fixture?.cleanup();
		delete (globalThis as { __starsCalls?: unknown }).__starsCalls;
	});

	test('registers every callback of the configuration', async () => {
		fixture = await createFixture({
			'src/main.js': '',
			'stars.config.mjs':
				"export default { hooks: { build: { done: [(o) => (globalThis.__starsCalls ??= []).push(['a', o.ok]), (o) => globalThis.__starsCalls.push(['b', o.ok])] } } };"
		});
		const { config, hooks } = await loadProject({ cwd: fixture.root, env: {} });
		await hooks.callHook('build:done', { ok: true, durationMs: 1, message: null }, config);
		expect((globalThis as { __starsCalls?: unknown }).__starsCalls).toEqual([
			['a', true],
			['b', true]
		]);
	});

	test('config:resolved runs once with the resolved configuration', async () => {
		fixture = await createFixture({
			'src/main.js': '',
			'stars.config.mjs': "export default { hooks: { 'config:resolved'(config) { (globalThis.__starsCalls ??= []).push(config.entry); } } };"
		});
		const { config } = await loadProject({ cwd: fixture.root, env: {} });
		expect((globalThis as { __starsCalls?: unknown }).__starsCalls).toEqual([config.entry]);
	});

	test('env:options can rewrite the options written into the build', async () => {
		fixture = await createFixture({
			'src/main.ts': '',
			'package.json': WITH_ENV_UTILITIES,
			'stars.config.mjs': "export default { env: { prefix: 'A_' }, hooks: { 'env:options'(options) { options.prefix = 'B_'; } } };"
		});
		const { config, hooks } = await loadProject({ cwd: fixture.root, env: {} });
		const next = await applyEnvOptions(config, hooks);
		expect(next.env.options.prefix).toBe('B_');
		// The resolved configuration itself stays untouched.
		expect(config.env.options.prefix).toBe('A_');
	});

	test('env:options does not run when env is disabled', async () => {
		fixture = await createFixture({
			'src/main.ts': '',
			'stars.config.mjs': "export default { env: false, hooks: { 'env:options'() { throw new Error('should not run'); } } };"
		});
		const { config, hooks } = await loadProject({ cwd: fixture.root, env: {} });
		await expect(applyEnvOptions(config, hooks)).resolves.toBe(config);
	});

	test('createStarsHooks works on a configuration without hooks', async () => {
		fixture = await createFixture({ 'src/main.js': '' });
		const { config } = await loadProject({ cwd: fixture.root, env: {} });
		// `hookable` returns synchronously when nothing is registered, so only check that it does not throw.
		expect(await createStarsHooks(config).callHook('dev:close', config)).toBeUndefined();
	});
});
