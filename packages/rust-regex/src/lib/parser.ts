import type { AssertionKind, ClassExpr, ClassItem, ClassOp, ClassSet, Node, PerlClass } from './ast.js';
import { RustRegexError, type RustRegexErrorCode } from './errors.js';
import { resolveProperty } from './properties.js';

/** The flags that change how a pattern is read or matched. `u` and `R` are handled where they are parsed. */
export interface Flags {
	i: boolean;
	m: boolean;
	s: boolean;
	U: boolean;
	x: boolean;
}

export interface ParseResult {
	readonly alt: Node[][];
	/** Case-insensitive state at the very start of the pattern, after any leading `(?i)`. */
	readonly initialI: boolean;
}

/** The nesting limit of the Rust `regex` crate. */
const NEST_LIMIT = 250;

const MAX_CODE_POINT = 0x10ffff;

const ASCII_CLASSES: Readonly<Record<string, readonly (readonly [number, number])[]>> = {
	alnum: [
		[0x30, 0x39],
		[0x41, 0x5a],
		[0x61, 0x7a]
	],
	alpha: [
		[0x41, 0x5a],
		[0x61, 0x7a]
	],
	ascii: [[0x00, 0x7f]],
	blank: [
		[0x20, 0x20],
		[0x09, 0x09]
	],
	cntrl: [
		[0x00, 0x1f],
		[0x7f, 0x7f]
	],
	digit: [[0x30, 0x39]],
	graph: [[0x21, 0x7e]],
	lower: [[0x61, 0x7a]],
	print: [[0x20, 0x7e]],
	punct: [
		[0x21, 0x2f],
		[0x3a, 0x40],
		[0x5b, 0x60],
		[0x7b, 0x7e]
	],
	space: [
		[0x09, 0x0d],
		[0x20, 0x20]
	],
	upper: [[0x41, 0x5a]],
	word: [
		[0x30, 0x39],
		[0x41, 0x5a],
		[0x5f, 0x5f],
		[0x61, 0x7a]
	],
	xdigit: [
		[0x30, 0x39],
		[0x41, 0x46],
		[0x61, 0x66]
	]
};

const ASCII_CLASS = /\[:(\^?)([a-z]+):\]/y;

const WHITESPACE = /^\p{White_Space}$/u;

/** What the Rust `regex` crate accepts as a capture group name: a letter or `_`, then letters, numbers, `_`, `.`, `[` and `]`. */
const RUST_GROUP_NAME = /^[_\p{Alphabetic}][_.[\]\p{Alphabetic}\p{N}]*$/u;

/** What JavaScript accepts as a capture group name: an identifier. */
const JS_GROUP_NAME = /^[_\p{ID_Start}]\p{ID_Continue}*$/u;

/** What the parser hands back for an atom: the node, and whether a quantifier may follow it. */
interface Parsed {
	readonly node: Node;
	readonly repeatable: boolean;
}

type Escape =
	| { readonly kind: 'char'; readonly cp: number }
	| { readonly kind: 'item'; readonly item: ClassItem }
	| { readonly kind: 'assertion'; readonly assertion: AssertionKind };

function isAsciiAlphanumeric(ch: string): boolean {
	return (ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
}

function union(items: readonly ClassItem[]): ClassExpr {
	return { kind: 'union', items };
}

class Parser {
	private pos = 0;
	private depth = 0;
	private readonly names = new Set<string>();

	/**
	 * How many levels of groups, repetitions and classes sit below a node, counted the way the nest limit of the Rust
	 * `regex` crate counts the depth of its tree. A chain such as `a*****...` adds a level per operator without opening
	 * a group, so `depth` alone would not stop it, and the emitter would overflow the stack on it.
	 */
	private readonly heights = new WeakMap<object, number>();

	public constructor(private readonly src: string) {}

	public parse(flags: Flags): Node[][] {
		const alt = this.parseAlternation(flags);
		if (this.pos < this.src.length) throw this.error('invalid_syntax', 'unopened group: found an unmatched ")"');

		return alt;
	}

	private error(code: RustRegexErrorCode, message: string, position = this.pos): RustRegexError {
		return new RustRegexError(code, message, this.src, position);
	}

	private enter(): void {
		if (++this.depth > NEST_LIMIT) throw this.nestLimit();
	}

	private nestLimit(position = this.pos): RustRegexError {
		return this.error('invalid_syntax', `exceeded the nest limit of ${NEST_LIMIT}`, position);
	}

	private height(value: object): number {
		return this.heights.get(value) ?? 0;
	}

	private withHeight<T extends object>(value: T, height: number, start: number): T {
		if (height > NEST_LIMIT) throw this.nestLimit(start);

		this.heights.set(value, height);
		return value;
	}

	private altHeight(alt: readonly (readonly Node[])[]): number {
		let tallest = 0;
		for (const branch of alt) for (const node of branch) tallest = Math.max(tallest, this.height(node));

		return tallest;
	}

	private unionHeight(items: readonly ClassItem[]): number {
		let tallest = 0;
		for (const item of items) if (item.kind === 'class') tallest = Math.max(tallest, this.height(item.set));

		return 1 + tallest;
	}

	private leave(): void {
		this.depth--;
	}

	private readCodePoint(): number {
		const cp = this.src.codePointAt(this.pos);
		if (cp === undefined) throw this.error('invalid_syntax', 'unexpected end of the pattern');

		this.pos += cp > 0xffff ? 2 : 1;
		return cp;
	}

	/**
	 * In verbose mode (`(?x)`) whitespace and `#` comments are not part of the pattern. That holds inside a class and
	 * a counted repetition too, where an escaped `\#` is still a literal.
	 */
	private skipVerbose(flags: Flags): void {
		if (!flags.x) return;

		for (;;) {
			const ch = this.src[this.pos];
			if (ch === undefined) return;

			if (ch === '#') {
				while (this.pos < this.src.length && this.src[this.pos] !== '\n') this.pos++;
			} else if (WHITESPACE.test(ch)) {
				this.pos++;
			} else {
				return;
			}
		}
	}

	private parseAlternation(flags: Flags): Node[][] {
		const branches: Node[][] = [];
		for (;;) {
			branches.push(this.parseConcat(flags));
			if (this.src[this.pos] !== '|') return branches;

			this.pos++;
		}
	}

	private parseConcat(flags: Flags): Node[] {
		const nodes: Node[] = [];
		for (;;) {
			this.skipVerbose(flags);
			const ch = this.src[this.pos];
			if (ch === undefined || ch === '|' || ch === ')') return nodes;

			let { node, repeatable } = this.parseAtom(flags);

			for (;;) {
				this.skipVerbose(flags);
				const next = this.src[this.pos];
				if (next !== '*' && next !== '+' && next !== '?' && next !== '{') break;
				if (!repeatable) throw this.error('invalid_syntax', 'repetition operator missing expression');

				const operand = node;
				const operatorAt = this.pos;
				node = this.withHeight(this.parseRepetition(flags, node), this.height(operand) + 1, operatorAt);
				repeatable = true;
			}

			nodes.push(node);
		}
	}

	private parseRepetition(flags: Flags, node: Node): Node {
		let min: number;
		let max: number | null;

		switch (this.src[this.pos]) {
			case '*':
				this.pos++;
				min = 0;
				max = null;
				break;
			case '+':
				this.pos++;
				min = 1;
				max = null;
				break;
			case '?':
				this.pos++;
				min = 0;
				max = 1;
				break;
			default:
				[min, max] = this.parseCounted(flags);
		}

		let lazy = false;
		if (this.src[this.pos] === '?') {
			this.pos++;
			lazy = true;
		}

		// `(?U)` swaps what a trailing `?` means.
		return { type: 'repeat', min, max, lazy: lazy !== flags.U, node };
	}

	private parseCounted(flags: Flags): [min: number, max: number | null] {
		const start = this.pos;
		this.pos++; // {
		this.skipVerbose(flags);
		const min = this.readDecimal();
		this.skipVerbose(flags);

		let max: number | null = min;
		if (this.src[this.pos] === ',') {
			this.pos++;
			this.skipVerbose(flags);
			max = this.src[this.pos] === '}' ? null : this.readDecimal();
			this.skipVerbose(flags);
		}

		if (this.src[this.pos] !== '}') throw this.error('invalid_syntax', 'unclosed counted repetition', start);

		this.pos++;
		if (max !== null && min > max) throw this.error('invalid_syntax', 'the minimum of a counted repetition is greater than its maximum', start);

		return [min, max];
	}

	private readDecimal(): number {
		const start = this.pos;
		while (this.src[this.pos] !== undefined && this.src[this.pos]! >= '0' && this.src[this.pos]! <= '9') this.pos++;

		if (this.pos === start) throw this.error('invalid_syntax', 'a counted repetition expects a decimal number');

		const value = Number(this.src.slice(start, this.pos));
		if (value > 0xffffffff) throw this.error('invalid_syntax', 'the number in a counted repetition is too big', start);

		return value;
	}

	private parseAtom(flags: Flags): Parsed {
		switch (this.src[this.pos]) {
			case '(':
				return this.parseGroup(flags);
			case '[': {
				const start = this.pos;
				const set = this.parseBracket(flags);

				// Groups and repetitions look up the height of the node, not of the class set it wraps.
				const node: Node = { type: 'class', set };
				return { node: this.withHeight(node, this.height(set), start), repeatable: true };
			}
			case '.':
				this.pos++;
				return { node: { type: 'dot', dotAll: flags.s }, repeatable: true };
			case '^':
				this.pos++;
				return { node: { type: 'assertion', kind: flags.m ? 'line-start' : 'text-start' }, repeatable: true };
			case '$':
				this.pos++;
				return { node: { type: 'assertion', kind: flags.m ? 'line-end' : 'text-end' }, repeatable: true };
			case '\\': {
				const escape = this.parseEscape(false);
				switch (escape.kind) {
					case 'char':
						return { node: { type: 'literal', cp: escape.cp }, repeatable: true };
					case 'item':
						return { node: { type: 'class', set: { negated: false, expr: union([escape.item]) } }, repeatable: true };
					case 'assertion':
						return { node: { type: 'assertion', kind: escape.assertion }, repeatable: true };
				}
			}
			case '*':
			case '+':
			case '?':
			case '{':
				throw this.error('invalid_syntax', 'repetition operator missing expression');
			default:
				return { node: { type: 'literal', cp: this.readCodePoint() }, repeatable: true };
		}
	}

	private parseGroup(flags: Flags): Parsed {
		const start = this.pos;
		this.pos++; // (

		if (this.src[this.pos] !== '?') return this.finishGroup(flags, start, true, undefined);

		this.pos++; // ?
		switch (this.src[this.pos]) {
			case 'P': {
				const after = this.src[this.pos + 1];
				if (after === '<') {
					this.pos += 2;
					return this.finishNamedGroup(flags, start);
				}

				if (after === '=') throw this.error('unsupported_backreference', 'backreferences are not supported by the Rust regex crate', start);
				if (after === '>') throw this.error('unsupported_feature', 'recursion is not supported by the Rust regex crate', start);
				throw this.error('invalid_syntax', 'unrecognized group syntax', start);
			}
			case '<': {
				const after = this.src[this.pos + 1];
				if (after === '=' || after === '!')
					throw this.error('unsupported_lookaround', 'lookbehind is not supported by the Rust regex crate', start);

				this.pos++;
				return this.finishNamedGroup(flags, start);
			}
			case '=':
			case '!':
				throw this.error('unsupported_lookaround', 'lookahead is not supported by the Rust regex crate', start);
			case '>':
				throw this.error('unsupported_feature', 'atomic groups are not supported by the Rust regex crate', start);
			default:
				return this.parseFlagsGroup(flags, start);
		}
	}

	private finishNamedGroup(flags: Flags, start: number): Parsed {
		const end = this.src.indexOf('>', this.pos);
		if (end === -1) throw this.error('invalid_syntax', 'unclosed capture group name', start);

		const name = this.src.slice(this.pos, end);
		if (name === '') throw this.error('invalid_syntax', 'a capture group name cannot be empty', start);
		if (!RUST_GROUP_NAME.test(name)) throw this.error('invalid_syntax', `the capture group name "${name}" is not valid`, start);
		if (!JS_GROUP_NAME.test(name)) throw this.error('unsupported_feature', `the capture group name "${name}" is not valid in JavaScript`, start);

		if (this.names.has(name)) throw this.error('invalid_syntax', `duplicate capture group name "${name}"`, start);

		this.names.add(name);
		this.pos = end + 1;
		return this.finishGroup(flags, start, true, name);
	}

	private finishGroup(flags: Flags, start: number, capture: boolean, name: string | undefined): Parsed {
		const inner: Flags = { ...flags };
		const iStart = inner.i;

		this.enter();
		const alt = this.parseAlternation(inner);
		this.leave();

		if (this.src[this.pos] !== ')') throw this.error('invalid_syntax', 'unclosed group', start);

		this.pos++;
		const group: Node = { type: 'group', capture, name, iStart, alt };
		return { node: this.withHeight(group, 1 + this.altHeight(alt), start), repeatable: true };
	}

	/** `(?flags)`, which changes the flags until the end of the group, and `(?flags:...)`, which scopes them to its body. */
	private parseFlagsGroup(flags: Flags, start: number): Parsed {
		const next: Flags = { ...flags };
		const seen = new Set<string>();
		let negated = false;
		let afterNegation = 0;

		for (;;) {
			const ch = this.src[this.pos];
			if (ch === undefined) throw this.error('invalid_syntax', 'unclosed group', start);
			if (ch === ')' || ch === ':') break;

			this.pos++;
			if (ch === '-') {
				if (negated) throw this.error('invalid_syntax', 'a flag group has more than one negation');

				negated = true;
				continue;
			}

			if (negated) afterNegation++;

			switch (ch) {
				case 'i':
				case 'm':
				case 's':
				case 'U':
				case 'x':
					if (seen.has(ch)) throw this.error('invalid_syntax', `duplicate flag "${ch}"`);

					seen.add(ch);
					next[ch] = !negated;
					break;
				case 'u':
					if (negated) throw this.error('unsupported_feature', 'disabling Unicode mode with (?-u) cannot be expressed in JavaScript');
					break;
				case 'R':
					if (!negated) throw this.error('unsupported_feature', 'CRLF mode (?R) cannot be expressed in JavaScript');
					break;
				default:
					throw this.error('invalid_syntax', `unrecognized flag "${ch}"`);
			}
		}

		if (negated && afterNegation === 0) throw this.error('invalid_syntax', 'a flag negation is missing the flags it negates');

		const terminator = this.src[this.pos];
		if (terminator === ':') {
			this.pos++;
			this.enter();
			const iStart = next.i;
			const alt = this.parseAlternation(next);
			this.leave();

			if (this.src[this.pos] !== ')') throw this.error('invalid_syntax', 'unclosed group', start);

			this.pos++;
			const group: Node = { type: 'group', capture: false, name: undefined, iStart, alt };
			return { node: this.withHeight(group, 1 + this.altHeight(alt), start), repeatable: true };
		}

		if (seen.size === 0 && !negated && this.src[this.pos - 1] === '?')
			throw this.error('invalid_syntax', 'a flag group is missing its flags', start);

		this.pos++; // )
		Object.assign(flags, next);
		return { node: { type: 'flags', i: flags.i }, repeatable: false };
	}

	private parseBracket(flags: Flags): ClassSet {
		const start = this.pos;
		this.pos++; // [
		this.enter();

		let negated = false;
		if (this.src[this.pos] === '^') {
			negated = true;
			this.pos++;
		}

		let lhs: ClassExpr | null = null;
		let lhsHeight = 0;
		let op: ClassOp | null = null;
		let items: ClassItem[] = [];
		let first = true;

		for (;;) {
			this.skipVerbose(flags);
			const ch = this.src[this.pos];
			if (ch === undefined) throw this.error('invalid_syntax', 'unclosed character class', start);

			if (ch === ']' && !first) {
				this.pos++;
				break;
			}

			first = false;

			const operator = this.src.startsWith('&&', this.pos)
				? '&&'
				: this.src.startsWith('--', this.pos)
					? '--'
					: this.src.startsWith('~~', this.pos)
						? '~~'
						: null;
			if (operator !== null) {
				if (items.length === 0) throw this.error('invalid_syntax', `the "${operator}" operator is missing its left operand`);

				const operand = union(items);
				const operandHeight = this.unionHeight(items);
				if (lhs === null || op === null) {
					lhs = operand;
					lhsHeight = operandHeight;
				} else {
					lhs = { kind: 'binary', op, left: lhs, right: operand };
					lhsHeight = 1 + Math.max(lhsHeight, operandHeight);
					if (lhsHeight > NEST_LIMIT) throw this.nestLimit(start);
				}

				op = operator;
				items = [];
				this.pos += 2;
				continue;
			}

			if (ch === '[') {
				items.push(this.tryAsciiClass() ?? { kind: 'class', set: this.parseBracket(flags) });
				continue;
			}

			if (ch === '\\') {
				const escape = this.parseEscape(true);
				if (escape.kind === 'item') items.push(escape.item);
				else if (escape.kind === 'char') this.pushCharOrRange(items, escape.cp, flags);
				continue;
			}

			this.pushCharOrRange(items, this.readCodePoint(), flags);
		}

		this.leave();

		if (items.length === 0)
			throw this.error('invalid_syntax', op === null ? 'empty character class' : `the "${op}" operator is missing its right operand`, start);

		const lastHeight = this.unionHeight(items);
		const expr: ClassExpr = lhs === null || op === null ? union(items) : { kind: 'binary', op, left: lhs, right: union(items) };
		const exprHeight = lhs === null || op === null ? lastHeight : 1 + Math.max(lhsHeight, lastHeight);

		return this.withHeight({ negated, expr }, 1 + exprHeight, start);
	}

	/** In verbose mode (`(?x)`) whitespace may sit on either side of the dash, as in `[a - z]`. */
	private pushCharOrRange(items: ClassItem[], lo: number, flags: Flags): void {
		const afterLo = this.pos;
		this.skipVerbose(flags);

		const dashAt = this.pos;
		const joinsRange = this.src[dashAt] === '-' && this.src[dashAt + 1] !== '-';
		if (joinsRange) {
			this.pos++; // -
			this.skipVerbose(flags);
		}

		const next = this.src[this.pos];
		// Rust looks past whitespace for the `]` or the `-` that follows the dash, so `[a - -]` is `a` and `-`.
		if (!joinsRange || next === undefined || next === ']' || next === '-') {
			// Not a range: the dash, if any, is read again as a character of its own.
			this.pos = afterLo;
			items.push({ kind: 'char', cp: lo });
			return;
		}

		let hi: number;
		if (this.src[this.pos] === '\\') {
			const escape = this.parseEscape(true);
			if (escape.kind !== 'char') throw this.error('invalid_syntax', 'the end of a range must be a single character');

			hi = escape.cp;
		} else if (this.src[this.pos] === '[') {
			throw this.error('invalid_syntax', 'the end of a range must be a single character');
		} else {
			hi = this.readCodePoint();
		}

		if (hi < lo) throw this.error('invalid_syntax', 'invalid range: the start is greater than the end');

		items.push({ kind: 'range', lo, hi });
	}

	/** `[:alpha:]`, `[:^alpha:]`: only meaningful directly inside a bracketed class. */
	private tryAsciiClass(): ClassItem | null {
		ASCII_CLASS.lastIndex = this.pos;
		const match = ASCII_CLASS.exec(this.src);
		if (match === null) return null;

		const [whole = '', caret = '', name = ''] = match;
		const ranges = ASCII_CLASSES[name];
		if (ranges === undefined) throw this.error('invalid_syntax', `unrecognized ASCII class "${name}"`);

		this.pos += whole.length;
		return { kind: 'class', set: { negated: caret === '^', expr: union(ranges.map(([lo, hi]): ClassItem => ({ kind: 'range', lo, hi }))) } };
	}

	private parseEscape(inClass: boolean): Escape {
		const start = this.pos;
		this.pos++; // backslash

		if (this.pos >= this.src.length) throw this.error('invalid_syntax', 'incomplete escape sequence: the pattern ends after a backslash', start);

		const cp = this.readCodePoint();
		const ch = String.fromCodePoint(cp);

		switch (ch) {
			case 't':
				return { kind: 'char', cp: 0x09 };
			case 'n':
				return { kind: 'char', cp: 0x0a };
			case 'r':
				return { kind: 'char', cp: 0x0d };
			case 'f':
				return { kind: 'char', cp: 0x0c };
			case 'v':
				return { kind: 'char', cp: 0x0b };
			case 'a':
				return { kind: 'char', cp: 0x07 };
			case 'x':
				return { kind: 'char', cp: this.parseHex(2, start) };
			case 'u':
				return { kind: 'char', cp: this.parseHex(4, start) };
			case 'U':
				return { kind: 'char', cp: this.parseHex(8, start) };
			case 'd':
			case 's':
			case 'w':
				return { kind: 'item', item: { kind: 'perl', cls: ch, negated: false } };
			case 'D':
			case 'S':
			case 'W':
				return { kind: 'item', item: { kind: 'perl', cls: ch.toLowerCase() as PerlClass, negated: true } };
			case 'p':
			case 'P':
				return { kind: 'item', item: this.parseProperty(ch === 'P', start) };
			case 'A':
			case 'z':
			case 'B':
				return this.assertion(ch === 'A' ? 'text-start' : ch === 'z' ? 'text-end' : 'not-word-boundary', inClass, start);
			case 'b':
				if (this.src[this.pos] === '{') throw this.error('unsupported_feature', 'the \\b{...} word boundaries are not supported', start);

				return this.assertion('word-boundary', inClass, start);
			case '<':
			case '>':
				throw this.error('unsupported_feature', `the \\${ch} word boundary is not supported`, start);
			case 'k':
				if (this.src[this.pos] === '<')
					throw this.error('unsupported_backreference', 'backreferences are not supported by the Rust regex crate', start);

				throw this.error('invalid_syntax', 'unrecognized escape sequence "\\k"', start);
			default:
				if (ch >= '1' && ch <= '9')
					throw this.error('unsupported_backreference', 'backreferences are not supported by the Rust regex crate', start);
				if (ch === '0') throw this.error('invalid_syntax', 'octal escapes are not supported, use \\x00', start);

				// Anything that is ASCII and not a letter or a digit is a literal when escaped.
				if (cp < 0x80 && !isAsciiAlphanumeric(ch)) return { kind: 'char', cp };

				throw this.error('invalid_syntax', `unrecognized escape sequence "\\${ch}"`, start);
		}
	}

	private assertion(kind: AssertionKind, inClass: boolean, start: number): Escape {
		if (inClass) throw this.error('invalid_syntax', 'an assertion is not allowed in a character class', start);

		return { kind: 'assertion', assertion: kind };
	}

	/** `\xNN`, `\x{N...}`, `\uNNNN`, `\u{N...}`, `\UNNNNNNNN`, `\U{N...}`. */
	private parseHex(digits: number, start: number): number {
		let text: string;
		if (this.src[this.pos] === '{') {
			const end = this.src.indexOf('}', this.pos);
			if (end === -1) throw this.error('invalid_syntax', 'unclosed hexadecimal escape', start);

			text = this.src.slice(this.pos + 1, end).trim();
			this.pos = end + 1;
			if (!/^[0-9A-Fa-f]{1,8}$/.test(text)) throw this.error('invalid_syntax', 'invalid hexadecimal escape', start);
		} else {
			text = this.src.slice(this.pos, this.pos + digits);
			if (text.length !== digits || !/^[0-9A-Fa-f]+$/.test(text))
				throw this.error('invalid_syntax', `a hexadecimal escape needs exactly ${digits} digits`, start);

			this.pos += digits;
		}

		const cp = Number.parseInt(text, 16);
		if (cp > MAX_CODE_POINT || (cp >= 0xd800 && cp <= 0xdfff))
			throw this.error('invalid_syntax', 'a hexadecimal escape must be a Unicode scalar value', start);

		return cp;
	}

	private parseProperty(negated: boolean, start: number): ClassItem {
		let spec: string;
		let singleLetter = false;

		if (this.src[this.pos] === '{') {
			const end = this.src.indexOf('}', this.pos);
			if (end === -1) throw this.error('invalid_syntax', 'unclosed Unicode class', start);

			spec = this.src.slice(this.pos + 1, end).trim();
			this.pos = end + 1;
		} else {
			spec = this.src[this.pos] ?? '';
			if (spec === '') throw this.error('invalid_syntax', 'incomplete Unicode class: the pattern ends after \\p', start);

			this.pos++;
			singleLetter = true;
		}

		if (spec.startsWith('^')) {
			negated = !negated;
			spec = spec.slice(1).trim();
		}

		const resolved = resolveProperty(spec, singleLetter);
		if ('error' in resolved)
			throw this.error(resolved.error === 'unsupported' ? 'unsupported_feature' : 'invalid_syntax', resolved.message, start);

		return { kind: 'property', expr: resolved.expr, negated: negated !== resolved.negated };
	}
}

export function parse(pattern: string, flags: Flags): ParseResult {
	// The parser changes `flags` as it meets `(?i)`, so the state the pattern starts in is read first.
	let initialI = flags.i;
	const alt = new Parser(pattern).parse(flags);

	// A flag group at the very start of the pattern applies to all of it, so it becomes the starting state instead of
	// a scoped `(?i:...)` around everything.
	const first = alt[0];
	while (first !== undefined && first[0]?.type === 'flags') {
		initialI = first[0].i;
		first.shift();
	}

	return { alt, initialI };
}
