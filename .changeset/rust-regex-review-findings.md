---
'@wolfstar/rust-regex': patch
---

Ignore `#` comments inside character classes and counted repetitions under `(?x)`, as the Rust `regex` crate does. Reject a chain of repetitions or class operations deeper than the nest limit with a `RustRegexError` instead of a native `RangeError`.
