import { TYPESCRIPT_RC_VERSION, type BuildTool, type Formatter, type Language, type Linter } from './options.js';

async function fetchVersion(packageName: string): Promise<string> {
	const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`);
	if (!response.ok) {
		throw new Error(`Failed to resolve latest version for ${packageName}: ${response.status} ${response.statusText}`);
	}
	const data = (await response.json()) as { version: string };
	return data.version;
}

/** Map of package name → resolved version (without a range prefix). */
export type DependencyVersions = Record<string, string>;

export interface VersionSelections {
	i18n: boolean;
	subcommands: boolean;
	subcommandsAdvanced: boolean;
	testing: boolean;
	language: Language;
	buildTool: BuildTool;
	linter: Linter;
	formatter: Formatter;
}

/**
 * Resolves the latest versions of only the packages required by the chosen selections.
 * `ts-node` is intentionally never included. TypeScript 7.0 (tsc7) is pinned to the rc instead
 * of being fetched, because `typescript@latest` resolves to the 6.x line.
 */
export async function fetchDependencyVersions(selections: VersionSelections): Promise<DependencyVersions> {
	const names = new Set<string>([
		'@wolfstar/http-framework',
		'@sapphire/pieces',
		'discord-api-types',
		'@wolfstar/env-utilities',
		'@wolfstar/start-banner',
		'gradient-string'
	]);

	if (selections.i18n) names.add('@wolfstar/plugin-i18next').add('@wolfstar/i18next-type-generator');
	if (selections.testing) names.add('vitest').add('@wolfstar/http-framework-test-utils');

	// TypeScript toolchain (skipped entirely for plain JavaScript projects).
	if (selections.language === 'ts') {
		names.add('@types/node');
		switch (selections.buildTool) {
			case 'tsc6':
				names.add('typescript').add('tsc-watch');
				break;
			case 'tsc7':
				// typescript is pinned to the rc below; tsc-watch backs `watch:start`.
				names.add('tsc-watch');
				break;
			case 'tsdown':
				names.add('tsdown').add('typescript');
				break;
		}
	}

	if (selections.linter === 'eslint') {
		names.add('eslint');
		names.add(selections.language === 'ts' ? 'typescript-eslint' : '@eslint/js');
	}
	if (selections.linter === 'oxlint') names.add('oxlint');
	if (selections.formatter === 'prettier') names.add('prettier');
	if (selections.formatter === 'oxfmt') names.add('oxfmt');

	const list = [...names];
	const resolved = await Promise.all(list.map(fetchVersion));

	const versions: DependencyVersions = {};
	list.forEach((name, index) => {
		versions[name] = resolved[index]!;
	});

	if (selections.language === 'ts' && selections.buildTool === 'tsc7') versions['typescript'] = TYPESCRIPT_RC_VERSION;

	return versions;
}
