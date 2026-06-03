import { esbuildPluginVersionInjector } from 'esbuild-plugin-version-injector';
import type { UserConfig } from 'tsdown';
import { createTsdownConfig } from '../../scripts/tsdown.config.js';

const defaultOptions: UserConfig = {
	plugins: [esbuildPluginVersionInjector()],
	entry: ['src/index.ts', 'src/setup.ts']
};

export default createTsdownConfig({
	cjsOptions: defaultOptions,
	esmOptions: defaultOptions
});
