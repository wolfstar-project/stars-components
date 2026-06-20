import { defineConfig } from 'tsdown';
import { createTsdownOptions } from '../../scripts/tsdown.config';

export default defineConfig(
	createTsdownOptions({
		entry: ['src/index.ts', 'src/vitest.ts'],
		cjsOptions: { disabled: true }
	})
);
