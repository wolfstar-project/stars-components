import type { Awaitable } from '@sapphire/utilities';
import type { Client, ClientOptions } from '../Client.js';
import { postInitialization, postListen, preGenericsInitialization, preInitialization, preLoad } from './symbols.js';

/**
 * The base class for all plugins. Plugins hook into the {@link Client}'s lifecycle by defining static
 * methods keyed by the plugin symbols. Use {@link PluginManager.use} (via `Client.use`) to register a plugin.
 *
 * @since 2.4.0
 */
export abstract class Plugin {
	public static [preGenericsInitialization]?: (this: Client, options: ClientOptions) => void;
	public static [preInitialization]?: (this: Client, options: ClientOptions) => void;
	public static [postInitialization]?: (this: Client, options: ClientOptions) => void;
	public static [preLoad]?: (this: Client, options: ClientOptions) => Awaitable<void>;
	public static [postListen]?: (this: Client, options: ClientOptions) => Awaitable<void>;
}
