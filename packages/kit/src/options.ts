function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

/**
 * Merges `options` over `defaults`: plain objects merge deeply, everything else (arrays included) is replaced, and an
 * `undefined` value in `options` keeps the default.
 */
export function mergeOptions<T extends Record<string, unknown>>(defaults: T | undefined, options: Record<string, unknown> | undefined): T {
	const merged: Record<string, unknown> = { ...defaults };
	for (const [key, value] of Object.entries(options ?? {})) {
		if (value === undefined) continue;
		const base = merged[key];
		merged[key] = isPlainObject(base) && isPlainObject(value) ? mergeOptions(base, value) : value;
	}

	return merged as T;
}
