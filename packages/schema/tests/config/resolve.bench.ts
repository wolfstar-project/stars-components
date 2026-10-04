import { bench, describe } from 'vitest';
import { resolveStarsConfig } from '../../src/index.js';

const cwd = process.cwd();

describe('resolveStarsConfig', () => {
	bench('defaults', () => {
		resolveStarsConfig({ cwd, configFile: null, config: {}, env: {}, projectEnv: {} });
	});

	bench('fully specified dev, build and imports', () => {
		resolveStarsConfig({
			cwd,
			configFile: null,
			env: {},
			projectEnv: {},
			config: {
				entry: 'src/main.ts',
				build: { tool: 'tsdown', outDir: 'dist' },
				dev: {
					debounce: 100,
					logs: { channels: ['bot', 'hmr'], levels: ['error', 'warn', 'info'], keep: 5 },
					commands: { refresh: 'prompt' }
				},
				imports: { dirs: ['src/lib/**'], presets: ['@wolfstar/http-framework'] }
			}
		});
	});
});
