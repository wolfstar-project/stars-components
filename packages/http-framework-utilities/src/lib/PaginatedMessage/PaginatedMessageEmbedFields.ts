import { EmbedLimits } from '@wolfstar/discord-utilities';
import type { APIEmbed, APIEmbedField } from 'discord-api-types/v10';
import { PaginatedMessage } from './PaginatedMessage.js';

/**
 * A {@linkcode PaginatedMessage} spreading embed fields over pages built from a template embed.
 */
export class PaginatedMessageEmbedFields extends PaginatedMessage {
	#template: APIEmbed = {};
	#items: APIEmbedField[] = [];
	#itemsPerPage = 10;

	public setTemplate(template: APIEmbed): this {
		this.#template = template;
		return this;
	}

	public setItems(items: APIEmbedField[]): this {
		this.#items = items;
		return this;
	}

	public setItemsPerPage(count: number): this {
		if (!Number.isInteger(count) || count < 1 || count > EmbedLimits.MaximumFields) {
			throw new RangeError(`Items per page must be an integer between 1 and ${EmbedLimits.MaximumFields}, received ${count}`);
		}

		this.#itemsPerPage = count;
		return this;
	}

	/**
	 * Builds the pages. Call it after the setters.
	 */
	public make(): this {
		for (let i = 0; i < this.#items.length; i += this.#itemsPerPage) {
			this.addPageEmbed({ ...this.#template, fields: this.#items.slice(i, i + this.#itemsPerPage) });
		}

		return this;
	}
}
