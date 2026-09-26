import { defineConfig } from '@wolfstar/http-framework/config';

export default defineConfig({
	// Vite is experimental: the flag opts in, then `build.tool: 'auto'` picks Vite because `vite` is installed.
	experimental: { enableVite: true },
	// Merged into the Vite configuration the CLI derives from the entry (SSR build, `dist/main.js`, sourcemaps).
	vite: {
		define: {
			__BUILT_AT__: JSON.stringify(new Date().toISOString())
		}
	}
});
