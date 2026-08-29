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
	// as a whole. `@wolfstar/plugin-i18next/register` is the one external import that
	// also needs to survive: it's a bare side-effect import that wires the i18n hooks
	// into `@wolfstar/http-framework`'s `Client`.
	treeshake: {
		moduleSideEffects: (id, external) => (external ? id.includes('@wolfstar/plugin-i18next/register') : true)
	}
});
