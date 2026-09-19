import type { EventEmitter } from 'node:events';
import type { StarsBuildTool } from './config.js';
import type { ResolvedStarsConfig } from '../config/resolve.js';

export type BuilderLogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error';

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
	log: [level: BuilderLogLevel, text: string];
}

/**
 * Turns project sources into the runnable output, once or continuously.
 * Implementations report progress through {@link BuilderEvents}.
 */
export interface Builder extends EventEmitter<BuilderEvents> {
	readonly tool: StarsBuildTool;
	/** Runs a single build. Compilation failures are reported in the outcome; dependency loading may throw. */
	build(): Promise<BuildOutcome>;
	/** Starts watching. Resolves once the watcher is set up; builds are reported through events. */
	watch(): Promise<void>;
	/** Stops watching. */
	close(): Promise<void>;
}

/** Services supplied by the host; server integrations never import the CLI. */
export interface BuilderContext {
	/** Resolve build dependencies from the consuming project and report missing dependencies. */
	importFromProject<T>(root: string, id: string, hint: string): Promise<T>;
	/** Create the host's entry transformation for installed plugin registrations. */
	pluginRegistrations(config: ResolvedStarsConfig): object;
}
