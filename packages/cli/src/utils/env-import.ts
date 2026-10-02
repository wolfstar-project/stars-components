import type { ResolvedStarsConfig } from '@wolfstar/schema';
import { envModuleSource, modulesModuleSource } from '@wolfstar/vite-server/internal';
import { resolveSync } from 'mlly';
import { isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import { cliDiagnostics } from './diagnostics.js';
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

/**
 * `node` arguments that register the runtime plugins of the installed modules (`ctx.addPlugin`) before the entry
 * runs, for the build tools the entry transform cannot reach. `@wolfstar/http-framework` and every plugin are resolved
 * from the project first, with the `import` condition (both are ESM), because a `data:` URL cannot resolve bare
 * specifiers; the framework is the bot's own copy, so `Client.use` reaches the `Client` the bot constructs. When the
 * framework is not installed nothing is preloaded, and the bot's own import of it reports the missing install.
 */
export function moduleImportArgs(config: ResolvedStarsConfig): string[] {
	const plugins = config.runtime?.plugins ?? [];
	if (plugins.length === 0 || !UNTRANSFORMED_TOOLS.has(config.build.tool)) return [];

	const url = pathToFileURL(`${config.root}/package.json`).href;
	let framework: string;
	try {
		framework = resolveSync('@wolfstar/http-framework', { url });
	} catch {
		return [];
	}

	const source = modulesModuleSource(plugins, {
		framework,
		resolve: (from) => {
			if (from.startsWith('file:')) return from;
			if (isAbsolute(from)) return pathToFileURL(from).href;
			try {
				return resolveSync(from, { url });
			} catch {
				throw cliDiagnostics.DEPENDENCY_MISSING({
					name: from,
					root: config.root,
					hint: 'Install the package of the module that registers this plugin.'
				});
			}
		}
	});
	return ['--import', `data:text/javascript,${encodeURIComponent(source)}`];
}
