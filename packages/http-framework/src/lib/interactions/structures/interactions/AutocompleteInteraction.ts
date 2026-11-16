import {
	InteractionResponseType,
	type APIApplicationCommandAutocompleteInteraction,
	type APIApplicationCommandInteractionDataIntegerOption,
	type APIApplicationCommandInteractionDataNumberOption,
	type APIApplicationCommandInteractionDataStringOption
} from 'discord-api-types/v10';
import {
	extractTopLevelOptions,
	transformAutocompleteInteraction,
	type AutocompleteInteractionArguments,
	type TransformedArguments
} from '../../resolvers/InteractionOptions.js';
import { BaseInteraction } from './base/BaseInteraction.js';
import type { AutocompleteResponseData, AutocompleteResponseOptions } from './base/common.js';

export class AutocompleteInteraction extends BaseInteraction<AutocompleteInteraction.Type> {
	/**
	 * The options typed so far, resolved the same way as the ones the autocomplete handler receives.
	 *
	 * `focused` holds the name of the option being typed, and `subCommand` and `subCommandGroup` the names of the
	 * subcommand path, if any.
	 *
	 * @remarks Every access builds a new object. Read it once when you need several options.
	 * @seealso {@link AutocompleteInteraction.focused} for the focused option itself.
	 */
	public get options(): AutocompleteInteraction.Options {
		return transformAutocompleteInteraction(this.data.resolved ?? {}, this.data.options ?? []);
	}

	/**
	 * The option the user is typing in, or `null` when there is none.
	 *
	 * Only string, integer and number options can be autocompleted. Its `value` is what the user typed so far.
	 */
	public get focused(): AutocompleteInteraction.FocusedOption | null {
		const { options } = extractTopLevelOptions(this.data.options ?? []);
		return (options.find((option) => 'focused' in option && option.focused) as AutocompleteInteraction.FocusedOption | undefined) ?? null;
	}

	/**
	 * Responds to the interaction with an autocomplete result.
	 * @param data The data to be sent.
	 */
	public reply(data: AutocompleteResponseOptions): Promise<void> {
		const body: AutocompleteResponseData = { type: InteractionResponseType.ApplicationCommandAutocompleteResult, data };
		return this._sendReply(body);
	}

	/**
	 * Responds to the interaction with an empty autocomplete result.
	 */
	public replyEmpty(): Promise<void> {
		return this.reply({ choices: [] });
	}
}

export namespace AutocompleteInteraction {
	export type Type = APIApplicationCommandAutocompleteInteraction;
	export type Options = AutocompleteInteractionArguments<Record<string, TransformedArguments.Any>>;
	export type FocusedOption =
		| APIApplicationCommandInteractionDataStringOption
		| APIApplicationCommandInteractionDataIntegerOption
		| APIApplicationCommandInteractionDataNumberOption;
}
