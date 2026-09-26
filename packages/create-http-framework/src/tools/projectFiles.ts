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
	packageManager: PackageManager;
	language: Language;
	/** Only meaningful when `language === 'ts'`. */
	buildTool: BuildTool;
	linter: Linter;
	formatter: Formatter;
	versions: DependencyVersions;
}

const caret = (version: string): string => `^${version}`;

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

/** Writes the tsconfig(s). The tsc branches use a composite build so `tsc -b src` resolves `src/tsconfig.json`. */
function writeTsconfig(targetDir: string, ctx: ProjectContext): void {
	if (ctx.language === 'js') return;

	if (isViteBuild(ctx.buildTool)) {
		writeFile(
			join(targetDir, 'tsconfig.json'),
			json({
				extends: './.stars/tsconfig.json',
				compilerOptions: { types: ['node'] },
				// `.stars/imports.d.ts` types the auto imports; `stars dev`/`stars build` regenerate it.
				include: ['src/**/*.ts', '.stars/*.d.ts'],
				exclude: ['node_modules', 'dist', '.output']
			})
		);
		return;
	}

	if (ctx.buildTool === 'tsdown') {
		writeFile(
			join(targetDir, 'tsconfig.json'),
			json({
				extends: './.stars/tsconfig.json',
				compilerOptions: {
					outDir: './dist',
					rootDir: './src'
				},
				// `.stars/imports.d.ts` types the auto imports; `stars dev`/`stars build` regenerate it.
				include: ['src/**/*.ts', '.stars/*.d.ts'],
				exclude: ['node_modules', 'dist']
			})
		);
		return;
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
}

/**
 * Writes the `stars.config.*` file read by the `stars` CLI (`dev`, `build`, `info`, `codegen` scripts). Conventional
 * JavaScript and tsdown projects need no options; an explicit tsc, Vite or Nitro selection is the only generated override.
 */
function writeStarsConfig(targetDir: string, ctx: ProjectContext): void {
	const isJs = ctx.language === 'js';
	const usesTsc = !isJs && (ctx.buildTool === 'tsc6' || ctx.buildTool === 'tsc7');
	let options = usesTsc ? "{ build: { tool: 'tsc' } }" : '{}';
	if (!isJs && isViteBuild(ctx.buildTool)) {
		// Nitro v3 is itself a Vite plugin, so `enableNitro` also needs `enableVite`.
		const nitro = isNitroBuild(ctx.buildTool) ? ", enableNitro: true, nitro: { preset: 'node-server' }" : '';
		options = `{ build: { tool: 'vite' }, experimental: { enableVite: true${nitro} } }`;
	}
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
				categories: { correctness: 'error', suspicious: 'warn' },
				ignorePatterns: ['dist/**', 'node_modules/**']
			})
		);
	} else if (ctx.linter === 'eslint') {
		const content =
			ctx.language === 'ts'
				? [
						"import tseslint from 'typescript-eslint';",
						'',
						'export default tseslint.config(',
						"\t{ ignores: ['dist/**'] },",
						'\t...tseslint.configs.recommended',
						');',
						''
					].join('\n')
				: ["import js from '@eslint/js';", '', 'export default [', "\t{ ignores: ['dist/**'] },", '\tjs.configs.recommended', '];', ''].join(
						'\n'
					);
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
export function writeProjectFiles(targetDir: string, ctx: ProjectContext): void {
	writeFile(join(targetDir, 'package.json'), packageJson(ctx));
	writeTsconfig(targetDir, ctx);
	writeStarsConfig(targetDir, ctx);
	writeLinterConfig(targetDir, ctx);
	writeFormatterConfig(targetDir, ctx);
}
