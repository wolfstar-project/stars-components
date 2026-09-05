import { EventEmitter } from 'node:events';
import { dirname, extname, relative, resolve } from 'node:path';
import type { ResolvedStarsConfig } from '@wolfstar/http-framework/config';
import { importFromProject } from '../project.js';
import type { Builder, BuilderEvents, BuildOutcome } from './types.js';

type TsdownModule = typeof import('tsdown');
type TsdownLogger = import('tsdown').Logger;
type TsdownBundle = import('tsdown').TsdownBundle;
type TsdownInlineConfig = NonNullable<Parameters<TsdownModule['build']>[0]>;
type TsdownOptions = Record<string, unknown>;
type AnyFunction = (...args: never[]) => unknown;

const INSTALL_HINT = "Install it with `pnpm add -D tsdown`, or set `build.tool` to 'tsc' or 'none'.";
const TYPESCRIPT_EXTENSIONS = new Set(['.ts', '.mts', '.cts']);
/** `./src/lib` and `../shared` are paths; `preact/compat` is a module id and must be left alone. */
const RELATIVE_PATH = /^\.\.?[/\\]/;

/**
 * Builds through the project's own `tsdown`, configured from `stars.config`.
 *
 * From `future.compatibilityVersion` 4 on this is the whole configuration: the entry's directory, `build.outDir` and
 * `build.tsconfig` produce the defaults a bot needs, the project's `tsdown` block is layered on top, and the auto
 * imports plugin is wired in — one configuration file instead of two. At 3 the project's own `tsdown.config.*` is
 * still loaded and everything here is merged over it by `tsdown` itself: scalars from `stars.config` win, and
 * `plugins` are appended rather than replaced.
 */
export class TsdownBuilder extends EventEmitter<BuilderEvents> implements Builder {
	public readonly tool = 'tsdown' as const;
	#bundles: TsdownBundle[] = [];
	#hadError = false;
	#startedAt = 0;

	public constructor(private readonly config: ResolvedStarsConfig) {
		super();
	}

	public async build(): Promise<BuildOutcome> {
		const tsdown = await this.#load();
		const options = await this.#options();
		this.#begin();

		try {
			this.#bundles = await tsdown.build(options as TsdownInlineConfig);
			return this.#finish(this.#hadError ? 'The build reported errors' : null);
		} catch (error) {
			return this.#finish(error instanceof Error ? error.message : String(error));
		}
	}

	public async watch(): Promise<void> {
		const tsdown = await this.#load();
		const options = await this.#options();

		this.#begin();
		this.#bundles = await tsdown.build(this.#watchOptions(options) as TsdownInlineConfig);
	}

	public async close(): Promise<void> {
		const bundles = this.#bundles;
		this.#bundles = [];
		await Promise.allSettled(bundles.map((bundle) => bundle[Symbol.asyncDispose]()));
	}

	#load(): Promise<TsdownModule> {
		return importFromProject<TsdownModule>(this.config.root, 'tsdown', INSTALL_HINT);
	}

	/**
	 * The options handed to `tsdown.build()`, with the project's own `tsdown` block already layered on top of the
	 * defaults (and of the plugins `stars` contributes).
	 */
	async #options(): Promise<TsdownOptions> {
		const user = this.config.tsdown as TsdownOptions;
		// A `tsdown.config.*` (or `package.json#tsdown`) is the project's own; `build.configFile` is `null` from
		// compatibility version 4 on, where loading one is a configuration error rather than a fallback.
		const defaults = this.config.build.configFile === null ? this.#defaults() : {};
		const plugins = [...(await this.#plugins()), ...toArray(user.plugins)];
		// `plugins` and `alias` are added to rather than replaced: a project declaring one of its own would
		// otherwise silently drop the auto imports transform, or every `~`/`@` import in its sources.
		const alias = { ...(defaults.alias as object), ...this.#alias(user.alias) };

		return {
			...defaults,
			...user,
			...(plugins.length > 0 ? { plugins } : {}),
			...(Object.keys(alias).length > 0 ? { alias } : {}),
			// Last, and so not overridable: these two are how the CLI talks to `tsdown` rather than build options —
			// the project root it resolves everything from, and the logger the dev panel reads its build channel off.
			cwd: this.config.root,
			customLogger: this.#logger()
		};
	}

	/**
	 * What `stars.config` alone says the build is — the configuration a bot would otherwise write out by hand, taken
	 * from the ones the WolfStar bots already keep next to theirs:
	 *
	 * - every source file next to the entry (minus tests), emitted one-to-one (`unbundle`) so the stores keep
	 *   loading pieces from `dist/commands` and friends at runtime;
	 * - ESM on `platform: 'node'`, with the extension `build.output` — and so `stars dev`, `package.json#main` and
	 *   `node dist/…` — expects;
	 * - sourcemaps and treeshaking on, minification off: a bot is deployed, not shipped, so readable stack traces
	 *   are worth more than bytes;
	 * - dependencies left in `node_modules` rather than bundled into the output;
	 * - Nuxt's own alias prefixes: `~` and `@` for the entry's directory, `~~` and `@@` for the project root;
	 * - no declaration files: nothing consumes a bot's `dist/`, and emitting them roughly doubles the build. A
	 *   project that wants them sets `tsdown: { dts: true }`.
	 *
	 * Every one of these is overridable through the project's `tsdown` block.
	 */
	#defaults(): TsdownOptions {
		const { root, entry, build } = this.config;
		const source = dirname(entry);
		const sourceDir = relative(root, source) || '.';
		const extensions = TYPESCRIPT_EXTENSIONS.has(extname(entry)) ? '{ts,mts,cts}' : '{js,mjs,cjs}';

		return {
			config: false,
			entry: [`${sourceDir}/**/*.${extensions}`, `!${sourceDir}/**/*.{test,spec}.${extensions}`],
			// The prefixes Nuxt gives every project, pointing at the same two places its own do: the source
			// directory and the project root. A project's tsconfig needs the matching `paths` for them to type.
			alias: { '~': source, '@': source, '~~': root, '@@': root },
			format: 'esm',
			platform: 'node',
			unbundle: true,
			outDir: build.outDir,
			outExtensions: () => ({ js: extname(build.output) }),
			sourcemap: true,
			clean: true,
			treeshake: true,
			minify: false,
			dts: false,
			deps: { skipNodeModulesBundle: true },
			...(build.tsconfig === null ? {} : { tsconfig: build.tsconfig })
		};
	}

	/**
	 * The project's own aliases, with relative targets resolved against the project root the way every other path in
	 * `stars.config` is. Module ids (`preact/compat`) and absolute paths are passed through untouched.
	 */
	#alias(alias: unknown): Record<string, unknown> {
		if (alias === null || typeof alias !== 'object' || Array.isArray(alias)) return {};

		return Object.fromEntries(
			Object.entries(alias as Record<string, unknown>).map(([key, value]) => [
				key,
				typeof value === 'string' && RELATIVE_PATH.test(value) ? resolve(this.config.root, value) : value
			])
		);
	}

	/**
	 * The auto imports transform, the way `nuxt dev` wires its own into the build rather than asking the project to.
	 * `stars dev`/`stars build` regenerate its declaration file (`stars prepare`) before the first build.
	 */
	async #plugins(): Promise<unknown[]> {
		if (!this.config.imports.enabled) return [];

		const { autoImports } = await import('@wolfstar/http-framework/auto-imports');
		const { dirs, presets, exclude, dts } = this.config.imports;
		return [await autoImports({ root: this.config.root, dirs, presets, exclude, dts })];
	}

	/**
	 * Watch mode reports through the same events a single build does. The project's own `hooks`/`onSuccess` still
	 * run: they are the reason a build is watched at all in some projects.
	 */
	#watchOptions(options: TsdownOptions): TsdownOptions {
		const hooks = (options.hooks ?? {}) as Record<string, unknown>;
		const prepare = hooks['build:prepare'];
		const success = options.onSuccess;

		return {
			...options,
			watch: true,
			hooks: {
				...hooks,
				'build:prepare': async (...args: never[]) => {
					if (typeof prepare === 'function') await (prepare as AnyFunction)(...args);
					if (this.#startedAt === 0) this.#begin();
				}
			},
			onSuccess: async (...args: never[]) => {
				if (typeof success === 'function') await (success as AnyFunction)(...args);
				this.#finish(null);
			}
		};
	}

	#begin(): void {
		this.#hadError = false;
		this.#startedAt = performance.now();
		this.emit('start');
	}

	#finish(message: string | null): BuildOutcome {
		const outcome: BuildOutcome = {
			ok: message === null && !this.#hadError,
			durationMs: Math.round(performance.now() - this.#startedAt),
			message
		};
		this.#startedAt = 0;
		this.emit(outcome.ok ? 'success' : 'failure', outcome);
		return outcome;
	}

	#logger(): TsdownLogger {
		const log = (level: 'info' | 'warn' | 'error' | 'success', args: unknown[]) => {
			// tsdown passes its (possibly undefined) name label and other blanks as separate arguments.
			const text = args
				.filter((argument) => argument !== undefined && argument !== null && argument !== false && argument !== '')
				.map((argument) => (argument instanceof Error ? (argument.stack ?? argument.message) : String(argument)))
				.join(' ');
			this.emit('log', level, text);
		};

		const warned = new Set<string>();
		return {
			level: 'info',
			info: (...args) => log('info', args),
			warn: (...args) => log('warn', args),
			warnOnce: (...args) => {
				const key = args.map(String).join(' ');
				if (warned.has(key)) return;
				warned.add(key);
				log('warn', args);
			},
			error: (...args) => {
				this.#hadError = true;
				log('error', args);
				// In watch mode tsdown never calls `onSuccess` after an error, report the failure now.
				if (this.#startedAt !== 0 && this.#bundles.length > 0) this.#finish(errorSummary(args));
			},
			success: (...args) => log('success', args),
			clearScreen: () => {}
		};
	}
}

function toArray(value: unknown): unknown[] {
	if (value === undefined || value === null || value === false) return [];
	return Array.isArray(value) ? value : [value];
}

function errorSummary(args: unknown[]): string {
	const first = args[0];
	if (first instanceof Error) return first.message.split('\n')[0] ?? 'Build failed';
	return String(first ?? 'Build failed').split('\n')[0] ?? 'Build failed';
}
