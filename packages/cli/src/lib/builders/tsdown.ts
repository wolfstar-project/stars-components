import { EventEmitter } from 'node:events';
import type { ResolvedStarsConfig } from '@wolfstar/http-framework/config';
import { importFromProject } from '../project.js';
import type { Builder, BuilderEvents, BuildOutcome } from './types.js';

type TsdownModule = typeof import('tsdown');
type TsdownLogger = import('tsdown').Logger;
type TsdownBundle = import('tsdown').TsdownBundle;

const INSTALL_HINT = "Install it with `pnpm add -D tsdown`, or set `build.tool` to 'tsc' or 'none'.";

/**
 * Builds through the project's own `tsdown`, honouring its `tsdown.config.*`.
 */
export class TsdownBuilder extends EventEmitter<BuilderEvents> implements Builder {
	public readonly tool = 'tsdown' as const;
	#bundles: TsdownBundle[] = [];
	#hadError = false;
	#startedAt = 0;

	public constructor(private readonly config: ResolvedStarsConfig) {
		super();
	}

	public async build(): Promise<BuildOutcome> {
		const tsdown = await this.#load();
		this.#begin();

		try {
			this.#bundles = await tsdown.build({ cwd: this.config.root, customLogger: this.#logger() });
			return this.#finish(this.#hadError ? 'The build reported errors' : null);
		} catch (error) {
			return this.#finish(error instanceof Error ? error.message : String(error));
		}
	}

	public async watch(): Promise<void> {
		const tsdown = await this.#load();

		this.#begin();
		this.#bundles = await tsdown.build({
			cwd: this.config.root,
			watch: true,
			customLogger: this.#logger(),
			hooks: {
				'build:prepare': () => {
					if (this.#startedAt === 0) this.#begin();
				}
			},
			onSuccess: () => {
				this.#finish(null);
			}
		});
	}

	public async close(): Promise<void> {
		const bundles = this.#bundles;
		this.#bundles = [];
		await Promise.allSettled(bundles.map((bundle) => bundle[Symbol.asyncDispose]()));
	}

	#load(): Promise<TsdownModule> {
		return importFromProject<TsdownModule>(this.config.root, 'tsdown', INSTALL_HINT);
	}

	#begin(): void {
		this.#hadError = false;
		this.#startedAt = performance.now();
		this.emit('start');
	}

	#finish(message: string | null): BuildOutcome {
		const outcome: BuildOutcome = {
			ok: message === null && !this.#hadError,
			durationMs: Math.round(performance.now() - this.#startedAt),
			message
		};
		this.#startedAt = 0;
		this.emit(outcome.ok ? 'success' : 'failure', outcome);
		return outcome;
	}

	#logger(): TsdownLogger {
		const log = (level: 'info' | 'warn' | 'error' | 'success', args: unknown[]) => {
			// tsdown passes its (possibly undefined) name label and other blanks as separate arguments.
			const text = args
				.filter((argument) => argument !== undefined && argument !== null && argument !== false && argument !== '')
				.map((argument) => (argument instanceof Error ? (argument.stack ?? argument.message) : String(argument)))
				.join(' ');
			this.emit('log', level, text);
		};

		const warned = new Set<string>();
		return {
			level: 'info',
			info: (...args) => log('info', args),
			warn: (...args) => log('warn', args),
			warnOnce: (...args) => {
				const key = args.map(String).join(' ');
				if (warned.has(key)) return;
				warned.add(key);
				log('warn', args);
			},
			error: (...args) => {
				this.#hadError = true;
				log('error', args);
				// In watch mode tsdown never calls `onSuccess` after an error, report the failure now.
				if (this.#startedAt !== 0 && this.#bundles.length > 0) this.#finish(errorSummary(args));
			},
			success: (...args) => log('success', args),
			clearScreen: () => {}
		};
	}
}

function errorSummary(args: unknown[]): string {
	const first = args[0];
	if (first instanceof Error) return first.message.split('\n')[0] ?? 'Build failed';
	return String(first ?? 'Build failed').split('\n')[0] ?? 'Build failed';
}
