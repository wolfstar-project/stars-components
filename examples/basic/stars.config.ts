import { defineConfig } from '@wolfstar/http-framework/config';

export default defineConfig({
	entry: 'src/main.ts',
	build: { tool: 'tsdown' }
});
