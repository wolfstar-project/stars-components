import { Client, type ClientOptions } from '@wolfstar/http-framework';
import type { APIInteraction, APIPrimaryEntryPointCommandInteraction } from 'discord-api-types/v10';
import type { ServerResponse } from 'node:http';

const TEST_DEFAULTS: ClientOptions = {
	discordPublicKey: 'a'.repeat(64),
	discordToken: 'Bot.test.token'
};

export class TestableClient extends Client {
	public constructor(options: Partial<ClientOptions> = {}) {
		super({ ...TEST_DEFAULTS, ...options });
	}

	public override async handleHttpMessage(
		interaction: Exclude<APIInteraction, APIPrimaryEntryPointCommandInteraction>,
		response: ServerResponse
	): Promise<ServerResponse> {
		return super.handleHttpMessage(interaction, response);
	}
}
