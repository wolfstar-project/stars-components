export type OutputMode = 'tui' | 'plain';

export interface ResolveOutputModeOptions {
	/** `--no-tui` (`tui: false`) or `--tui` (`tui: true`) from the command line. */
	tui?: boolean;
	env?: NodeJS.ProcessEnv;
	/** Whether stdout is an interactive terminal. */
	isTTY?: boolean;
	/** Raw-key input requires a terminal too, even when the output is a TTY. */
	isInputTTY?: boolean;
	columns?: number;
	rows?: number;
	/** Whether the process runs in a CI environment. */
	isCI?: boolean;
}

const truthy = new Set(['1', 'true', 'yes', 'on']);

/**
 * Decides between the interactive TUI and plain line output.
 *
 * Precedence: `--no-tui` › `STARS_TUI=plain` › non-interactive stdout, CI or `TERM=dumb`.
 */
export function resolveOutputMode(options: ResolveOutputModeOptions = {}): OutputMode {
	const env = options.env ?? process.env;
	const isTTY = options.isTTY ?? Boolean(process.stdout.isTTY);
	const isInputTTY = options.isInputTTY ?? options.isTTY ?? Boolean(process.stdin.isTTY);
	const isCI = options.isCI ?? isCIEnvironment(env);

	if (options.tui === false) return 'plain';

	const forced = env.STARS_TUI?.trim().toLowerCase();
	if (forced === 'plain' || forced === '0' || forced === 'false' || forced === 'off') return 'plain';
	if (!isTTY || !isInputTTY || env.TERM === 'dumb') return 'plain';
	if (forced === 'tui' || (forced && truthy.has(forced))) return isTTY ? 'tui' : 'plain';

	if (options.tui === true) return isTTY ? 'tui' : 'plain';
	if (isCI || (options.columns ?? process.stdout.columns ?? 80) < 40 || (options.rows ?? process.stdout.rows ?? 24) < 10) return 'plain';
	return 'tui';
}

export function isCIEnvironment(env: NodeJS.ProcessEnv = process.env): boolean {
	return (
		Boolean(env.CI && !['false', '0'].includes(env.CI.toLowerCase())) ||
		Boolean(env.GITHUB_ACTIONS || env.GITLAB_CI || env.BUILDKITE || env.CIRCLECI)
	);
}

/**
 * Whether colours should be emitted, honouring `NO_COLOR` and `FORCE_COLOR`.
 */
export function shouldUseColor(env: NodeJS.ProcessEnv = process.env, isTTY = Boolean(process.stdout.isTTY)): boolean {
	if (env.NO_COLOR !== undefined && env.NO_COLOR !== '') return false;
	if (env.FORCE_COLOR !== undefined) return env.FORCE_COLOR !== '0';
	return isTTY && env.TERM !== 'dumb';
}

/**
 * Whether animations (spinners, blinking status) should be avoided.
 */
export function prefersReducedMotion(env: NodeJS.ProcessEnv = process.env): boolean {
	const value = env.STARS_REDUCED_MOTION ?? env.REDUCED_MOTION;
	return value !== undefined && value !== '' && value !== '0' && value.toLowerCase() !== 'false';
}
