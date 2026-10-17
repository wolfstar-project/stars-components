import { defineConfig } from 'tsdown';
import { createTsdownOptions } from '../../scripts/tsdown.config';

export default defineConfig({
	...createTsdownOptions({
		cjsOptions: { disabled: true },
		entry: ['src/index.ts', 'src/register.ts', 'src/module.ts', 'src/plugin.ts'],
		esmOptions: { outDir: 'dist' },
		target: 'es2022'
	}),
	// `sideEffects` in package.json only covers the built `register.js`/`plugin.js` for downstream bundlers;
	// without this, rolldown treats every local module as pure and drops the `import './register.js'` in
	// `plugin.ts`, which is what creates `container.influx`.
	treeshake: { moduleSideEffects: 'no-external' }
});
