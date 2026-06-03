import { createTsupConfig } from '../../scripts/tsup.config';

export default createTsupConfig({
	cjsOptions: { disabled: true },
	esmOptions: {
		entry: ['src/index.ts', 'src/register.ts'],
		target: 'es2022'
	}
});
