import type { InteractionHandler, Interactions } from '@wolfstar/http-framework';
import { ComponentType, type APIInteractionResponseCallbackData } from 'discord-api-types/v10';

export const DefaultWrongUserReply = 'These buttons are not for you.';

export const DefaultExpiredReply = 'This interaction has expired.';

/**
 * Anything an interactive message can be sent from: command and component interactions of `@wolfstar/http-framework`.
 */
export interface RunnableInteraction {
	readonly user: { readonly id: string };
	reply(data: APIInteractionResponseCallbackData): Promise<unknown>;
}

export type ComponentInteraction = Interactions.MessageComponentButton | Interactions.MessageComponentStringSelect;

export function isComponentInteraction(interaction: InteractionHandler.Interaction): interaction is ComponentInteraction {
	const type = (interaction.data as { component_type?: ComponentType }).component_type;
	return type === ComponentType.Button || type === ComponentType.StringSelect;
}

export function getSelectedValues(interaction: ComponentInteraction): string[] {
	return interaction.data.component_type === ComponentType.StringSelect ? interaction.data.values : [];
}
