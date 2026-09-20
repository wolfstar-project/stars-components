import { EventEmitter } from 'node:events';
import type { Builder, BuilderContext, BuilderEvents, BuildOutcome, ResolvedStarsConfig } from '@wolfstar/schema';
import { defaultBuilderContext } from './context.js';

export interface ServerHooks {
	beforeBuild?(config: ResolvedStarsConfig): void | Promise<void>;
	afterBuild?(outcome: BuildOutcome): void | Promise<void>;
	close?(): void | Promise<void>;
}

/** Shared lifecycle: coalesce concurrent builds, report failures and drain work before close. */
export abstract class ServerBuilder extends EventEmitter<BuilderEvents> implements Builder {
	public readonly tool = 'vite' as const;
	protected closed = false;
	protected active: Promise<BuildOutcome> | null = null;
	protected watching: Promise<void> | null = null;
	protected stopWatching: (() => Promise<void>) | null = null;
	#closing: Promise<void> | null = null;
	protected constructor(
		protected readonly config: ResolvedStarsConfig,
		protected readonly context: BuilderContext = defaultBuilderContext,
		protected readonly hooks: ServerHooks = {}
	) {
		super();
	}
	public build(): Promise<BuildOutcome> {
		if (this.closed) return Promise.reject(new Error('The server builder is closed. Create a new builder to restart.'));
		if (this.active) return this.active;
		this.active = this.runBuild().finally(() => {
			this.active = null;
		});
		return this.active;
	}
	private async runBuild(): Promise<BuildOutcome> {
		const started = performance.now();
		this.emit('start');
		let message: string | null = null;
		try {
			await this.hooks.beforeBuild?.(this.config);
			await this.compile();
		} catch (error) {
			message = error instanceof Error ? error.message : String(error);
		}
		const outcome = { ok: message === null, durationMs: Math.round(performance.now() - started), message };
		try {
			await this.hooks.afterBuild?.(outcome);
		} catch (error) {
			outcome.ok = false;
			outcome.message = error instanceof Error ? error.message : String(error);
		}
		if (!this.closed) this.emit(outcome.ok ? 'success' : 'failure', outcome);
		return outcome;
	}
	protected abstract compile(): Promise<void>;
	protected abstract startWatching(): Promise<void>;
	public watch(): Promise<void> {
		if (this.closed) return Promise.reject(new Error('The server builder is closed.'));
		this.watching ??= this.startWatching().catch(async (error: unknown) => {
			const stop = this.stopWatching;
			this.stopWatching = null;
			await stop?.();
			this.watching = null;
			throw error;
		});
		return this.watching;
	}
	public close(): Promise<void> {
		this.closed = true;
		this.#closing ??= (async () => {
			try {
				await this.watching?.catch(() => {});
				const stop = this.stopWatching;
				this.stopWatching = null;
				try {
					await stop?.();
				} finally {
					await this.active;
				}
			} finally {
				await this.hooks.close?.();
			}
		})();
		return this.#closing;
	}
}
