import type { ResolvedStarsConfig } from '@wolfstar/schema';
import { envModuleSource } from '@wolfstar/vite-server/internal';
import { pathToFileURL } from 'node:url';
import { resolveFromProject } from './project.js';

/** Build tools whose output never passes through the entry transform that registers `env`. */
const UNTRANSFORMED_TOOLS = new Set<string>(['none', 'tsc']);

/**
 * `node` arguments that register `env` before the entry runs, for the build tools the entry transform cannot reach.
 * The preload is a `data:` URL, so `.stars/` gets no generated runtime file; a `data:` URL cannot resolve bare
 * specifiers, so `@wolfstar/env-utilities` is resolved from the project first. When it cannot be resolved nothing is
 * preloaded, and the bot's own import of it reports the missing install.
 */
export function envImportArgs(config: ResolvedStarsConfig): string[] {
	if (!config.env.enabled || !UNTRANSFORMED_TOOLS.has(config.build.tool)) return [];

	const resolved = resolveFromProject(config.root, '@wolfstar/env-utilities');
	if (resolved === null) return [];

	const source = envModuleSource(config.env.options, pathToFileURL(resolved).href);
	return ['--import', `data:text/javascript,${encodeURIComponent(source)}`];
}
