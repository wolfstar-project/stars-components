import { defineConfig } from 'tsdown';
import { createTsdownOptions } from '../../scripts/tsdown.config';

export default defineConfig({
	...createTsdownOptions({
		cjsOptions: { disabled: true },
		entry: ['src/cli.ts', 'src/index.ts'],
		esmOptions: { outDir: 'dist' },
		target: 'es2022'
	}),
	attw: false,
	publint: { enabled: true, level: 'error' }
});
