import { defineConfig } from 'tsdown';
import { createTsdownOptions } from '../../scripts/tsdown.config';

export default defineConfig(
	createTsdownOptions({
		cjsOptions: { disabled: true },
		entry: ['src/index.ts', 'src/config.ts', 'src/auto-imports.ts', 'src/fetch.ts']
	})
);
