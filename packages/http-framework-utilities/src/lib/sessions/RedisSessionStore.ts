import type { SessionStore } from './SessionStore.js';

/**
 * The Redis commands {@linkcode RedisSessionStore} needs. An `ioredis` `Redis` or `Cluster` satisfies it as is.
 */
export interface RedisSessionClientLike {
	get(key: string): Promise<string | null>;
	set(key: string, value: string, mode: 'PX', ttl: number): Promise<unknown>;
	del(key: string): Promise<unknown>;
}

export interface RedisSessionStoreOptions {
	redis: RedisSessionClientLike;
	/**
	 * Prefix of every key, sessions live at `<prefix>:<id>`.
	 * @default 'wolfstar:sessions'
	 */
	prefix?: string;
}

/**
 * A {@linkcode SessionStore} shared between processes through Redis. Values are stored as JSON.
 */
export class RedisSessionStore<T = unknown> implements SessionStore<T> {
	readonly #redis: RedisSessionClientLike;
	readonly #prefix: string;

	public constructor(options: RedisSessionStoreOptions) {
		this.#redis = options.redis;
		this.#prefix = options.prefix ?? 'wolfstar:sessions';
	}

	public async get(id: string): Promise<T | null> {
		const raw = await this.#redis.get(this.#key(id));
		return raw === null ? null : (JSON.parse(raw) as T);
	}

	public async set(id: string, value: T, ttl: number): Promise<void> {
		await this.#redis.set(this.#key(id), JSON.stringify(value), 'PX', ttl);
	}

	public async delete(id: string): Promise<void> {
		await this.#redis.del(this.#key(id));
	}

	#key(id: string): string {
		return `${this.#prefix}:${id}`;
	}
}
