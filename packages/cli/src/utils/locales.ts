import { EventEmitter } from 'node:events';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import type { ResolvedStarsConfig } from '@wolfstar/schema';
import type { LogLevel } from './log-buffer.js';

export interface LocalesEvents {
	change: [];
	log: [level: LogLevel, text: string];
}

/** Keeps the conventional `src/locales` data directory next to the compiled application. */
export class Locales extends EventEmitter<LocalesEvents> {
	readonly source: string;
	readonly destination: string;
	#watcher: { close(): Promise<void> } | null = null;

	public constructor(private readonly config: ResolvedStarsConfig) {
		super();
		this.source = join(config.root, 'src', 'locales');
		this.destination = join(config.build.outDir, 'locales');
	}

	public copy(): boolean {
		if (this.config.build.tool === 'none' || !existsSync(this.source)) return false;
		mkdirSync(this.destination, { recursive: true });
		cpSync(this.source, this.destination, { recursive: true, force: true });
		return true;
	}

	public async watch(): Promise<void> {
		if (this.config.build.tool === 'none' || !existsSync(this.source) || this.#watcher) return;
		const { watch } = await import('chokidar');
		const watcher = watch(this.source, { ignoreInitial: true });
		this.#watcher = watcher;

		watcher.on('all', (event, path) => {
			try {
				const target = join(this.destination, relative(this.source, path));
				if (event === 'unlink' || event === 'unlinkDir') rmSync(target, { recursive: event === 'unlinkDir', force: true });
				else if (existsSync(path)) {
					mkdirSync(dirname(target), { recursive: true });
					cpSync(path, target, { recursive: event === 'addDir', force: true });
				}
				this.emit('change');
			} catch (error) {
				this.emit('log', 'error', `Failed to copy locales: ${error instanceof Error ? error.message : String(error)}`);
			}
		});
		watcher.on('error', (error) => this.emit('log', 'error', error instanceof Error ? error.message : String(error)));
		await new Promise<void>((resolve) => watcher.once('ready', resolve));
	}

	public async close(): Promise<void> {
		const watcher = this.#watcher;
		this.#watcher = null;
		await watcher?.close();
	}
}
