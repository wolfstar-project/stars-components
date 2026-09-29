function isPlainObject(value: unknown): boolean {
	const proto = Object.getPrototypeOf(value as object) as object | null;
	return proto === Object.prototype || proto === null;
}

function isPagesArrayPath(path: string): boolean {
	return /(^|\.)pages\[\d+\]$/.test(path);
}

function fail(path: string, reason: string): never {
	throw new TypeError(`${path} cannot be stored in a shared session store: ${reason}`);
}

function walk(value: unknown, path: string, inArray: boolean): void {
	const type = typeof value;

	if (type === 'function') fail(path, 'functions are not JSON-serializable');
	if (type === 'symbol') fail(path, 'symbols are not JSON-serializable');
	if (type === 'bigint') fail(path, 'bigints are not JSON-serializable');
	if (type === 'number' && !Number.isFinite(value as number)) fail(path, 'NaN and Infinity are not JSON-serializable');

	if (type === 'undefined') {
		if (inArray) fail(path, 'undefined is not JSON-serializable');
		return;
	}

	if (value === null) {
		if (inArray && isPagesArrayPath(path)) {
			throw new TypeError(`${path} is a lazy page that has not been resolved; shared stores need eager pages`);
		}

		return;
	}

	if (type !== 'object') return;

	if (Array.isArray(value)) {
		value.forEach((item, index) => walk(item, `${path}[${index}]`, true));
		return;
	}

	if (!isPlainObject(value)) {
		fail(path, 'class instances are not JSON-serializable, use a plain object');
	}

	for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
		walk(item, path.length === 0 ? key : `${path}.${key}`, false);
	}
}

/**
 * Throws a {@linkcode TypeError} naming the first path (e.g. `pages[2]`, `actions.jump.run`) that a shared session
 * store cannot hold: functions, symbols, bigints, `undefined` inside arrays, non-plain objects (class instances
 * other than `Array`/plain `Object`), `NaN`/`Infinity`, and unresolved lazy pages (`null` inside a `pages` array).
 */
export function assertSharedSessionState(value: unknown, path = ''): void {
	walk(value, path, false);
}
