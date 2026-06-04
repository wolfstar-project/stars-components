import { createTsdownConfig } from '../../scripts/tsdown.config.js';

export default createTsdownConfig({
	entry: ['src/index.ts', 'src/register.ts'],
	target: 'es2022',
	cjsOptions: { disabled: true },
	esmOptions: { outDir: 'dist' }
});
