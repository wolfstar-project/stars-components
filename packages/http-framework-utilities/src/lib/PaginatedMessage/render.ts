import { MessageLimits } from '@wolfstar/discord-utilities';
import {
	ButtonStyle,
	ComponentType,
	type APIActionRowComponent,
	type APIButtonComponentWithCustomId,
	type APIComponentInMessageActionRow,
	type APIStringSelectComponent
} from 'discord-api-types/v10';
import { encodeCustomId, PaginatedMessageHandlerName } from '../custom-id.js';
import { selectWindow } from './state.js';
import type { PaginatedMessageButtonActionData, PaginatedMessageSession } from './types.js';

const ButtonsPerRow = 5;

export interface RenderOptions {
	disabled?: boolean;
}

export function renderComponents(
	sessionId: string,
	session: Pick<PaginatedMessageSession, 'index' | 'pages' | 'actions'>,
	options: RenderOptions = {}
): APIActionRowComponent<APIComponentInMessageActionRow>[] {
	const disabled = options.disabled ?? false;
	const buttons = session.actions
		.filter((action): action is PaginatedMessageButtonActionData => action.type === 'button')
		.map((action): APIButtonComponentWithCustomId => ({
			type: ComponentType.Button,
			style: action.style ?? ButtonStyle.Primary,
			custom_id: encodeCustomId(PaginatedMessageHandlerName, sessionId, action.id),
			label: action.label,
			emoji: action.emoji,
			disabled
		}));

	const maximumButtons = ButtonsPerRow * (MessageLimits.MaximumActionRows - 1);
	if (buttons.length > maximumButtons) {
		throw new RangeError(`A paginated message can have at most ${maximumButtons} buttons, received ${buttons.length}`);
	}

	const rows: APIActionRowComponent<APIComponentInMessageActionRow>[] = [];
	for (let i = 0; i < buttons.length; i += ButtonsPerRow) {
		rows.push({ type: ComponentType.ActionRow, components: buttons.slice(i, i + ButtonsPerRow) });
	}

	const select = session.actions.find((action) => action.type === 'select');
	if (select && session.pages.length > 1) {
		const component: APIStringSelectComponent = {
			type: ComponentType.StringSelect,
			custom_id: encodeCustomId(PaginatedMessageHandlerName, sessionId, 'select'),
			placeholder: select.placeholder,
			disabled,
			options: selectWindow(session.pages.length, session.index).map((page) => ({
				label: `Page ${page + 1}`,
				value: String(page),
				default: page === session.index
			}))
		};
		rows.push({ type: ComponentType.ActionRow, components: [component] });
	}

	if (rows.length > MessageLimits.MaximumActionRows) {
		throw new RangeError(`A paginated message can render at most ${MessageLimits.MaximumActionRows} action rows, received ${rows.length}`);
	}

	return rows;
}
