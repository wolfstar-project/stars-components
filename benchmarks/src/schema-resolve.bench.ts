import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveStarsConfig, type StarsConfig } from '@wolfstar/schema';
import { afterAll, bench, describe } from 'vitest';

// `resolveStarsConfig` checks that the entry file exists, and throws otherwise: a bench that throws reports nothing.
const cwd = mkdtempSync(join(tmpdir(), 'stars-bench-'));
mkdirSync(join(cwd, 'src'));
writeFileSync(join(cwd, 'src', 'main.ts'), '');
writeFileSync(join(cwd, 'package.json'), JSON.stringify({ name: 'bot', dependencies: { '@wolfstar/http-framework': '*' } }));

afterAll(() => rmSync(cwd, { recursive: true, force: true }));

const full: StarsConfig = {
	entry: 'src/main.ts',
	build: { tool: 'tsdown', outDir: 'dist' },
	dev: {
		debounce: 100,
		logs: { channels: ['bot', 'hmr'], levels: ['error', 'warn', 'info'], keep: 5 },
		commands: { refresh: 'prompt' }
	},
	imports: { dirs: ['src/lib/**'], presets: ['@wolfstar/http-framework'] }
};

const resolve = (config: StarsConfig) => resolveStarsConfig({ cwd, configFile: null, config, env: {}, projectEnv: {} });

// Fail loudly here instead of silently inside the benchmarks.
resolve({});
resolve(full);

describe('resolveStarsConfig', () => {
	bench('defaults', () => {
		resolve({});
	});

	bench('fully specified dev, build and imports', () => {
		resolve(full);
	});
});
