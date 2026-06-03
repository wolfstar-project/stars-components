import { createTsdownConfig } from '../../scripts/tsdown.config.js';

export default createTsdownConfig({
	cjsOptions: { disabled: true },
	esmOptions: {
		entry: ['src/index.ts', 'src/register.ts'],
		target: 'es2022'
	}
});
