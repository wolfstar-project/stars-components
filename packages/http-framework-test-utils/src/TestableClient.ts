import { Client, type ClientOptions, type HttpReply } from '@wolfstar/http-framework';
import type { APIInteraction, APIPrimaryEntryPointCommandInteraction } from 'discord-api-types/v10';

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
		response: HttpReply
	): Promise<HttpReply> {
		return super.handleHttpMessage(interaction, response);
	}
}
