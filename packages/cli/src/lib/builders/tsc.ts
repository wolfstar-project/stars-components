import { spawn, type ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import type { ResolvedStarsConfig } from '@wolfstar/http-framework/config';
import { CliError } from '../errors.js';
import { createLineSplitter } from '../process-supervisor.js';
import { resolveBinary } from '../project.js';
import type { Builder, BuilderEvents, BuildOutcome } from './types.js';

const INSTALL_HINT = "Install it with `pnpm add -D typescript`, or set `build.tool` to 'tsdown' or 'none'.";
const WATCH_START = /Starting (incremental )?compilation/;
const WATCH_DONE = /Found (\d+) errors?\. Watching for file changes/;
const ERROR_LINE = /error TS\d+:/;

/**
 * Builds through the project's `tsc -b`, parsing its output to report progress.
 */
export class TscBuilder extends EventEmitter<BuilderEvents> implements Builder {
	public readonly tool = 'tsc' as const;
	#child: ChildProcess | null = null;
	#startedAt = 0;
	#firstError: string | null = null;

	public constructor(private readonly config: ResolvedStarsConfig) {
		super();
	}

	public build(): Promise<BuildOutcome> {
		const child = this.#spawn([]);
		this.#begin();

		return new Promise((resolve) => {
			child.once('exit', (code) => {
				this.#child = null;
				resolve(this.#finish(code === 0 ? null : (this.#firstError ?? `tsc exited with code ${code}`)));
			});
		});
	}

	public watch(): Promise<void> {
		this.#spawn(['--watch', '--preserveWatchOutput']);
		this.#begin();
		return Promise.resolve();
	}

	public close(): Promise<void> {
		const child = this.#child;
		this.#child = null;
		if (!child || child.exitCode !== null) return Promise.resolve();

		return new Promise((resolve) => {
			child.once('exit', () => resolve());
			child.kill();
		});
	}

	#spawn(extraArgs: string[]): ChildProcess {
		const tsc = resolveTscBinary(this.config.root);
		if (!tsc) throw new CliError(`"typescript" is not installed in ${this.config.root}`, { code: 'DEPENDENCY_MISSING', hint: INSTALL_HINT });

		const child = spawn(process.execPath, [tsc, '-b', this.config.build.tsconfig!, '--pretty', 'false', ...extraArgs], {
			cwd: this.config.root,
			env: process.env,
			stdio: ['ignore', 'pipe', 'pipe'],
			windowsHide: true
		});
		this.#child = child;

		const handleLine = (line: string) => this.#handleLine(line);
		const stdout = createLineSplitter(handleLine);
		const stderr = createLineSplitter(handleLine);
		child.stdout?.on('data', stdout.push);
		child.stderr?.on('data', stderr.push);
		child.once('exit', () => {
			stdout.flush();
			stderr.flush();
		});
		child.once('error', (error) => this.emit('log', 'error', error.message));

		return child;
	}

	#handleLine(line: string): void {
		const text = line.trim();
		if (text.length === 0) return;

		if (WATCH_START.test(text)) {
			if (this.#startedAt === 0) this.#begin();
			return;
		}

		if (ERROR_LINE.test(text)) {
			this.#firstError ??= text;
			this.emit('log', 'error', text);
			return;
		}

		const done = WATCH_DONE.exec(text);
		if (done) {
			const errors = Number(done[1]);
			this.emit('log', errors === 0 ? 'success' : 'error', text);
			this.#finish(errors === 0 ? null : (this.#firstError ?? text));
			return;
		}

		this.emit('log', 'info', text);
	}

	#begin(): void {
		this.#firstError = null;
		this.#startedAt = performance.now();
		this.emit('start');
	}

	#finish(message: string | null): BuildOutcome {
		const outcome: BuildOutcome = { ok: message === null, durationMs: Math.round(performance.now() - this.#startedAt), message };
		this.#startedAt = 0;
		this.emit(outcome.ok ? 'success' : 'failure', outcome);
		return outcome;
	}
}

/**
 * Locates the `tsc` script of the project's TypeScript through its `package.json#bin`, which works for both the
 * classic `lib/tsc.js` layout (TypeScript ≤ 6) and the native `bin/tsc` launcher (TypeScript 7, whose `exports` map
 * hides `lib/`).
 */
export function resolveTscBinary(root: string): string | null {
	return resolveBinary(root, 'typescript', 'tsc');
}
