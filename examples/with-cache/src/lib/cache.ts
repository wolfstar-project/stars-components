import { envIsDefined, envParseString } from '@wolfstar/env-utilities';
import { createInMemoryCache, createRedisCache, type Cache } from '@wolfstar/plugin-cache';
import { Redis } from 'ioredis';

/**
 * A Redis cache when `REDIS_URL` is set, an in-memory one otherwise: swapping the store never changes the call sites,
 * the gateway client and its managers only see the `Cache` interface.
 */
export function createCache(): Cache {
	if (!envIsDefined('REDIS_URL')) return createInMemoryCache({ maxSize: { messages: 1_000 } });

	return createRedisCache({
		redis: new Redis(envParseString('REDIS_URL')),
		// Entries live at `<prefix>:<entity>:<key>`, so several bots can share one database.
		prefix: 'with-cache-example',
		// Values of 1 KiB or more are compressed; turning compression on or off never breaks reading stored values.
		compression: 'gzip',
		compressionThreshold: 1024,
		// Seconds; entity caches left out never expire.
		ttl: { messages: 60 * 60, users: 30 * 60 }
	});
}
