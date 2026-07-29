import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Rolldown } from 'tsdown';

function copyLocales(): Rolldown.RolldownPluginOption {
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
	entry: ['src/**/*.ts'],
	format: ['esm'],
	target: 'node20',
	// Mirror src/ so Sapphire can load dist/commands at runtime.
	unbundle: true,
	outExtensions: () => ({ js: '.js' }),
	clean: true,
	sourcemap: true,
	plugins: [copyLocales()]
});
