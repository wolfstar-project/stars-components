import { DEFAULT_TUNNEL_PROVIDER, type ResolvedStarsConfig, type ResolvedTunnelConfig, type StarsTunnelProvider } from '@wolfstar/schema';
import { EventEmitter } from 'node:events';
import { Diagnostic } from 'nostics';
import type { startTunnel } from 'untun';
import type { LogLevel } from '../utils/log-buffer.js';
import { readProjectVariable } from '../utils/project-env.js';
import {
	CloudflaredProvider,
	NgrokProvider,
	type NgrokLoader,
	type QuickTunnelConfig,
	type TunnelHandle,
	type TunnelProvider
} from './tunnel-providers.js';

export type TunnelState = 'off' | 'starting' | 'up' | 'failed';

export interface TunnelEvents {
	log: [level: LogLevel, text: string];
	state: [state: TunnelState, url: string | null];
}

export interface TunnelOptions {
	/** Override for tests: how the `cloudflared` provider opens its tunnel. */
	startTunnel?: typeof startTunnel;
	/** Override for tests: how the `ngrok` provider loads `@ngrok/ngrok`. */
	loadNgrok?: NgrokLoader;
}

/**
 * Exposes the bot's interactions endpoint publicly while `stars dev` runs.
 *
 * `dev.tunnel: true` opens a quick tunnel through the configured provider: `cloudflared` via `untun` by default (it
 * changes on every run), or `ngrok`. A configured https URL is only probed, since the user already serves it. Writing
 * the URL to the Discord application is opt-in through `dev.tunnel.updateEndpoint`, because it edits a live application.
 */
export class Tunnel extends EventEmitter<TunnelEvents> {
	#providers: Record<StarsTunnelProvider, TunnelProvider>;
	#tunnel: TunnelHandle | null = null;
	#state: TunnelState = 'off';
	#url: string | null = null;
	#wanted = false;

	public constructor(
		private readonly config: ResolvedStarsConfig,
		options: TunnelOptions = {}
	) {
		super();
		this.#providers = { cloudflared: new CloudflaredProvider(options.startTunnel), ngrok: new NgrokProvider(options.loadNgrok) };
	}

	public get state(): TunnelState {
		return this.#state;
	}

	/** The public URL of the interactions endpoint, `null` until the tunnel is up. */
	public get url(): string | null {
		return this.#url;
	}

	public async start(forceQuick = false): Promise<void> {
		if (this.#state === 'starting' || this.#state === 'up') return;
		const configured = this.config.dev.tunnel;
		const tunnel: ResolvedTunnelConfig =
			forceQuick && configured.mode === 'off'
				? { mode: 'quick', provider: DEFAULT_TUNNEL_PROVIDER, domain: null, path: '/', updateEndpoint: false }
				: configured;
		if (tunnel.mode === 'off') return;

		this.#wanted = true;
		this.#setState('starting', null);
		const url = tunnel.mode === 'url' ? await this.#useConfiguredUrl(tunnel) : await this.#openQuickTunnel(tunnel);
		if (!url || !this.#wanted) return;

		this.#setState('up', endpointUrl(url, tunnel.path));
		this.emit('log', 'success', `Tunnel ready at ${this.#url}`);
		if (tunnel.updateEndpoint) await this.#updateInteractionsEndpoint(this.#url!);
	}

	/** Toggles the configured tunnel, opening a quick tunnel when the project did not configure one. */
	public toggle(): Promise<void> {
		return this.#state === 'starting' || this.#state === 'up' ? this.close() : this.start(true);
	}

	public async close(): Promise<void> {
		this.#wanted = false;
		const tunnel = this.#tunnel;
		this.#tunnel = null;
		this.#setState('off', null);
		// Without a tunnel, `#openQuickTunnel` is still waiting for one and closes it when it arrives.
		await tunnel?.close();
	}

	async #useConfiguredUrl(tunnel: Extract<ResolvedTunnelConfig, { mode: 'url' }>): Promise<string | null> {
		const reachable = await probe(endpointUrl(tunnel.url, tunnel.path));
		if (!reachable) {
			this.emit('log', 'warn', `${tunnel.url} did not answer; make sure it forwards to ${this.config.dev.url ?? 'the bot'}`);
		}

		return tunnel.url;
	}

	async #openQuickTunnel(tunnel: QuickTunnelConfig): Promise<string | null> {
		const target = this.config.dev.url;
		if (!target) {
			this.emit('log', 'error', 'A quick tunnel needs `dev.url` to know what to forward to');
			this.#setState('failed', null);
			return null;
		}

		const provider = this.#providers[tunnel.provider];
		this.emit('log', 'info', `Opening a ${provider.name} quick tunnel…`);

		try {
			const handle = await provider.open(target, {
				config: this.config,
				tunnel,
				onStopped: (error) => this.#stoppedUnexpectedly(provider.name, error)
			});
			if (!this.#wanted) {
				await handle?.close();
				return null;
			}
			if (!handle) {
				this.emit('log', 'error', `${provider.name} setup was cancelled`);
				this.#setState('failed', null);
				return null;
			}

			this.#tunnel = handle;
			return await handle.getURL();
		} catch (error) {
			// Closing a tunnel can make its process exit, which a provider may report as a failure: that is not one.
			if (!this.#wanted) return null;
			this.emit('log', 'error', `${provider.name} failed: ${describeError(error)}`);
			this.#setState('failed', null);
			return null;
		}
	}

	/** Whether the report was about the tunnel in use: one that is up and still wanted. */
	#stoppedUnexpectedly(provider: StarsTunnelProvider, error: Error): boolean {
		if (this.#state !== 'up' || !this.#wanted) return false;
		this.#tunnel = null;
		this.emit('log', 'error', `${provider} stopped unexpectedly: ${error.message}`);
		this.#setState('failed', null);
		return true;
	}

	/**
	 * Points the Discord application's interactions endpoint at the tunnel. Discord validates the endpoint with a
	 * signed ping before accepting it, so the bot has to be up already — this runs after the first successful build.
	 */
	async #updateInteractionsEndpoint(url: string): Promise<void> {
		const credentials = readDiscordCredentials(this.config);
		if (!credentials) {
			this.emit('log', 'warn', 'Skipped the interactions endpoint update: DISCORD_TOKEN is not set');
			return;
		}

		try {
			const response = await fetch('https://discord.com/api/v10/applications/@me', {
				method: 'PATCH',
				headers: { authorization: `Bot ${credentials.token}`, 'content-type': 'application/json' },
				body: JSON.stringify({ interactions_endpoint_url: url }),
				signal: AbortSignal.timeout(10_000)
			});

			if (response.ok) this.emit('log', 'success', `Interactions endpoint set to ${url}`);
			else
				this.emit(
					'log',
					'error',
					`Discord rejected the interactions endpoint (${response.status}): ${(await response.text()).slice(0, 300)}`
				);
		} catch (error) {
			this.emit('log', 'error', `Failed to update the interactions endpoint: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	#setState(state: TunnelState, url: string | null): void {
		this.#state = state;
		this.#url = url;
		this.emit('state', state, url);
	}
}

/**
 * Joins the tunnel's origin with the path the interactions endpoint is served on.
 */
export function endpointUrl(origin: string, path: string): string {
	return path === '/' ? origin : new URL(path, origin.endsWith('/') ? origin : `${origin}/`).href;
}

async function probe(url: string): Promise<boolean> {
	try {
		const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
		return response.status < 500;
	} catch {
		return false;
	}
}

export interface DiscordCredentials {
	token: string;
	applicationId: string | null;
}

/**
 * Reads the Discord credentials the CLI needs from the environment, falling back to the project's `.env` files the
 * way the bot itself does once it starts.
 */
export function readDiscordCredentials(config: ResolvedStarsConfig, env: NodeJS.ProcessEnv = process.env): DiscordCredentials | null {
	const token = readProjectVariable(config, env, 'DISCORD_TOKEN', 'TOKEN');
	if (!token) return null;

	return {
		token,
		applicationId: readProjectVariable(config, env, 'DISCORD_APPLICATION_ID', 'APPLICATION_ID', 'DISCORD_CLIENT_ID', 'CLIENT_ID')
	};
}

/** How a quick tunnel is described to the user, for `stars info` and `stars doctor`. */
export function describeQuickTunnel(tunnel: QuickTunnelConfig): string {
	return `${tunnel.provider} quick tunnel${tunnel.domain ? ` on ${tunnel.domain}` : ''}`;
}

/** A diagnostic's own advice is part of the message, since the dev log has no place to show it separately. */
function describeError(error: unknown): string {
	if (error instanceof Diagnostic) return error.fix ? `${error.message}. ${error.fix}` : error.message;
	return error instanceof Error ? error.message : String(error);
}
