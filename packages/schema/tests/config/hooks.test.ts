import { Diagnostic } from 'nostics';
import { defineConfig, loadStarsConfig, STARS_HOOK_NAMES } from '../../src/index.js';
import { createFixture, type Fixture } from './helpers.js';

describe('stars.config hooks', () => {
	let fixture: Fixture;

	afterEach(async () => {
		await fixture?.cleanup();
	});

	async function load(hooks: string) {
		fixture = await createFixture({ 'src/main.js': '', 'stars.config.mjs': `export default { hooks: ${hooks} };` });
		return loadStarsConfig({ cwd: fixture.root, env: {} });
	}

	async function loadError(hooks: string): Promise<Diagnostic> {
		const error = await load(hooks).catch((error: unknown) => error);
		expect(error).toBeInstanceOf(Diagnostic);
		return error as Diagnostic;
	}

	test('defaults to no hooks', async () => {
		fixture = await createFixture({ 'src/main.js': '' });
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).hooks).toEqual({});
	});

	test('flattens nested hook objects and keeps arrays of callbacks', async () => {
		const config = await load("{ build: { before() {}, done: [() => {}, () => {}] }, 'config:resolved'() {} }");
		expect(Object.keys(config.hooks).sort()).toEqual(['build:before', 'build:done', 'config:resolved']);
		expect(config.hooks['build:done']).toHaveLength(2);
		expect(config.hooks['build:before']).toHaveLength(1);
	});

	test('merges a nested and a flat declaration of the same hook', async () => {
		const config = await load("{ build: { done() {} }, 'build:done'() {} }");
		expect(config.hooks['build:done']).toHaveLength(2);
	});

	test('rejects unknown hook names', async () => {
		const error = await loadError("{ 'build:befor'() {} }");
		expect(error.code).toBe('UNKNOWN_HOOK');
		expect(error.fix).toContain('build:before');
		expect((await loadError('{ build: { finish() {} } }')).code).toBe('UNKNOWN_HOOK');
	});

	test('rejects non-function hooks', async () => {
		const error = await loadError("{ 'build:before': 1 }");
		expect(error.code).toBe('INVALID_TYPE');
		expect(error.message).toContain('hooks.build:before');
		expect((await loadError("{ 'build:done': [() => {}, 'nope'] }")).code).toBe('INVALID_TYPE');
		expect((await loadError('[]')).code).toBe('INVALID_TYPE');
	});

	test('exposes the documented hook names', () => {
		expect([...STARS_HOOK_NAMES].sort()).toEqual(
			[
				'build:before',
				'build:done',
				'builder:created',
				'config:resolved',
				'dev:close',
				'dev:restart',
				'dev:start',
				'env:options',
				'prepare:before',
				'prepare:done',
				'tsdown:options'
			].sort()
		);
	});

	test('defineConfig types hook arguments', () => {
		const config = defineConfig({
			hooks: {
				'env:options'(options) {
					options.prefix = 'BOT_';
				},
				build: {
					done: [(outcome) => void outcome.durationMs]
				}
			}
		});
		expect(config.hooks).toBeDefined();
	});
});
