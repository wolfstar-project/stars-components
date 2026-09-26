import { ShardClient } from '@wolfstar/plugin-sharder';

/** Requests the shards answer, see `src/shard.ts`. */
export interface ShardRequest {
	type: 'guildCount';
}

/**
 * This process's handle on the manager. Constructing it signals the `Starting` status, so it only exists in shards:
 * import this module from shard-side code only.
 */
export const shard = new ShardClient();
