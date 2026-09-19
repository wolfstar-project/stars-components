/**
 * `@wolfstar/http-framework/auto-imports`, resolved from the project's own installation rather than declared as a
 * dependency of this package — the way `@nuxt/cli` resolves the project's own `nuxt` without depending on it.
 * `@wolfstar/http-framework` depends on `@wolfstar/cli` (for its `stars` binary), so the reverse dependency here
 * would make the two packages depend on each other.
 *
 * `mlly`'s `resolve` (the same tool `@wolfstar/http-framework/auto-imports` itself already uses to scan preset
 * packages, see its `scanPresetImports`) anchors the resolution at the project root, respecting its `exports`
 * `import` condition. A plain `require.resolve` anchored the same way (as `tsdown`/`vite`/`nitro` are resolved
 * elsewhere in this package, see `utils/project.ts`) does not work here: those are dual CJS/ESM packages, while
 * `@wolfstar/http-framework` is ESM-only, so a CJS-style resolver reports its `./auto-imports` subpath as
 * unavailable even though it exists. Anchoring at the project root is also what makes this find the project's real,
 * already-built `@wolfstar/http-framework` even though pnpm workspace packages are linked directly (not hoisted or
 * nested under `.pnpm`), which is what makes a plain bare-specifier `import()` from this package's own location
 * unable to reach it.
 *
 * The fallback bare specifier is for this repository's own tests, which alias it to source without a build; a
 * variable (not a string literal) in the `import()` call keeps TypeScript from requiring `@wolfstar/http-framework`
 * to resolve at type-check time too, since only a literal argument triggers module resolution.
 */
import type { ResolvedImportsConfig } from '@wolfstar/schema';
import { resolve as resolveModule } from 'mlly';
import { pathToFileURL } from 'node:url';

const AUTO_IMPORTS_SPECIFIER = '@wolfstar/http-framework/auto-imports';

export interface AutoImportsPluginOptions extends Pick<ResolvedImportsConfig, 'dirs' | 'presets' | 'exclude' | 'dts'> {
	/** Absolute project root, used to resolve `presets` against the project's own `node_modules`. */
	root: string;
}

interface AutoImportsModule {
	autoImports(options: AutoImportsPluginOptions): Promise<unknown>;
	generateAutoImportsDts(options: Omit<AutoImportsPluginOptions, 'dts'>): Promise<string>;
}

/** Loads `@wolfstar/http-framework/auto-imports` from the project at `root`. */
export async function loadAutoImportsModule(root: string): Promise<AutoImportsModule> {
	const url = pathToFileURL(`${root}/package.json`).href;
	const target = await resolveModule(AUTO_IMPORTS_SPECIFIER, { url }).catch(() => AUTO_IMPORTS_SPECIFIER);
	return (await import(target)) as AutoImportsModule;
}
