---
'@wolfstar/http-framework': patch
---

fix(http-framework): annotate the return type of `Command#registry`, which newer TypeScript builds reported as an implicit `any` (TS7023)
