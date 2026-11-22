---
'@wolfstar/rust-regex': minor
---

Add `@wolfstar/rust-regex`, which transpiles regular expressions written for the Rust `regex` crate, the flavour Discord uses for AutoMod, into the source and flags of an equivalent JavaScript `RegExp`. Patterns Rust would reject, and the ones JavaScript cannot express, fail with a typed `RustRegexError`.
