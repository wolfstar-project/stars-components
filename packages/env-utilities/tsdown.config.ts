import VersionInjector from '@redstardev/unplugin-version-injector/rolldown';
import { defineConfig } from 'tsdown';
import { createTsdownOptions } from '../../scripts/tsdown.config';

export default defineConfig(
	createTsdownOptions({
		entry: ['src/index.ts', 'src/setup.ts'],
		cjsOptions: { plugins: [VersionInjector()] },
		esmOptions: { plugins: [VersionInjector()] }
	})
);
