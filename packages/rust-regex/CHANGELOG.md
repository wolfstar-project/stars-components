# @wolfstar/rust-regex

## 0.1.0

### Minor Changes

- [#394](https://github.com/wolfstar-project/stars-components/pull/394) [`a78e6cd`](https://github.com/wolfstar-project/stars-components/commit/a78e6cd18e2d77729ed892b0970823612ef02908) - Add `@wolfstar/rust-regex`, which transpiles regular expressions written for the Rust `regex` crate, the flavour Discord uses for AutoMod, into the source and flags of an equivalent JavaScript `RegExp`. Patterns Rust would reject, and the ones JavaScript cannot express, fail with a typed `RustRegexError`. Thanks [@RedStar071](https://github.com/RedStar071)!
