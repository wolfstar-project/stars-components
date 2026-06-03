import { esbuildPluginVersionInjector } from 'esbuild-plugin-version-injector';
import { createTsdownConfig } from '../../scripts/tsdown.config.js';

export default createTsdownConfig({
	cjsOptions: { disabled: true },
	esmOptions: { plugins: [esbuildPluginVersionInjector()] }
});
