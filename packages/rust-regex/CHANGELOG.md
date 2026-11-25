# @wolfstar/rust-regex

## 0.1.1

### Patch Changes

- [#395](https://github.com/wolfstar-project/stars-components/pull/395) [`e681815`](https://github.com/wolfstar-project/stars-components/commit/e68181581d96975d6e657c454a294b59bdf225fd) - Ignore `#` comments inside character classes and counted repetitions under `(?x)`, as the Rust `regex` crate does. Reject a chain of repetitions or class operations deeper than the nest limit with a `RustRegexError` instead of a native `RangeError`. Thanks [@RedStar071](https://github.com/RedStar071)!

## 0.1.0

### Minor Changes

- [#394](https://github.com/wolfstar-project/stars-components/pull/394) [`a78e6cd`](https://github.com/wolfstar-project/stars-components/commit/a78e6cd18e2d77729ed892b0970823612ef02908) - Add `@wolfstar/rust-regex`, which transpiles regular expressions written for the Rust `regex` crate, the flavour Discord uses for AutoMod, into the source and flags of an equivalent JavaScript `RegExp`. Patterns Rust would reject, and the ones JavaScript cannot express, fail with a typed `RustRegexError`. Thanks [@RedStar071](https://github.com/RedStar071)!
