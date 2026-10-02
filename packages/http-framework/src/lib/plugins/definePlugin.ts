import type { Awaitable } from '@sapphire/utilities';
import type { Client, ClientOptions } from '../Client.js';
import type { PluginHook } from '../types/Enums.js';

/**
 * A runtime plugin hook. It receives the {@link Client} explicitly and the same credential-free
 * {@link ClientOptions} object the client persists, so a hook can rewrite what a later hook sees.
 *
 * @since 6.1.0
 */
export type StarsPluginHook<Async extends boolean = false> = (
	client: Client,
	options: ClientOptions
) => Async extends true ? Awaitable<unknown> : unknown;

/**
 * Where a plugin applies: `'development'` and `'production'` compare against `process.env.NODE_ENV` (which
 * `stars dev` forces to `development`), a function decides per client from its options. A function is called once
 * per client and plugin, when the plugin's first hook would run, and its answer holds for every hook of the plugin: it
 * receives the options rather than the client because the client is not initialised yet. A function that throws is
 * not wrapped in a {@link PluginHookError}.
 *
 * @since 6.1.0
 */
export type StarsPluginApply = 'development' | 'production' | ((options: ClientOptions) => boolean);

/**
 * A declarative, object-based plugin. Hook names match the {@link PluginHook} lifecycle.
 *
 * @since 6.1.0
 */
export interface StarsPlugin {
	/**
	 * The plugin's identity, used to attribute errors and in the `pluginLoaded` event. Must be non-empty.
	 */
	name: string;

	/**
	 * Hooks of a `'pre'` plugin run before plain ones, and `'post'` ones run after them. Registration order is
	 * kept inside each group.
	 */
	enforce?: 'pre' | 'post';

	/**
	 * Restricts the plugin to an environment, or to the clients a function accepts.
	 */
	apply?: StarsPluginApply;

	preGenericsInitialization?: StarsPluginHook;
	preInitialization?: StarsPluginHook;
	postInitialization?: StarsPluginHook;
	preLoad?: StarsPluginHook<true>;
	postListen?: StarsPluginHook<true>;
}

/**
 * Anything accepted where plugins are listed: a plugin, or nested arrays of plugins in which falsy entries are
 * dropped, so `plugins: [condition && plugin()]` works.
 *
 * @since 6.1.0
 */
export type PluginOption = StarsPlugin | false | null | undefined | readonly PluginOption[];

/**
 * Defines a plugin. This is an identity helper that gives the object (or the options factory) its types.
 *
 * @example
 * ```ts
 * export default definePlugin((options: { prefix?: string } = {}) => ({
 * 	name: 'wolfstar:my-plugin',
 * 	enforce: 'pre',
 * 	preLoad(client) {}
 * }));
 * ```
 * @since 6.1.0
 */
export function definePlugin<T extends StarsPlugin>(plugin: T): T;
export function definePlugin<Args extends unknown[], T extends StarsPlugin>(factory: (...args: Args) => T): (...args: Args) => T;
export function definePlugin(plugin: StarsPlugin | ((...args: any[]) => StarsPlugin)) {
	return plugin;
}

/**
 * The error a {@link StarsPlugin} hook is wrapped in, so a failure points at the plugin that threw. The original
 * error is available as `cause`.
 *
 * @since 6.1.0
 */
export class PluginHookError extends Error {
	public readonly pluginName: string;
	public readonly hook: PluginHook;

	public constructor(pluginName: string, hook: PluginHook, cause: unknown) {
		super(`The "${hook}" hook of the plugin "${pluginName}" failed: ${cause instanceof Error ? cause.message : String(cause)}`, { cause });
		this.name = 'PluginHookError';
		this.pluginName = pluginName;
		this.hook = hook;
	}
}
