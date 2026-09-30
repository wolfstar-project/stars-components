import {
	loadConfigFile,
	resolveStarsConfig,
	type LoadStarsConfigOptions,
	type ResolveConfigOptions,
	type ResolvedStarsConfig,
	type StarsHookName,
	type StarsHooks
} from '@wolfstar/schema';
import { createHooks, type Hookable } from 'hookable';

export type StarsHookable = Hookable<StarsHooks>;

/** What each configuration loaded by {@link loadProject} was resolved from, so `env:options` can re-resolve it. */
const sources = new WeakMap<ResolvedStarsConfig, ResolveConfigOptions>();

/** Registers the `hooks` of `stars.config` on a fresh `hookable` instance. */
export function createStarsHooks(config: ResolvedStarsConfig): StarsHookable {
	const hooks = createHooks<StarsHooks>();
	for (const [name, callbacks] of Object.entries(config.hooks) as [StarsHookName, readonly StarsHooks[StarsHookName][]][]) {
		for (const callback of callbacks) hooks.hook(name, callback);
	}

	return hooks;
}

/** Loads `stars.config`, registers its hooks and runs `config:resolved`. */
export async function loadProject(options: LoadStarsConfigOptions): Promise<{ config: ResolvedStarsConfig; hooks: StarsHookable }> {
	const cwd = options.cwd ?? process.cwd();
	const loaded = await loadConfigFile({ cwd, configFile: options.configFile });
	const source: ResolveConfigOptions = { cwd, configFile: loaded.configFile, config: loaded.config, env: options.env };
	const config = resolveStarsConfig(source);
	sources.set(config, source);

	const hooks = createStarsHooks(config);
	await hooks.callHook('config:resolved', config);
	return { config, hooks };
}

/**
 * Runs `env:options` on a copy of the resolved `env` options and returns a configuration carrying the result, which
 * is what the builders write into the entry. The resolved configuration itself is left untouched.
 *
 * When the hook changes the options, the configuration is resolved again with them, so everything read from the env
 * files — the default `dev.url` port above all — matches what the bot will load.
 */
export async function applyEnvOptions(config: ResolvedStarsConfig, hooks: StarsHookable): Promise<ResolvedStarsConfig> {
	if (!config.env.enabled) return config;

	const options = { ...config.env.options };
	await hooks.callHook('env:options', options, config);

	const source = sources.get(config);
	if (source === undefined || JSON.stringify(options) === JSON.stringify(config.env.options)) {
		return { ...config, env: { ...config.env, options } };
	}

	return resolveStarsConfig({ ...source, config: { ...source.config, env: { ...options, enabled: true } } });
}
