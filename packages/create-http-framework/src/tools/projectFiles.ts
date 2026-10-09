import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { writeFile } from './fileSystem.js';
import type { DependencyVersions } from './npmHelpers.js';
import { isNitroBuild, isViteBuild, type BuildTool, type Formatter, type Language, type Linter } from './options.js';
import type { PackageManager } from './packageManager.js';

export interface ProjectContext {
	name: string;
	port: number;
	i18n: boolean;
	subcommands: boolean;
	subcommandsAdvanced: boolean;
	testing: boolean;
	gateway: boolean;
	cache: boolean;
	redis: boolean;
	sharder: boolean;
	/** Whether `stars dev` opens a cloudflared quick tunnel for the interactions endpoint. */
	tunnel?: boolean;
	/** Whether the project depends on `varlock`: scaffolded with `--env varlock`, or already there in the target directory. */
	varlock?: boolean;
	/**
	 * Whether `stars.config` sets `env: { loader: 'varlock' }`: the project has a varlock schema, scaffolded or already
	 * there. Only written where `stars` registers `env` itself (see {@link registersEnvFromConfig}); elsewhere the runtime
	 * picks varlock on its own, from the same schema.
	 */
	varlockLoader?: boolean;
	/**
	 * The `future.compatibilityVersion` the project is generated for. From 6 the root `tsconfig.json` of a `tsdown` or
	 * Vite project only references the `.stars/` configs `stars prepare` writes. Defaults to {@link GENERATED_COMPATIBILITY_VERSION}.
	 */
	compatibilityVersion?: number;
	packageManager: PackageManager;
	language: Language;
	/** Only meaningful when `language === 'ts'`. */
	buildTool: BuildTool;
	linter: Linter;
	formatter: Formatter;
	versions: DependencyVersions;
}

const caret = (version: string): string => `^${version}`;

/** The compatibility version a generated project runs on: the default of `@wolfstar/schema`'s current latest version. */
export const GENERATED_COMPATIBILITY_VERSION = 6;
/** From this version on `stars prepare` splits `.stars/tsconfig.json` into an app and a node config (`SPLIT_TSCONFIG_VERSION`). */
export const SPLIT_TSCONFIG_VERSION = 6;

export const FRAMEWORK_LINT_PLUGIN = '@wolfstar/eslint-plugin-http-framework';

/** The rules of {@link FRAMEWORK_LINT_PLUGIN}, listed for oxlint, whose JSON configuration cannot import them. */
export const FRAMEWORK_LINT_RULES = [
	'wolfstar/apply-options-decorator-order',
	'wolfstar/require-subcommand-parent',
	'wolfstar/no-raw-discord-fetch',
	'wolfstar/no-dynamic-translation-key',
	'wolfstar/prefer-apply-localized-builder',
	'wolfstar/no-hoisted-plugin-register-import',
	'wolfstar/no-deprecated-i18n-package'
] as const;

function sortKeys<T extends Record<string, string>>(record: T): T {
	return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b))) as T;
}

function json(value: unknown): string {
	return `${JSON.stringify(value, null, '\t')}\n`;
}

/** The file `start` runs and `main` points at: sources for JavaScript, the build output for TypeScript. */
function entryFile(ctx: ProjectContext): string {
	if (ctx.language === 'js') return 'src/main.js';
	return isNitroBuild(ctx.buildTool) ? '.output/server/index.mjs' : 'dist/main.js';
}

export function buildScripts(ctx: ProjectContext): Record<string, string> {
	// `stars dev` / `stars build` (from @wolfstar/cli) read stars.config.* and drive the build tool chosen below, so
	// the scripts are the same for every language and build tool.
	const scripts: Record<string, string> = {
		dev: 'stars dev',
		...(ctx.language === 'ts' && (ctx.buildTool === 'tsdown' || isViteBuild(ctx.buildTool)) ? { postinstall: 'stars prepare' } : {}),
		...(ctx.language === 'js' ? {} : { build: 'stars build' }),
		// A root `tsconfig.json` that only references the generated projects checks nothing on its own.
		...(splitsTsconfig(ctx) ? { typecheck: 'stars typecheck' } : {}),
		start: `node ${entryFile(ctx)}`
	};

	if (ctx.linter === 'oxlint') {
		scripts['lint'] = 'oxlint src';
		scripts['lint:fix'] = 'oxlint --fix src';
	} else if (ctx.linter === 'eslint') {
		scripts['lint'] = 'eslint src';
		scripts['lint:fix'] = 'eslint src --fix';
	}

	if (ctx.formatter === 'oxfmt') {
		scripts['format'] = 'oxfmt --write src';
		scripts['format:check'] = 'oxfmt --check src';
	} else if (ctx.formatter === 'prettier') {
		scripts['format'] = 'prettier --write src';
		scripts['format:check'] = 'prettier --check src';
	}

	if (ctx.i18n) scripts['generate:i18n'] = 'stars codegen';
	if (ctx.testing) scripts['test'] = 'vitest run';

	return scripts;
}

export function buildDependencies(ctx: ProjectContext): Record<string, string> {
	const v = ctx.versions;
	const dependencies: Record<string, string> = {
		'@wolfstar/http-framework': caret(v['@wolfstar/http-framework']!),
		'@sapphire/pieces': caret(v['@sapphire/pieces']!),
		'discord-api-types': caret(v['discord-api-types']!),
		'@wolfstar/env-utilities': caret(v['@wolfstar/env-utilities']!),
		'@wolfstar/start-banner': caret(v['@wolfstar/start-banner']!),
		'gradient-string': caret(v['gradient-string']!)
	};
	if (ctx.i18n) dependencies['@wolfstar/plugin-i18next'] = caret(v['@wolfstar/plugin-i18next']!);
	if (ctx.gateway) dependencies['@wolfstar/plugin-gateway'] = caret(v['@wolfstar/plugin-gateway']!);
	if (ctx.cache) dependencies['@wolfstar/plugin-cache'] = caret(v['@wolfstar/plugin-cache']!);
	if (ctx.redis) dependencies['ioredis'] = caret(v['ioredis']!);
	if (ctx.sharder) dependencies['@wolfstar/plugin-sharder'] = caret(v['@wolfstar/plugin-sharder']!);
	// Optional peer of `@wolfstar/env-utilities`: the project installs it itself.
	if (ctx.varlock) dependencies['varlock'] = caret(v['varlock']!);
	return sortKeys(dependencies);
}

export function buildDevDependencies(ctx: ProjectContext): Record<string, string> {
	const v = ctx.versions;
	const dev: Record<string, string> = { '@wolfstar/cli': caret(v['@wolfstar/cli']!) };

	if (ctx.language === 'ts') {
		dev['@types/node'] = caret(v['@types/node']!);
		switch (ctx.buildTool) {
			case 'tsc6':
				dev['typescript'] = caret(v['typescript']!);
				break;
			case 'tsc7':
				// rc prerelease — pin exactly rather than with a caret range.
				dev['typescript'] = v['typescript']!;
				break;
			case 'tsdown':
				dev['tsdown'] = caret(v['tsdown']!);
				dev['typescript'] = caret(v['typescript']!);
				break;
			case 'vite':
			case 'vite-nitro':
				dev['vite'] = caret(v['vite']!);
				dev['typescript'] = caret(v['typescript']!);
				// Nitro v3 is a beta prerelease — pin exactly rather than with a caret range.
				if (isNitroBuild(ctx.buildTool)) dev['nitro'] = v['nitro']!;
				break;
		}
	}

	if (ctx.linter === 'eslint') {
		dev['eslint'] = caret(v['eslint']!);
		if (ctx.language === 'ts') dev['typescript-eslint'] = caret(v['typescript-eslint']!);
		else dev['@eslint/js'] = caret(v['@eslint/js']!);
	} else if (ctx.linter === 'oxlint') {
		dev['oxlint'] = caret(v['oxlint']!);
	}

	// The framework's own rules (decorator order, raw Discord fetches, …) run in both linters from one plugin.
	if (ctx.linter !== 'none') dev[FRAMEWORK_LINT_PLUGIN] = caret(v[FRAMEWORK_LINT_PLUGIN]!);

	if (ctx.formatter === 'prettier') {
		dev['prettier'] = caret(v['prettier']!);
	} else if (ctx.formatter === 'oxfmt') {
		dev['oxfmt'] = caret(v['oxfmt']!);
	}

	if (ctx.i18n) dev['@wolfstar/i18next-type-generator'] = caret(v['@wolfstar/i18next-type-generator']!);

	if (ctx.testing) {
		dev['vitest'] = caret(v['vitest']!);
		dev['@wolfstar/http-framework-test-utils'] = caret(v['@wolfstar/http-framework-test-utils']!);
	}

	return sortKeys(dev);
}

export function packageJson(ctx: ProjectContext): string {
	const devDependencies = buildDevDependencies(ctx);
	// client.load() locates the commands directory relative to this field (dirname(main) + 'commands'), not relative
	// to the running file, so it must point at whichever file `start` actually runs.
	const main = entryFile(ctx);
	return json({
		name: ctx.name,
		version: '1.0.0',
		description: 'A Discord HTTP bot built with `@wolfstar/http-framework`',
		type: 'module',
		main,
		scripts: buildScripts(ctx),
		dependencies: buildDependencies(ctx),
		...(Object.keys(devDependencies).length > 0 ? { devDependencies } : {}),
		// `@wolfstar/plugin-gateway` requires it.
		engines: { node: ctx.gateway ? '>=24.17.0' : '>=20' }
	});
}

const sharedCompilerOptions = {
	target: 'ES2022',
	module: 'Node16',
	moduleResolution: 'Node16',
	strict: true,
	esModuleInterop: true,
	skipLibCheck: true,
	declaration: true,
	declarationMap: true,
	sourceMap: true,
	experimentalDecorators: true,
	emitDecoratorMetadata: true
} as const;

/** Whether the root `tsconfig.json` is the solution-style one that references `.stars/tsconfig.{app,node}.json`. */
function splitsTsconfig(ctx: ProjectContext): boolean {
	return (
		ctx.language === 'ts' &&
		(ctx.buildTool === 'tsdown' || isViteBuild(ctx.buildTool)) &&
		(ctx.compatibilityVersion ?? GENERATED_COMPATIBILITY_VERSION) >= SPLIT_TSCONFIG_VERSION
	);
}

/** The root `tsconfig.json` of compatibility versions 5 and below: it extends the single generated config. */
function legacyTsconfig(ctx: ProjectContext): object {
	if (isViteBuild(ctx.buildTool)) {
		return {
			extends: './.stars/tsconfig.json',
			compilerOptions: { types: ['node'] },
			// `.stars/imports.d.ts` types the auto imports; `stars dev`/`stars build` regenerate it.
			include: ['src/**/*.ts', '.stars/*.d.ts'],
			exclude: ['node_modules', 'dist', '.output']
		};
	}

	return {
		extends: './.stars/tsconfig.json',
		compilerOptions: { outDir: './dist', rootDir: './src' },
		// `.stars/imports.d.ts` types the auto imports; `stars dev`/`stars build` regenerate it.
		include: ['src/**/*.ts', '.stars/*.d.ts'],
		exclude: ['node_modules', 'dist']
	};
}

/** The solution-style root `tsconfig.json`, the way a Nuxt 4 project has it: only the generated projects are checked. */
const solutionTsconfig = {
	files: [],
	references: [{ path: './.stars/tsconfig.app.json' }, { path: './.stars/tsconfig.node.json' }]
};

const parseJson = (content: string): unknown => {
	try {
		return JSON.parse(content);
	} catch {
		return undefined;
	}
};

/**
 * Writes the root `tsconfig.json` of a `tsdown` or Vite project. An existing one is only replaced when it is what the
 * generator wrote before (this version's, or the `extends` one of compatibility version 5 and below): `tsconfig.json`
 * is where a project keeps its own options. Compared as JSON, since the formatter run after generation rewrites the
 * whitespace.
 *
 * @returns Whether an existing, hand-edited file was kept.
 */
function writeBundlerTsconfig(targetDir: string, ctx: ProjectContext): boolean {
	const path = join(targetDir, 'tsconfig.json');
	const next = splitsTsconfig(ctx) ? solutionTsconfig : legacyTsconfig(ctx);
	const existing = existsSync(path) ? parseJson(readFileSync(path, 'utf-8')) : null;
	const generated = [next, legacyTsconfig(ctx), solutionTsconfig].map((candidate) => JSON.stringify(candidate));
	if (existing !== null && !generated.includes(JSON.stringify(existing))) return true;

	writeFile(path, json(next));
	return false;
}

/**
 * Writes the tsconfig(s). The tsc branches use a composite build so `tsc -b src` resolves `src/tsconfig.json`.
 *
 * @returns The files kept because they were hand-edited.
 */
function writeTsconfig(targetDir: string, ctx: ProjectContext): string[] {
	if (ctx.language === 'js') return [];

	if (isViteBuild(ctx.buildTool) || ctx.buildTool === 'tsdown') {
		return writeBundlerTsconfig(targetDir, ctx) ? ['tsconfig.json'] : [];
	}

	writeFile(join(targetDir, 'tsconfig.json'), json({ files: [], references: [{ path: './src' }] }));
	writeFile(
		join(targetDir, 'src', 'tsconfig.json'),
		json({
			compilerOptions: {
				...sharedCompilerOptions,
				rootDir: '.',
				outDir: '../dist',
				composite: true,
				tsBuildInfoFile: '../dist/tsconfig.tsbuildinfo'
			},
			include: ['**/*.ts']
		})
	);
	return [];
}

/**
 * Writes the `stars.config.*` file read by the `stars` CLI (`dev`, `build`, `info`, `codegen` scripts). Conventional
 * tsdown projects need no options; an explicit tsc, Vite or Nitro selection is the only generated build override.
 * JavaScript and tsc projects also turn the automatic `env` registration off: their output never passes through the
 * entry transform that registers it, so `src/lib/setup` loads the environment itself (see `registersEnv` in the
 * template processor).
 */
/**
 * Whether `stars` loads `env` from `stars.config`: the entry of a `tsdown` or Vite build passes through its transform. A
 * `tsc` or JavaScript project loads the environment itself (`env: false`), and Nitro leaves `env` off by default.
 */
function registersEnvFromConfig(ctx: ProjectContext): boolean {
	return ctx.language === 'ts' && (ctx.buildTool === 'tsdown' || ctx.buildTool === 'vite');
}

function writeStarsConfig(targetDir: string, ctx: ProjectContext): void {
	const isJs = ctx.language === 'js';
	const usesTsc = !isJs && (ctx.buildTool === 'tsc6' || ctx.buildTool === 'tsc7');
	const parts = usesTsc ? ["build: { tool: 'tsc' }", 'env: false'] : isJs ? ['env: false'] : [];
	if (ctx.varlockLoader && registersEnvFromConfig(ctx)) parts.push("env: { loader: 'varlock' }");
	if (!isJs && isViteBuild(ctx.buildTool)) {
		// Nitro v3 is itself a Vite plugin, so `enableNitro` also needs `enableVite`.
		const nitro = isNitroBuild(ctx.buildTool) ? ", enableNitro: true, nitro: { preset: 'node-server' }" : '';
		parts.push("build: { tool: 'vite' }", `experimental: { enableVite: true${nitro} }`);
	}
	// A cloudflared quick tunnel, so Discord reaches the bot on the developer's machine.
	if (ctx.tunnel) parts.push('dev: { tunnel: true }');
	const options = parts.length > 0 ? `{ ${parts.join(', ')} }` : '{}';
	const content = ["import { defineConfig } from '@wolfstar/http-framework/config';", '', `export default defineConfig(${options});`, ''].join(
		'\n'
	);
	writeFile(join(targetDir, isJs ? 'stars.config.js' : 'stars.config.ts'), content);
}

function writeLinterConfig(targetDir: string, ctx: ProjectContext): void {
	if (ctx.linter === 'oxlint') {
		writeFile(
			join(targetDir, '.oxlintrc.json'),
			json({
				$schema: './node_modules/oxlint/configuration_schema.json',
				...(ctx.language === 'ts' ? { plugins: ['typescript'] } : {}),
				jsPlugins: [FRAMEWORK_LINT_PLUGIN],
				categories: { correctness: 'error', suspicious: 'warn' },
				rules: Object.fromEntries(FRAMEWORK_LINT_RULES.map((rule) => [rule, 'error'])),
				ignorePatterns: ['dist/**', 'node_modules/**']
			})
		);
	} else if (ctx.linter === 'eslint') {
		const content =
			ctx.language === 'ts'
				? [
						`import wolfstar, { recommendedRules } from '${FRAMEWORK_LINT_PLUGIN}';`,
						"import tseslint from 'typescript-eslint';",
						'',
						'export default tseslint.config(',
						"\t{ ignores: ['dist/**'] },",
						'\t...tseslint.configs.recommended,',
						'\t{ plugins: { wolfstar }, rules: recommendedRules }',
						');',
						''
					].join('\n')
				: [
						"import js from '@eslint/js';",
						`import wolfstar, { recommendedRules } from '${FRAMEWORK_LINT_PLUGIN}';`,
						'',
						'export default [',
						"\t{ ignores: ['dist/**'] },",
						'\tjs.configs.recommended,',
						'\t{ plugins: { wolfstar }, rules: recommendedRules }',
						'];',
						''
					].join('\n');
		writeFile(join(targetDir, 'eslint.config.mjs'), content);
	}
}

function writeFormatterConfig(targetDir: string, ctx: ProjectContext): void {
	if (ctx.formatter === 'oxfmt') {
		writeFile(
			join(targetDir, '.oxfmtrc.json'),
			json({
				$schema: './node_modules/oxfmt/configuration_schema.json',
				useTabs: true,
				tabWidth: 4,
				printWidth: 150,
				singleQuote: true,
				trailingComma: 'none',
				semi: true,
				endOfLine: 'lf'
			})
		);
	} else if (ctx.formatter === 'prettier') {
		writeFile(
			join(targetDir, '.prettierrc.json'),
			json({ useTabs: true, tabWidth: 4, printWidth: 150, singleQuote: true, trailingComma: 'none' })
		);
	}
}

/** Generates every config-style file in code so the output is always valid, formatted JSON/TS. */
/** @returns The generated files that were kept because the project hand-edited them. */
export function writeProjectFiles(targetDir: string, ctx: ProjectContext): string[] {
	writeFile(join(targetDir, 'package.json'), packageJson(ctx));
	const kept = writeTsconfig(targetDir, ctx);
	writeStarsConfig(targetDir, ctx);
	writeLinterConfig(targetDir, ctx);
	writeFormatterConfig(targetDir, ctx);
	return kept;
}
