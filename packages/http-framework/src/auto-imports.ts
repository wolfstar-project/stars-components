/**
 * Nuxt-style auto imports for `@wolfstar/http-framework` projects.
 *
 * Wires `unimport` into `tsdown`'s rolldown pipeline: the framework's (and any configured preset's) exports, plus
 * the project's own {@link AutoImportsPluginOptions.dirs}, become usable without an explicit `import` statement, the
 * same way Nuxt's own exports and its `composables`/`utils` directories do. Only usable with the `tsdown` build
 * tool — `tsc` and `none` have no transform step to hook the injection into.
 *
 * @module @wolfstar/http-framework/auto-imports
 */
import { resolveModuleExportNames } from 'mlly';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createUnimport, type Import } from 'unimport';
import unplugin from 'unimport/unplugin';
import type { ResolvedImportsConfig } from './lib/config/resolve.js';

/**
 * Export names never auto-imported, even when a preset re-exports them under that name: names generic enough that
 * project code is likely to declare or import its own value with the same identifier.
 */
const BLOCKED_EXPORTS: ReadonlySet<string> = new Set(['Client', 'Message', 'Plugin', 'Store']);

/**
 * Nuxt matches its own auto-import transform against every JS/TS file variant (`.js .mjs .cjs .ts .mts .cts .jsx
 * .tsx`, see `isJS` in `@nuxt/kit`), not `unimport`'s narrower unplugin default (`/\.[jt]sx?$/`, which misses
 * `.mjs`/`.cjs`/`.mts`/`.cts`): whether a file gets auto imports must not depend on whether the project happens to
 * use TypeScript.
 */
const TRANSFORM_INCLUDE = [/\.(?:[cm]?[jt]s|[jt]sx)$/];

export interface AutoImportsPluginOptions extends Pick<ResolvedImportsConfig, 'dirs' | 'presets' | 'exclude' | 'dts'> {
	/** Absolute project root, used to resolve `presets` against the project's own `node_modules`. */
	root: string;
}

/**
 * Scans every configured preset package for its export names, from the project's own `node_modules` so the result
 * matches what the project actually has installed. Packages that fail to resolve (not installed, or a preset the
 * user configured for a plugin they do not use) are skipped rather than failing the build.
 */
async function scanPresetImports(root: string, presets: readonly string[], excluded: ReadonlySet<string>): Promise<Import[]> {
	const url = pathToFileURL(`${root}/package.json`).href;
	const imports: Import[] = [];

	await Promise.all(
		presets.map(async (from) => {
			let names: string[];
			try {
				names = await resolveModuleExportNames(from, { url });
			} catch {
				return;
			}

			for (const name of names) {
				if (excluded.has(name)) continue;
				imports.push({ name, from });
			}
		})
	);

	return imports;
}

/**
 * Builds the rolldown plugin `tsdown.config.ts` adds to `plugins` to enable auto imports, as resolved from
 * {@link StarsImportsConfig} (see `@wolfstar/http-framework/config`).
 */
export async function autoImports(options: AutoImportsPluginOptions) {
	const excluded = new Set([...BLOCKED_EXPORTS, ...options.exclude]);
	const imports = await scanPresetImports(options.root, options.presets, excluded);

	// `unimport`'s unplugin writes `dts` on `buildStart` but does not create its parent directory.
	mkdirSync(dirname(options.dts), { recursive: true });

	return unplugin.rolldown({
		imports,
		dirs: [...options.dirs],
		include: TRANSFORM_INCLUDE,
		dts: options.dts
	});
}

/**
 * Generates the auto imports declaration file's contents without writing it, so `stars prepare --check` can diff it
 * against what is on disk the same way `stars codegen --check` does for i18next types.
 */
export async function generateAutoImportsDts(options: Pick<AutoImportsPluginOptions, 'root' | 'dirs' | 'presets' | 'exclude'>): Promise<string> {
	const excluded = new Set([...BLOCKED_EXPORTS, ...options.exclude]);
	const imports = await scanPresetImports(options.root, options.presets, excluded);
	const ctx = createUnimport({ imports, dirs: [...options.dirs] });
	await ctx.init();
	return ctx.generateTypeDeclarations();
}
