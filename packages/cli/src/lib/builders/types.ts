import type { EventEmitter } from 'node:events';
import type { StarsBuildTool } from '@wolfstar/http-framework/config';
import type { LogLevel } from '../log-buffer.js';

export interface BuildOutcome {
	ok: boolean;
	durationMs: number;
	/** A one-line summary, e.g. the first error. */
	message: string | null;
}

export interface BuilderEvents {
	start: [];
	/** Coarse, real lifecycle milestones, not an estimate of compiler work remaining. */
	progress: [fraction: number, message: string];
	success: [outcome: BuildOutcome];
	failure: [outcome: BuildOutcome];
	log: [level: LogLevel, text: string];
}

/**
 * Turns project sources into the runnable output, once or continuously.
 * Implementations report progress through {@link BuilderEvents}.
 */
export interface Builder extends EventEmitter<BuilderEvents> {
	readonly tool: StarsBuildTool;
	/** Runs a single build. Never throws for build errors, those are reported in the outcome. */
	build(): Promise<BuildOutcome>;
	/** Starts watching. Resolves once the watcher is set up; builds are reported through events. */
	watch(): Promise<void>;
	/** Stops watching. */
	close(): Promise<void>;
}
