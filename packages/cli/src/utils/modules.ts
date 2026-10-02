import { ModuleError, setupModules } from '@wolfstar/kit';
import type { ResolvedStarsConfig } from '@wolfstar/schema';
import { envModuleSource, modulesModuleSource } from '@wolfstar/vite-server/internal';
import { resolve as resolveModule } from 'mlly';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import type { Diagnostic } from 'nostics';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { cliDiagnostics } from './diagnostics.js';
import { UNTRANSFORMED_TOOLS } from './env-import.js';
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

/**
 * The warning for a project whose runtime plugins reach production only through a `node --import` preload, `null`
 * otherwise. It is not one of `config.warnings`: `stars dev` preloads the plugins itself, so there it would be noise
 * on every start. `stars build` and `stars prepare` report it.
 */
export function modulesPreloadWarning(config: ResolvedStarsConfig): Diagnostic | null {
	if (!needsPreload(config)) return null;
	return cliDiagnostics.MODULES_PRELOAD_REQUIRED({
		tool: config.build.tool,
		plugins: [...new Set(config.runtime.plugins.map((plugin) => plugin.module))].join(', ')
	});
}

/** A build tool the entry transform cannot reach, with runtime plugins to register: they need a `node --import` preload. */
function needsPreload(config: ResolvedStarsConfig): boolean {
	return UNTRANSFORMED_TOOLS.has(config.build.tool) && (config.runtime?.plugins.length ?? 0) > 0;
}

export interface ModulesPreloadResult {
	/** Absolute path of the preload file. */
	path: string;
	status: 'written' | 'up-to-date' | 'outdated';
}

/**
 * Writes `.stars/modules.mjs`, the production counterpart of the preload `stars dev` passes to `node`: `node --import
 * ./.stars/modules.mjs <entry>` registers the runtime plugins of the installed modules for the build tools whose entry
 * cannot be transformed (`tsc`, `none`). Its specifiers are bare, so they resolve from the project's `node_modules`
 * like the bot's own imports. `null` when there is nothing to register.
 *
 * With `env` enabled it is preceded by `.stars/env.mjs`, a separate module imported first: imports of one module are
 * all evaluated before its body runs, so the environment could not be loaded ahead of the plugins from the same file,
 * and a plugin reading `process.env` while it is imported would see nothing.
 */
export async function prepareModulesPreload(config: ResolvedStarsConfig, check = false): Promise<ModulesPreloadResult | null> {
	if (!needsPreload(config)) return null;

	const directory = join(config.root, '.stars');
	const path = join(directory, 'modules.mjs');
	const withEnv = config.env?.enabled === true;
	// An absolute path is a `file:` URL in the import, like in `moduleImportArgs`: Node rejects a Windows path there.
	const plugins = modulesModuleSource(config.runtime.plugins, { resolve: (from) => (isAbsolute(from) ? pathToFileURL(from).href : from) });
	const files = [
		{ path, content: withEnv ? `import "./env.mjs";\n${plugins}` : plugins },
		...(withEnv ? [{ path: join(directory, 'env.mjs'), content: envModuleSource(config.env.options) }] : [])
	];

	if (check) {
		const current = await Promise.all(files.map(async (file) => (await readFile(file.path, 'utf-8').catch(() => null)) === file.content));
		return { path, status: current.every(Boolean) ? 'up-to-date' : 'outdated' };
	}

	await mkdir(directory, { recursive: true });
	await Promise.all(files.map((file) => writeFile(file.path, file.content)));
	return { path, status: 'written' };
}
