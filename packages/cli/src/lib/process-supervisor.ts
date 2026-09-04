import { spawn, type ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';

export type ProcessState = 'idle' | 'starting' | 'running' | 'stopping' | 'stopped' | 'crashed';

export interface ProcessExit {
	code: number | null;
	signal: NodeJS.Signals | null;
	/** Whether the exit was requested through {@link ProcessSupervisor.stop}. */
	requested: boolean;
}

export interface ProcessSupervisorOptions {
	command: string;
	args: readonly string[];
	cwd: string;
	env: NodeJS.ProcessEnv;
	/** Milliseconds to wait after `SIGTERM` before sending `SIGKILL`. */
	killTimeout: number;
}

export interface ProcessSupervisorEvents {
	state: [state: ProcessState];
	stdout: [line: string];
	stderr: [line: string];
	exit: [exit: ProcessExit];
	error: [error: Error];
}

/**
 * Owns a single child process: starts it, streams its output line by line and stops it gracefully.
 */
export class ProcessSupervisor extends EventEmitter<ProcessSupervisorEvents> {
	#child: ChildProcess | null = null;
	#state: ProcessState = 'idle';
	#startedAt: number | null = null;
	#stopping: Promise<void> | null = null;

	public constructor(private readonly options: ProcessSupervisorOptions) {
		super();
	}

	public get state(): ProcessState {
		return this.#state;
	}

	public get pid(): number | null {
		return this.#child?.pid ?? null;
	}

	public get startedAt(): number | null {
		return this.#startedAt;
	}

	public get running(): boolean {
		return this.#state === 'starting' || this.#state === 'running';
	}

	public start(): void {
		if (this.#child) throw new Error('The process is already running, call stop() or restart() first.');

		const { command, args, cwd, env } = this.options;
		this.#setState('starting');

		const child = spawn(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
		this.#child = child;
		this.#startedAt = Date.now();

		let requested = false;
		const stdout = createLineSplitter((line) => this.emit('stdout', line));
		const stderr = createLineSplitter((line) => this.emit('stderr', line));
		child.stdout?.on('data', stdout.push);
		child.stderr?.on('data', stderr.push);

		child.once('spawn', () => {
			if (this.#child === child) this.#setState('running');
		});

		child.once('error', (error) => {
			this.emit('error', error);
		});

		child.once('exit', (code, signal) => {
			stdout.flush();
			stderr.flush();
			requested = this.#state === 'stopping';
			this.#child = null;
			this.#startedAt = null;
			this.#setState(requested || code === 0 ? 'stopped' : 'crashed');
			this.emit('exit', { code, signal, requested });
		});
	}

	/**
	 * Sends `SIGTERM`, escalates to `SIGKILL` after `killTimeout` and resolves once the process exited.
	 */
	public stop(): Promise<void> {
		const child = this.#child;
		if (!child) return Promise.resolve();
		if (this.#stopping) return this.#stopping;

		this.#setState('stopping');
		this.#stopping = new Promise<void>((resolve) => {
			const timer = setTimeout(() => {
				if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
			}, this.options.killTimeout);
			timer.unref();

			child.once('exit', () => {
				clearTimeout(timer);
				this.#stopping = null;
				resolve();
			});

			if (!child.kill('SIGTERM')) {
				clearTimeout(timer);
				this.#stopping = null;
				resolve();
			}
		});

		return this.#stopping;
	}

	public async restart(): Promise<void> {
		await this.stop();
		this.start();
	}

	#setState(state: ProcessState): void {
		if (this.#state === state) return;
		this.#state = state;
		this.emit('state', state);
	}
}

/**
 * Splits a byte stream into complete lines, keeping the trailing partial line until the next chunk.
 */
export function createLineSplitter(onLine: (line: string) => void) {
	let remainder = '';
	return {
		push(chunk: Buffer | string) {
			remainder += chunk.toString();
			const lines = remainder.split(/\r?\n/);
			remainder = lines.pop() ?? '';
			for (const line of lines) onLine(line);
		},
		flush() {
			if (remainder.length > 0) onLine(remainder);
			remainder = '';
		}
	};
}
