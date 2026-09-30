import { loadStarsConfig, type LoadStarsConfigOptions, type ResolvedStarsConfig, type StarsHookName, type StarsHooks } from '@wolfstar/schema';
import { createHooks, type Hookable } from 'hookable';

export type StarsHookable = Hookable<StarsHooks>;

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
	const config = await loadStarsConfig(options);
	const hooks = createStarsHooks(config);
	await hooks.callHook('config:resolved', config);
	return { config, hooks };
}

/**
 * Runs `env:options` on a copy of the resolved `env` options and returns a configuration carrying the result, which
 * is what the builders write into the entry. The resolved configuration itself is left untouched.
 */
export async function applyEnvOptions(config: ResolvedStarsConfig, hooks: StarsHookable): Promise<ResolvedStarsConfig> {
	if (!config.env.enabled) return config;

	const options = { ...config.env.options };
	await hooks.callHook('env:options', options, config);
	return { ...config, env: { ...config.env, options } };
}
