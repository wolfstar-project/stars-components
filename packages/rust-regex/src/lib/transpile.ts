import { Emitter } from './emitter.js';
import { RustRegexError } from './errors.js';
import { parse, type Flags } from './parser.js';

export interface TranspileOptions {
	/**
	 * The Rust flags the pattern starts with, as if it began with `(?flags)`. Any of `i`, `m`, `s`, `x` and `U`.
	 *
	 * @default ''
	 */
	flags?: string;

	/**
	 * Whether to compile the result to prove the JavaScript engine accepts it. This is what reports an unknown Unicode
	 * script name, or scoped flags on a runtime without ES2025 regular expression modifiers.
	 *
	 * @default true
	 */
	validate?: boolean;
}

export interface TranspileResult {
	/** The pattern, for `new RegExp(source, flags)`. */
	readonly source: string;

	/** The flags to compile {@link TranspileResult.source} with: always `v`, plus `i` when the Rust pattern is case-insensitive. */
	readonly flags: string;

	/** Whether {@link TranspileResult.source} contains `(?i:...)` or `(?-i:...)`, which need ES2025 (Node.js 23 or newer). */
	readonly usesModifiers: boolean;
}

export interface ToRegExpOptions extends TranspileOptions {
	/** Flags added to the ones the pattern needs: any of `d`, `g` and `y`. The others would change what the Rust pattern means. */
	extraFlags?: string;
}

/**
 * The JavaScript flags a caller may add. `i`, `m`, `s` and `u` would change what the Rust pattern means, and `v` is
 * always set, so none of them can be added.
 */
const EXTRA_FLAGS = new Set(['d', 'g', 'y']);

function checkExtraFlags(extraFlags: string, pattern: string): void {
	const seen = new Set<string>();
	for (const flag of extraFlags) {
		if (!EXTRA_FLAGS.has(flag)) {
			throw new RustRegexError('invalid_option', `extraFlags accepts only "d", "g" and "y", not "${flag}"`, pattern);
		}

		if (seen.has(flag)) throw new RustRegexError('invalid_option', `extraFlags repeats the flag "${flag}"`, pattern);

		seen.add(flag);
	}
}

function parseFlags(flags: string, pattern: string): Flags {
	const result: Flags = { i: false, m: false, s: false, U: false, x: false };
	for (const flag of flags) {
		if (flag !== 'i' && flag !== 'm' && flag !== 's' && flag !== 'U' && flag !== 'x') {
			throw new RustRegexError('invalid_option', `unrecognized flag "${flag}"`, pattern);
		}

		result[flag] = true;
	}

	return result;
}

/**
 * Converts a regular expression written for the Rust `regex` crate, the flavour Discord uses, into the source and
 * flags of an equivalent JavaScript `RegExp`.
 *
 * @example
 * ```ts
 * transpile(String.raw`(?i)\bfree\s+nitro\b`);
 * // { source: '(?:(?<=[…])(?![…])|…)free\\p{White_Space}+nitro…', flags: 'iv', usesModifiers: false }
 * ```
 *
 * @throws {RustRegexError} When Rust would reject the pattern, or when it uses something JavaScript cannot express.
 */
export function transpile(pattern: string, options: TranspileOptions = {}): TranspileResult {
	const { alt, initialI } = parse(pattern, parseFlags(options.flags ?? '', pattern));
	const { source, usesModifiers } = new Emitter(pattern).emit(alt, initialI);
	const flags = initialI ? 'iv' : 'v';

	if (options.validate !== false) {
		try {
			new RegExp(source, flags);
		} catch (error) {
			throw new RustRegexError('invalid_output', rejection(error, usesModifiers), pattern);
		}
	}

	return { source, flags, usesModifiers };
}

function rejection(error: unknown, usesModifiers: boolean): string {
	const hint = usesModifiers ? ' (scoped flags need a runtime with ES2025 regular expression modifiers)' : '';
	return `JavaScript rejected the translated pattern: ${error instanceof Error ? error.message : String(error)}${hint}`;
}

/**
 * Same as {@link transpile}, but returns the compiled `RegExp`.
 *
 * Rust matches in time linear in the size of the text, whatever the pattern. A JavaScript `RegExp` backtracks, so a
 * pattern such as `(a+)+$` that is safe in Rust can take exponential time here. Do not run the result against text a
 * stranger controls without a limit, for example in a worker with a timeout.
 *
 * @example
 * ```ts
 * toRegExp(String.raw`(?P<year>\d{4})-(?P<month>\d{2})`).exec('2026-11')?.groups?.year; // '2026'
 * ```
 */
export function toRegExp(pattern: string, options: ToRegExpOptions = {}): RegExp {
	const { extraFlags = '', ...rest } = options;
	checkExtraFlags(extraFlags, pattern);

	const { source, flags, usesModifiers } = transpile(pattern, { ...rest, validate: false });

	try {
		return new RegExp(source, flags + extraFlags);
	} catch (error) {
		throw new RustRegexError('invalid_output', rejection(error, usesModifiers), pattern);
	}
}
