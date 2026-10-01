import type { ResolvedStarsConfig } from '../config/resolve.js';
import type { Builder, BuildOutcome } from './builder.js';
import type { StarsEnvSetupOptions } from './config.js';

type HookResult = void | Promise<void>;

/** Why `stars dev` (re)started the bot. */
export type StarsRestartReason = 'initial' | 'build' | 'manual' | 'crash';

/** What `stars prepare` generated. */
export interface PrepareProjectResult {
	/** Absolute path of the generated auto imports declaration file, `null` when auto imports are off. */
	readonly dts: string | null;
	readonly status: 'written' | 'up-to-date' | 'outdated' | null;
}

/**
 * Lifecycle hooks of the `stars` CLI, registered through `hooks` in `stars.config` and run with
 * [`hookable`](https://github.com/unjs/hookable). They run in the CLI process, never in the bot: use `env:options`
 * to change what the bot receives.
 */
export interface StarsHooks {
	/** The configuration was loaded and validated. */
	'config:resolved': (config: ResolvedStarsConfig) => HookResult;
	/** The `env` options about to be written into the built entry. Mutate `options` to change them. */
	'env:options': (options: StarsEnvSetupOptions, config: ResolvedStarsConfig) => HookResult;
	/** Before `.stars/` is generated. */
	'prepare:before': (config: ResolvedStarsConfig) => HookResult;
	/** After `.stars/` is generated. */
	'prepare:done': (config: ResolvedStarsConfig, result: PrepareProjectResult) => HookResult;
	/** The builder for `build.tool` exists but has not built yet. */
	'builder:created': (builder: Builder, config: ResolvedStarsConfig) => HookResult;
	/** The options about to be handed to `tsdown.build()`. Mutate `options` to change them. */
	'tsdown:options': (options: Record<string, unknown>, config: ResolvedStarsConfig) => HookResult;
	/** A build (or, in `stars dev`, a rebuild) starts. */
	'build:before': (config: ResolvedStarsConfig) => HookResult;
	/** A build (or rebuild) finished, successfully or not — see `outcome.ok`. */
	'build:done': (outcome: BuildOutcome, config: ResolvedStarsConfig) => HookResult;
	/** `stars dev` is watching. */
	'dev:start': (config: ResolvedStarsConfig) => HookResult;
	/** `stars dev` is about to (re)start the bot. */
	'dev:restart': (reason: StarsRestartReason, config: ResolvedStarsConfig) => HookResult;
	/** `stars dev` is shutting down. */
	'dev:close': (config: ResolvedStarsConfig) => HookResult;
}

export type StarsHookName = keyof StarsHooks;

type HookOrList<Callback> = Callback | readonly Callback[];
type NamespaceOf<Name> = Name extends `${infer Namespace}:${string}` ? Namespace : never;
export type StarsHookNamespace = NamespaceOf<StarsHookName>;

/**
 * The `hooks` block of `stars.config`: each hook keyed by its full name (`'build:done'`) or nested under its namespace
 * (`{ build: { done() {} } }`), as a function or an array of functions.
 */
export type StarsHooksConfig = { [Name in StarsHookName]?: HookOrList<StarsHooks[Name]> } & {
	[Namespace in StarsHookNamespace]?: {
		[Name in StarsHookName as Name extends `${Namespace}:${infer Rest}` ? Rest : never]?: HookOrList<StarsHooks[Name]>;
	};
};
