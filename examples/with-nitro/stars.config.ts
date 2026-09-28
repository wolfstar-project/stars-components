import { defineConfig } from '@wolfstar/http-framework/config';

export default defineConfig({
	experimental: {
		// Nitro v3 is itself a Vite plugin, so it requires the Vite build as well.
		enableVite: true,
		enableNitro: true,
		nitro: {
			// Anything Nitro targets: 'cloudflare-module', 'vercel', 'netlify', 'aws-lambda', 'bun', 'deno-deploy', …
			preset: 'node-server'
		}
	}
});
