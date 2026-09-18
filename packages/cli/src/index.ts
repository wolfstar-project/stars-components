export { runMain } from './run.js';
export { CliError, ExitCode, exitCodeOf, formatError } from './utils/errors.js';
export type { CliErrorOptions } from './utils/errors.js';
export { ConfigError, loadStarsConfig } from '@wolfstar/http-framework/config';
export type { ConfigErrorOptions, ResolvedStarsConfig } from '@wolfstar/http-framework/config';
export { isCIEnvironment, prefersReducedMotion, resolveOutputMode, shouldUseColor } from './utils/output-mode.js';
export type { OutputMode, ResolveOutputModeOptions } from './utils/output-mode.js';
export { THEME_SETTINGS, THEMES, resolveTheme, resolveThemeSetting } from './utils/theme.js';
export type { Theme, ThemeName, ThemeSetting, ThemeToken } from './utils/theme.js';
