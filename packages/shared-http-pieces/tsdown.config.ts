import { defineConfig } from 'tsdown';
import { createTsdownOptions } from '../../scripts/tsdown.config';

export default defineConfig(
	createTsdownOptions({
		cjsOptions: { disabled: true },
		entry: ['src/index.ts', 'src/register.ts'],
		esmOptions: { outDir: 'dist' },
		target: 'es2022'
	})
);
