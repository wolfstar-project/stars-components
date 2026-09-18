import type { ResolvedStarsConfig, StarsBuildTool } from '@wolfstar/http-framework/config';
import { dirname } from 'node:path';
import { EventEmitter } from 'node:events';
import { displayPath } from '@wolfstar/http-framework/config';
import type { Builder, BuilderEvents, BuildOutcome } from './types.js';

/**
 * Runs no build of its own: the project drives one itself (`vite dev`, `vite build --watch`, a task runner, …) and
 * this only watches what that build writes, restarting the bot whenever the output changes.
 *
 * This is what `experimental.enableExternalVite` selects — the CLI stays out of the build's way but keeps the rest
 * of `stars dev` (restarts, health, tunnel, type checking, the panel) working.
 */
export class ExternalBuilder extends EventEmitter<BuilderEvents> implements Builder {
	public readonly tool: StarsBuildTool;
	#watcher: { close(): Promise<void> } | null = null;

	public constructor(private readonly config: ResolvedStarsConfig) {
		super();
		this.tool = config.build.tool;
	}

	public build(): Promise<BuildOutcome> {
		this.emit('start');
		const outcome: BuildOutcome = { ok: true, durationMs: 0, message: null };
		this.emit('success', outcome);
		return Promise.resolve(outcome);
	}

	public async watch(): Promise<void> {
		const { watch } = await import('chokidar');
		const target = dirname(this.config.build.output);
		this.emit('log', 'info', `Watching ${displayPath(this.config.root, target)} for an external build`);

		const watcher = watch(target, { ignored: [...this.config.dev.ignore], ignoreInitial: true, cwd: this.config.root });
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
