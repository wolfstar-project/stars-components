export { CliError, ExitCode, exitCodeOf, formatError } from './lib/errors.js';
export type { CliErrorOptions } from './lib/errors.js';
export { ConfigError, loadStarsConfig } from '@wolfstar/http-framework/config';
export type { ConfigErrorOptions, ResolvedStarsConfig } from '@wolfstar/http-framework/config';
export { isCIEnvironment, prefersReducedMotion, resolveOutputMode, shouldUseColor } from './lib/output-mode.js';
export type { OutputMode, ResolveOutputModeOptions } from './lib/output-mode.js';
