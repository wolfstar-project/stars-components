import type { AssertionKind, ClassExpr, ClassItem, ClassSet, Node, PerlClass } from './ast.js';
import { RustRegexError } from './errors.js';

/**
 * Unicode `\w` as Rust defines it (UTS #18): letters, marks, decimal digits, connector punctuation and joiners.
 * JavaScript's own `\w` is ASCII only, so it cannot be used, even with the `u` or `v` flag.
 */
const WORD_CONTENT = String.raw`\p{Alphabetic}\p{M}\p{Nd}\p{Pc}\p{Join_Control}`;
const WORD = `[${WORD_CONTENT}]`;

const ASSERTIONS: Readonly<Record<AssertionKind, string>> = {
	'text-start': '^',
	'text-end': '$',
	// Start or end of the text, or next to a `\n`. JavaScript's `m` flag would also look at `\r` and at the Unicode line and paragraph separators.
	'line-start': String.raw`(?<![^\n])`,
	'line-end': String.raw`(?![^\n])`,
	// Unicode word boundaries, which JavaScript's `\b` is not.
	'word-boundary': `(?:(?<=${WORD})(?!${WORD})|(?<!${WORD})(?=${WORD}))`,
	'not-word-boundary': `(?:(?<=${WORD})(?=${WORD})|(?<!${WORD})(?!${WORD}))`
};

/** Characters that are syntax outside of a class. */
const SYNTAX_CHARACTERS = new Set('^$\\.*+?()[]{}|/');

/**
 * Characters that need a backslash inside a class under the `v` flag: the class syntax characters and the reserved
 * punctuators, which also covers the doubled ones (`&&`, `!!`, `##`, ...) the flag refuses to see unescaped.
 */
const CLASS_ESCAPES = new Set('()[]{}/-\\|&!#%,:;<=>@`~$*+.?^');

/**
 * The longest source, in UTF-16 units, that one `~~` may produce. Each `~~` writes both of its sides twice, so a short
 * chain such as `[a~~b~~b~~b...]` doubles its output at every step and would otherwise run out of memory.
 */
const MAX_SYMMETRIC_DIFFERENCE_LENGTH = 1_000_000;

/** Thrown by the class writers, which know no pattern, and turned into a {@link RustRegexError} by {@link Emitter.emit}. */
const OUTPUT_TOO_LARGE = Symbol('output too large');

function isPrintableAscii(cp: number): boolean {
	return cp >= 0x20 && cp <= 0x7e;
}

function hex(cp: number): string {
	return String.raw`\u{${cp.toString(16)}}`;
}

function literal(cp: number): string {
	if (!isPrintableAscii(cp)) return hex(cp);

	const ch = String.fromCharCode(cp);
	return SYNTAX_CHARACTERS.has(ch) ? `\\${ch}` : ch;
}

function classChar(cp: number): string {
	if (!isPrintableAscii(cp)) return hex(cp);

	const ch = String.fromCharCode(cp);
	return CLASS_ESCAPES.has(ch) ? `\\${ch}` : ch;
}

function property(expr: string, negated: boolean): string {
	return `\\${negated ? 'P' : 'p'}{${expr}}`;
}

function perl(cls: PerlClass, negated: boolean): string {
	switch (cls) {
		case 'd':
			return property('Nd', negated);
		case 's':
			return property('White_Space', negated);
		case 'w':
			return `[${negated ? '^' : ''}${WORD_CONTENT}]`;
	}
}

/** What a perl class or property adds to a bracketed class, which is not always a bracket of its own. */
function perlInClass(cls: PerlClass, negated: boolean): string {
	return cls === 'w' && !negated ? WORD_CONTENT : perl(cls, negated);
}

function item(entry: ClassItem): string {
	switch (entry.kind) {
		case 'char':
			return classChar(entry.cp);
		case 'range':
			return `${classChar(entry.lo)}-${classChar(entry.hi)}`;
		case 'perl':
			return perlInClass(entry.cls, entry.negated);
		case 'property':
			return property(entry.expr, entry.negated);
		case 'class':
			return bracket(entry.set);
	}
}

/**
 * Under the `v` flag the operands of `&&` and `--` cannot be ranges or runs of characters, only a single character or
 * a nested class, so each side is always wrapped in a class of its own.
 */
function operand(expr: ClassExpr): string {
	return `[${body(expr)}]`;
}

function body(expr: ClassExpr): string {
	if (expr.kind === 'union') return expr.items.map(item).join('');

	if (expr.op === '~~') {
		// `a ~~ b` is `(a -- b) || (b -- a)`.
		const left = operand(expr.left);
		const right = operand(expr.right);
		if (left.length + right.length > MAX_SYMMETRIC_DIFFERENCE_LENGTH / 2) throw OUTPUT_TOO_LARGE;

		return `[${left}--${right}][${right}--${left}]`;
	}

	return `${operand(expr.left)}${expr.op}${operand(expr.right)}`;
}

function bracket(set: ClassSet): string {
	return `[${set.negated ? '^' : ''}${body(set.expr)}]`;
}

function classNode(set: ClassSet): string {
	const { expr } = set;
	if (!set.negated && expr.kind === 'union' && expr.items.length === 1) {
		const only = expr.items[0];
		if (only?.kind === 'perl') return perl(only.cls, only.negated);
		if (only?.kind === 'property') return property(only.expr, only.negated);
	}

	return bracket(set);
}

/** Case-insensitive state while walking a sequence. A `(?i)` changes it for the rest of the enclosing group. */
interface State {
	rustI: boolean;
}

export interface EmitResult {
	readonly source: string;
	readonly usesModifiers: boolean;
}

/**
 * Turns the parsed pattern into the source of a JavaScript `RegExp` that is meant to run with the `v` flag, and with
 * the `i` flag when `initialI` is set.
 *
 * Only case-insensitivity has to be a flag: everything else (`s`, `m`, `U`, `x`) was settled while parsing and is
 * written out explicitly, so the one thing that can change inside the pattern is `i`. That is expressed with the
 * ES2025 modifiers `(?i:...)` and `(?-i:...)`, and only when the pattern actually switches it.
 */
export class Emitter {
	private usesModifiers = false;

	public constructor(private readonly pattern: string) {}

	public emit(alt: Node[][], initialI: boolean): EmitResult {
		try {
			const source = this.alt(alt, { rustI: initialI }, initialI);
			return { source: source === '' ? '(?:)' : source, usesModifiers: this.usesModifiers };
		} catch (error) {
			if (error !== OUTPUT_TOO_LARGE) throw error;

			throw new RustRegexError(
				'unsupported_feature',
				'the symmetric difference "~~" nests too deeply to be written as a JavaScript RegExp',
				this.pattern
			);
		}
	}

	/** `jsI` is whether the JavaScript engine is matching case-insensitively at this point of the output. */
	private alt(branches: Node[][], state: State, jsI: boolean): string {
		return branches.map((branch) => this.seq(branch, state, jsI)).join('|');
	}

	private seq(nodes: Node[], state: State, jsI: boolean): string {
		let out = '';
		let closers = 0;
		let current = jsI;

		for (const node of nodes) {
			if (node.type === 'flags') {
				state.rustI = node.i;
				continue;
			}

			// Opens a modifier group when Rust's state and the engine's disagree, and only once something follows that
			// it applies to. It stays open to the end of the branch.
			if (state.rustI !== current) {
				out += state.rustI ? '(?i:' : '(?-i:';
				closers++;
				current = state.rustI;
				this.usesModifiers = true;
			}

			out += this.node(node, current);
		}

		return out + ')'.repeat(closers);
	}

	private node(node: Node, jsI: boolean): string {
		switch (node.type) {
			case 'literal':
				return literal(node.cp);
			case 'dot':
				return node.dotAll ? String.raw`[\s\S]` : String.raw`[^\n]`;
			case 'assertion':
				return ASSERTIONS[node.kind];
			case 'class':
				return classNode(node.set);
			case 'group':
				return this.group(node, jsI);
			case 'repeat':
				return this.repeat(node, jsI);
			case 'flags':
				return '';
		}
	}

	private group(node: Extract<Node, { type: 'group' }>, jsI: boolean): string {
		const inner: State = { rustI: node.iStart };

		if (node.capture) {
			const open = node.name === undefined ? '(' : `(?<${node.name}>`;
			return `${open}${this.alt(node.alt, inner, jsI)})`;
		}

		// `(?i:...)` in the Rust pattern is the same modifier group here, so it does not need a second one inside.
		if (node.iStart !== jsI) {
			this.usesModifiers = true;
			return `${node.iStart ? '(?i:' : '(?-i:'}${this.alt(node.alt, inner, node.iStart)})`;
		}

		return `(?:${this.alt(node.alt, inner, jsI)})`;
	}

	private repeat(node: Extract<Node, { type: 'repeat' }>, jsI: boolean): string {
		const { min, max } = node;
		const quantifier =
			min === 0 && max === null
				? '*'
				: min === 1 && max === null
					? '+'
					: min === 0 && max === 1
						? '?'
						: max === null
							? `{${min},}`
							: min === max
								? `{${min}}`
								: `{${min},${max}}`;

		// Assertions and other quantifiers cannot be quantified directly under the `v` flag.
		const child = this.node(node.node, jsI);
		const wrapped = node.node.type === 'assertion' || node.node.type === 'repeat' ? `(?:${child})` : child;

		return `${wrapped}${quantifier}${node.lazy ? '?' : ''}`;
	}
}
