# `@wolfstar/http-framework-decorators`

Re-exports of the utility decorators shipped by [`@wolfstar/http-framework`](https://github.com/wolfstar-project/stars-components/tree/main/packages/http-framework), for projects that prefer importing them from a dedicated package.

Everything here lives in the framework itself — the framework's own `Register*` decorators are built on the same primitives, so keeping them in one package avoids a dependency cycle. This package adds no behaviour of its own: importing `ApplyOptions` from here and from `@wolfstar/http-framework` gives you the exact same function.

## Installation

```bash
npm install @wolfstar/http-framework-decorators
# or
pnpm add @wolfstar/http-framework-decorators
```

`@wolfstar/http-framework` is a peer dependency and must be installed alongside it.

The decorators are the legacy TypeScript ones, so `experimentalDecorators` must be enabled in your `tsconfig.json`:

```json
{
	"compilerOptions": {
		"experimentalDecorators": true
	}
}
```

## Usage

```typescript
import { ApplyOptions, RequiresGuildContext, RequiresUserPermissions } from '@wolfstar/http-framework-decorators';
```

See the [decorators section of the framework's README](https://github.com/wolfstar-project/stars-components/tree/main/packages/http-framework#utility-decorators) for the full documentation of each decorator and its semantics.

## Exports

| Export                                                                                       | Kind              | Description                                     |
| -------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------- |
| `ApplyOptions`                                                                               | Class             | Sets the options of a `Piece`                   |
| `RequiresGuildContext` / `RequiresDMContext`                                                 | Method            | Gates a method by interaction context           |
| `RequiresUserPermissions` / `RequiresClientPermissions`                                      | Method            | Checks `member.permissions` / `app_permissions` |
| `Enumerable` / `EnumerableMethod`                                                            | Property / Method | Controls property visibility                    |
| `createClassDecorator`, `createMethodDecorator`, `createProxy`, `createFunctionPrecondition` | Utility           | Primitives for building custom decorators       |
| `MissingPermissionsError`, `Identifiers`                                                     | Error             | Thrown by the permission decorators             |
| `resolvePermissions`, `getMissingPermissions`, `toPermissionNames`                           | Utility           | Permission bitfield helpers                     |
