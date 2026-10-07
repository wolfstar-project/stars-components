import { ApplicationCommandType, InteractionType, PermissionFlagsBits, type APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10';
import { Client, CommandStore, Identifiers, PreconditionError, container, type Command } from '@wolfstar/http-framework';
import type { ServerResponse } from 'node:http';
import { RequiresClientPermissions, RequiresUserPermissions } from '../src/index.js';

function makeResponse() {
	return { statusCode: 200, closed: false, end: vi.fn().mockReturnThis() } as unknown as ServerResponse;
}

function makeInteraction(memberPermissions: bigint, appPermissions: bigint): APIChatInputApplicationCommandInteraction {
	return {
		id: '254360814063058944',
		application_id: '737141877803057244',
		type: InteractionType.ApplicationCommand,
		token: 'token',
		version: 1,
		locale: 'en-US',
		guild_id: '737141877803057244',
		channel_id: '737142209639350343',
		app_permissions: String(appPermissions),
		member: { permissions: String(memberPermissions), roles: [], joined_at: '', deaf: false, mute: false, flags: 0, user: { id: '1' } },
		data: { id: '0', name: 'foo', type: ApplicationCommandType.ChatInput, options: [] }
	} as unknown as APIChatInputApplicationCommandInteraction;
}

class UserCommand {
	public readonly name = 'foo';
	public readonly router = { routeChatInputInteraction: () => 'chatInputRun' };

	@RequiresUserPermissions('BanMembers')
	@RequiresClientPermissions('ManageMessages')
	public chatInputRun() {
		return 'ran';
	}
}

describe('PreconditionError thrown by the permission decorators', () => {
	let client: Client;
	let store: CommandStore;

	beforeEach(() => {
		client = new Client({ discordPublicKey: 'a'.repeat(64), discordToken: 'Bot.test.token' });
		container.client = client;
		client.on('error', () => {});
		store = new CommandStore();
		vi.spyOn(store.router, 'get').mockReturnValue(new UserCommand() as unknown as Command);
	});

	test('GIVEN a member without the permission THEN it is emitted as chatInputCommandDenied, not commandError', async () => {
		const denied = vi.fn();
		const failed = vi.fn();
		client.on('chatInputCommandDenied', denied);
		client.on('commandError', failed);

		await store.runApplicationCommand(makeResponse(), makeInteraction(PermissionFlagsBits.KickMembers, PermissionFlagsBits.ManageMessages));

		expect(denied).toHaveBeenCalledOnce();
		const [error] = denied.mock.calls[0];
		expect(error).toBeInstanceOf(PreconditionError);
		expect(error).toMatchObject({ identifier: Identifiers.PreconditionUserPermissions, precondition: 'UserPermissions' });
		expect(failed).not.toHaveBeenCalled();
	});

	test('GIVEN an application without the permission THEN it is emitted as chatInputCommandDenied, not commandError', async () => {
		const denied = vi.fn();
		const failed = vi.fn();
		client.on('chatInputCommandDenied', denied);
		client.on('commandError', failed);

		await store.runApplicationCommand(makeResponse(), makeInteraction(PermissionFlagsBits.BanMembers, 0n));

		expect(denied).toHaveBeenCalledOnce();
		expect(denied.mock.calls[0][0]).toMatchObject({ identifier: Identifiers.PreconditionClientPermissions, precondition: 'ClientPermissions' });
		expect(failed).not.toHaveBeenCalled();
	});

	test('GIVEN both permissions THEN the command runs and nothing is denied', async () => {
		const denied = vi.fn();
		const success = vi.fn();
		client.on('chatInputCommandDenied', denied);
		client.on('commandSuccess', success);

		await store.runApplicationCommand(makeResponse(), makeInteraction(PermissionFlagsBits.BanMembers, PermissionFlagsBits.ManageMessages));

		expect(success).toHaveBeenCalledWith(expect.anything(), 'ran');
		expect(denied).not.toHaveBeenCalled();
	});
});
