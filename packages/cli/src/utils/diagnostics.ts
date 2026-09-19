import { defineDiagnostics } from 'nostics';

/**
 * Structured, stable diagnostic codes for everything `@wolfstar/cli` itself rejects (as opposed to `stars.config.*`
 * validation, which is `@wolfstar/http-framework`'s own {@link import('@wolfstar/http-framework/config').configDiagnostics}).
 *
 * `reporters` stays empty: `runMain` (`src/run.ts`) is the single place that renders a caught `Diagnostic` to the
 * terminal (`formatError`) and picks its exit code (`exitCodeOf`), so nothing here should print on its own — a
 * command that calls e.g. `runBuild` directly (as the test suite does) gets a plain thrown value instead of stray
 * console output.
 *
 * `why` and `fix` are always given the same, fully-typed params object, even when one of them ignores part of it or
 * neither takes any: a bare `() => value` next to a typed sibling loses nostics' param-type inference (a zero-arg
 * function widens to `unknown` params, erasing the sibling's fields from the merged type).
 */
export const cliDiagnostics = defineDiagnostics({
	docsBase: (code) => `https://wolfstar.rocks/docs/cli/errors#${code.toLowerCase()}`,
	reporters: [],
	codes: {
		PREPARE_OUTDATED: {
			why: (_p: {}) => 'The generated project files are out of date, run `stars prepare` to update it.'
		},
		DISCORD_TOKEN_MISSING: {
			why: (_p: {}) => 'DISCORD_TOKEN is not set',
			fix: (_p: {}) => 'Set DISCORD_TOKEN in the environment or in the project .env file.'
		},
		DISCORD_APPLICATION_ID_MISSING: {
			why: (_p: {}) => 'The Discord application id is not set',
			fix: (_p: {}) => 'Set DISCORD_APPLICATION_ID (or APPLICATION_ID) in the environment or in the project .env file.'
		},
		DISCORD_REQUEST_FAILED: {
			why: (p: { status: number; detail: string }) => `Discord answered ${p.status}${p.detail ? `: ${p.detail}` : ''}`,
			fix: (p: { status: number; detail: string }) =>
				p.status === 401 ? 'Check DISCORD_TOKEN.' : 'Check the application id and the bot permissions.'
		},
		BUILD_FAILED: {
			why: (p: { message: string }) => `Build failed${p.message ? `: ${p.message}` : ''}`
		},
		COMMAND_NOT_FOUND: {
			why: (p: { names: string }) => `No deployed command is named ${p.names}`,
			fix: (_p: { names: string }) => 'Run `stars commands list` to see what is deployed.'
		},
		ABORTED: {
			why: (_p: {}) => 'Aborted'
		},
		CONFIRMATION_REQUIRED: {
			why: (_p: {}) => 'Refusing to delete commands without a confirmation',
			fix: (_p: {}) => 'Pass --yes to delete them, or --name to pick one, from a script.'
		},
		INVALID_THEME: {
			why: (p: { theme: string; themes: string }) => `Unknown theme \`${p.theme}\`.`,
			fix: (p: { theme: string; themes: string }) => `Use one of: ${p.themes}.`
		},
		CODEGEN_OUTDATED: {
			why: (_p: {}) => 'Generated files are out of date, run `stars codegen` to update them.'
		},
		DEPENDENCY_MISSING: {
			why: (p: { name: string; root: string; hint: string }) => `"${p.name}" is not installed in ${p.root}`,
			fix: (p: { name: string; root: string; hint: string }) => p.hint
		},
		CODEGEN_FAILED: {
			why: (p: { code: number | null; stderr: string }) => `i18next-type-generator exited with code ${p.code}${p.stderr ? `: ${p.stderr}` : ''}`
		},
		EXPERIMENT_UNAVAILABLE: {
			why: (_p: {}) => '`experimental.enableNitro` is not implemented yet',
			fix: (_p: {}) =>
				"Nitro needs the framework's Fetch adapter (wolfstar-project/stars-components#81); until it lands, use `build.tool` 'tsdown', 'vite' or 'tsc'."
		}
	}
});

export type CliDiagnosticCode = keyof typeof cliDiagnostics;
