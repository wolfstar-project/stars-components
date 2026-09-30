import type { Diagnostic } from 'nostics';
import { configDiagnostics } from './errors.js';

/** Validates raw `stars.config` values, throwing a `configDiagnostics` diagnostic grounded in the configuration file. */
export class Validator {
	public constructor(private readonly file: string | null) {}

	private get sources(): string[] | undefined {
		return this.file ? [this.file] : undefined;
	}

	public error<Handle extends (params: any) => Diagnostic>(handle: Handle, params: Parameters<Handle>[0]): Diagnostic {
		return handle({ ...params, sources: this.sources });
	}

	public knownKeys(value: object, path: string, keys: readonly string[]): void {
		for (const key of Object.keys(value)) {
			if (keys.includes(key)) continue;
			const fullPath = path ? `${path}.${key}` : key;
			throw this.error(configDiagnostics.UNKNOWN_OPTION, { path: fullPath, parent: path, known: keys.join(', ') });
		}
	}

	public string(value: unknown, path: string): string | undefined {
		if (value === undefined) return undefined;
		if (typeof value !== 'string' || value.length === 0) throw this.typeError(path, 'a non-empty string', value);
		return value;
	}

	public boolean(value: unknown, path: string): boolean | undefined {
		if (value === undefined) return undefined;
		if (typeof value !== 'boolean') throw this.typeError(path, 'a boolean', value);
		return value;
	}

	/** A plain object passed through as-is (e.g. raw `vite`/`tsdown` config merged into the project's own). */
	public plainObject(value: unknown, path: string): Record<string, unknown> | undefined {
		if (value === undefined) return undefined;
		if (value === null || typeof value !== 'object' || Array.isArray(value)) throw this.typeError(path, 'an object', value);
		return value as Record<string, unknown>;
	}

	public stringArray(value: unknown, path: string): string[] | undefined {
		if (value === undefined) return undefined;
		if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) throw this.typeError(path, 'an array of strings', value);
		return value;
	}

	public nonNegativeNumber(value: unknown, path: string): number | undefined {
		if (value === undefined) return undefined;
		if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw this.typeError(path, 'a non-negative number', value);
		return value;
	}

	public stringRecord(value: unknown, path: string): Record<string, string> | undefined {
		if (value === undefined) return undefined;
		if (value === null || typeof value !== 'object' || Array.isArray(value) || !Object.values(value).every((item) => typeof item === 'string')) {
			throw this.typeError(path, 'an object of string values', value);
		}
		return value as Record<string, string>;
	}

	/** A generic "wrong type" diagnostic. `fix` defaults to the standard "set it or remove it" wording. */
	public typeError(path: string, expected: string, value: unknown, fix?: string): Diagnostic {
		return this.error(configDiagnostics.INVALID_TYPE, {
			path,
			expected,
			value,
			fix: fix ?? `Set \`${path}\` to ${expected} or remove it to use the default.`
		});
	}
}
