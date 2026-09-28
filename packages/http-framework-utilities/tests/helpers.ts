import { makeInteraction, StringIdParser, type InteractionHandler } from '@wolfstar/http-framework';
import {
	makeResponse,
	MessageComponentButtonInteractionData,
	MessageComponentStringSelectInteractionData,
	type MockServerResponse
} from '@wolfstar/http-framework-test-utils';
import { ComponentType } from 'discord-api-types/v10';

export interface Click {
	interaction: InteractionHandler.Interaction;
	value: unknown;
	body<T = { type: number; data: Record<string, unknown> }>(): T;
}

function finish(customId: string, data: object, userId?: string): Click {
	const response = makeResponse();
	const payload = userId
		? { ...data, member: { ...(data as { member: object }).member, user: { ...(data as { member: { user: object } }).member.user, id: userId } } }
		: data;
	const interaction = makeInteraction(response, payload as never) as InteractionHandler.Interaction;
	return {
		interaction,
		value: new StringIdParser().run(customId)!.content,
		body: () => (response as unknown as MockServerResponse).getBodyAsJson()
	};
}

export function clickButton(customId: string, userId?: string): Click {
	return finish(
		customId,
		{ ...MessageComponentButtonInteractionData, data: { component_type: ComponentType.Button, custom_id: customId } },
		userId
	);
}

export function selectOption(customId: string, value: string, userId?: string): Click {
	return finish(
		customId,
		{
			...MessageComponentStringSelectInteractionData,
			data: { component_type: ComponentType.StringSelect, custom_id: customId, values: [value] }
		},
		userId
	);
}

export function fakeCommandInteraction(userId: string) {
	return { user: { id: userId }, reply: vi.fn(async (_data: unknown) => undefined) };
}
