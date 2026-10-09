import { readProjectEnvFiles, type ResolvedStarsConfig } from '@wolfstar/schema';
import { execFileSync } from 'node:child_process';
import { resolveBinary } from './project.js';

/**
 * The variables the bot will load, for the CLI's own lookups (Discord credentials for the tunnel). With the default
 * loader these are the project's env files, read from `env.path`/`env.env`. With `loader: 'varlock'` they are what
 * `varlock load` resolves from the project's `.env.schema` — a dotenv file may be stale or absent there — and nothing
 * when varlock cannot be run, rather than values the bot never sees.
 */
export function readProjectEnv(config: ResolvedStarsConfig): Record<string, string> {
	const { path, env = 'development' } = config.env.options;
	const { loader } = config.env;
	if (loader !== 'varlock') return readProjectEnvFiles(config.root, env, { path });

	const binary = resolveBinary(config.root, 'varlock', 'varlock');
	if (binary === null) return {};

	try {
		// The way the bot loads it: `@wolfstar/env-utilities` runs `varlock/auto-load` with no `--env` (it ignores
		// `env.env` with varlock), in the environment `stars dev` gives the bot.
		const output = execFileSync(process.execPath, [binary, 'load', '--format', 'json'], {
			cwd: config.root,
			// Same order as `createSupervisor`: `NODE_ENV` is forced to development after `dev.env`, so it can't differ.
			env: { ...process.env, ...config.dev.env, NODE_ENV: 'development' },
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore'],
			timeout: 30_000
		});
		const values = JSON.parse(output) as Record<string, unknown>;
		return Object.fromEntries(
			Object.entries(values)
				.filter(([, value]) => value !== undefined && value !== null)
				.map(([key, value]) => [key, String(value)])
		);
	} catch {
		return {};
	}
}
