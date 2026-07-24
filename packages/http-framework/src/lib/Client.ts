import { REST, type RESTOptions } from '@discordjs/rest';
import { container } from '@sapphire/pieces';
import { isNullishOrEmpty } from '@sapphire/utilities';
import { AsyncEventEmitter } from '@vladfrangu/async_event_emitter';
import { InteractionType, type APIInteraction, type APIPrimaryEntryPointCommandInteraction } from 'discord-api-types/v10';
import { createServer, type IncomingMessage, type Server, type ServerOptions, type ServerResponse } from 'node:http';
import type { ListenOptions as NetListenOptions } from 'node:net';
import type { MappedClientEvents } from './ClientEvents.js';
import { HttpCodes } from './api/HttpCodes.js';
import type { IIdParser } from './components/IIdParser.js';
import { StringIdParser } from './components/StringIdParser.js';
import type { DiscordHttpRequest, ProcessDiscordHttpOptions } from './http/DiscordHttpRequest.js';
import { FetchHttpReply } from './http/FetchHttpReply.js';
import type { HttpReply } from './http/HttpReply.js';
import { NodeHttpReply } from './http/NodeHttpReply.js';
import type { ApplicationCommandRegistry, RequestAuthPrefix } from './interactions/shared/ApplicationCommandRegistry.js';
import { PluginManager } from './plugins/PluginManager.js';
import type { Plugin } from './plugins/Plugin.js';
import { CommandStore } from './structures/CommandStore.js';
import { InteractionHandlerStore } from './structures/InteractionHandlerStore.js';
import { ListenerStore } from './structures/ListenerStore.js';
import { PluginHook } from './types/Enums.js';
import { ErrorMessages, Payloads } from './utils/constants.js';
import { makeKey, verifyBody, type Key } from './utils/security.js';
import { getSafeTextBody, getSafeTextBodyFromWebRequest } from './utils/streams.js';

container.stores.register(new CommandStore());
container.stores.register(new InteractionHandlerStore());
container.stores.register(new ListenerStore());

export class Client extends AsyncEventEmitter<MappedClientEvents> {
	public server!: Server;
	public readonly id: string;
	public readonly options: ClientOptions;
	public readonly bodySizeLimit: number;
	public readonly httpReplyOnError: boolean;
	#discordPublicKey: string;
	#verificationKey: Promise<Key> | null = null;

	public constructor(options: ClientOptions = {}) {
		super();

		// Persist the options without the Discord credentials: the token and public key are consumed
		// during construction (the token is handed to `container.rest`, the public key is hashed into
		// `#discordPublicKey`). Storing the sanitized copy first lets every lifecycle hook receive the
		// same credential-free options, so neither this public field nor the plugin hooks retain or
		// observe secrets for the lifetime of the client.
		this.options = { ...options, discordToken: undefined, discordPublicKey: undefined };

		for (const plugin of Client.plugins.values(PluginHook.PreGenericsInitialization)) {
			plugin.hook.call(this, this.options);
			this.emit('pluginLoaded', plugin.type, plugin.name);
		}

		for (const plugin of Client.plugins.values(PluginHook.PreInitialization)) {
			plugin.hook.call(this, this.options);
			this.emit('pluginLoaded', plugin.type, plugin.name);
		}

		this.bodySizeLimit = options.bodySizeLimit ?? 1024 * 1024;
		this.httpReplyOnError = options.httpReplyOnError ?? true;

		const discordPublicKey = options.discordPublicKey ?? process.env.DISCORD_PUBLIC_KEY;
		if (!discordPublicKey) throw new Error('The discordPublicKey cannot be empty');
		this.#discordPublicKey = discordPublicKey;

		container.rest = new REST(options.restOptions);
		const token = options.discordToken ?? process.env.DISCORD_TOKEN;
		if (!token) throw new Error('The discordToken cannot be empty');

		this.id = options.clientId ?? process.env.DISCORD_CLIENT_ID ?? Buffer.from(token.split('.')[0], 'base64').toString();

		container.client = this;
		container.rest.setToken(token);
		container.idParser ??= new StringIdParser();
		container.applicationCommandRegistry.setup({
			clientId: this.id,
			rest: container.rest,
			authPrefix: options.authPrefix
		});

		for (const plugin of Client.plugins.values(PluginHook.PostInitialization)) {
			plugin.hook.call(this, this.options);
			this.emit('pluginLoaded', plugin.type, plugin.name);
		}
	}

	/**
	 * The plugin manager, holding every registered plugin hook.
	 *
	 * @since 2.4.0
	 */
	public static readonly plugins = new PluginManager();

	/**
	 * Registers a plugin onto the {@link Client}, applying all of its hooks.
	 *
	 * @since 2.4.0
	 * @param plugin The plugin to register.
	 */
	public static use(plugin: typeof Plugin) {
		this.plugins.use(plugin);
		return this;
	}

	/**
	 * Gets the application command registry.
	 *
	 * @since 2.0.0
	 * @returns The application command registry.
	 */
	public get registry() {
		return container.applicationCommandRegistry;
	}

	/**
	 * Returns the Ed25519 verification key derived from the Discord public key.
	 * Cached after the first call so adapters can share it across requests.
	 *
	 * @since 3.1.0
	 */
	public getVerificationKey(): Promise<Key> {
		this.#verificationKey ??= makeKey(this.#discordPublicKey);
		return this.#verificationKey;
	}

	/**
	 * Loads all the commands.
	 * @param options The load options.
	 */
	public async load(options: LoadOptions = {}) {
		for (const plugin of Client.plugins.values(PluginHook.PreLoad)) {
			await plugin.hook.call(this, this.options);
			this.emit('pluginLoaded', plugin.type, plugin.name);
		}

		// Register the user directory if not null:
		if (options.baseUserDirectory !== null) {
			container.stores.registerPath(options.baseUserDirectory);
		}

		await container.stores.load();
	}

	/**
	 * Starts the HTTP server, listening for HTTP interactions.
	 * Behavior is unchanged from previous versions: creates a `node:http` server and binds it.
	 * @param options The listen options.
	 */
	public async listen({ serverOptions, postPath, port, address, ...listenOptions }: ListenOptions) {
		const key = await this.getVerificationKey();
		const path = postPath ?? process.env.HTTP_POST_PATH ?? '/';

		this.server = createServer(serverOptions ?? {});
		this.server.on('request', (request, response) => void this.handleRawHttpMessage(request, response, path, key));

		await new Promise<void>((resolve) => this.server.listen({ ...listenOptions, port, host: address }, resolve));

		try {
			for (const plugin of Client.plugins.values(PluginHook.PostListen)) {
				await plugin.hook.call(this, this.options);
				this.emit('pluginLoaded', plugin.type, plugin.name);
			}
		} catch (error) {
			// A postListen hook failed: close the server we just opened so it does not stay bound to the
			// port as an orphaned listener, then propagate the original error to the caller.
			await new Promise<void>((resolve) => this.server.close(() => resolve()));
			throw error;
		}
	}

	/**
	 * Processes a Web Fetch {@link Request} through the Discord interactions pipeline.
	 * Used by `@wolfstar/http-framework/adapters/fetch` and compatible runtimes.
	 *
	 * @since 3.1.0
	 */
	public async handleWebRequest(request: Request, options: HandleWebRequestOptions = {}): Promise<Response> {
		const path = options.postPath ?? process.env.HTTP_POST_PATH ?? '/';
		const key = options.key ?? (await this.getVerificationKey());
		const reply = new FetchHttpReply();

		const url = new URL(request.url);
		await this.processDiscordHttpRequest(
			{
				method: request.method,
				url: url.pathname,
				signature: request.headers.get('x-signature-ed25519'),
				timestamp: request.headers.get('x-signature-timestamp'),
				readBody: () => getSafeTextBodyFromWebRequest(request)
			},
			{ path, key, reply }
		);

		return reply.response;
	}

	protected async handleRawHttpMessage(request: IncomingMessage, response: ServerResponse, path: string, key: Key) {
		const reply = new NodeHttpReply(response);
		reply.header('Content-Type', 'application/json');

		return this.processDiscordHttpRequest(
			{
				method: request.method,
				// Preserve historical Node matching: compare against the raw `url` (path + query).
				url: request.url,
				signature: headerValue(request.headers['x-signature-ed25519']),
				timestamp: headerValue(request.headers['x-signature-timestamp']),
				readBody: () => getSafeTextBody(request)
			},
			{ path, key, reply }
		);
	}

	/**
	 * Shared Discord HTTP pipeline used by both `node:http` and Fetch adapters.
	 */
	protected async processDiscordHttpRequest(request: DiscordHttpRequest, { path, key, reply }: ProcessDiscordHttpOptions): Promise<HttpReply> {
		if (request.url !== path) {
			return reply.status(HttpCodes.NotFound).end(ErrorMessages.NotFound);
		}

		if (request.method !== 'POST') {
			return reply.status(HttpCodes.MethodNotAllowed).end(ErrorMessages.UnsupportedHttpMethod);
		}

		const { signature, timestamp } = request;
		if (isNullishOrEmpty(signature) || isNullishOrEmpty(timestamp)) {
			return reply.status(HttpCodes.Unauthorized).end(ErrorMessages.MissingSignatureInformation);
		}

		const result = await request.readBody();
		if (result.isErr()) {
			return reply.status(HttpCodes.BadRequest).end(result.unwrapErr());
		}

		const body = result.unwrap();
		const valid = await verifyBody(body, signature, timestamp, key);
		if (!valid) {
			return reply.status(HttpCodes.Unauthorized).end(ErrorMessages.InvalidSignature);
		}

		return this.handleHttpMessage(JSON.parse(body) as Exclude<APIInteraction, APIPrimaryEntryPointCommandInteraction>, reply);
	}

	protected async handleHttpMessage(
		interaction: Exclude<APIInteraction, APIPrimaryEntryPointCommandInteraction>,
		response: HttpReply
	): Promise<HttpReply> {
		if (interaction.type === InteractionType.Ping) {
			return response.status(HttpCodes.OK).end(Payloads.Pong);
		}

		switch (interaction.type) {
			case InteractionType.ApplicationCommand:
				return container.stores.get('commands').runApplicationCommand(response, interaction);
			case InteractionType.ApplicationCommandAutocomplete:
				return container.stores.get('commands').runApplicationCommandAutocomplete(response, interaction);
			case InteractionType.MessageComponent:
			case InteractionType.ModalSubmit:
				return container.stores.get('interaction-handlers').runHandler(response, interaction);
			default: {
				return response.status(HttpCodes.NotImplemented).end(ErrorMessages.UnknownInteractionType);
			}
		}
	}
}

function headerValue(value: string | string[] | undefined): string | undefined {
	if (value === undefined) return undefined;
	return typeof value === 'string' ? value : value[0];
}

export interface HandleWebRequestOptions {
	/**
	 * The path the handler will accept Discord POSTs on.
	 * @default process.env.HTTP_POST_PATH ?? '/'
	 */
	postPath?: `/${string}`;

	/**
	 * Optional precomputed verification key. Defaults to {@link Client.getVerificationKey}.
	 */
	key?: Key;
}

export interface ClientOptions {
	/**
	 * The public key from Discord, available under "General Information" after opening an application from
	 * [Discord's applications](https://discord.com/developers/applications).
	 *
	 * @default process.env.DISCORD_PUBLIC_KEY
	 */
	discordPublicKey?: string;

	/**
	 * The Discord token used for authenticating requests outside of interaction responses.
	 *
	 * @default process.env.DISCORD_TOKEN
	 */
	discordToken?: string;

	/**
	 * The options to be passed to the underlying REST library.
	 */
	restOptions?: Partial<RESTOptions>;

	/**
	 * The body size limit in bytes.
	 * @default 1024 * 1024 // (1 MiB)
	 */
	bodySizeLimit?: number;

	/**
	 * Whether to reply with a 500 status code to Discord if an error occurs while processing an interaction.
	 * @default true
	 */
	httpReplyOnError?: boolean;

	/**
	 * The ID of the client.
	 *
	 * @default process.env.DISCORD_CLIENT_ID ?? Buffer.from(token.split('.')[0], 'base64').toString()
	 */
	clientId?: string;

	/**
	 * The prefix to use for authentication in REST calls.
	 * @default 'Bot'
	 * @since 2.0.0
	 */
	authPrefix?: RequestAuthPrefix;
}

export interface LoadOptions {
	/**
	 * The base user directory, if set to `null`, the library will not call {@link StoreRegistry.registerPath},
	 * meaning that you will need to manually set each folder for each store. Please read the aforementioned method's
	 * documentation for more information.
	 */
	baseUserDirectory?: string | null;
}

export interface ListenOptions extends Omit<NetListenOptions, 'path' | 'readableAll' | 'writableAll'> {
	/**
	 * The port at which the server will listen for requests.
	 */
	port: number;

	/**
	 * The address at which the server will be started.
	 */
	address?: string;

	/**
	 * The path the HTTP server will listen to.
	 * @default process.env.HTTP_POST_PATH ?? '/'
	 */
	postPath?: `/${string}`;

	/**
	 * The options to pass to the `createServer` function.
	 */
	serverOptions?: ServerOptions;
}

export namespace Client {
	export type Options = ClientOptions;
	export type PieceLoadOptions = LoadOptions;
	export type ServerListenOptions = ListenOptions;
}

declare module '@sapphire/pieces' {
	export interface StoreRegistryEntries {
		commands: CommandStore;
		'interaction-handlers': InteractionHandlerStore;
		listeners: ListenerStore;
	}

	export interface Container {
		client: Client;
		idParser: IIdParser;
		rest: REST;
		applicationCommandRegistry: ApplicationCommandRegistry;
	}
}
