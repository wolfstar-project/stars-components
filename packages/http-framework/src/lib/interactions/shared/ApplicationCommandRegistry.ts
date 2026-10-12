import { Collection } from '@discordjs/collection';
import type { REST, RequestData, RouteLike } from '@discordjs/rest';
import type { JSONEncodable } from '@discordjs/util';
import { container } from '@sapphire/pieces';
import {
	ApplicationCommandType,
	type APIApplicationCommand,
	type RESTGetAPIApplicationCommandsResult,
	Routes,
	type RESTPutAPIApplicationCommandsJSONBody,
	type RESTPutAPIApplicationCommandsResult,
	type RESTPutAPIApplicationGuildCommandsJSONBody,
	type RESTPutAPIApplicationGuildCommandsResult,
	type Snowflake
} from 'discord-api-types/v10';
import type { Command } from '../../structures/Command.js';
import { restrictedGuildIdRegistry } from '../decorators/RestrictGuildIds.js';
import { ApplicationCommandRegistryEntry } from './ApplicationCommandRegistryEntry.js';
import { commandSyncBody, matchesCommand } from './command-sync.js';

export type RequestAuthPrefix = RequestData['authPrefix'];

/**
 * Represents a registry for application commands.
 *
 * @remarks This registry is globally available through {@linkcode container.applicationCommandRegistry}.
 * @since 2.0.0
 */
export class ApplicationCommandRegistry implements JSONEncodable<ApplicationCommandRegistryEntry.Command[]> {
	#entries = new Collection<typeof Command<Command.Options>, ApplicationCommandRegistryEntry>();
	#rest: REST | null = null;
	#clientId: Snowflake | null = null;
	#authPrefix: RequestAuthPrefix = 'Bot';
	#syncPromise: Promise<ApplicationCommandRegistry.SyncResult> | null = null;

	public get store() {
		return container.stores.get('commands');
	}

	/**
	 * Sets up the application command registry with the provided options.
	 *
	 * @since 2.0.0
	 * @param options - The setup options for the application command registry.
	 * @returns The updated instance of the application command registry.
	 */
	public setup(options: Readonly<ApplicationCommandRegistry.SetupOptions>) {
		this.#rest = options.rest;
		this.#clientId = options.clientId;
		this.#authPrefix = options.authPrefix ?? 'Bot';
		return this;
	}

	/**
	 * Retrieves the {@linkcode ApplicationCommandRegistryEntry} associated with the specified command class.
	 *
	 * @since 2.0.0
	 * @template Options - The options type of the command class.
	 * @param target - The command class to retrieve the entry for.
	 * @returns The {@linkcode ApplicationCommandRegistryEntry} associated with the command class, or null if not found.
	 */
	public get<Options extends Command.Options>(target: typeof Command<Options>): ApplicationCommandRegistryEntry | null {
		return this.#entries.get(target) ?? null;
	}

	/**
	 * Deletes a command from the registry.
	 *
	 * @since 2.0.0
	 * @template Options - The options type for the command.
	 * @param target - The command to delete.
	 * @returns True if the command was successfully deleted, false otherwise.
	 */
	public delete<Options extends Command.Options>(target: typeof Command<Options>): boolean {
		return this.#entries.delete(target);
	}

	/**
	 * Retrieves or creates an {@linkcode ApplicationCommandRegistryEntry} for the specified command class.
	 *
	 * @since 2.0.0
	 * @template Options - The options type for the command.
	 * @param target - The command class to ensure registration for.
	 * @returns The application command registry entry for the command.
	 */
	public ensure<Options extends Command.Options>(target: typeof Command<Options>): ApplicationCommandRegistryEntry {
		return this.#entries.ensure(target, () => new ApplicationCommandRegistryEntry());
	}

	/**
	 * Converts the {@linkcode ApplicationCommandRegistryEntry} objects to an array of command objects in JSON format.
	 *
	 * @since 2.0.0
	 * @returns An array of Command objects in JSON format.
	 */
	public toJSON(): ApplicationCommandRegistryEntry.Command[] {
		return this.#entries.map((entry) => entry.toJSON()).flat(1);
	}

	/**
	 * Loads the commands from the specified base user directory.
	 *
	 * @since 2.0.0
	 * @param baseUserDirectory - The base user directory to load the commands from, define it as `null` to not register
	 * a path for the file system loader.
	 * @returns A promise that resolves when all the commands are loaded.
	 */
	public loadCommands(baseUserDirectory?: string | URL | null) {
		if (baseUserDirectory !== null) {
			container.stores.registerPath(baseUserDirectory);
		}

		return this.store.loadAll();
	}

	/**
	 * Retrieves the loaded chat input commands from the application command registry.
	 *
	 * @since 2.0.0
	 * @returns A collection of chat input commands.
	 */
	public getLoadedChatInputCommands() {
		const collection = new Collection<string, ApplicationCommandRegistryEntry>();
		for (const registryEntry of this.#entries.values()) {
			if (registryEntry.chatInput) collection.set(registryEntry.chatInput.toJSON().name, registryEntry);
		}

		return collection;
	}

	/**
	 * Retrieves the loaded context menu commands.
	 *
	 * @since 2.0.0
	 * @returns A collection of context menu commands.
	 */
	public getLoadedContextMenuCommands() {
		const collection = new Collection<string, ApplicationCommandRegistryEntry>();
		for (const registryEntry of this.#entries.values()) {
			for (const entry of registryEntry.contextMenu) {
				collection.set(entry.toJSON().name, registryEntry);
			}
		}

		return collection;
	}

	/**
	 * Retrieves the loaded global commands from the application command registry.
	 *
	 * @since 2.0.0
	 * @returns An array of loaded global commands.
	 */
	public getLoadedGlobalCommands(): ApplicationCommandRegistryEntry.Command[] {
		return this.#entries
			.filter((_, command) => !restrictedGuildIdRegistry.get(command)?.length)
			.map((entry) => entry.toJSON())
			.flat(1);
	}

	/**
	 * Retrieves the loaded guild commands from the application command registry.
	 *
	 * @since 2.0.0
	 * @returns A collection of guild commands, where the key is the guild ID and the value is an array of commands.
	 */
	public getLoadedGuildCommands(): Collection<Snowflake, ApplicationCommandRegistryEntry.Command[]> {
		const collection = new Collection<Snowflake, ApplicationCommandRegistryEntry.Command[]>();

		for (const [command, guildIds] of restrictedGuildIdRegistry) {
			if (guildIds.length === 0) continue;

			const entry = this.#entries.get(command);
			if (!entry) continue;

			const commands = entry.toJSON();
			for (const guildId of guildIds) {
				collection.ensure(guildId, () => []).push(...commands);
			}
		}

		return collection;
	}

	/**
	 * Registers all the non guild-restricted commands globally.
	 *
	 * @since 2.0.0
	 * @returns The raw result from registering the commands globally.
	 */
	public pushGlobalCommands() {
		return this.#push(Routes.applicationCommands(this.clientId), this.getLoadedGlobalCommands(), null);
	}

	/**
	 * Registers all the non guild-restricted commands in a single guild.
	 *
	 * @since 2.0.0
	 * @param guildId The guild to register the commands at.
	 * @returns The raw result from registering the commands in the specified guild.
	 */
	public pushGlobalCommandsInGuild(guildId: Snowflake) {
		return this.#push(Routes.applicationGuildCommands(this.clientId, guildId), this.getLoadedGlobalCommands(), guildId);
	}

	/**
	 * Registers all the commands including guild-restricted ones in a single guild.
	 *
	 * @param guildId The guild to register the commands at.
	 * @returns The raw result from registering the commands in the specified guild.
	 */
	public pushAllCommandsInGuild(guildId: Snowflake) {
		return this.#push(Routes.applicationGuildCommands(this.clientId, guildId), this.toJSON(), guildId);
	}

	/**
	 * Registers all the guild-restricted commands in their respective guilds.
	 *
	 * @returns The settled promises from all the guild command registrations.
	 */
	public pushGuildRestrictedCommands(): Promise<PromiseSettledResult<RESTPutAPIApplicationGuildCommandsResult>[]> {
		const promises = this.getLoadedGuildCommands().map((commands, guildId) =>
			this.#push(Routes.applicationGuildCommands(this.clientId, guildId), commands, guildId)
		);

		return Promise.allSettled(promises);
	}

	/** Fetch deployed commands, including their full localization dictionaries. */
	public async fetchDeployed(guildId: Snowflake | null = null): Promise<RESTGetAPIApplicationCommandsResult> {
		if (this.#rest === null) throw new Error('The ApplicationCommandRegistry has not been setup yet.');
		return (await this.#rest.get(this.#route(guildId), {
			authPrefix: this.#authPrefix,
			query: new URLSearchParams({ with_localizations: 'true' })
		})) as RESTGetAPIApplicationCommandsResult;
	}

	/**
	 * Synchronize loaded commands with Discord. Equal commands cause no writes; unknown remote commands are
	 * preserved unless `removeUnknown` is enabled. Failures reject, so callers can retry or choose their policy.
	 * Concurrent calls share the current synchronization (and its options). This is not a distributed lock:
	 * use `when` to select one process in a sharder/broker deployment.
	 */
	public sync(options: ApplicationCommandRegistry.SyncOptions = {}): Promise<ApplicationCommandRegistry.SyncResult> {
		if (this.#syncPromise) return this.#syncPromise;
		this.#syncPromise = this.#sync(options).finally(() => {
			this.#syncPromise = null;
		});
		return this.#syncPromise;
	}

	async #sync(options: ApplicationCommandRegistry.SyncOptions): Promise<ApplicationCommandRegistry.SyncResult> {
		const result: ApplicationCommandRegistry.SyncResult = { created: 0, updated: 0, removed: 0, unchanged: 0 };
		if (options.onConflict === 'ignore' || (options.when && !(await options.when()))) return result;
		const global = this.getLoadedGlobalCommands();
		const guilds = this.getLoadedGuildCommands();
		const scopes = new Map<Snowflake | null, ApplicationCommandRegistryEntry.Command[]>();
		if (options.guildIds?.length) {
			for (const guildId of options.guildIds) scopes.set(guildId, [...global, ...(guilds.get(guildId) ?? [])]);
		} else {
			scopes.set(null, global);
			for (const [guildId, commands] of guilds) scopes.set(guildId, commands);
		}

		for (const [guildId, commands] of scopes) {
			const deployed = await this.fetchDeployed(guildId);
			const remote = new Map(deployed.map((command) => [`${command.type}:${command.name}`, command]));
			for (const command of commands) {
				const key = `${command.type ?? 1}:${command.name}`;
				const old = remote.get(key);
				remote.delete(key);
				const body = commandSyncBody(command, guildId);
				if (old && matchesCommand(body, old as unknown as Record<string, unknown>)) {
					this.#recordIds([old], guildId);
					result.unchanged++;
					continue;
				}
				if (options.onConflict !== 'log') {
					const data = { body, authPrefix: this.#authPrefix };
					const entry = (
						old ? await this.#rest!.patch(this.#route(guildId, old.id), data) : await this.#rest!.post(this.#route(guildId), data)
					) as APIApplicationCommand;
					this.#recordIds([entry], guildId);
				}
				if (old) result.updated++;
				else result.created++;
			}
			if (options.removeUnknown) {
				for (const command of remote.values()) {
					if (options.onConflict !== 'log') await this.#rest!.delete(this.#route(guildId, command.id), { authPrefix: this.#authPrefix });
					result.removed++;
				}
			}
		}
		const changes = result.created + result.updated + result.removed;
		if (changes === 0) container.logger.info(`Commands: ${result.unchanged} up to date`);
		else {
			const summary = `${result.created} created, ${result.updated} updated, ${result.removed} removed`;
			if (options.onConflict === 'log') container.logger.warn(`Commands: differences detected (${summary}); no changes written`);
			else container.logger.info(`Commands: ${summary}`);
		}
		return result;
	}

	#route(guildId: Snowflake | null, commandId?: Snowflake): RouteLike {
		if (guildId === null) return commandId ? Routes.applicationCommand(this.clientId, commandId) : Routes.applicationCommands(this.clientId);
		return commandId
			? Routes.applicationGuildCommand(this.clientId, guildId, commandId)
			: Routes.applicationGuildCommands(this.clientId, guildId);
	}

	async #push<GuildId extends Snowflake | null>(route: RouteLike, body: BodyOf<GuildId>, guildId: GuildId): Promise<ResultOf<GuildId>> {
		if (this.#rest === null) {
			throw new Error('The ApplicationCommandRegistry has not been setup yet.');
		}

		const entries = (await this.#rest.put(route, { body, authPrefix: this.#authPrefix })) as ResultOf<GuildId>;
		this.#recordIds(entries, guildId);
		return entries;
	}

	#recordIds(entries: readonly APIApplicationCommand[], guildId: Snowflake | null) {
		const { router } = this.store;
		for (const entry of entries) {
			const command = entry.type === ApplicationCommandType.ChatInput ? router.getChatInput(entry.name) : router.getContextMenu(entry.name);
			const registry = command?.registry;
			if (!registry) continue;

			if (guildId === null) {
				registry.setGlobalId(entry.id);
			} else {
				registry.setGuildId(guildId, entry.id);
			}
		}
	}

	private get clientId() {
		if (this.#clientId === null) throw new Error('The ApplicationCommandRegistry has not been setup yet.');
		return this.#clientId;
	}
}

export namespace ApplicationCommandRegistry {
	export interface SyncOptions {
		/** Overwrite differences (default), report without writing, or skip silently. */
		onConflict?: 'overwrite' | 'log' | 'ignore';
		/** Deploy global commands and each target guild's restricted commands to these guilds only. */
		guildIds?: readonly Snowflake[];
		/** Delete unknown commands in the selected scopes. Defaults to false. */
		removeUnknown?: boolean;
		/** Select one registering process; no distributed lock is taken. */
		when?: () => boolean | Promise<boolean>;
	}

	/** Applied changes, or proposed changes when `onConflict` is `log`. */
	export interface SyncResult {
		created: number;
		updated: number;
		removed: number;
		unchanged: number;
	}

	export interface SetupOptions {
		rest: REST;
		clientId: Snowflake;
		authPrefix?: RequestAuthPrefix;
	}
}

export const applicationCommandRegistry = new ApplicationCommandRegistry();
container.applicationCommandRegistry = applicationCommandRegistry;

type BodyOf<GuildId extends Snowflake | null> = Snowflake | null extends GuildId
	? RESTPutAPIApplicationCommandsJSONBody | RESTPutAPIApplicationGuildCommandsJSONBody
	: Snowflake extends GuildId
		? RESTPutAPIApplicationGuildCommandsJSONBody
		: RESTPutAPIApplicationCommandsJSONBody;
type ResultOf<GuildId extends Snowflake | null> = Snowflake | null extends GuildId
	? RESTPutAPIApplicationCommandsResult | RESTPutAPIApplicationGuildCommandsResult
	: Snowflake extends GuildId
		? RESTPutAPIApplicationGuildCommandsResult
		: RESTPutAPIApplicationCommandsResult;
