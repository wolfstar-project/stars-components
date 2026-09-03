import { join } from 'node:path';
import { writeFile } from './fileSystem.js';
import type { DependencyVersions } from './npmHelpers.js';
import type { BuildTool, Formatter, Language, Linter } from './options.js';
import { getRunScript, type PackageManager } from './packageManager.js';

export interface ProjectContext {
	name: string;
	port: number;
	i18n: boolean;
	subcommands: boolean;
	subcommandsAdvanced: boolean;
	testing: boolean;
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

export function buildScripts(ctx: ProjectContext): Record<string, string> {
	const { packageManager: pm, buildTool } = ctx;
	const start = 'node dist/main.js';

	let scripts: Record<string, string>;
	if (ctx.language === 'js') {
		// Plain JavaScript runs directly — no compile step.
		scripts = {
			start: 'node src/main.js',
			dev: 'node --watch src/main.js'
		};
	} else if (buildTool === 'tsdown') {
		scripts = {
			build: 'tsdown',
			dev: getRunScript(pm, 'build', ['--onSuccess', getRunScript(pm, 'start')]),
			watch: getRunScript(pm, 'build', ['--watch']),
			'watch:start': getRunScript(pm, 'build', ['--watch', '--onSuccess', getRunScript(pm, 'start')]),
			start
		};
	} else {
		scripts = {
			build: 'tsc -b src',
			dev: `${getRunScript(pm, 'build')} && ${getRunScript(pm, 'start')}`,
			watch: 'tsc -b src -w',
			'watch:start': `tsc-watch -b src --onSuccess "${getRunScript(pm, 'start')}"`,
			start
		};
	}

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

	if (ctx.i18n) scripts['generate:i18n'] = 'i18next-type-generator ./src/locales/en-US/ ./src/@types/i18next.d.ts';
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
	return sortKeys(dependencies);
}

export function buildDevDependencies(ctx: ProjectContext): Record<string, string> {
	const v = ctx.versions;
	const dev: Record<string, string> = {};

	if (ctx.language === 'ts') {
		dev['@types/node'] = caret(v['@types/node']!);
		switch (ctx.buildTool) {
			case 'tsc6':
				dev['typescript'] = caret(v['typescript']!);
				dev['tsc-watch'] = caret(v['tsc-watch']!);
				break;
			case 'tsc7':
				// rc prerelease — pin exactly rather than with a caret range.
				dev['typescript'] = v['typescript']!;
				dev['tsc-watch'] = caret(v['tsc-watch']!);
				break;
			case 'tsdown':
				dev['tsdown'] = caret(v['tsdown']!);
				dev['typescript'] = caret(v['typescript']!);
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
	const main = ctx.language === 'js' ? 'src/main.js' : 'dist/main.js';
	return json({
		name: ctx.name,
		version: '1.0.0',
		description: 'A Discord HTTP bot built with `@wolfstar/http-framework`',
		type: 'module',
		main,
		scripts: buildScripts(ctx),
		dependencies: buildDependencies(ctx),
		...(Object.keys(devDependencies).length > 0 ? { devDependencies } : {}),
		engines: { node: '>=20' }
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

	if (ctx.buildTool === 'tsdown') {
		writeFile(
			join(targetDir, 'tsconfig.json'),
			json({
				compilerOptions: { ...sharedCompilerOptions, outDir: './dist', rootDir: './src' },
				include: ['src/**/*.ts'],
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

function writeBuildConfig(targetDir: string, ctx: ProjectContext): void {
	if (ctx.language === 'js' || ctx.buildTool !== 'tsdown') return;
	const content = [
		"import { defineConfig } from 'tsdown';",
		'',
		'export default defineConfig({',
		"\tentry: ['src/**/*.ts'],",
		"\tformat: ['esm'],",
		"\ttarget: 'node20',",
		'\t// Mirror the src/ structure so the framework can load command pieces from dist/commands at runtime.',
		'\tunbundle: true,',
		'\t// Emit dist/main.js so the shared `start` script (node dist/main.js) works.',
		"\toutExtensions: () => ({ js: '.js' }),",
		'\tclean: true,',
		'\tsourcemap: true',
		'});',
		''
	].join('\n');
	writeFile(join(targetDir, 'tsdown.config.ts'), content);
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
	writeBuildConfig(targetDir, ctx);
	writeLinterConfig(targetDir, ctx);
	writeFormatterConfig(targetDir, ctx);
}
