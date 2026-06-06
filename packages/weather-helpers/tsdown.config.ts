import VersionInjector from '@redstardev/unplugin-version-injector/rolldown';
import { defineConfig } from 'tsdown';
import { createTsdownOptions } from '../../scripts/tsdown.config';

export default defineConfig(
	createTsdownOptions({
		cjsOptions: { disabled: true },
		esmOptions: { plugins: [VersionInjector()] }
	})
);
