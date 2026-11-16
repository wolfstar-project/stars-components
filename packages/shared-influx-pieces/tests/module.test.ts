import { setupModules, type ModuleHookHost } from '@wolfstar/kit';
import module from '../src/module.js';

type Config = Parameters<typeof setupModules>[0]['config'];

async function install(moduleOptions: Record<string, unknown> = {}) {
	const hooks = { hook: () => undefined, callHook: async () => undefined } as unknown as ModuleHookHost;
	const config = { root: '/app', moduleOptions, modules: [{ specifier: module.meta.name, options: {} }] } as unknown as Config;
	return setupModules({
		config,
		hooks,
		load: async (specifier) => {
			if (specifier !== module.meta.name) throw new Error(`Cannot find ${specifier}`);
			return { default: module };
		}
	});
}

describe('module', () => {
	test('GIVEN the package is listed in modules THEN it registers one runtime plugin', async () => {
		const runtime = await install();

		expect(runtime.modules.map((installed) => installed.name)).toEqual(['@wolfstar/shared-influx-pieces']);
		expect(runtime.plugins).toHaveLength(1);
		expect(runtime.plugins[0]).toMatchObject({ module: '@wolfstar/shared-influx-pieces', export: 'default' });
		expect(String(runtime.plugins[0]!.from)).toMatch(/plugin\.js$/);
	});

	test('GIVEN the influxPieces key in stars.config THEN the module claims it', async () => {
		const runtime = await install({ influxPieces: {} });

		expect(module.meta.configKey).toBe('influxPieces');
		expect(runtime.configKeys).toEqual(['influxPieces']);
	});
});
