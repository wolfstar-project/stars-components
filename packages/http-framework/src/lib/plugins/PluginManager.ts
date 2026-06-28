import type { Awaitable } from '@sapphire/utilities';
import type { Client, ClientOptions } from '../Client.js';
import { PluginHook } from '../types/Enums.js';
import type { Plugin } from './Plugin.js';
import { postInitialization, postListen, preGenericsInitialization, preInitialization, preLoad } from './symbols.js';

export type AsyncPluginHooks = PluginHook.PreLoad | PluginHook.PostListen;
export interface HttpFrameworkPluginAsyncHook {
	(this: Client, options: ClientOptions): Awaitable<unknown>;
}

export type SyncPluginHooks = Exclude<PluginHook, AsyncPluginHooks>;
export interface HttpFrameworkPluginHook {
	(this: Client, options: ClientOptions): unknown;
}

export interface HttpFrameworkPluginHookEntry<T = HttpFrameworkPluginHook | HttpFrameworkPluginAsyncHook> {
	hook: T;
	type: PluginHook;
	name?: string;
}

export class PluginManager {
	public readonly registry = new Set<HttpFrameworkPluginHookEntry>();

	public registerHook(hook: HttpFrameworkPluginHook, type: SyncPluginHooks, name?: string): this;
	public registerHook(hook: HttpFrameworkPluginAsyncHook, type: AsyncPluginHooks, name?: string): this;
	public registerHook(hook: HttpFrameworkPluginHook | HttpFrameworkPluginAsyncHook, type: PluginHook, name?: string): this {
		if (typeof hook !== 'function') throw new TypeError(`The provided hook ${name ? `(${name}) ` : ''}is not a function`);
		this.registry.add({ hook, type, name });
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

	public use(plugin: typeof Plugin) {
		const possibleSymbolHooks: [symbol, PluginHook][] = [
			[preGenericsInitialization, PluginHook.PreGenericsInitialization],
			[preInitialization, PluginHook.PreInitialization],
			[postInitialization, PluginHook.PostInitialization],
			[preLoad, PluginHook.PreLoad],
			[postListen, PluginHook.PostListen]
		];
		for (const [hookSymbol, hookType] of possibleSymbolHooks) {
			const hook = Reflect.get(plugin, hookSymbol) as HttpFrameworkPluginHook | HttpFrameworkPluginAsyncHook;
			if (typeof hook !== 'function') continue;
			this.registerHook(hook, hookType as any, plugin.name);
		}
		return this;
	}

	public values(): Generator<HttpFrameworkPluginHookEntry, void, unknown>;
	public values(hook: SyncPluginHooks): Generator<HttpFrameworkPluginHookEntry<HttpFrameworkPluginHook>, void, unknown>;
	public values(hook: AsyncPluginHooks): Generator<HttpFrameworkPluginHookEntry<HttpFrameworkPluginAsyncHook>, void, unknown>;
	public *values(hook?: PluginHook): Generator<HttpFrameworkPluginHookEntry, void, unknown> {
		for (const plugin of this.registry) {
			if (hook && plugin.type !== hook) continue;
			yield plugin;
		}
	}
}
