import { ModuleError, setupModules } from '@wolfstar/kit';
import type { ResolvedStarsConfig } from '@wolfstar/schema';
import { resolve as resolveModule } from 'mlly';
import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { cliDiagnostics } from './diagnostics.js';
import type { StarsHookable } from './hooks.js';
import { findInstalledVersion } from './project.js';
import { readOwnPackageJson } from './version.js';

/**
 * Where a module specifier is imported from: a relative or absolute path is a file of the project, a `file:` URL is
 * itself, anything else is a package resolved from the project root — with `mlly`, honouring the `import` condition,
 * because installed modules are ESM-only packages a CommonJS `require.resolve` cannot see.
 */
async function resolveSpecifier(root: string, specifier: string): Promise<string> {
	if (specifier.startsWith('file:')) return specifier;
	if (specifier.startsWith('.') || isAbsolute(specifier)) return pathToFileURL(resolve(root, specifier)).href;
	return resolveModule(specifier, { url: pathToFileURL(`${root}/package.json`).href });
}

/**
 * Runs `setup` of every module in `modules` (see `@wolfstar/kit`) and returns the configuration carrying what they
 * contributed: `runtime`, and `imports.presets` extended by `ctx.addImports`. Without modules the configuration is
 * returned as it is.
 */
export async function installModules(config: ResolvedStarsConfig, hooks: StarsHookable): Promise<ResolvedStarsConfig> {
	if (config.modules.length === 0) return config;

	try {
		const runtime = await setupModules({
			config,
			hooks,
			versions: { framework: findInstalledVersion(config.root, '@wolfstar/http-framework'), stars: readOwnPackageJson().version },
			load: async (specifier) => import(await resolveSpecifier(config.root, specifier))
		});

		const presets = [...config.imports.presets, ...runtime.imports.filter((preset) => !config.imports.presets.includes(preset))];
		return { ...config, runtime, imports: { ...config.imports, presets } };
	} catch (error) {
		if (error instanceof ModuleError) {
			throw cliDiagnostics.MODULE_FAILED({ module: error.moduleName, reason: error.code, message: error.message, cause: error });
		}

		throw error;
	}
}
