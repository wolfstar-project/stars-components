import codspeedPlugin from '@codspeed/vitest-plugin';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const source = (path: string) => fileURLToPath(new URL(`../packages/${path}`, import.meta.url));

// The packages test on Vitest 5, which replaced the `bench` export with a test-context API that
// `@codspeed/vitest-plugin` (peer range `vitest ^3.2 || ^4`) does not support, so the benchmarks live in their own
// project on Vitest 4. They import the packages' sources, so no `pnpm build` is needed first.
export default defineConfig({
	plugins: [codspeedPlugin()],
	resolve: {
		alias: [
			{ find: '@wolfstar/http-framework-test-utils', replacement: source('http-framework-test-utils/src/index.ts') },
			{ find: '@wolfstar/schema', replacement: source('schema/src/index.ts') },
			{ find: '@wolfstar/http-framework', replacement: source('http-framework/src/index.ts') }
		]
	},
	esbuild: {
		target: 'es2022',
		tsconfigRaw: { compilerOptions: { experimentalDecorators: true, emitDecoratorMetadata: true } }
	},
	test: {
		globals: false,
		include: [],
		benchmark: { include: ['src/**/*.bench.ts'] }
	}
});
