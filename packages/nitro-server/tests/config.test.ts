import { createNitroConfig, createNitroViteConfig, defineNitroConfig, NITRO_ENTRY_ID, NITRO_ERROR_HANDLER_ID } from '../src/index.js';
import { fixture } from './helpers.js';

describe('Nitro configuration', () => {
	test('preserves upstream options while keeping the application entry and output authoritative', async () => {
		const f = await fixture(true);
		try {
			const options = defineNitroConfig({
				routeRules: { '/api/**': { cors: true } },
				runtimeConfig: { token: 'test' },
				virtual: { '#custom': 'export default 1' }
			});
			const config = createNitroConfig({
				...f.config,
				experimental: {
					...f.config.experimental,
					nitro: { ...options, preset: 'node-server', rootDir: '/wrong', serverEntry: 'wrong', output: { dir: '/wrong' } }
				}
			});
			expect(config.routeRules).toEqual(options.routeRules);
			expect(config.runtimeConfig).toEqual(options.runtimeConfig);
			expect(config.rootDir).toBe(f.root);
			expect(config.output?.dir).toBe(f.config.build.outDir);
			expect(config.serverEntry).toBe(NITRO_ENTRY_ID);
			expect(config.virtual?.['#custom']).toBe('export default 1');
		} finally {
			await f.cleanup();
		}
	});
	test('defaults the error handler to the Stars JSON handler, but respects an explicit one', async () => {
		const f = await fixture(true);
		try {
			const config = createNitroConfig(f.config);
			expect(config.errorHandler).toBe(NITRO_ERROR_HANDLER_ID);
			expect(config.virtual?.[NITRO_ERROR_HANDLER_ID]).toBeTypeOf('function');

			const overridden = createNitroConfig({
				...f.config,
				experimental: { ...f.config.experimental, nitro: { ...f.config.experimental.nitro, errorHandler: './my-handler.ts' } }
			});
			expect(overridden.errorHandler).toBe('./my-handler.ts');
		} finally {
			await f.cleanup();
		}
	});
	test('awaits configuration hooks and retains plugins', async () => {
		const f = await fixture(true);
		try {
			const nitro = vi.fn(() => []);
			const context = {
				pluginRegistrations: () => ({ name: 'registration' }),
				importFromProject: async <T>(root: string, id: string): Promise<T> => {
					expect(root).toBe(f.root);
					return (id === 'vite' ? {} : { nitro }) as T;
				}
			};
			const result = await createNitroViteConfig(f.config, context, {
				configureNitro: async (config) => {
					config.routeRules = { '/api/**': { cors: true } };
				},
				configureVite: async (config) => {
					config.define = { TEST: 'true' };
				}
			});
			expect(nitro).toHaveBeenCalledWith(expect.objectContaining({ routeRules: { '/api/**': { cors: true } } }));
			expect(result.options.define).toEqual({ TEST: 'true' });
			expect(result.options.plugins).toContainEqual({ name: 'registration' });
		} finally {
			await f.cleanup();
		}
	});
});
