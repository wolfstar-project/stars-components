import type { StarsHookName, StarsHooks, StarsHooksConfig } from '../types/hooks.js';
import { configDiagnostics } from './errors.js';
import type { Validator } from './validator.js';

type AnyHook = StarsHooks[StarsHookName];

/** Every hook of `stars.config`, flattened to its full name, with its callbacks in declaration order. */
export type ResolvedHooksConfig = Readonly<Partial<Record<StarsHookName, readonly AnyHook[]>>>;

export const STARS_HOOK_NAMES = [
	'config:resolved',
	'env:options',
	'prepare:before',
	'prepare:done',
	'builder:created',
	'tsdown:options',
	'build:before',
	'build:done',
	'dev:start',
	'dev:restart',
	'dev:close'
] as const satisfies readonly StarsHookName[];

const KNOWN = new Set<string>(STARS_HOOK_NAMES);

/**
 * Flattens and validates `hooks`. `hookable`'s own `flatHooks` is not used: it would split an array of callbacks into
 * `name:0`, `name:1` and silently drop anything that is not a function, while a typo in a hook name here should fail
 * loudly rather than register a hook that never runs.
 */
export function resolveHooks(config: StarsHooksConfig | undefined, validator: Validator): ResolvedHooksConfig {
	if (config === undefined) return {};

	const resolved: Partial<Record<StarsHookName, AnyHook[]>> = {};
	const visit = (value: unknown, path: string): void => {
		if (value === null || typeof value !== 'object' || Array.isArray(value)) {
			throw validator.typeError(
				path ? `hooks.${path}` : 'hooks',
				'an object',
				value,
				"Use `{ 'build:done'() {} }` or `{ build: { done() {} } }`."
			);
		}

		for (const [key, entry] of Object.entries(value)) {
			const name = path ? `${path}:${key}` : key;
			if (entry !== null && typeof entry === 'object' && !Array.isArray(entry)) {
				visit(entry, name);
				continue;
			}

			if (!KNOWN.has(name)) throw validator.error(configDiagnostics.UNKNOWN_HOOK, { name, known: STARS_HOOK_NAMES.join(', ') });

			const callbacks: unknown[] = Array.isArray(entry) ? entry : [entry];
			for (const callback of callbacks) {
				if (typeof callback !== 'function') {
					throw validator.typeError(`hooks.${name}`, 'a function or an array of functions', callback, 'Pass a function.');
				}
			}

			(resolved[name as StarsHookName] ??= []).push(...(callbacks as AnyHook[]));
		}
	};

	visit(config, '');
	return resolved;
}
