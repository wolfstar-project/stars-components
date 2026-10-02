import type { ResolvedModuleEntry } from '../types/modules.js';
import type { Validator } from './validator.js';

const FIX =
	"Use a package name, or `[name, options]` to pass options: `modules: ['@wolfstar/plugin-cache', ['@wolfstar/plugin-gateway', { shards: 2 }]]`.";

/** Normalises `modules`: falsy entries are dropped, a bare specifier gets empty options. */
export function resolveModules(config: unknown, validator: Validator): readonly ResolvedModuleEntry[] {
	if (config === undefined) return [];
	if (!Array.isArray(config)) throw validator.typeError('modules', 'an array', config, FIX);

	const resolved: ResolvedModuleEntry[] = [];
	for (const [index, entry] of (config as unknown[]).entries()) {
		if (!entry) continue;
		const path = `modules[${index}]`;

		if (typeof entry === 'string') {
			if (entry.length === 0) throw validator.typeError(path, 'a non-empty module specifier', entry, FIX);
			resolved.push({ specifier: entry, options: {} });
			continue;
		}

		if (!Array.isArray(entry)) throw validator.typeError(path, 'a module specifier or a `[specifier, options]` tuple', entry, FIX);

		if (entry.length > 2) {
			throw validator.typeError(path, 'a `[specifier, options]` tuple with at most two members', entry, FIX);
		}

		const [specifier, options] = entry as [unknown, unknown?];
		if (typeof specifier !== 'string' || specifier.length === 0) {
			throw validator.typeError(`${path}[0]`, 'a non-empty module specifier', specifier, FIX);
		}

		if (options !== undefined && (options === null || typeof options !== 'object' || Array.isArray(options))) {
			throw validator.typeError(`${path}[1]`, 'an object', options, FIX);
		}

		resolved.push({ specifier, options: (options as Record<string, unknown> | undefined) ?? {} });
	}

	return resolved;
}
