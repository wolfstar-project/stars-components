import { defineConfig } from 'tsdown';
import { createTsdownOptions } from '../../scripts/tsdown.config';

export default defineConfig({
	...createTsdownOptions({
		cjsOptions: { disabled: true },
		entry: ['src/cli.ts'],
		esmOptions: { outDir: 'dist', dts: false },
		target: 'es2022'
	}),
	attw: false,
	publint: { enabled: true, level: 'error' }
});
