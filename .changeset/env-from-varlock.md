---
'@wolfstar/env-utilities': minor
---

feat(env-utilities): add `EnvFromVarlock` to derive `Env` from varlock's generated `CoercedEnvSchema`, exported from the package root and from the new `@wolfstar/env-utilities/varlock` subpath. The README now also states that `envParseArray` needs `ArrayString` keys, not plain `string`.
