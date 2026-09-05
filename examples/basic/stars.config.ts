import { defineConfig } from '@wolfstar/http-framework/config';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

/** The locales are data, not modules: the bundler has to copy them next to the build it produces. */
function copyLocales() {
	return {
		name: 'copy-locales',
		buildEnd() {
			const srcDir = resolve(import.meta.dirname, 'src/locales');
			const distDir = resolve(import.meta.dirname, 'dist/locales');
			if (!existsSync(srcDir)) return;
			mkdirSync(distDir, { recursive: true });
			cpSync(srcDir, distDir, { recursive: true });
		}
	};
}

export default defineConfig({
	entry: 'src/main.ts',
	// The next major's defaults: `tsdown` is configured from this file alone, and auto imports are wired into the
	// build for you. See https://github.com/wolfstar-project/stars-components/tree/main/packages/http-framework#compatibility-version
	future: { compatibilityVersion: 4 },
	// Only what the defaults cannot know: this bot ships locale files next to its code. The entry's directory,
	// `dist/main.js`, ESM on Node, sourcemaps and one output file per source file all come for free.
	tsdown: { plugins: [copyLocales()] }
});
