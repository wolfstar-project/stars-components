import { EmbedLimits, MessageLimits } from '@wolfstar/discord-utilities';
import type { APIAllowedMentions, APIEmbed, APIInteractionResponseCallbackData } from 'discord-api-types/v10';

/**
 * The message body accepted by the interaction `reply`, `update`, and `followup` methods of `@wolfstar/http-framework`.
 */
export type MessageBuilderData = Pick<APIInteractionResponseCallbackData, 'content' | 'embeds' | 'components' | 'allowed_mentions' | 'flags' | 'tts'>;

export class MessageBuilder {
	#data: MessageBuilderData;

	public constructor(data: MessageBuilderData = {}) {
		this.#data = { ...data, embeds: data.embeds ? [...data.embeds] : undefined };
		if (this.#data.embeds === undefined) delete this.#data.embeds;
	}

	public setContent(content: string | null): this {
		return this.#set('content', content);
	}

	public setEmbeds(embeds: APIEmbed[] | null): this {
		return this.#set('embeds', embeds === null ? null : [...embeds]);
	}

	public addEmbeds(...embeds: APIEmbed[]): this {
		return this.#set('embeds', [...(this.#data.embeds ?? []), ...embeds]);
	}

	public setComponents(components: MessageBuilderData['components'] | null): this {
		return this.#set('components', components === null ? null : [...(components ?? [])]);
	}

	public setAllowedMentions(mentions: APIAllowedMentions | null): this {
		return this.#set('allowed_mentions', mentions);
	}

	public setFlags(flags: number | null): this {
		return this.#set('flags', flags);
	}

	public setTTS(tts = true): this {
		return this.#set('tts', tts);
	}

	/**
	 * Validates the body against Discord's limits and returns a copy of it.
	 * @throws `RangeError` naming the first field over its limit.
	 */
	public toJSON(): MessageBuilderData {
		validateMessage(this.#data);
		return structuredClone(this.#data);
	}

	#set<K extends keyof MessageBuilderData>(key: K, value: MessageBuilderData[K] | null): this {
		if (value === null || value === undefined) delete this.#data[key];
		else this.#data[key] = value;
		return this;
	}
}

function checkLength(path: string, value: string | undefined, maximum: number): number {
	const length = value?.length ?? 0;
	if (length > maximum) throw new RangeError(`${path} must be at most ${maximum} characters, received ${length}`);
	return length;
}

function checkCount(path: string, values: readonly unknown[] | undefined, maximum: number): void {
	const count = values?.length ?? 0;
	if (count > maximum) throw new RangeError(`${path} must contain at most ${maximum} entries, received ${count}`);
}

/**
 * Validates a message body against Discord's limits.
 * @throws `RangeError` naming the first field over its limit.
 */
export function validateMessage(data: MessageBuilderData): void {
	checkLength('content', data.content, MessageLimits.MaximumLength);
	checkCount('components', data.components, MessageLimits.MaximumActionRows);
	checkCount('embeds', data.embeds, MessageLimits.MaximumEmbeds);

	let total = 0;
	for (const [index, embed] of (data.embeds ?? []).entries()) {
		const path = `embeds[${index}]`;
		total += checkLength(`${path}.title`, embed.title, EmbedLimits.MaximumTitleLength);
		total += checkLength(`${path}.description`, embed.description, EmbedLimits.MaximumDescriptionLength);
		total += checkLength(`${path}.footer.text`, embed.footer?.text, EmbedLimits.MaximumFooterLength);
		total += checkLength(`${path}.author.name`, embed.author?.name, EmbedLimits.MaximumAuthorNameLength);
		checkCount(`${path}.fields`, embed.fields, EmbedLimits.MaximumFields);
		for (const [fieldIndex, field] of (embed.fields ?? []).entries()) {
			total += checkLength(`${path}.fields[${fieldIndex}].name`, field.name, EmbedLimits.MaximumFieldNameLength);
			total += checkLength(`${path}.fields[${fieldIndex}].value`, field.value, EmbedLimits.MaximumFieldValueLength);
		}
	}

	if (total > EmbedLimits.MaximumTotalCharacters) {
		throw new RangeError(`embeds must total at most ${EmbedLimits.MaximumTotalCharacters} characters, received ${total}`);
	}
}
