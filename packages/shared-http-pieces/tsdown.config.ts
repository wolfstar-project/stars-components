import { defineConfig } from 'tsdown';
import { createTsdownOptions } from '../../scripts/tsdown.config';

export default defineConfig({
	...createTsdownOptions({
		cjsOptions: { disabled: true },
		entry: ['src/index.ts', 'src/register.ts'],
		esmOptions: { outDir: 'dist' },
		target: 'es2022'
	}),
	// `sideEffects` in package.json only covers `./dist/register.js` for downstream
	// bundlers; without this, rolldown treats every local module as pure and
	// tree-shakes away the `commands/_load.js` / `listeners/_load.js` imports that
	// register pieces as a side effect, even though the built file is never dropped
	// as a whole. `@wolfstar/plugin-i18next/register` is imported dynamically in
	// register.ts (not statically), so it survives regardless of this setting.
	treeshake: { moduleSideEffects: 'no-external' }
});
