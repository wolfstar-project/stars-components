import { ApplicationCommandType } from 'discord-api-types/v10';
import type { Command } from '../../structures/Command.js';
import { ensureChatInputCommandResolver, ensureContextMenuCommandResolver } from '../decorators/_shared.js';
import { restrictedGuildIdRegistry } from '../decorators/RestrictGuildIds.js';
import type { ChatInputCommandResolver } from '../resolvers/ChatInputCommandResolver.js';
import type { ContextMenuCommandResolver } from '../resolvers/ContextMenuCommandResolver.js';

/**
 * A per-command registry passed to {@linkcode Command.registerApplicationCommands}, allowing commands to be
 * registered imperatively, without relying on decorators.
 *
 * @remarks This is the decorator-free equivalent of {@link RegisterCommand}, {@link RegisterSubcommand},
 * {@link RegisterSubcommandGroup}, {@link RegisterMessageCommand}, {@link RegisterUserCommand}, and
 * {@link RestrictGuildIds}; both approaches can be used interchangeably as they share the same underlying
 * {@linkcode ApplicationCommandRegistryEntry}.
 * @since 3.1.0
 */
export class CommandRegistry<Options extends Command.Options = Command.Options> {
	readonly #target: typeof Command<Options>;

	public constructor(target: typeof Command<Options>) {
		this.#target = target;
	}

	/**
	 * Registers the chat input (slash) command for this command.
	 *
	 * @since 3.1.0
	 * @param data - The command data.
	 * @returns This registry, for chaining.
	 * @example
	 * ```typescript
	 * public override registerApplicationCommands(registry: Command.Registry) {
	 * 	registry.registerChatInputCommand((builder) =>
	 * 		builder.setName('ping').setDescription('A simple ping pong command')
	 * 	);
	 * }
	 * ```
	 */
	public registerChatInputCommand(data: ChatInputCommandResolver.CommandData): this {
		ensureChatInputCommandResolver(this.#target).setCommand(data);
		return this;
	}

	/**
	 * Registers a subcommand for the chat input command of this command.
	 *
	 * @since 3.1.0
	 * @param data - The subcommand data.
	 * @param method - The name of the method that handles this subcommand.
	 * @param groupName - The name of the subcommand group this subcommand belongs to, if any.
	 * @returns This registry, for chaining.
	 */
	public registerSubcommand(data: ChatInputCommandResolver.SubcommandData, method: string, groupName?: string | null): this {
		ensureChatInputCommandResolver(this.#target).addSubcommand(data, method, groupName);
		return this;
	}

	/**
	 * Registers a subcommand group for the chat input command of this command.
	 *
	 * @since 3.1.0
	 * @param data - The subcommand group data.
	 * @param method - The name of the method that handles this subcommand group, if any.
	 * @returns This registry, for chaining.
	 */
	public registerSubcommandGroup(data: ChatInputCommandResolver.SubcommandGroupData, method?: string | null): this {
		ensureChatInputCommandResolver(this.#target).addSubcommandGroup(data, method);
		return this;
	}

	/**
	 * Registers a context menu command for this command.
	 *
	 * @since 3.1.0
	 * @param data - The command data.
	 * @param type - The type of context menu command to register.
	 * @param method - The name of the method that handles this context menu command, if any.
	 * @returns This registry, for chaining.
	 */
	public registerContextMenuCommand(
		data: ContextMenuCommandResolver.CommandData,
		type: ApplicationCommandType.Message | ApplicationCommandType.User,
		method?: string | null
	): this {
		ensureContextMenuCommandResolver(this.#target).setCommand(data, type, method);
		return this;
	}

	/**
	 * Registers a "Message" context menu command for this command.
	 *
	 * @since 3.1.0
	 * @param data - The command data.
	 * @param method - The name of the method that handles this context menu command, if any.
	 * @returns This registry, for chaining.
	 */
	public registerMessageCommand(data: ContextMenuCommandResolver.CommandData, method?: string | null): this {
		return this.registerContextMenuCommand(data, ApplicationCommandType.Message, method);
	}

	/**
	 * Registers a "User" context menu command for this command.
	 *
	 * @since 3.1.0
	 * @param data - The command data.
	 * @param method - The name of the method that handles this context menu command, if any.
	 * @returns This registry, for chaining.
	 */
	public registerUserCommand(data: ContextMenuCommandResolver.CommandData, method?: string | null): this {
		return this.registerContextMenuCommand(data, ApplicationCommandType.User, method);
	}

	/**
	 * Restricts this command to the given guild IDs, so it is only registered there instead of globally.
	 *
	 * @since 3.1.0
	 * @param guildIds - The guild IDs to restrict this command to.
	 * @returns This registry, for chaining.
	 */
	public setGuildIds(guildIds: readonly string[]): this {
		restrictedGuildIdRegistry.set(this.#target, guildIds);
		return this;
	}
}
