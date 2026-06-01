import { esbuildPluginVersionInjector } from 'esbuild-plugin-version-injector';
import { defineProject } from 'vitest/config';

export default defineProject({
	plugins: [esbuildPluginVersionInjector()],
	test: {
		globals: true,
		maxWorkers: 1,
		isolate: false
	}
});
