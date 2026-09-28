import type { APIEmbed } from 'discord-api-types/v10';
import { PaginatedMessage } from './PaginatedMessage.js';

/**
 * A {@linkcode PaginatedMessage} listing items as lines of a single embed field per page.
 */
export class PaginatedFieldMessageEmbed<T> extends PaginatedMessage {
	#template: APIEmbed = {};
	#title: string | null = null;
	#items: T[] = [];
	#formatter: (item: T, index: number) => string = (item) => String(item);
	#itemsPerPage = 10;

	public setTemplate(template: APIEmbed): this {
		this.#template = template;
		return this;
	}

	public setTitleField(title: string): this {
		this.#title = title;
		return this;
	}

	public setItems(items: T[]): this {
		this.#items = items;
		return this;
	}

	public formatItems(formatter: (item: T, index: number) => string): this {
		this.#formatter = formatter;
		return this;
	}

	public setItemsPerPage(count: number): this {
		if (!Number.isInteger(count) || count < 1) throw new RangeError(`Items per page must be a positive integer, received ${count}`);
		this.#itemsPerPage = count;
		return this;
	}

	/**
	 * Builds the pages. Call it after the setters.
	 */
	public make(): this {
		if (this.#title === null) throw new Error('PaginatedFieldMessageEmbed requires a title field');

		for (let i = 0; i < this.#items.length; i += this.#itemsPerPage) {
			const value = this.#items
				.slice(i, i + this.#itemsPerPage)
				.map((item, offset) => this.#formatter(item, i + offset))
				.join('\n');
			this.addPageEmbed({ ...this.#template, fields: [{ name: this.#title, value }] });
		}

		return this;
	}
}
