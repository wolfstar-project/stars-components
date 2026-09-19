import { defineDiagnostics } from 'nostics';

/**
 * Structured, stable diagnostic codes for every way a `stars.config.*` can fail to load or validate.
 *
 * This is a plain data error (no exit code or terminal formatting), so nothing here reports anywhere on its own —
 * `reporters` stays empty and each call only builds and returns a `Diagnostic`. That keeps it meaningful outside a
 * CLI, e.g. for a dashboard or test that calls {@link loadStarsConfig} directly; `@wolfstar/cli` is what renders it
 * and picks an exit code (`exitCodeOf`).
 *
 * The `sources` field (populated with the configuration file, when there is one) carries the "which file" grounding
 * `ConfigError` used to expose as `.file`; the "which option" grounding it exposed as `.path` is folded directly into
 * every `why`/`fix` message instead, the way every other diagnostic code already reads.
 *
 * `why` and `fix` are always given the same, fully-typed params object (even when one of them ignores part of it):
 * a bare `() => value` loses nostics' param-type inference (a zero-arg function widens to `unknown` params), so every
 * entry here spells out its shape on both sides instead.
 */
export const configDiagnostics = defineDiagnostics({
	docsBase: (code) => `https://wolfstar.rocks/docs/config/errors#${code.toLowerCase()}`,
	reporters: [],
	codes: {
		ROOT_NOT_FOUND: {
			why: (p: { root: string }) => `The project root does not exist: ${p.root}`,
			fix: (_p: { root: string }) => 'Point `root` to an existing directory, relative to the configuration file.'
		},
		PACKAGE_JSON_INVALID: {
			why: (p: { file: string; message: string }) => `Failed to parse ${p.file}: ${p.message}`,
			fix: (_p: { file: string; message: string }) => 'Fix the JSON syntax of the package.json file.'
		},
		ENTRY_NOT_FOUND: {
			why: (p: { entry: string }) => `The entry file does not exist: ${p.entry}`,
			fix: (_p: { entry: string }) => 'Point `entry` to the file that starts the bot, relative to the project root.'
		},
		ENTRY_DEFAULT_NOT_FOUND: {
			why: (p: { root: string; defaults: string }) => `Could not find the entry file in ${p.root}`,
			fix: (p: { root: string; defaults: string }) => `Set \`entry\` in the configuration, or create one of ${p.defaults}.`
		},
		INVALID_BUILD_TOOL: {
			why: (p: { tool: string }) => `Unknown build tool "${p.tool}"`,
			fix: (_p: { tool: string }) => "Use one of 'tsdown', 'tsc', 'vite', 'none' or 'auto'."
		},
		EXPERIMENTAL_BUILD_TOOL: {
			why: (p: { tool: string; flag: string }) => `The '${p.tool}' build tool is experimental`,
			fix: (p: { tool: string; flag: string }) => `Set \`${p.flag}\` to true to use it.`
		},
		BUILD_TOOL_REQUIRED: {
			why: (p: { entry: string }) => `The entry ${p.entry} is TypeScript but the build tool is 'none'`,
			fix: (_p: { entry: string }) => "Set `build.tool` to 'tsdown' or 'tsc', or point `entry` to a JavaScript file."
		},
		TSCONFIG_EXPLICIT_NOT_FOUND: {
			why: (p: { tsconfig: string; path: string }) => `The tsconfig file does not exist: ${p.tsconfig}`,
			fix: (p: { tsconfig: string; path: string }) => `Point \`${p.path}\` to an existing tsconfig.json, relative to the project root.`
		},
		TSCONFIG_NOT_FOUND: {
			why: (p: { root: string; suggestion: string }) => `Could not find a tsconfig.json in ${p.root}`,
			fix: (p: { root: string; suggestion: string }) => `Create src/tsconfig.json or tsconfig.json, or set \`${p.suggestion}\`.`
		},
		TSDOWN_OPTIONS_REQUIRE_TSDOWN: {
			why: (_p: { tool: string }) => '`tsdown` options need the `tsdown` build tool',
			fix: (p: { tool: string }) => `Set \`build.tool\` to 'tsdown', or remove \`tsdown\` (the build tool is '${p.tool}').`
		},
		VITE_OPTIONS_REQUIRE_VITE: {
			why: (_p: { tool: string }) => '`vite` options need the `vite` build tool',
			fix: (p: { tool: string }) =>
				`Set \`build.tool\` to 'vite' with \`experimental.enableVite\`, or remove \`vite\` (the build tool is '${p.tool}').`
		},
		TSDOWN_CONFIG_FILE_UNSUPPORTED: {
			why: (p: { file: string; version: number; legacyVersion: number }) => `\`${p.file}\` is not used with compatibility version ${p.version}`,
			fix: (p: { file: string; version: number; legacyVersion: number }) =>
				`Move its options into \`tsdown\` here, drop the ${p.file} configuration, or set \`future.compatibilityVersion\` to ${p.legacyVersion}.`
		},
		INVALID_TYPE: {
			why: (p: { path: string; expected: string; value: unknown; fix: string }) =>
				`\`${p.path}\` must be ${p.expected}, received ${describeValue(p.value)}`,
			fix: (p: { path: string; expected: string; value: unknown; fix: string }) => p.fix
		},
		INVALID_COMPATIBILITY_VERSION: {
			why: (p: { value: unknown; legacyVersion: number; latestVersion: number }) => `Unknown compatibility version ${describeValue(p.value)}`,
			fix: (p: { value: unknown; legacyVersion: number; latestVersion: number }) =>
				`Use ${p.legacyVersion} for the legacy build pipeline or ${p.latestVersion} for today's defaults.`
		},
		UNKNOWN_OPTION: {
			why: (p: { path: string; parent: string; known: string }) => `Unknown option \`${p.path}\``,
			fix: (p: { path: string; parent: string; known: string }) => `Known options${p.parent ? ` of \`${p.parent}\`` : ''}: ${p.known}.`
		},
		EXPERIMENT_REQUIRED: {
			why: (p: { path: string; requires: string; drop: string }) => `\`${p.path}\` needs \`${p.requires}\``,
			fix: (p: { path: string; requires: string; drop: string }) => `Set \`${p.requires}\` to true as well, or drop \`${p.drop}\`.`
		},
		IMPORTS_REQUIRE_TSDOWN: {
			why: (_p: {}) => '`imports` requires the `tsdown` build tool',
			fix: (_p: {}) => "Set `build.tool` to 'tsdown', or remove `imports`/set it to `false`."
		},
		LOCALES_NOT_FOUND: {
			why: (p: { locales: string }) => `The locales directory does not exist: ${p.locales}`,
			fix: (_p: { locales: string }) => 'Point `codegen.i18n.locales` to the base locale directory, relative to the project root.'
		},
		INVALID_URL: {
			why: (p: { url: string; fix: string }) => `Invalid URL "${p.url}"`,
			fix: (p: { url: string; fix: string }) => p.fix
		},
		TUNNEL_URL_NOT_HTTPS: {
			why: (p: { url: string }) => `The tunnel URL must be https, received "${p.url}"`,
			fix: (_p: { url: string }) => 'Discord only accepts an https interactions endpoint.'
		},
		INVALID_TYPECHECKER: {
			why: (p: { checker: string }) => `Unknown type checker "${p.checker}"`,
			fix: (_p: { checker: string }) => "Use one of 'tsc', 'golar', 'tsz' or 'auto'."
		},
		CONFIG_NOT_FOUND: {
			why: (p: { file: string; cwd: string; names: string }) => `Configuration file not found: ${p.file}`,
			fix: (p: { file: string; cwd: string; names: string }) => `Pass an existing file to --config, or create one of ${p.names} in ${p.cwd}.`
		},
		CONFIG_LOAD_FAILED: {
			why: (p: { message: string }) => `Failed to load the configuration: ${p.message}`,
			fix: (_p: { message: string }) => 'The file must be valid TypeScript/JavaScript and export the configuration as its default export.'
		},
		CONFIG_NOT_OBJECT: {
			why: (_p: {}) => 'The configuration file must export an object as its default export.',
			fix: (_p: {}) => "Use `export default defineConfig({ ... })` from '@wolfstar/http-framework/config'."
		}
	}
});

export type ConfigDiagnosticCode = keyof typeof configDiagnostics;

function describeValue(value: unknown): string {
	if (value === null) return 'null';
	if (Array.isArray(value)) return 'an array';
	if (typeof value === 'string') return `"${value}"`;
	return typeof value === 'object' ? 'an object' : `${typeof value} ${String(value)}`;
}
