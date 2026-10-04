import codspeedPlugin from '@codspeed/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	// Only active under `vitest bench` (the plugin skips every other mode), and only measures when CodSpeed's runner
	// instruments the process: locally and in the unit job `vitest bench` is a plain tinybench run.
	plugins: [codspeedPlugin()],
	oxc: {
		target: 'es2021',
		decorator: {
			legacy: true,
			emitDecoratorMetadata: true
		}
	},
	test: {
		globals: true,
		maxWorkers: 1,
		isolate: false
	}
});
