import type { ResolvedStarsConfig, ResolvedTunnelConfig, StarsTunnelProvider } from '@wolfstar/schema';
import { startTunnel, type Tunnel as UntunTunnel } from 'untun';
import { cliDiagnostics } from '../utils/diagnostics.js';
import { readProjectVariable } from '../utils/project-env.js';
import { importFromProject } from '../utils/project.js';

export type QuickTunnelConfig = Extract<ResolvedTunnelConfig, { mode: 'quick' }>;

/** A tunnel a provider opened: where it is reachable, and how to take it down. */
export interface TunnelHandle {
	getURL(): Promise<string>;
	close(): Promise<void>;
}

export interface TunnelOpenContext {
	config: ResolvedStarsConfig;
	tunnel: QuickTunnelConfig;
	/**
	 * Reports that the tunnel ended without being closed. Returns whether it was handled (the tunnel was up and wanted),
	 * so the provider knows whether it is done watching for it.
	 */
	onStopped(error: Error): boolean;
}

/** A service that exposes the bot's local address publicly. */
export interface TunnelProvider {
	readonly name: StarsTunnelProvider;
	/**
	 * Opens a tunnel to `target`. Resolves to `undefined` when the user cancelled the setup, and rejects when the tunnel
	 * cannot be opened; either way nothing stays open.
	 */
	open(target: string, context: TunnelOpenContext): Promise<TunnelHandle | undefined>;
}

const SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const;

function isCloudflaredExit(reason: unknown): reason is Error {
	return reason instanceof Error && reason.message.startsWith('cloudflared exited (');
}

/**
 * The `cloudflared` quick tunnel, opened through `untun` (no account, a new hostname on every run).
 *
 * `untun` is wrapped rather than changed: it adds process signal listeners and leaves a promise unhandled whenever
 * `cloudflared` exits, both of which would end `stars dev`, so they are neutralised here.
 */
export class CloudflaredProvider implements TunnelProvider {
	public readonly name = 'cloudflared';
	#startTunnel: typeof startTunnel;
	#rejectionGuard: ((reason: unknown) => void) | null = null;

	public constructor(start: typeof startTunnel = startTunnel) {
		this.#startTunnel = start;
	}

	public async open(target: string, context: TunnelOpenContext): Promise<TunnelHandle | undefined> {
		this.#installRejectionGuard(context);

		let tunnel: UntunTunnel | undefined;
		try {
			tunnel = await this.#startWithoutSignalHandlers(target);
		} catch (error) {
			this.#releaseRejectionGuard();
			throw error;
		}

		if (!tunnel) {
			this.#releaseRejectionGuard();
			return undefined;
		}

		const opened = tunnel;
		return {
			getURL: async () => {
				try {
					return await opened.getURL();
				} catch (error) {
					this.#releaseRejectionGuard();
					throw error;
				}
			},
			close: async () => {
				try {
					await opened.close();
				} finally {
					this.#releaseRejectionGuard();
				}
			}
		};
	}

	/**
	 * `untun` adds its own `SIGINT`/`SIGTERM`/`SIGHUP` listeners that call `process.exit()` once cloudflared is closed,
	 * which races `stars dev`'s graceful shutdown (it closes the tunnel through {@link TunnelHandle.close} anyway), so they
	 * are removed.
	 */
	async #startWithoutSignalHandlers(target: string): Promise<UntunTunnel | undefined> {
		const before = SIGNALS.map((signal) => new Set(process.listeners(signal)));
		try {
			return await this.#startTunnel({ url: target, acceptCloudflareNotice: true });
		} finally {
			SIGNALS.forEach((signal, index) => {
				for (const listener of process.listeners(signal)) {
					if (!before[index]!.has(listener)) process.off(signal, listener);
				}
			});
		}
	}

	/**
	 * `untun` rejects a promise per connection when cloudflared exits and never handles it (and its location pattern
	 * does not match lowercase codes such as `mxp03`, so that promise is never settled before), which Node reports as an
	 * unhandled rejection that ends the process, whenever the tunnel closes. The guard swallows that one error for as
	 * long as this tunnel exists; anything else it sees is thrown again, as if it was not installed.
	 */
	#installRejectionGuard(context: TunnelOpenContext): void {
		if (this.#rejectionGuard) return;

		const guard = (reason: unknown): void => {
			if (!isCloudflaredExit(reason)) {
				// The guard is the only listener, so without this the rejection would be ignored instead of ending the process.
				if (process.listeners('unhandledRejection').length === 1) throw reason;
				return;
			}

			if (context.onStopped(reason)) this.#releaseRejectionGuard();
		};

		this.#rejectionGuard = guard;
		process.on('unhandledRejection', guard);
	}

	/** Node reports an unhandled rejection after the microtasks that follow it, so the guard has to outlive them. */
	#releaseRejectionGuard(): void {
		const guard = this.#rejectionGuard;
		this.#rejectionGuard = null;
		if (guard) setImmediate(() => process.off('unhandledRejection', guard));
	}
}

/** What the CLI uses of `@ngrok/ngrok`, so the package itself is never a dependency of the CLI. */
export interface NgrokListener {
	url(): string | null;
	close(): Promise<void>;
}

export interface NgrokModule {
	forward(options: { addr: string | number; authtoken: string; domain?: string }): Promise<NgrokListener>;
}

/** Loads `@ngrok/ngrok`; replaced in tests. */
export type NgrokLoader = (root: string) => Promise<NgrokModule>;

export const NGROK_PACKAGE = '@ngrok/ngrok';
export const NGROK_AUTHTOKEN_VARIABLE = 'NGROK_AUTHTOKEN';
export const NGROK_INSTALL_HINT = `Install it with \`pnpm add -D ${NGROK_PACKAGE}\`, or remove \`provider: 'ngrok'\` from \`dev.tunnel\`.`;

/** Imports `@ngrok/ngrok` from the project, where it is an optional peer of the CLI. */
export const loadNgrok: NgrokLoader = async (root) => {
	const imported = await importFromProject<NgrokModule & { default?: NgrokModule }>(root, NGROK_PACKAGE, NGROK_INSTALL_HINT);
	return typeof imported.forward === 'function' ? imported : imported.default!;
};

/**
 * ngrok through its official Node SDK. It runs in-process (no binary is downloaded), authenticates with
 * `NGROK_AUTHTOKEN` and can bind a domain reserved in the account.
 */
export class NgrokProvider implements TunnelProvider {
	public readonly name = 'ngrok';
	#load: NgrokLoader;

	public constructor(load: NgrokLoader = loadNgrok) {
		this.#load = load;
	}

	public async open(target: string, { config, tunnel }: TunnelOpenContext): Promise<TunnelHandle> {
		const ngrok = await this.#load(config.root);
		const authtoken = readProjectVariable(config, process.env, [NGROK_AUTHTOKEN_VARIABLE], { fresh: true });
		if (!authtoken) throw cliDiagnostics.NGROK_AUTHTOKEN_MISSING({});

		const listener = await ngrok.forward({ addr: ngrokAddress(target), authtoken, ...(tunnel.domain ? { domain: tunnel.domain } : {}) });
		const url = listener.url();
		if (!url) {
			await listener.close();
			throw new Error('ngrok did not report a URL for the tunnel');
		}

		return { getURL: () => Promise.resolve(url), close: () => listener.close() };
	}
}

/** ngrok forwards to `host:port`; a full `http` URL is reduced to it, anything else (`https`, a socket) is passed on. */
export function ngrokAddress(target: string): string {
	try {
		const url = new URL(target);
		if (url.protocol === 'http:') return `${url.hostname}:${url.port || 80}`;
	} catch {
		// Not a URL, so already an address.
	}

	return target;
}
