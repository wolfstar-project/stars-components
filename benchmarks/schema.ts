import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Bench } from 'tinybench';
import { resolveStarsConfig } from '../packages/schema/src/config/resolve.js';
import type { StarsConfig } from '../packages/schema/src/types/config.ts';

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

export function register(bench: Bench) {
	// `resolveStarsConfig` checks that the entry file exists and throws otherwise, and a throwing benchmark reports nothing.
	const cwd = mkdtempSync(join(tmpdir(), 'stars-bench-'));
	mkdirSync(join(cwd, 'src'));
	writeFileSync(join(cwd, 'src', 'main.ts'), '');
	writeFileSync(join(cwd, 'package.json'), JSON.stringify({ name: 'bot', dependencies: { '@wolfstar/http-framework': '*' } }));
	process.once('exit', () => rmSync(cwd, { recursive: true, force: true }));

	const resolve = (config: StarsConfig) => resolveStarsConfig({ cwd, configFile: null, config, env: {} as NodeJS.ProcessEnv, projectEnv: {} });
	// Fail here, loudly, instead of inside a benchmark.
	resolve({});
	resolve(full);

	bench
		.add('schema: resolveStarsConfig (defaults)', () => {
			resolve({});
		})
		.add('schema: resolveStarsConfig (fully specified)', () => {
			resolve(full);
		});
}
