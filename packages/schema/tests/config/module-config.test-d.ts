import { BUILT_IN_CONFIG_KEYS, defineConfig, type StarsConfig } from '@wolfstar/schema';

// What a module's types declare, the way a Nuxt module augments `NuxtConfig`.
declare module '@wolfstar/schema' {
	interface StarsConfig {
		scheduledTasks?: { bull?: { connection?: { host?: string; port?: number } } };
	}
}

describe('module options in StarsConfig', () => {
	test('a key declared by an augmentation type-checks and is typed', () => {
		const config = defineConfig({
			modules: ['@wolfstar/plugin-scheduled-tasks'],
			scheduledTasks: { bull: { connection: { host: 'localhost', port: 6379 } } }
		});

		expectTypeOf(config.scheduledTasks).toEqualTypeOf<{ bull?: { connection?: { host?: string; port?: number } } } | undefined>();
		expectTypeOf<StarsConfig['scheduledTasks']>().not.toBeAny();
	});

	test('the options of a declared key are checked', () => {
		// @ts-expect-error `port` is a number
		defineConfig({ scheduledTasks: { bull: { connection: { port: '6379' } } } });
	});

	test('a key no module declared is still an error', () => {
		// @ts-expect-error `scheduledTask` is not declared by any module
		defineConfig({ scheduledTask: {} });
	});

	test('BUILT_IN_CONFIG_KEYS lists every key of StarsConfig, and only those', () => {
		// `scheduledTasks` is the module's augmentation above: the only key that is not built in.
		expectTypeOf<Exclude<keyof StarsConfig, 'scheduledTasks'>>().toEqualTypeOf<(typeof BUILT_IN_CONFIG_KEYS)[number]>();
	});
});
