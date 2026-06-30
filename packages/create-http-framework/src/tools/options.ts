export const PACKAGE_MANAGERS = ['npm', 'yarn', 'pnpm', 'bun'] as const;

export const LANGUAGES = ['ts', 'js'] as const;
export type Language = (typeof LANGUAGES)[number];

export const BUILD_TOOLS = ['tsc6', 'tsc7', 'tsdown'] as const;
export type BuildTool = (typeof BUILD_TOOLS)[number];

export const LINTERS = ['none', 'eslint', 'oxlint'] as const;
export type Linter = (typeof LINTERS)[number];

export const FORMATTERS = ['none', 'prettier', 'oxfmt'] as const;
export type Formatter = (typeof FORMATTERS)[number];

/**
 * TypeScript 7.0 (the native compiler) ships under the main `typescript` package on the `rc`
 * dist-tag. We pin it exactly because it is a prerelease (the old separate `@typescript/native-preview`
 * package only has dev builds).
 */
export const TYPESCRIPT_RC_VERSION = '7.0.1-rc';
