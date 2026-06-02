import { createTsupConfig } from '../../scripts/tsup.config.js';

export default createTsupConfig({
	cjsOptions: { disabled: true },
	esmOptions: {
		entry: ['src/index.ts', 'src/register.ts']
	}
});
