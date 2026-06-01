import { esbuildPluginVersionInjector } from 'esbuild-plugin-version-injector';
import { defineProject, mergeConfig } from 'vitest/config';
import configShared from '../../vitest.shared.js';

export default mergeConfig(
	configShared,
	defineProject({
		plugins: [esbuildPluginVersionInjector()]
	})
);
