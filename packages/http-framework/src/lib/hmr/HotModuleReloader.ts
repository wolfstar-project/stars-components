import { container, type Piece, type Store } from '@sapphire/pieces';
import { Result } from '@sapphire/result';
import type { ChokidarOptions, FSWatcher } from 'chokidar';
import { relative } from 'node:path';
import { Events } from '../ClientEvents.js';

/**
 * Hot Module Reloading for every {@link Store} registered in {@link container.stores}.
 *
 * @remarks The reloader watches each store's registered paths and reacts to file system events by loading, reloading,
 * and unloading the affected pieces in place, without restarting the process. It is a development-only utility: watching
 * the file system in production adds overhead and reloads code that is not supposed to change, which is why it is
 * opt-in.
 * @since 3.3.0
 * @example
 * ```typescript
 * const client = new Client({ hmr: { enabled: process.env.NODE_ENV !== 'production' } });
 * await client.load();
 * ```
 */
export class HotModuleReloader {
	/**
	 * The options this reloader was constructed with.
	 *
	 * @since 3.3.0
	 */
	public readonly options: HotModuleReloader.Options;

	#watchers: FSWatcher[] = [];
	#running = false;

	public constructor(options: HotModuleReloader.Options = {}) {
		this.options = options;
	}

	/**
	 * Whether the reloader is currently watching for changes.
	 *
	 * @since 3.3.0
	 */
	public get running(): boolean {
		return this.#running;
	}

	/**
	 * The paths currently being watched, one entry per store path.
	 *
	 * @since 3.3.0
	 */
	public get paths(): readonly string[] {
		return this.#watchers.flatMap((watcher) => Object.keys(watcher.getWatched()));
	}

	/**
	 * Starts watching every path registered in every store.
	 *
	 * @remarks This is a no-op when {@link HotModuleReloader.Options.enabled} is `false`, when the reloader is already
	 * running, or when no store has registered paths. `chokidar` is imported lazily, so applications that never enable
	 * HMR do not pay for loading it.
	 * @since 3.3.0
	 * @returns This instance, for chaining.
	 */
	public async start(): Promise<this> {
		if (this.#running) return this;

		const { enabled = true, silent = false, ...chokidarOptions } = this.options;
		if (!enabled) return this;

		const { watch } = await import('chokidar');

		const watchedPaths: string[] = [];
		for (const store of container.stores.values()) {
			const paths = [...store.paths];
			if (paths.length === 0) continue;

			watchedPaths.push(...paths);
			this.#watchers.push(
				watch(paths, { ignoreInitial: true, ...chokidarOptions })
					.on('add', (path) => void this.handlePieceUpdate(store as Store<Piece>, path))
					.on('change', (path) => void this.handlePieceUpdate(store as Store<Piece>, path))
					.on('unlink', (path) => void this.handlePieceDelete(store as Store<Piece>, path))
			);
		}

		this.#running = true;

		if (!silent) console.info(`[HMR]: Enabled, watching ${watchedPaths.length} path(s) for piece changes.`);
		container.client?.emit(Events.HmrStart, watchedPaths);

		return this;
	}

	/**
	 * Stops watching for changes and closes every watcher.
	 *
	 * @remarks Calling this on a reloader that is not running is a no-op. Already loaded pieces are left untouched.
	 * @since 3.3.0
	 */
	public async stop(): Promise<void> {
		if (!this.#running) return;

		const watchers = this.#watchers;
		this.#watchers = [];
		this.#running = false;

		await Promise.all(watchers.map((watcher) => watcher.close()));

		if (!this.options.silent) console.info('[HMR]: Disabled, no longer watching for piece changes.');
		container.client?.emit(Events.HmrStop);
	}

	/**
	 * Handles a file being added to, or modified in, one of the store's paths, reloading the piece it defines when it is
	 * already loaded, and loading it otherwise.
	 *
	 * @since 3.3.0
	 * @param store - The store the path belongs to.
	 * @param path - The full path of the file that changed.
	 */
	protected async handlePieceUpdate(store: Store<Piece>, path: string): Promise<void> {
		if (!store.strategy.filter(path)) return;

		const piece = store.find((entry) => entry.location.full === path);
		const result = await Result.fromAsync(async () => {
			if (piece) {
				await piece.reload();

				if (!this.options.silent) console.info(`[HMR]: Reloaded '${piece.name}' from the '${store.name}' store.`);
				container.client?.emit(Events.HmrPieceReloaded, piece, path);
				return;
			}

			const root = [...store.paths].find((storePath) => path.startsWith(storePath));
			if (!root) throw new Error(`Could not find the root path for '${path}'.`);

			const pieces = await store.load(root, relative(root, path));

			if (!this.options.silent) {
				const names = pieces.map((entry) => `'${entry.name}'`).join(', ');
				console.info(`[HMR]: Loaded ${pieces.length} piece(s) into the '${store.name}' store: ${names}.`);
			}

			container.client?.emit(Events.HmrPiecesLoaded, pieces, path);
		});

		result.inspectErr((error) => this.handleError(error, path));
	}

	/**
	 * Handles a file being removed from one of the store's paths, unloading the piece it defined.
	 *
	 * @since 3.3.0
	 * @param store - The store the path belongs to.
	 * @param path - The full path of the file that was deleted.
	 */
	protected async handlePieceDelete(store: Store<Piece>, path: string): Promise<void> {
		if (!store.strategy.filter(path)) return;

		const piece = store.find((entry) => entry.location.full === path);
		if (!piece) return;

		const result = await Result.fromAsync(async () => {
			await piece.unload();

			if (!this.options.silent) console.info(`[HMR]: Unloaded '${piece.name}' from the '${store.name}' store.`);
			container.client?.emit(Events.HmrPieceUnloaded, piece, path);
		});

		result.inspectErr((error) => this.handleError(error, path));
	}

	/**
	 * Handles an error thrown while (re)loading or unloading a piece.
	 *
	 * @remarks Errors are never rethrown: a broken file must not take the process down, the user is expected to fix it
	 * and save again, which triggers a new reload.
	 * @since 3.3.0
	 * @param error - The error that was thrown.
	 * @param path - The full path of the file that was being processed.
	 */
	protected handleError(error: unknown, path: string): void {
		if (!this.options.silent) console.error(`[HMR]: Failed to process '${path}'.`, error);
		container.client?.emit(Events.HmrError, error, path);
	}
}

export interface HMROptions extends ChokidarOptions {
	/**
	 * Whether Hot Module Reloading is enabled.
	 *
	 * @default true
	 */
	enabled?: boolean;

	/**
	 * Whether the reloader should refrain from writing to the console. Events are always emitted on the
	 * {@link Client} regardless of this option.
	 *
	 * @default false
	 */
	silent?: boolean;
}

export namespace HotModuleReloader {
	export type Options = HMROptions;
}
