<div align="center">
  <picture>
    <img src="https://cdn.wolfstar.rocks/assets/stars-components/wordmark.webp" alt="Stars Components" width="440" />
  </picture>

# @wolfstar/rust-regex

**Write regular expressions the way Discord reads them, and test them in JavaScript.**

[![version](https://npmx.dev/api/registry/badge/version/@wolfstar/rust-regex)](https://npmx.dev/package/@wolfstar/rust-regex)
[![downloads](https://npmx.dev/api/registry/badge/downloads/@wolfstar/rust-regex)](https://npmx.dev/package/@wolfstar/rust-regex)
[![license](https://img.shields.io/github/license/wolfstar-project/stars-components?style=flat-square&color=informational)](https://github.com/wolfstar-project/stars-components/blob/main/LICENSE)

</div>

## Description

Discord evaluates regular expressions, for example in AutoMod keyword filters, with the [Rust `regex` crate](https://docs.rs/regex). Its syntax is close to JavaScript's but not the same: there are no lookarounds or backreferences, `\d`, `\w` and `\b` are Unicode-aware, flags are inline, and character classes have set operations.

`@wolfstar/rust-regex` parses a Rust pattern and writes out the source and flags of a JavaScript `RegExp` that matches the same text. It has no dependencies.

## Features

- Parses the Rust syntax, so a pattern Rust rejects (a lookahead, a backreference, an unbalanced group) is rejected here too, with the position of the problem
- Unicode `\d`, `\w`, `\s` and `\b`, and `\p{...}` classes with Rust's loose names (`\p{Greek}`, `\p{uppercase_letter}`)
- Inline flags `(?i)`, `(?s)`, `(?m)`, `(?U)` and `(?x)`, global or scoped to a group
- Class set operations (`[a-z&&[^aeiou]]`, `[\p{L}--[a-z]]`, `[a-c~~b-d]`) and ASCII classes (`[[:alpha:]]`)
- Named groups in both Rust spellings, `(?P<name>...)` and `(?<name>...)`
- ESM only

## Usage

```typescript
import { RustRegexError, toRegExp, transpile } from '@wolfstar/rust-regex';

// A ready to use RegExp
const regex = toRegExp(String.raw`(?i)\b(?:free\s+nitro|discord\.gift/\w+)\b`);
regex.test('Get FREE Nitro now'); // true

// Or the pieces, to store or log
transpile(String.raw`(?P<year>\d{4})-(?P<month>\d{2})`);
// { source: '(?<year>\\p{Nd}{4})-(?<month>\\p{Nd}{2})', flags: 'v', usesModifiers: false }

try {
	toRegExp('(?=lookahead)');
} catch (error) {
	if (error instanceof RustRegexError) {
		console.log(error.code); // 'unsupported_lookaround'
		console.log(error.position); // 0
	}
}
```

The result always uses the [`v` flag](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicodeSets) (Node.js 20 or newer), plus `i` when the pattern is case-insensitive. Add flags such as `g` with the `extraFlags` option of `toRegExp`.

### Options

| Option       | Applies to              | Description                                                                                         |
| ------------ | ----------------------- | --------------------------------------------------------------------------------------------------- |
| `flags`      | `transpile`, `toRegExp` | Rust flags the pattern starts with, as if it began with `(?flags)`: any of `i`, `m`, `s`, `x`, `U`. |
| `validate`   | `transpile`             | Compile the result to prove JavaScript accepts it. On by default.                                   |
| `extraFlags` | `toRegExp`              | JavaScript flags added to the ones the pattern needs, for example `g`.                              |

### Errors

Every failure is a `RustRegexError`, a `SyntaxError` with a `code`, the `pattern` and the `position` of the problem:

| `code`                      | Meaning                                                                                                        |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `invalid_syntax`            | Rust would reject the pattern as well.                                                                         |
| `unsupported_lookaround`    | Lookahead or lookbehind. Rust does not have them, so Discord rejects the pattern.                              |
| `unsupported_backreference` | `\1`, `\k<name>` or `(?P=name)`. Rust does not have them either.                                               |
| `unsupported_feature`       | Valid Rust that cannot be written as a JavaScript `RegExp`, see below.                                         |
| `invalid_output`            | The pattern is fine, but the JavaScript engine refuses the result, for example an unknown Unicode script name. |

## What is not supported

- `(?-u)` (ASCII and byte mode), `(?R)` (CRLF mode), the `\b{start}` family and `\<`, `\>`
- Unicode properties other than general category, script, script extensions and the binary ones
- Capture group names with `.`, `[` or `]`, which Rust allows and JavaScript does not

## Known differences from Rust

The transpiler is meant to preview and test patterns, not to replace Discord as the source of truth. Differential tests against the real crate over thousands of generated patterns found these differences, all in corners most patterns never reach:

- **Case-insensitive scoping needs ES2025.** `(?i)` at the start of the pattern becomes the `i` flag, which works everywhere. `(?i:...)`, `(?-i)` or a flag group in the middle becomes a regular expression modifier, and `transpile` reports `usesModifiers`. Modifiers need Node.js 23 or newer, and Node.js 24 has an engine bug that lets a modifier group leak into the rest of the pattern in some cases. It was not reproduced on a newer V8.
- **Groups that can match nothing, repeated.** For a pattern such as `(a?|b){1,2}`, JavaScript and Rust disagree about whether an empty iteration counts, so the overall match can differ in length.
- **Zero-width matches next to emoji.** V8 can report an empty match in the middle of a surrogate pair, for example `\B` on `x😀y`, where Rust only matches between characters.
- **Escaped letters in `\p{...}`.** Script names are title-cased (`olditalic` stays `Olditalic`), because there is no table of script names. `transpile` fails with `invalid_output` for a spelling JavaScript does not know.

## Contributing

Please make sure to read the [Contributing Guide][contributing] before making a pull request.

[contributing]: https://github.com/wolfstar-project/stars-components/blob/main/.github/CONTRIBUTING.md
