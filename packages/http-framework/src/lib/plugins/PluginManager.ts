import type { Awaitable } from '@sapphire/utilities';
import type { Client, ClientOptions } from '../Client.js';
import { PluginHook } from '../types/Enums.js';
import { PluginHookError, type PluginOption, type StarsPlugin, type StarsPluginApply } from './definePlugin.js';
import type { Plugin } from './Plugin.js';
import { postInitialization, postListen, preGenericsInitialization, preInitialization, preLoad } from './symbols.js';

export type AsyncPluginHooks = PluginHook.PreLoad | PluginHook.PostListen;

/**
 * A legacy hook: `this` is the client.
 *
 * @deprecated Use {@link StarsPlugin} through `definePlugin` instead.
 */
export interface HttpFrameworkPluginAsyncHook {
	(this: Client, options: ClientOptions): Awaitable<unknown>;
}

export type SyncPluginHooks = Exclude<PluginHook, AsyncPluginHooks>;

/**
 * A legacy hook: `this` is the client.
 *
 * @deprecated Use {@link StarsPlugin} through `definePlugin` instead.
 */
export interface HttpFrameworkPluginHook {
	(this: Client, options: ClientOptions): unknown;
}

/**
 * The normalised callable stored for every hook, whether it came from a {@link StarsPlugin} or from the legacy API.
 */
export interface HttpFrameworkPluginInvoker {
	(client: Client, options: ClientOptions): Awaitable<unknown>;
}

export interface HttpFrameworkPluginHookEntry<T = HttpFrameworkPluginHook | HttpFrameworkPluginAsyncHook> {
	/** The hook, `this`-bound to the client like it always was: `entry.hook.call(client, options)`. */
	hook: T;
	/** The same hook as a plain `(client, options)` call. For a {@link StarsPlugin} it also attributes failures to the plugin. */
	run: HttpFrameworkPluginInvoker;
	type: PluginHook;
	name?: string;
	enforce?: 'pre' | 'post';
	apply?: StarsPluginApply;
}

const HOOK_NAMES = [
	PluginHook.PreGenericsInitialization,
	PluginHook.PreInitialization,
	PluginHook.PostInitialization,
	PluginHook.PreLoad,
	PluginHook.PostListen
] as const;

const LEGACY_SYMBOLS: readonly [symbol, PluginHook][] = [
	[preGenericsInitialization, PluginHook.PreGenericsInitialization],
	[preInitialization, PluginHook.PreInitialization],
	[postInitialization, PluginHook.PostInitialization],
	[preLoad, PluginHook.PreLoad],
	[postListen, PluginHook.PostListen]
];

const warnedLegacyNames = new Set<string>();

function warnLegacy(name: string | undefined) {
	const label = name ?? 'anonymous';
	if (warnedLegacyNames.has(label)) return;
	warnedLegacyNames.add(label);
	process.emitWarning(
		`The plugin "${label}" uses the legacy class/symbol plugin API (Plugin, Client.use(Class), registerXHook), which is deprecated. Port it to definePlugin.`,
		{ type: 'DeprecationWarning', code: 'HTTP_FRAMEWORK_LEGACY_PLUGIN' }
	);
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
	return typeof (value as PromiseLike<unknown> | null | undefined)?.then === 'function';
}

function flatten(option: PluginOption, into: StarsPlugin[]) {
	if (!option) return into;
	if (Array.isArray(option)) {
		for (const entry of option) flatten(entry, into);
	} else {
		into.push(option as StarsPlugin);
	}
	return into;
}

/**
 * Converts plugin options into hook entries, one per defined hook.
 *
 * @param option The plugin(s) to convert.
 * @returns The entries, in the plugin order and in {@link PluginHook} order inside each plugin.
 */
export function toPluginEntries(option: PluginOption): HttpFrameworkPluginHookEntry[] {
	const entries: HttpFrameworkPluginHookEntry[] = [];
	for (const plugin of flatten(option, [])) {
		if (typeof plugin?.name !== 'string' || plugin.name === '') throw new TypeError('A plugin must have a non-empty name');

		for (const type of HOOK_NAMES) {
			const hook = plugin[type];
			if (hook === undefined) continue;
			if (typeof hook !== 'function') throw new TypeError(`The "${type}" hook of the plugin "${plugin.name}" is not a function`);

			const name = plugin.name;
			const invoker: HttpFrameworkPluginInvoker = (client, options) => {
				try {
					const result = (hook as HttpFrameworkPluginInvoker).call(plugin, client, options);
					return isThenable(result)
						? Promise.resolve(result).then(undefined, (error: unknown) => {
								throw new PluginHookError(name, type, error);
							})
						: result;
				} catch (error) {
					throw new PluginHookError(name, type, error);
				}
			};
			entries.push({
				hook: function (this: Client, options: ClientOptions) {
					return invoker(this, options);
				},
				run: invoker,
				type,
				name,
				enforce: plugin.enforce,
				apply: plugin.apply
			});
		}
	}
	return entries;
}

/**
 * Decides whether an entry applies. A function is called once per `decisions` map (one per client) and its answer
 * kept, so every hook of a plugin sees the same decision: a predicate that is not stable cannot leave a plugin
 * half-applied, with its early hooks run and its later ones skipped.
 */
function isApplicable(entry: HttpFrameworkPluginHookEntry, options: ClientOptions, decisions: Map<StarsPluginApply, boolean>) {
	const { apply } = entry;
	if (apply === undefined) return true;
	if (apply === 'development') return process.env.NODE_ENV === 'development';
	if (apply === 'production') return process.env.NODE_ENV === 'production';

	let decision = decisions.get(apply);
	if (decision === undefined) {
		decision = apply(options);
		decisions.set(apply, decision);
	}
	return decision;
}

export class PluginManager {
	public readonly registry = new Set<HttpFrameworkPluginHookEntry>();

	/**
	 * Registers a legacy hook.
	 *
	 * @deprecated Register a {@link StarsPlugin} with {@link PluginManager.use} instead.
	 */
	public registerHook(hook: HttpFrameworkPluginHook, type: SyncPluginHooks, name?: string): this;
	public registerHook(hook: HttpFrameworkPluginAsyncHook, type: AsyncPluginHooks, name?: string): this;
	public registerHook(hook: HttpFrameworkPluginHook | HttpFrameworkPluginAsyncHook, type: PluginHook, name?: string): this {
		if (typeof hook !== 'function') throw new TypeError(`The provided hook ${name ? `(${name}) ` : ''}is not a function`);
		warnLegacy(name);
		this.registry.add({ hook, run: (client, options) => hook.call(client, options), type, name });
		return this;
	}

	public registerPreGenericsInitializationHook(hook: HttpFrameworkPluginHook, name?: string) {
		return this.registerHook(hook, PluginHook.PreGenericsInitialization, name);
	}

	public registerPreInitializationHook(hook: HttpFrameworkPluginHook, name?: string) {
		return this.registerHook(hook, PluginHook.PreInitialization, name);
	}

	public registerPostInitializationHook(hook: HttpFrameworkPluginHook, name?: string) {
		return this.registerHook(hook, PluginHook.PostInitialization, name);
	}

	public registerPreLoadHook(hook: HttpFrameworkPluginAsyncHook, name?: string) {
		return this.registerHook(hook, PluginHook.PreLoad, name);
	}

	public registerPostListenHook(hook: HttpFrameworkPluginAsyncHook, name?: string) {
		return this.registerHook(hook, PluginHook.PostListen, name);
	}

	/**
	 * Registers plugins: {@link StarsPlugin} objects (possibly nested in arrays, with falsy entries dropped) or, for
	 * backwards compatibility, legacy {@link Plugin} classes.
	 *
	 * @param plugins The plugins to register.
	 */
	public use(...plugins: (typeof Plugin | PluginOption)[]) {
		for (const plugin of plugins) {
			if (typeof plugin === 'function') {
				this.#useLegacy(plugin);
			} else {
				for (const entry of toPluginEntries(plugin)) this.registry.add(entry);
			}
		}
		return this;
	}

	#useLegacy(plugin: typeof Plugin) {
		for (const [hookSymbol, hookType] of LEGACY_SYMBOLS) {
			const hook = Reflect.get(plugin, hookSymbol) as HttpFrameworkPluginHook | HttpFrameworkPluginAsyncHook;
			if (typeof hook !== 'function') continue;
			this.registerHook(hook, hookType as any, plugin.name);
		}
	}

	/**
	 * Yields the entries ordered as `enforce: 'pre'`, plain, then `enforce: 'post'`, keeping registration order
	 * inside each group.
	 */
	public values(): Generator<HttpFrameworkPluginHookEntry, void, unknown>;
	/**
	 * @param hook The hook to filter by.
	 * @param extra Entries (from {@link toPluginEntries}) registered next to the global ones, such as a client's own plugins.
	 */
	public values(
		hook: SyncPluginHooks,
		extra?: readonly HttpFrameworkPluginHookEntry[]
	): Generator<HttpFrameworkPluginHookEntry<HttpFrameworkPluginHook>, void, unknown>;
	public values(
		hook: AsyncPluginHooks,
		extra?: readonly HttpFrameworkPluginHookEntry[]
	): Generator<HttpFrameworkPluginHookEntry<HttpFrameworkPluginAsyncHook>, void, unknown>;
	public values(hook: PluginHook, extra?: readonly HttpFrameworkPluginHookEntry[]): Generator<HttpFrameworkPluginHookEntry, void, unknown>;
	public *values(hook?: PluginHook, extra: readonly HttpFrameworkPluginHookEntry[] = []): Generator<HttpFrameworkPluginHookEntry, void, unknown> {
		const entries = [...this.registry, ...extra].filter((entry) => !hook || entry.type === hook);
		for (const enforce of ['pre', undefined, 'post'] as const) {
			for (const entry of entries) if (entry.enforce === enforce) yield entry;
		}
	}

	/**
	 * Like {@link PluginManager.values}, but only the entries whose `apply` accepts the client's options.
	 *
	 * @param decisions The answers of `apply` functions already given for this client. Pass the same map for every
	 * phase of one client so a plugin is accepted or rejected as a whole.
	 */
	public *applicable(
		hook: PluginHook,
		options: ClientOptions,
		extra: readonly HttpFrameworkPluginHookEntry[] = [],
		decisions: Map<StarsPluginApply, boolean> = new Map()
	): Generator<HttpFrameworkPluginHookEntry, void, unknown> {
		for (const entry of this.values(hook, extra)) {
			if (isApplicable(entry, options, decisions)) yield entry;
		}
	}
}
