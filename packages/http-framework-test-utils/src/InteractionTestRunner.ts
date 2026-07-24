import type { APIInteraction, APIPrimaryEntryPointCommandInteraction } from 'discord-api-types/v10';
import { MockHttpReply } from './MockServerResponse.js';
import type { TestableClient } from './TestableClient.js';
import type { InteractionResult } from './types.js';

export class InteractionTestRunner {
	readonly #client: TestableClient;

	public constructor(client: TestableClient) {
		this.#client = client;
	}

	public async run(interaction: Exclude<APIInteraction, APIPrimaryEntryPointCommandInteraction>): Promise<InteractionResult> {
		const response = new MockHttpReply();
		await this.#client.handleHttpMessage(interaction, response);
		const body = response.getBody();
		return {
			statusCode: response.statusCode,
			body,
			json: <T = unknown>() => response.getBodyAsJson<T>()
		};
	}
}
