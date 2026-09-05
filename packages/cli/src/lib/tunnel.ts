import { readProjectEnvFiles, type ResolvedStarsConfig, type ResolvedTunnelConfig } from '@wolfstar/http-framework/config';
import { spawn, type ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import type { LogLevel } from './log-buffer.js';
import { createLineSplitter } from './process-supervisor.js';

const QUICK_TUNNEL_URL = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;
const INSTALL_HINT =
	'Install cloudflared (https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/), point `dev.tunnel` at an https URL you already serve, or set it to false.';

export type TunnelState = 'off' | 'starting' | 'up' | 'failed';

export interface TunnelEvents {
	log: [level: LogLevel, text: string];
	state: [state: TunnelState, url: string | null];
}

/**
 * Exposes the bot's interactions endpoint publicly while `stars dev` runs.
 *
 * `dev.tunnel: true` spawns a `cloudflared` quick tunnel and reads its hostname off the process output (it changes
 * on every run); a configured https URL is only probed, since the user already serves it. Writing the URL to the
 * Discord application is opt-in through `dev.tunnel.updateEndpoint`, because it edits a live application.
 */
export class Tunnel extends EventEmitter<TunnelEvents> {
	#child: ChildProcess | null = null;
	#state: TunnelState = 'off';
	#url: string | null = null;

	public constructor(private readonly config: ResolvedStarsConfig) {
		super();
	}

	public get state(): TunnelState {
		return this.#state;
	}

	/** The public URL of the interactions endpoint, `null` until the tunnel is up. */
	public get url(): string | null {
		return this.#url;
	}

	public async start(): Promise<void> {
		const tunnel = this.config.dev.tunnel;
		if (tunnel.mode === 'off') return;

		this.#setState('starting', null);
		const url = tunnel.mode === 'url' ? await this.#useConfiguredUrl(tunnel) : await this.#openQuickTunnel();
		if (!url) return;

		this.#setState('up', endpointUrl(url, tunnel.path));
		this.emit('log', 'success', `Tunnel ready at ${this.#url}`);
		if (tunnel.updateEndpoint) await this.#updateInteractionsEndpoint(this.#url!);
	}

	public close(): Promise<void> {
		const child = this.#child;
		this.#child = null;
		this.#setState('off', null);
		if (!child || child.exitCode !== null) return Promise.resolve();

		return new Promise((resolve) => {
			child.once('exit', () => resolve());
			child.kill();
		});
	}

	async #useConfiguredUrl(tunnel: Extract<ResolvedTunnelConfig, { mode: 'url' }>): Promise<string | null> {
		const reachable = await probe(endpointUrl(tunnel.url, tunnel.path));
		if (!reachable) {
			this.emit('log', 'warn', `${tunnel.url} did not answer; make sure it forwards to ${this.config.dev.url ?? 'the bot'}`);
		}

		return tunnel.url;
	}

	async #openQuickTunnel(): Promise<string | null> {
		const target = this.config.dev.url;
		if (!target) {
			this.emit('log', 'error', 'A quick tunnel needs `dev.url` to know what to forward to');
			this.#setState('failed', null);
			return null;
		}

		this.emit('log', 'info', 'Opening a cloudflared quick tunnel…');

		return new Promise<string | null>((resolve) => {
			let child: ChildProcess;
			try {
				child = spawn('cloudflared', ['tunnel', '--url', target, '--no-autoupdate'], {
					cwd: this.config.root,
					stdio: ['ignore', 'pipe', 'pipe'],
					windowsHide: true
				});
			} catch {
				this.#failWithMissingBinary();
				resolve(null);
				return;
			}

			this.#child = child;
			let settled = false;
			const settle = (url: string | null) => {
				if (settled) return;
				settled = true;
				resolve(url);
			};

			const handleLine = (line: string) => {
				const match = QUICK_TUNNEL_URL.exec(line);
				if (match) settle(match[0]);
				else if (line.trim().length > 0) this.emit('log', 'debug', line.trim());
			};

			const stdout = createLineSplitter(handleLine);
			const stderr = createLineSplitter(handleLine);
			child.stdout?.on('data', stdout.push);
			child.stderr?.on('data', stderr.push);

			child.once('error', (error: NodeJS.ErrnoException) => {
				if (error.code === 'ENOENT') this.#failWithMissingBinary();
				else {
					this.emit('log', 'error', `cloudflared failed: ${error.message}`);
					this.#setState('failed', null);
				}
				settle(null);
			});

			child.once('exit', (code) => {
				stdout.flush();
				stderr.flush();
				this.#child = null;
				if (!settled) {
					this.emit('log', 'error', `cloudflared exited with code ${code} before the tunnel was up`);
					this.#setState('failed', null);
					settle(null);
				}
			});
		});
	}

	#failWithMissingBinary(): void {
		this.emit('log', 'error', `cloudflared is not installed. ${INSTALL_HINT}`);
		this.#setState('failed', null);
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
	const fromFiles = readProjectEnvFilesCached(config.root);
	const read = (...keys: string[]): string | null => {
		for (const key of keys) {
			const value = config.dev.env[key] ?? env[key] ?? fromFiles[key];
			if (value) return value;
		}
		return null;
	};

	const token = read('DISCORD_TOKEN', 'TOKEN');
	if (!token) return null;

	return { token, applicationId: read('DISCORD_APPLICATION_ID', 'APPLICATION_ID', 'DISCORD_CLIENT_ID', 'CLIENT_ID') };
}

let envFileCache: { root: string; values: Record<string, string> } | null = null;

function readProjectEnvFilesCached(root: string): Record<string, string> {
	if (envFileCache?.root !== root) envFileCache = { root, values: readProjectEnvFiles(root) };
	return envFileCache.values;
}
