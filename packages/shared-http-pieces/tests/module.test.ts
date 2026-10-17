import { setupModules, type ModuleHookHost } from '@wolfstar/kit';
import { fileURLToPath } from 'node:url';
import module from '../src/module.js';

type Config = Parameters<typeof setupModules>[0]['config'];

async function install() {
	const hooks = { hook: () => undefined, callHook: async () => undefined } as unknown as ModuleHookHost;
	const config = { root: '/app', moduleOptions: {}, modules: [{ specifier: module.meta.name, options: {} }] } as unknown as Config;
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
	test('GIVEN the package is listed in modules THEN it adds its locales and one runtime plugin', async () => {
		const runtime = await install();

		expect(runtime.modules.map((installed) => installed.name)).toEqual(['@wolfstar/shared-http-pieces']);
		expect(runtime.locales).toEqual([
			{
				module: '@wolfstar/shared-http-pieces',
				path: fileURLToPath(new URL('../src/locales', import.meta.url)),
				namespaces: ['commands/shared']
			}
		]);
		expect(runtime.plugins).toHaveLength(1);
		expect(runtime.plugins[0]).toMatchObject({ module: '@wolfstar/shared-http-pieces', export: 'default' });
		expect(String(runtime.plugins[0]!.from)).toMatch(/pieces\.js$/);
	});

	test('GIVEN the plugin source is imported THEN it registers the shared pieces under the package name', async () => {
		// A fresh module graph, so the pieces are registered again whatever other test files imported before.
		vi.resetModules();
		const { container } = await import('@wolfstar/http-framework');
		const loaded: string[] = [];
		const loadPiece = container.stores.loadPiece.bind(container.stores);
		vi.spyOn(container.stores, 'loadPiece').mockImplementation((entry) => {
			loaded.push(`${entry.store}:${entry.name}`);
			return loadPiece(entry);
		});

		const { default: plugin } = await import('../src/pieces.js');

		expect(plugin.name).toBe('@wolfstar/shared-http-pieces');
		expect(loaded.sort()).toEqual([
			'commands:info',
			'listeners:SharedAutocompleteError',
			'listeners:SharedCommandError',
			'listeners:SharedError',
			'listeners:SharedInteractionHandlerError'
		]);
	});
});
