import type { ResolvedStarsConfig } from '@wolfstar/schema';
import { resolveSync } from 'mlly';
import { pathToFileURL } from 'node:url';
import { findInstalledVersion } from '../utils/project.js';

/** Marks a message of the bridge, so a bot using the IPC channel for something else is left alone. */
export const BRIDGE_SOURCE = 'stars:bridge';
/** Marks a message `stars dev` sends to the bot. */
export const CLI_SOURCE = 'stars:cli';
/** The first `@wolfstar/http-framework` with object plugins (`Client.use({ name, postListen })`), which the bridge is. */
export const BRIDGE_FRAMEWORK_VERSION = '6.1.0';

/** An application command as the bot would register it: the JSON body Discord receives. */
export interface CommandData {
	name: string;
	type?: number;
	[key: string]: unknown;
}

export interface CommandSnapshot {
	global: CommandData[];
	/** Guild-restricted commands, by guild id. */
	guilds: Record<string, CommandData[]>;
}

export interface BridgeError {
	message: string;
	/** The first stack frames, without the message line. */
	stack: string[];
}

/**
 * What the bot tells `stars dev` over the IPC channel. The bot's stdout only carries text a level is guessed for; this
 * is everything the dev UI shows that happens inside the bot: hot reloads, requests, dispatches, its commands.
 */
export type BridgeMessage =
	| { type: 'ready'; clientId: string; port: number | null }
	| { type: 'pieces'; store: string; pieces: { name: string; path: string }[] }
	| { type: 'hmr'; event: 'start'; paths: string[] }
	| { type: 'hmr'; event: 'stop' }
	| { type: 'hmr'; event: 'reloaded' | 'loaded' | 'unloaded'; store: string; names: string[]; path: string }
	| ({ type: 'hmr'; event: 'error'; path: string } & BridgeError)
	| ({ type: 'commands' } & CommandSnapshot)
	| { type: 'dispatch'; phase: 'run'; route: string; piece: string }
	| { type: 'dispatch'; phase: 'success'; route: string; piece: string; ms: number | null }
	| { type: 'dispatch'; phase: 'error'; route: string; piece: string; ms: number | null; error: BridgeError }
	| { type: 'request'; method: string; path: string; status: number; ms: number }
	| { type: 'refreshed'; ok: true; global: number; guilds: number; cleared: number }
	| ({ type: 'refreshed'; ok: false } & BridgeError)
	/** A line on a channel of the sender's choice: how a plugin gets its own channel in the dev UI. */
	| { type: 'log'; channel: string; level: string; text: string; detail?: string[] };

/** What the CLI asks of the bot. `clearGuilds` are guilds whose last command was removed: nothing registers them any more. */
export interface RefreshRequest {
	source: typeof CLI_SOURCE;
	type: 'commands:refresh';
	clearGuilds: string[];
}

type Loose = Record<string, any>;

const isString = (value: unknown): value is string => typeof value === 'string';
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isStrings = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString);
const isRecord = (value: unknown): value is Loose => value !== null && typeof value === 'object' && !Array.isArray(value);
const isCommands = (value: unknown): boolean => Array.isArray(value) && value.every((command) => isRecord(command) && isString(command.name));
const isError = (value: Loose): boolean => isString(value.message) && isStrings(value.stack);

/** The shape each message must have. A plugin can send `log`, so nothing here is taken on trust. */
const SHAPES: Record<BridgeMessage['type'], (message: Loose) => boolean> = {
	ready: (message) => isString(message.clientId) && (message.port === null || isNumber(message.port)),
	pieces: (message) =>
		isString(message.store) &&
		Array.isArray(message.pieces) &&
		message.pieces.every((piece: unknown) => isRecord(piece) && isString(piece.name) && isString(piece.path)),
	hmr: (message) => {
		switch (message.event) {
			case 'start':
				return isStrings(message.paths);
			case 'stop':
				return true;
			case 'error':
				return isString(message.path) && isError(message);
			case 'reloaded':
			case 'loaded':
			case 'unloaded':
				return isString(message.store) && isStrings(message.names) && isString(message.path);
			default:
				return false;
		}
	},
	commands: (message) => isCommands(message.global) && isRecord(message.guilds) && Object.values(message.guilds).every(isCommands),
	dispatch: (message) => {
		if (!isString(message.route) || !isString(message.piece)) return false;
		if (message.phase === 'run') return true;
		if (message.ms !== null && !isNumber(message.ms)) return false;
		return message.phase === 'success' || (message.phase === 'error' && isRecord(message.error) && isError(message.error));
	},
	request: (message) => isString(message.method) && isString(message.path) && isNumber(message.status) && isNumber(message.ms),
	refreshed: (message) =>
		message.ok === true
			? isNumber(message.global) && isNumber(message.guilds) && isNumber(message.cleared)
			: message.ok === false && isError(message),
	log: (message) =>
		isString(message.channel) &&
		message.channel.length > 0 &&
		isString(message.level) &&
		isString(message.text) &&
		(message.detail === undefined || isStrings(message.detail))
};

/**
 * Narrows an IPC message to one of the bridge's, `null` for anything else the bot sends and for a bridge message that
 * does not have the shape of its type.
 */
export function parseBridgeMessage(value: unknown): BridgeMessage | null {
	if (!isRecord(value) || value.source !== BRIDGE_SOURCE || !isString(value.type) || !Object.hasOwn(SHAPES, value.type)) return null;
	return SHAPES[value.type as BridgeMessage['type']](value) ? (value as BridgeMessage) : null;
}

/**
 * The source of the bridge: a module preloaded into the bot (`node --import`) that registers a plugin on the bot's own
 * `Client` and reports what happens there with `process.send`. It never writes to stdout, and does nothing when the
 * process has no IPC channel, so it is inert outside `stars dev`.
 *
 * It only uses what `@wolfstar/http-framework` already exposes — the client's events, its registry and its stores —
 * which is what keeps `@wolfstar/cli` free of a dependency on the framework: `framework` is the project's own copy.
 */
export function bridgeModuleSource(framework: string): string {
	return `import { Client, container } from ${JSON.stringify(framework)};

if (typeof process.send === 'function') {
	const send = (type, data) => {
		try {
			process.send({ source: ${JSON.stringify(BRIDGE_SOURCE)}, type, ...data });
		} catch {}
	};
	const describe = (error) => ({
		message: error instanceof Error ? error.message : String(error),
		stack:
			error instanceof Error && typeof error.stack === 'string'
				? error.stack.split('\\n').slice(1, 6).map((line) => line.trim())
				: []
	});
	const commandRoute = (context) => {
		const data = context.interaction.data ?? {};
		const kind = context.interaction.type === 4 ? 'autocomplete' : data.type === 2 ? 'user' : data.type === 3 ? 'message' : 'slash';
		let name = String(data.name ?? 'unknown');
		let options = data.options;
		while (Array.isArray(options) && options.length === 1 && (options[0].type === 1 || options[0].type === 2)) {
			name += ' ' + options[0].name;
			options = options[0].options;
		}
		return kind + ':' + name;
	};
	const handlerRoute = (context) => (context.interaction.type === 5 ? 'modal' : 'component') + ':' + context.handler.name;
	const commandsOf = (client) => {
		const guilds = {};
		for (const [id, commands] of client.registry.getLoadedGuildCommands()) guilds[id] = commands;
		return { global: client.registry.getLoadedGlobalCommands(), guilds };
	};
	const snapshot = (client) => {
		try {
			send('commands', commandsOf(client));
		} catch {}
	};

	try {
		Client.use({
			name: 'stars:dev-bridge',
			enforce: 'post',
			postInitialization(client) {
				const started = new WeakMap();
				const track = (prefix, route, pieceOf) => {
					client.on(prefix + 'Run', (context) => {
						started.set(context.interaction, performance.now());
						send('dispatch', { phase: 'run', route: route(context), piece: pieceOf(context).name });
					});
					const done = (phase) => (first, second) => {
						const context = phase === 'error' ? second : first;
						const at = started.get(context.interaction);
						send('dispatch', {
							phase,
							route: route(context),
							piece: pieceOf(context).name,
							ms: at === undefined ? null : Math.round(performance.now() - at),
							...(phase === 'error' ? { error: describe(first) } : {})
						});
					};
					client.on(prefix + 'Success', done('success'));
					client.on(prefix + 'Error', done('error'));
				};
				track('command', commandRoute, (context) => context.command);
				track('autocomplete', commandRoute, (context) => context.command);
				track('interactionHandler', handlerRoute, (context) => context.handler);

				const changed = (event) => (pieces, path) => {
					const list = Array.isArray(pieces) ? pieces : [pieces];
					const store = list[0]?.store?.name ?? 'pieces';
					send('hmr', { event, path, store, names: list.map((piece) => piece.name) });
					if (store === 'commands') snapshot(client);
				};
				client.on('hmrStart', (paths) => send('hmr', { event: 'start', paths }));
				client.on('hmrStop', () => send('hmr', { event: 'stop' }));
				client.on('hmrPieceReloaded', changed('reloaded'));
				client.on('hmrPiecesLoaded', changed('loaded'));
				client.on('hmrPieceUnloaded', changed('unloaded'));
				client.on('hmrError', (error, path) => send('hmr', { event: 'error', path, ...describe(error) }));
			},
			postListen(client) {
				const server = client.server;
				server?.on?.('request', (request, response) => {
					const at = performance.now();
					response.once('finish', () =>
						send('request', {
							method: String(request.method),
							path: String(request.url),
							status: response.statusCode,
							ms: Math.round(performance.now() - at)
						})
					);
				});
				for (const store of container.stores.values()) {
					send('pieces', {
						store: store.name,
						pieces: [...store.values()].map((piece) => ({ name: piece.name, path: piece.location.full }))
					});
				}
				snapshot(client);
				const address = server?.address?.();
				send('ready', { clientId: client.id, port: address !== null && typeof address === 'object' ? address.port : null });
			}
		});

		process.on('message', (message) => {
			if (message === null || typeof message !== 'object' || message.source !== ${JSON.stringify(CLI_SOURCE)}) return;
			if (message.type !== 'commands:refresh') return;
			Promise.resolve()
				.then(async () => {
					const client = container.client;
					const global = await client.registry.pushGlobalCommands();
					const guilds = await client.registry.pushGuildRestrictedCommands();
					const failed = guilds.find((result) => result.status === 'rejected');
					if (failed) throw failed.reason;
					// A guild that lost its last command is no longer in the registry, so nothing above overwrote it.
					const clear = Array.isArray(message.clearGuilds) ? message.clearGuilds.filter((id) => typeof id === 'string') : [];
					for (const id of clear) {
						await container.rest.put('/applications/' + client.id + '/guilds/' + id + '/commands', { body: [] });
					}
					send('refreshed', { ok: true, global: global.length, guilds: guilds.length, cleared: clear.length });
				})
				.catch((error) => send('refreshed', { ok: false, ...describe(error) }));
		});
		// Listening for messages keeps the channel, and with it the process, alive: a bot that is done must still exit.
		process.channel?.unref?.();
	} catch {}
}
`;
}

/**
 * `node` arguments that preload the bridge into the bot. Nothing is preloaded when the project's framework cannot be
 * resolved or predates object plugins: `stars dev` then shows what the bot prints, as it did before the bridge.
 *
 * The framework is resolved from the project with the `import` condition, the way `moduleImportArgs` does, so the
 * plugin lands on the `Client` the bot constructs. A build that bundles the framework into its output (Vite, Nitro)
 * has its own copy, which the preload cannot reach: the bridge stays silent there too.
 */
export function bridgeImportArgs(config: ResolvedStarsConfig): string[] {
	const version = findInstalledVersion(config.root, '@wolfstar/http-framework');
	if (version === null || !isAtLeast(version, BRIDGE_FRAMEWORK_VERSION)) return [];

	let framework: string;
	try {
		framework = resolveSync('@wolfstar/http-framework', { url: pathToFileURL(`${config.root}/package.json`).href });
	} catch {
		return [];
	}

	return ['--import', `data:text/javascript,${encodeURIComponent(bridgeModuleSource(framework))}`];
}

/** Compares the `major.minor.patch` of two versions; a prerelease counts as its release. */
export function isAtLeast(version: string, minimum: string): boolean {
	const parse = (value: string) =>
		value
			.split('-', 1)[0]!
			.split('.')
			.map((part) => Number.parseInt(part, 10) || 0);
	const [a, b] = [parse(version), parse(minimum)];
	for (let index = 0; index < 3; index++) {
		const difference = (a[index] ?? 0) - (b[index] ?? 0);
		if (difference !== 0) return difference > 0;
	}

	return true;
}
