import type { ResolvedStarsConfig, StarsTypechecker } from '@wolfstar/http-framework/config';
import { spawn, type ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { resolveTscBinary } from './builders/tsc.js';
import { CliError } from './errors.js';
import type { LogLevel } from './log-buffer.js';
import { createLineSplitter } from './process-supervisor.js';
import { resolveBinary } from './project.js';

const WATCH_START = /Starting (incremental )?compilation/;
const WATCH_DONE = /Found (\d+) errors?\. Watching for file changes/;
const ONE_SHOT_DONE = /Found (\d+) errors?/;
const ERROR_LINE = /error TS\d+:/;

export type TypecheckState = 'idle' | 'checking' | 'ok' | 'failed';

export interface TypecheckerEvents {
	log: [level: LogLevel, text: string];
	state: [state: TypecheckState, errors: number];
}

export interface TypecheckCommand {
	/** The executable, and whether it is a script `node` has to run. */
	readonly command: string;
	readonly args: readonly string[];
	readonly node: boolean;
	/** Whether the checker watches the project itself, or has to be re-run after every build. */
	readonly watch: boolean;
}

/**
 * Runs a type checker next to the bot and reports type errors on their own channel, without ever blocking builds or
 * restarts: `stars dev` keeps running whatever the build tool produced, the way Seedcord's `hmr.typecheck` and
 * Vite's `checker` plugin do.
 *
 * `tsc` and `golar` (which forwards to TypeScript) watch the project themselves; `tsz` has no watch mode, so
 * {@link Typechecker.check} re-runs it after every build instead.
 */
export class Typechecker extends EventEmitter<TypecheckerEvents> {
	#child: ChildProcess | null = null;
	#state: TypecheckState = 'idle';
	#errors = 0;
	#pending = false;

	public constructor(private readonly config: ResolvedStarsConfig) {
		super();
	}

	public get state(): TypecheckState {
		return this.#state;
	}

	public get errors(): number {
		return this.#errors;
	}

	/** Whether the checker re-runs per build instead of watching on its own. */
	public get oneShot(): boolean {
		return this.config.dev.typecheck.enabled && !resolveTypecheckCommand(this.config).watch;
	}

	public start(): void {
		if (!this.config.dev.typecheck.enabled) return;
		this.#run();
	}

	/**
	 * Re-runs a checker that cannot watch. Called after every successful build; a run already in flight is replaced,
	 * so a fast series of builds only leaves the last check standing.
	 */
	public check(): void {
		if (!this.oneShot) return;
		if (this.#child) {
			this.#pending = true;
			this.#child.kill();
			return;
		}

		this.#run();
	}

	public close(): Promise<void> {
		const child = this.#child;
		this.#child = null;
		this.#pending = false;
		if (!child || child.exitCode !== null) return Promise.resolve();

		return new Promise((resolve) => {
			child.once('exit', () => resolve());
			child.kill();
		});
	}

	#run(): void {
		const { command, args, node, watch } = resolveTypecheckCommand(this.config);
		const child = spawn(node ? process.execPath : command, node ? [command, ...args] : [...args], {
			cwd: this.config.root,
			env: process.env,
			stdio: ['ignore', 'pipe', 'pipe'],
			windowsHide: true
		});
		this.#child = child;
		this.#setState('checking', 0);

		let errors = 0;
		const handleLine = (line: string) => {
			if (ERROR_LINE.test(line)) errors++;
			this.#handleLine(line);
		};

		const stdout = createLineSplitter(handleLine);
		const stderr = createLineSplitter(handleLine);
		child.stdout?.on('data', stdout.push);
		child.stderr?.on('data', stderr.push);

		child.once('exit', (code) => {
			stdout.flush();
			stderr.flush();
			this.#child = null;

			if (!watch && this.#state === 'checking') {
				// A one-shot checker only reports through its exit code when it prints no summary line.
				this.#setState(code === 0 && errors === 0 ? 'ok' : 'failed', errors);
			}

			if (this.#pending) {
				this.#pending = false;
				this.#run();
			}
		});
		child.once('error', (error: NodeJS.ErrnoException) => {
			this.#child = null;
			this.emit('log', 'error', error.code === 'ENOENT' ? `${command} is not installed` : error.message);
			this.#setState('failed', this.#errors);
		});
	}

	#handleLine(line: string): void {
		const text = line.trim();
		if (text.length === 0) return;

		if (WATCH_START.test(text)) {
			this.#setState('checking', 0);
			return;
		}

		if (ERROR_LINE.test(text)) {
			this.emit('log', 'error', text);
			return;
		}

		const done = WATCH_DONE.exec(text) ?? ONE_SHOT_DONE.exec(text);
		if (done) {
			const errors = Number(done[1]);
			this.#setState(errors === 0 ? 'ok' : 'failed', errors);
			this.emit('log', errors === 0 ? 'success' : 'error', errors === 0 ? 'No type errors' : `${errors} type error${errors === 1 ? '' : 's'}`);
			return;
		}

		this.emit('log', 'info', text);
	}

	#setState(state: TypecheckState, errors: number): void {
		this.#state = state;
		this.#errors = errors;
		this.emit('state', state, errors);
	}
}

/**
 * Builds the command line of the configured type checker, resolved from the project's own `node_modules`.
 *
 * @throws {CliError} when the checker is not installed in the project.
 */
export function resolveTypecheckCommand(config: ResolvedStarsConfig): TypecheckCommand {
	const { checker, tsconfig } = config.dev.typecheck;
	const project = tsconfig!;

	switch (checker) {
		case 'golar': {
			// `golar tsc` forwards everything after it to the TypeScript CLI, watch mode included.
			const golar = resolveBinary(config.root, 'golar', 'golar');
			if (!golar) throw missing(config, 'golar', 'Install it with `pnpm add -D golar`');

			return { command: golar, args: ['tsc', ...WATCH_ARGS, '-p', project], node: true, watch: true };
		}

		case 'tsz': {
			// `tsz` is an early, tsc-compatible checker with no watch mode; `try-tsz` is its comparison harness.
			const tsz = resolveBinary(config.root, '@mohsen-azimi/tsz-dev', 'tsz');
			if (tsz) return { command: tsz, args: ['--noEmit', '-p', project], node: true, watch: false };

			const tryTsz = resolveBinary(config.root, 'try-tsz', 'try-tsz');
			if (tryTsz) return { command: tryTsz, args: ['-p', project], node: true, watch: false };

			throw missing(config, 'tsz', 'Install it with `pnpm add -D @mohsen-azimi/tsz-dev` (or `try-tsz`)');
		}

		default: {
			const tsc = resolveTscBinary(config.root);
			if (!tsc) throw missing(config, 'typescript', 'Install it with `pnpm add -D typescript`');

			return { command: tsc, args: [...WATCH_ARGS, '-p', project], node: true, watch: true };
		}
	}
}

const WATCH_ARGS = ['--noEmit', '--watch', '--preserveWatchOutput', '--pretty', 'false'] as const;

function missing(config: ResolvedStarsConfig, name: string, install: string): CliError {
	return new CliError(`"${name}" is not installed in ${config.root}`, {
		code: 'DEPENDENCY_MISSING',
		hint: `${install}, pick another \`dev.typecheck.checker\`, or set \`dev.typecheck\` to false.`
	});
}

export type { StarsTypechecker };
