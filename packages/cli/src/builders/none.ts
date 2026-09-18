import { EventEmitter } from 'node:events';
import type { ResolvedStarsConfig } from '@wolfstar/http-framework/config';
import type { Builder, BuilderEvents, BuildOutcome } from './types.js';

/**
 * No build step: watches the configured paths and reports every change as an instant successful "build".
 */
export class NoneBuilder extends EventEmitter<BuilderEvents> implements Builder {
	public readonly tool = 'none' as const;
	#watcher: { close(): Promise<void> } | null = null;

	public constructor(private readonly config: ResolvedStarsConfig) {
		super();
	}

	public build(): Promise<BuildOutcome> {
		this.emit('start');
		const outcome: BuildOutcome = { ok: true, durationMs: 0, message: null };
		this.emit('success', outcome);
		return Promise.resolve(outcome);
	}

	public async watch(): Promise<void> {
		const { watch } = await import('chokidar');
		const watcher = watch([...this.config.dev.watch], {
			ignored: [...this.config.dev.ignore],
			ignoreInitial: true,
			cwd: this.config.root
		});
		this.#watcher = watcher;

		watcher.on('all', (event, path) => {
			this.emit('log', 'info', `${event}: ${path}`);
			void this.build();
		});
		watcher.on('error', (error) => this.emit('log', 'error', error instanceof Error ? error.message : String(error)));

		await new Promise<void>((resolve) => watcher.once('ready', resolve));
		await this.build();
	}

	public async close(): Promise<void> {
		const watcher = this.#watcher;
		this.#watcher = null;
		await watcher?.close();
	}
}
