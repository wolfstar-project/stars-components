import { relative, resolve as resolveDir } from 'path';
import { type UserConfig } from 'tsdown';
export type FormatConfig = Exclude<NonNullable<UserConfig['format']>, string | string[]> extends Record<string, infer V> ? NonNullable<V> : never;

export interface FormatConfigCJS extends FormatConfig {
	disabled?: boolean;
}

type LegacyFormatPlugins = { plugins?: UserConfig['plugins'] };

function splitFormatOptions<T extends object>(options?: T) {
	if (!options) {
		return { formatOptions: undefined as T | undefined, plugins: undefined as UserConfig['plugins'] | undefined };
	}

	const { plugins, ...formatOptions } = options as T & LegacyFormatPlugins;
	return { formatOptions: formatOptions as T, plugins };
}

const esmOutExtensions = () => ({ js: '.js', dts: '.d.ts' });
const cjsOutExtensions = () => ({ js: '.cjs', dts: '.d.cts' });

const baseOptions: UserConfig = {
	clean: true,
	dts: true,
	entry: ['src/index.ts'],
	minify: false,
	deps: { skipNodeModulesBundle: true },
	sourcemap: true,
	target: 'es2021',
	treeshake: true,
	attw: {
		entrypoints: ['.'],
		enabled: true,
		level: 'error',
		profile: 'node16'
	},

	tsconfig: relative(import.meta.dirname, resolveDir(import.meta.dirname, '../tsconfig.build.json')),

	publint: {
		enabled: true,
		level: 'error'
	}
};

export function createTsdownOptions(options?: EnhancedTsdownOptions) {
	const { cjsOptions, esmOptions, entry, target, plugins } = options ?? {};
	const { formatOptions: cjsFormatOptions, plugins: cjsPlugins } = splitFormatOptions(cjsOptions);
	const { formatOptions: esmFormatOptions, plugins: esmPlugins } = splitFormatOptions(esmOptions);
	const { disabled: cjsDisabled, ...cjsRest } = cjsFormatOptions ?? {};
	const mergedPlugins = [...(plugins ?? []), ...(cjsPlugins ?? []), ...(esmPlugins ?? [])];

	const esmFormat = {
		outDir: 'dist/esm',
		outExtensions: esmOutExtensions,
		...esmFormatOptions
	};

	return {
		...baseOptions,
		attw: {
			...baseOptions.attw,
			profile: cjsDisabled ? 'esm-only' : 'node16'
		},
		entry: entry ?? baseOptions.entry,
		...(target ? { target } : {}),
		...(mergedPlugins.length > 0 ? { plugins: mergedPlugins } : {}),
		format: cjsDisabled
			? { esm: esmFormat }
			: {
					esm: esmFormat,
					cjs: {
						outDir: 'dist/cjs',
						outExtensions: cjsOutExtensions,
						...cjsRest
					}
				}
	} satisfies UserConfig;
}

export interface EnhancedTsdownOptions {
	cjsOptions?: FormatConfigCJS;
	esmOptions?: FormatConfig;
	entry?: UserConfig['entry'];
	plugins?: UserConfig['plugins'];
	target?: UserConfig['target'];
}
