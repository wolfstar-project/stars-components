import { SPLIT_TSCONFIG_VERSION, type ResolvedStarsConfig } from '@wolfstar/schema';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import type { Diagnostic } from 'nostics';
import { cliDiagnostics } from './diagnostics.js';

const require = createRequire(import.meta.url);
const presetOptions = (ids: string[]) =>
	Object.assign({}, ...ids.map((id) => (require(id) as { compilerOptions: Record<string, unknown> }).compilerOptions)) as Record<string, unknown>;
// Strictness belongs to every project; the decorator options only to the code the bundler compiles.
const strictOptions = presetOptions(['@sapphire/ts-config', '@sapphire/ts-config/extra-strict']);
const sapphireOptions = presetOptions(['@sapphire/ts-config', '@sapphire/ts-config/extra-strict', '@sapphire/ts-config/decorators']);

export type TsconfigName = 'tsconfig' | 'app' | 'node';

export interface TsconfigStatus {
	/** `tsconfig` is the single file of compatibility versions below 6, `app` and `node` the split ones. */
	name: TsconfigName;
	path: string;
	status: 'written' | 'up-to-date' | 'outdated';
}

/** The root config files that run in Node and never go through the bundler. */
const NODE_PROJECT_FILES = ['stars.config.*', 'vitest.config.*', 'tsdown.config.*', 'vite.config.*', 'scripts/**/*'] as const;

/**
 * Generates the TypeScript configuration without changing the project's own tsconfig: one extendable
 * `.stars/tsconfig.json` below compatibility version 6, and from 6 the `.stars/tsconfig.app.json` (the bot sources) and
 * `.stars/tsconfig.node.json` (the root files that run in Node) a solution-style `tsconfig.json` references.
 * Returns one status per file.
 */
export async function prepareTsconfig(config: ResolvedStarsConfig, check = false): Promise<TsconfigStatus[]> {
	if (config.future.compatibilityVersion < SPLIT_TSCONFIG_VERSION) {
		return [await emit(config, 'tsconfig', appTsconfig(config, 'tsconfig'), check)];
	}

	return [await emit(config, 'app', appTsconfig(config, 'app'), check), await emit(config, 'node', nodeTsconfig(config), check)];
}

/**
 * Reports a root `tsconfig.json` that still extends the single `.stars/tsconfig.json` of compatibility versions below 6,
 * a file `stars prepare` no longer writes from version 6 on. A project moving to 6 updates it once.
 */
export async function findLegacyRootTsconfig(config: ResolvedStarsConfig): Promise<Diagnostic | null> {
	if (config.future.compatibilityVersion < SPLIT_TSCONFIG_VERSION) return null;

	const path = join(config.root, 'tsconfig.json');
	const content = await readFile(path, 'utf-8').catch(() => null);
	if (content === null || !/["']extends["']\s*:\s*(?:\[[^\]]*)?["']\.\/\.stars\/tsconfig\.json["']/.test(content)) return null;

	return cliDiagnostics.TSCONFIG_LEGACY_EXTENDS({ file: relative(config.root, path) || 'tsconfig.json' });
}

async function emit(config: ResolvedStarsConfig, name: TsconfigName, compilerConfig: object, check: boolean): Promise<TsconfigStatus> {
	const path = join(config.root, '.stars', name === 'tsconfig' ? 'tsconfig.json' : `tsconfig.${name}.json`);
	const content = `${JSON.stringify(compilerConfig, null, 2)}\n`;
	if (check) {
		const existing = await readFile(path, 'utf-8').catch(() => null);
		return { name, path, status: existing === content ? 'up-to-date' : 'outdated' };
	}
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, content);
	return { name, path, status: 'written' };
}

/** What `.stars/tsconfig.json` has always been: the bot sources, with the aliases and the bundler's compiler options. */
function appTsconfig(config: ResolvedStarsConfig, name: TsconfigName) {
	const path = join(config.root, '.stars', name === 'tsconfig' ? 'tsconfig.json' : `tsconfig.${name}.json`);
	const fromGenerated = (target: string) => `./${relative(dirname(path), target).replaceAll('\\', '/')}`;
	const paths: Record<string, string[]> = {};
	if (config.build.tool === 'tsdown') {
		const source = dirname(config.entry);
		const defaults = config.build.configFile === null ? { '~': source, '@': source, '~~': config.root, '@@': config.root } : {};
		const aliases = { ...defaults, ...(config.tsdown.alias as Record<string, unknown> | undefined) };
		for (const [alias, target] of Object.entries(aliases)) {
			// Module redirects belong to the bundler; only filesystem targets become TypeScript paths.
			if (typeof target !== 'string' || (!isAbsolute(target) && !/^\.\.?[/\\]/.test(target))) continue;
			const resolved = fromGenerated(resolve(config.root, target));
			paths[alias] = [resolved];
			paths[`${alias}/*`] = [`${resolved}/*`];
		}
	} else if (config.experimental.enableNitro) {
		// `NitroBuilder` turns on Vite's native `resolve.tsconfigPaths` (see https://nitro.build/examples/import-alias),
		// which reads these `paths` straight out of the generated tsconfig — no `tsdown.alias` equivalent to merge
		// with, `vite`/Nitro projects only have this file's own `compilerOptions.paths` to extend or replace.
		const source = dirname(config.entry);
		const defaults = { '~': source, '@': source, '~~': config.root, '@@': config.root };
		for (const [alias, target] of Object.entries(defaults)) {
			const resolved = fromGenerated(resolve(config.root, target));
			paths[alias] = [resolved];
			paths[`${alias}/*`] = [`${resolved}/*`];
		}
	}
	return {
		compilerOptions: {
			...sapphireOptions,
			// Bundlers emit the application; TypeScript only checks it. Keep Node16 emit for tsc.
			...(config.build.tool === 'tsdown' || config.build.tool === 'vite'
				? {
						module: 'ESNext',
						moduleResolution: 'Bundler',
						moduleDetection: 'force',
						isolatedModules: true,
						verbatimModuleSyntax: true,
						allowJs: true,
						allowImportingTsExtensions: true,
						resolvePackageJsonImports: true,
						lib: ['ESNext', 'DOM'],
						noEmit: true
					}
				: {}),
			target: 'ES2022',
			forceConsistentCasingInFileNames: true,
			skipLibCheck: true,
			tsBuildInfoFile: name === 'tsconfig' ? './tsconfig.tsbuildinfo' : `./tsconfig.${name}.tsbuildinfo`,
			paths
		},
		include: [`${fromGenerated(dirname(config.entry))}/**/*`, ...(config.imports.enabled ? [fromGenerated(config.imports.dts)] : [])],
		exclude: [fromGenerated(join(config.root, 'node_modules')), fromGenerated(config.build.outDir)]
	};
}

/**
 * The root files that run in Node: `stars.config.*`, `vitest.config.*`, `scripts/**` and the like. No DOM, no
 * bundler resolution, no aliases or auto imports (none of it applies to a file Node loads itself), and no decorators.
 */
function nodeTsconfig(config: ResolvedStarsConfig) {
	const path = join(config.root, '.stars', 'tsconfig.node.json');
	const fromGenerated = (target: string) => `./${relative(dirname(path), target).replaceAll('\\', '/')}`;
	const source = dirname(config.entry);
	const include = NODE_PROJECT_FILES.map((pattern) => fromGenerated(join(config.root, pattern)));
	// A custom `--config` file name is not covered by the globs.
	if (config.configFile !== null) include.push(fromGenerated(config.configFile));

	return {
		compilerOptions: {
			...strictOptions,
			target: 'ES2022',
			module: 'NodeNext',
			moduleResolution: 'NodeNext',
			moduleDetection: 'force',
			lib: ['ESNext'],
			types: ['node'],
			allowJs: true,
			noEmit: true,
			forceConsistentCasingInFileNames: true,
			skipLibCheck: true,
			tsBuildInfoFile: './tsconfig.node.tsbuildinfo'
		},
		include: [...new Set(include)],
		// The two projects must not overlap: the bot sources belong to the app one. An entry in the project root has
		// no directory of its own to leave out.
		exclude: [
			fromGenerated(join(config.root, 'node_modules')),
			fromGenerated(config.build.outDir),
			...(source === config.root ? [] : [fromGenerated(source)])
		]
	};
}
