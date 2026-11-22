import { RustRegexError, toRegExp, transpile } from '../src/index.js';

const supportsModifiers = (() => {
	try {
		new RegExp('(?i:a)', 'v');
		return true;
	} catch {
		return false;
	}
})();

function rust(pattern: string, flags?: string): RegExp {
	return toRegExp(pattern, flags === undefined ? {} : { flags });
}

function failure(pattern: string): RustRegexError {
	try {
		transpile(pattern);
	} catch (error) {
		if (error instanceof RustRegexError) return error;
		throw error;
	}

	throw new Error(`Expected "${pattern}" to be rejected`);
}

describe('literals and escapes', () => {
	test('GIVEN plain text THEN it matches that text', () => {
		expect(rust('abc').test('xabcx')).toBe(true);
		expect(rust('abc').test('ab')).toBe(false);
	});

	test('GIVEN an empty pattern THEN it matches everything', () => {
		expect(transpile('').source).toBe('(?:)');
		expect(rust('').test('anything')).toBe(true);
	});

	test('GIVEN escaped metacharacters THEN they match literally', () => {
		expect(rust(String.raw`a\.b\*c\+d\?e\(f\)g\[h\]i\{j\}k\|l\^m\$n\\o`).test('a.b*c+d?e(f)g[h]i{j}k|l^m$n\\o')).toBe(true);
	});

	test('GIVEN escaped punctuation Rust allows but JavaScript does not THEN it still matches', () => {
		expect(rust(String.raw`\-\#\&\~\/\!\@\%\"\'\_\ `).test(`-#&~/!@%"'_ `)).toBe(true);
	});

	test('GIVEN a forward slash, braces and brackets that are literal in Rust THEN they match literally', () => {
		expect(rust('a/b}c]').test('a/b}c]')).toBe(true);
	});

	test('GIVEN control and hex escapes THEN they match the code point', () => {
		expect(rust(String.raw`\t\n\r\f\v\a`).test('\t\n\r\f\v\u0007')).toBe(true);
		expect(rust(String.raw`\x41\x{1F600}B\u{43}\U00000044`).test('A😀BCD')).toBe(true);
	});

	test('GIVEN non-ASCII literals THEN they match', () => {
		expect(rust('caffè 😀').test('un caffè 😀!')).toBe(true);
	});
});

describe('Unicode classes', () => {
	test('GIVEN \\d THEN it matches any decimal digit, not just ASCII', () => {
		expect(rust(String.raw`^\d+$`).test('٣٤٥')).toBe(true);
		expect(rust(String.raw`\D`).test('12')).toBe(false);
	});

	test('GIVEN \\w THEN it is the Unicode word class', () => {
		expect(rust(String.raw`^\w+$`).test('è_ñ1')).toBe(true);
		expect(rust(String.raw`\W`).test('é')).toBe(false);
		expect(rust(String.raw`\W`).test('-')).toBe(true);
	});

	test('GIVEN \\s THEN it matches Unicode whitespace', () => {
		expect(rust(String.raw`a\sb`).test('a\u00a0b')).toBe(true);
		expect(rust(String.raw`\S`).test(' \t')).toBe(false);
	});

	test('GIVEN \\b THEN it uses Unicode word characters', () => {
		const regex = rust(String.raw`\bé\b`);
		expect(regex.test('un é ici')).toBe(true);
		expect(regex.test('blé')).toBe(false);
		expect(rust(String.raw`\Bb\B`).test('abc')).toBe(true);
		expect(rust(String.raw`\Bb\B`).test('a b c')).toBe(false);
	});

	test('GIVEN \\p classes THEN scripts, categories and binary properties all resolve', () => {
		expect(rust(String.raw`^\p{Greek}+$`).test('αβγ')).toBe(true);
		expect(rust(String.raw`^\p{Script=Greek}+$`).test('αβγ')).toBe(true);
		expect(rust(String.raw`^\p{sc=Latin}+$`).test('abc')).toBe(true);
		expect(rust(String.raw`^\pL+$`).test('abcé')).toBe(true);
		expect(rust(String.raw`^\p{Lu}$`).test('É')).toBe(true);
		expect(rust(String.raw`^\p{uppercase_letter}$`).test('É')).toBe(true);
		expect(rust(String.raw`^\p{gc=Nd}$`).test('7')).toBe(true);
		expect(rust(String.raw`^\p{Emoji}$`).test('😀')).toBe(true);
		expect(rust(String.raw`\PL`).test('abc')).toBe(false);
		expect(rust(String.raw`\p{^Greek}`).test('α')).toBe(false);
		expect(rust(String.raw`\p{Script!=Greek}`).test('a')).toBe(true);
	});
});

describe('anchors and the dot', () => {
	test('GIVEN ^ and $ THEN they only match at the ends of the text', () => {
		expect(rust('^b').test('a\nb')).toBe(false);
		expect(rust('a$').test('a\n')).toBe(false);
		expect(rust(String.raw`\Aab\z`).test('ab')).toBe(true);
		expect(rust(String.raw`\Aab\z`).test('ab\n')).toBe(false);
	});

	test('GIVEN (?m) THEN ^ and $ match around \\n only', () => {
		const regex = rust('(?m)^b$');
		expect(regex.test('a\nb\nc')).toBe(true);
		expect(regex.test('a\r\nb\r\nc')).toBe(false);
		expect(rust(String.raw`(?m)^$`).test('a\n\nb')).toBe(true);
	});

	test('GIVEN . THEN it matches everything except \\n', () => {
		expect(rust('a.b').test('a\rb')).toBe(true);
		expect(rust('a.b').test('a\u2028b')).toBe(true);
		expect(rust('a.b').test('a\nb')).toBe(false);
	});

	test('GIVEN (?s) THEN . matches \\n too', () => {
		expect(rust('(?s)a.b').test('a\nb')).toBe(true);
	});
});

describe('flags', () => {
	test('GIVEN a leading (?i) THEN it becomes the i flag and needs no modifiers', () => {
		const result = transpile('(?i)abc');
		expect(result).toEqual({ source: 'abc', flags: 'iv', usesModifiers: false });
		expect(rust('(?i)abc').test('ABC')).toBe(true);
		expect(rust('abc').test('ABC')).toBe(false);
	});

	test('GIVEN the flags option THEN it acts like a leading flag group', () => {
		expect(transpile('abc', { flags: 'i' }).flags).toBe('iv');
		expect(rust('a.c', 's').test('a\nc')).toBe(true);
		expect(() => transpile('a', { flags: 'q' })).toThrow(RustRegexError);
	});

	test('GIVEN (?i) THEN Unicode case folding applies', () => {
		expect(rust('(?i)straße').test('STRASSE')).toBe(false);
		expect(rust('(?i)é').test('É')).toBe(true);
		expect(rust('(?i)σ').test('ς')).toBe(true);
	});

	test('GIVEN (?x) THEN whitespace and comments are ignored', () => {
		expect(rust('(?x) a b # a comment\n c').test('abc')).toBe(true);
		expect(rust(String.raw`(?x) a \  b`).test('a b')).toBe(true);
		expect(rust(String.raw`(?x) [a b]+ \# `).test('ab#')).toBe(true);
	});

	test('GIVEN (?x) and spaces around the dash of a class range THEN it is still a range', () => {
		for (const pattern of ['(?x)^[a - z]+$', '(?x)^[a- z]+$', '(?x)^[a -z]+$']) {
			expect(rust(pattern).test('bcd')).toBe(true);
		}

		expect(rust('(?x)^[a - ]+$').test('a-')).toBe(true);
		expect(rust('(?x)^[a - ]+$').test('b')).toBe(false);
	});

	test('GIVEN (?U) THEN greediness is swapped', () => {
		expect(rust('(?U)a+').exec('aaa')?.[0]).toBe('a');
		expect(rust('(?U)a+?').exec('aaa')?.[0]).toBe('aaa');
		expect(rust('a+?').exec('aaa')?.[0]).toBe('a');
	});

	test('GIVEN a flag group with (?-s) THEN it turns the flag back off', () => {
		expect(rust('(?s)a(?-s:.)b').test('a\nb')).toBe(false);
		expect(rust('(?s)a(?-s:.)b').test('axb')).toBe(true);
		expect(rust('(?s)a(?-s).b').test('a\nb')).toBe(false);
	});

	test('GIVEN a flag that is scoped to a group THEN it does not leak out', () => {
		expect(rust('(?:(?s).)a.').test('\naz')).toBe(true);
		expect(rust('(?:(?s).)a.').test('\na\n')).toBe(false);
	});

	test.runIf(supportsModifiers)('GIVEN a scoped (?i:...) THEN only that part is case-insensitive', () => {
		const result = transpile('(?i:a)b');
		expect(result).toEqual({ source: '(?i:a)b', flags: 'v', usesModifiers: true });

		const regex = rust('(?i:a)b');
		expect(regex.test('Ab')).toBe(true);
		expect(regex.test('AB')).toBe(false);
	});

	test.runIf(supportsModifiers)('GIVEN (?i) in the middle THEN it applies until the end of the group, across alternatives', () => {
		const regex = rust('^(?:x(?i)y|z)$');
		expect(regex.test('xY')).toBe(true);
		expect(regex.test('Z')).toBe(true);
		expect(regex.test('X')).toBe(false);
	});

	test.runIf(supportsModifiers)('GIVEN (?-i) after (?i) THEN case sensitivity comes back', () => {
		const regex = rust('(?i)a(?-i)b');
		expect(regex.test('Ab')).toBe(true);
		expect(regex.test('AB')).toBe(false);
	});

	test.skipIf(supportsModifiers)('GIVEN a scoped flag on a runtime without modifiers THEN it reports invalid_output', () => {
		expect(() => transpile('(?i:a)b')).toThrow(expect.objectContaining({ code: 'invalid_output' }));
	});
});

describe('groups and repetitions', () => {
	test('GIVEN capture groups THEN they keep their numbering and names', () => {
		const named = rust(String.raw`(?P<year>\d{4})-(?<month>\d{2})`).exec('on 2026-11');
		expect(named?.groups).toMatchObject({ year: '2026', month: '11' });
		expect(named?.[1]).toBe('2026');
		expect(rust('(?:a)(b)').exec('ab')?.[1]).toBe('b');
	});

	test('GIVEN a capture group name with non-ASCII letters THEN it is kept', () => {
		expect(rust('(?P<名前>x)(?<é1>y)').exec('xy')?.groups).toMatchObject({ 名前: 'x', é1: 'y' });
	});

	test('GIVEN alternation THEN the leftmost alternative wins, like Rust', () => {
		expect(rust('samwise|sam').exec('samwise')?.[0]).toBe('samwise');
		expect(rust('sam|samwise').exec('samwise')?.[0]).toBe('sam');
		expect(rust('a(b|)c').test('ac')).toBe(true);
	});

	test('GIVEN counted repetitions THEN they work like JavaScript', () => {
		expect(rust('^a{2}$').test('aa')).toBe(true);
		expect(rust('^a{2,}$').test('aaaa')).toBe(true);
		expect(rust('^a{1,2}$').test('aaa')).toBe(false);
		expect(rust('a{2}?').exec('aaa')?.[0]).toBe('aa');
		expect(rust('a*?').exec('aaa')?.[0]).toBe('');
	});

	test('GIVEN a quantified assertion THEN it is wrapped so JavaScript accepts it', () => {
		expect(rust(String.raw`\b+a`).test('a')).toBe(true);
		expect(rust('(?:^)*a').test('a')).toBe(true);
		expect(rust('a**').test('aaa')).toBe(true);
	});
});

describe('character classes', () => {
	test('GIVEN ranges, negation and escapes THEN they match as in Rust', () => {
		expect(rust('^[a-c1-3_]+$').test('ab2_c')).toBe(true);
		expect(rust('^[^a-c]$').test('d')).toBe(true);
		expect(rust('^[^a-c]$').test('b')).toBe(false);
		expect(rust(String.raw`^[\d\s.\-]+$`).test('1 2.3-4')).toBe(true);
		expect(rust(String.raw`^[\x41-\x43\u{1F600}]+$`).test('AB😀')).toBe(true);
	});

	test('GIVEN a leading ] or - THEN it is a literal', () => {
		expect(rust('^[]a]+$').test('a]a')).toBe(true);
		expect(rust('^[^]a]$').test(']')).toBe(false);
		expect(rust('^[-a]+$').test('-a')).toBe(true);
		expect(rust('^[a-]+$').test('a-')).toBe(true);
	});

	test('GIVEN punctuation that the v flag reserves THEN it still matches literally', () => {
		// `&&`, `--` and `~~` are operators in Rust, but every other doubled punctuator is plain text there.
		expect(rust('^[!!##%%,,::;;<<==>>@@``\\&\\~]+$').test('!#%,:;<=>@`&~')).toBe(true);
		expect(rust(String.raw`^[(){}|/$*+.?^\[\]\\]+$`).test('(){}|/$*+.?^[]\\')).toBe(true);
	});

	test('GIVEN \\w and \\W inside a class THEN they keep their Unicode meaning', () => {
		expect(rust(String.raw`^[\w-]+$`).test('é-1')).toBe(true);
		expect(rust(String.raw`^[\W]+$`).test('é')).toBe(false);
		expect(rust(String.raw`^[^\W\d]+$`).test('é1')).toBe(false);
	});

	test('GIVEN ASCII classes THEN they match only ASCII', () => {
		expect(rust('^[[:alpha:]]+$').test('abcXYZ')).toBe(true);
		expect(rust('^[[:alpha:]]+$').test('é')).toBe(false);
		expect(rust('^[[:^alpha:]]+$').test('12')).toBe(true);
		expect(rust('^[[:digit:][:upper:]]+$').test('1A')).toBe(true);
		expect(rust('^[[:punct:]]+$').test('!-~')).toBe(true);
		expect(rust('^[[:xdigit:]]+$').test('09afAF')).toBe(true);
		expect(rust('^[[:word:]]+$').test('a_1')).toBe(true);
	});

	test('GIVEN class set operations THEN intersection, difference and symmetric difference work', () => {
		const consonant = rust('^[a-z&&[^aeiou]]$');
		expect(consonant.test('b')).toBe(true);
		expect(consonant.test('e')).toBe(false);

		const diff = rust('^[a-z--[aeiou]]$');
		expect(diff.test('b')).toBe(true);
		expect(diff.test('a')).toBe(false);

		const intersection = rust('^[\\p{L}&&\\p{Greek}]$');
		expect(intersection.test('α')).toBe(true);
		expect(intersection.test('a')).toBe(false);

		const symmetric = rust('^[a-c~~b-d]$');
		expect(symmetric.test('a')).toBe(true);
		expect(symmetric.test('d')).toBe(true);
		expect(symmetric.test('b')).toBe(false);

		const chained = rust('^[a-z--[aeiou]--[xyz]]$');
		expect(chained.test('b')).toBe(true);
		expect(chained.test('x')).toBe(false);
	});

	test('GIVEN nested classes THEN they are a union', () => {
		expect(rust('^[a[0-9][xyz]]+$').test('a1y')).toBe(true);
		expect(rust('^[^a[0-9]]$').test('5')).toBe(false);
	});

	test('GIVEN (?i) and a class THEN case folding applies to the class', () => {
		expect(rust('(?i)^[a-c]+$').test('ABc')).toBe(true);
		expect(rust('(?i)^[^a-c]$').test('B')).toBe(false);
	});
});

describe('real-world patterns', () => {
	test('GIVEN a Discord AutoMod style pattern THEN it matches as the Rust one would', () => {
		const regex = rust(String.raw`(?i)\b(?:free\s+nitro|discord\.gift/\w+)\b`);
		expect(regex.test('Get FREE   Nitro now')).toBe(true);
		expect(regex.test('see discord.gift/abc123')).toBe(true);
		expect(regex.test('freenitro')).toBe(false);
		expect(regex.test('discordxgift/abc')).toBe(false);
	});

	test('GIVEN an invite link pattern THEN it extracts the code', () => {
		const regex = rust(String.raw`(?:discord\.gg|discord(?:app)?\.com/invite)/(?P<code>[\w-]+)`);
		expect(regex.exec('join discord.gg/wolfstar-1 now')?.groups?.code).toBe('wolfstar-1');
	});
});

describe('errors', () => {
	test.each([
		['(?=a)a', 'unsupported_lookaround'],
		['(?!a)', 'unsupported_lookaround'],
		['(?<=a)b', 'unsupported_lookaround'],
		['(?<!a)b', 'unsupported_lookaround'],
		[String.raw`(a)\1`, 'unsupported_backreference'],
		[String.raw`\8`, 'unsupported_backreference'],
		[String.raw`(?P<n>a)\k<n>`, 'unsupported_backreference'],
		['(?P<n>a)(?P=n)', 'unsupported_backreference'],
		['(?>a)', 'unsupported_feature'],
		[String.raw`\<a\>`, 'unsupported_feature'],
		[String.raw`\b{start}a`, 'unsupported_feature'],
		['(?-u)a', 'unsupported_feature'],
		['(?R)a', 'unsupported_feature'],
		[String.raw`\p{Age=1.1}`, 'unsupported_feature'],
		['(?P<a.b>x)', 'unsupported_feature'],
		['(?P<é.b>x)', 'unsupported_feature'],
		['[a' + '~~b'.repeat(30) + ']', 'unsupported_feature']
	] as const)('GIVEN %s THEN it fails with %s', (pattern, code) => {
		const error = failure(pattern);
		expect(error).toBeInstanceOf(SyntaxError);
		expect(error.code).toBe(code);
		expect(error.pattern).toBe(pattern);
	});

	test.each([
		'(',
		'a)',
		'[a',
		'[]',
		'*a',
		'a|*',
		'+',
		'?',
		'{2}',
		'a{',
		'a{x}',
		'a{2,1}',
		'a{,3}',
		'[b-a]',
		'[a&&]',
		'[&&a]',
		'[[:nope:]]',
		String.raw`\q`,
		String.raw`\0`,
		String.raw`\x4`,
		String.raw`\x{110000}`,
		String.raw`\u{D800}`,
		'a\\',
		'(?)',
		'(?i',
		'(?i-)',
		'(?--i)',
		'(?ii)a',
		'(?q)a',
		'(?P<>a)',
		'(?P<n>a)(?P<n>b)',
		'(?P<1a>a)',
		String.raw`\pX`,
		String.raw`\p{`,
		'(?i)*',
		'(?x) #comment\n *',
		'\\'
	])('GIVEN %j THEN it is rejected as invalid syntax', (pattern) => {
		expect(failure(pattern).code).toBe('invalid_syntax');
	});

	test('GIVEN an error THEN it says where the problem is', () => {
		const error = failure('ab(?=c)');
		expect(error.position).toBe(2);
		expect(error.message).toContain('lookahead');
	});

	test('GIVEN a pattern nested deeper than Rust allows THEN it fails instead of overflowing the stack', () => {
		expect(failure('('.repeat(300) + ')'.repeat(300)).message).toContain('nest limit');
	});

	test('GIVEN an unknown script THEN JavaScript rejects it and the error says so', () => {
		const error = failure(String.raw`\p{NotAScript}`);
		expect(error.code).toBe('invalid_output');
		expect(error.position).toBeUndefined();
		expect(() => transpile(String.raw`\p{NotAScript}`, { validate: false })).not.toThrow();
	});
});

describe('toRegExp', () => {
	test('GIVEN extraFlags THEN they are added to the ones the pattern needs', () => {
		const regex = toRegExp('(?i)a', { extraFlags: 'g' });
		expect(regex.flags).toBe('giv');
		expect('aAa'.match(regex)).toHaveLength(3);
	});

	test.each(['i', 'm', 's', 'u', 'v', 'z', 'gg'])(
		'GIVEN the extraFlags %j THEN it is refused as an invalid option, not as bad output',
		(extraFlags) => {
			expect(() => toRegExp('(?i)a', { extraFlags })).toThrow(expect.objectContaining({ code: 'invalid_option', position: undefined }));
		}
	);
});

describe('options', () => {
	test('GIVEN an unknown Rust flag THEN the error names the flag and the pattern, with no position', () => {
		try {
			transpile('abc', { flags: 'z' });
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(RustRegexError);
			expect(error).toMatchObject({ code: 'invalid_option', pattern: 'abc', position: undefined });
			expect((error as RustRegexError).message).toContain('"z"');
			expect((error as RustRegexError).message).not.toContain('at index');
		}
	});
});
