import { envParseInteger, envParseString } from '@wolfstar/env-utilities';
import { container } from '@wolfstar/http-framework';
import { createInMemoryCache } from '@wolfstar/plugin-cache';
import { GatewayClient } from '@wolfstar/plugin-gateway';
import { GatewayIntentBits } from 'discord-api-types/v10';
import { registerCommands } from './lib/register-commands.js';
import { shard, type ShardRequest } from './lib/shard.js';

const client = new GatewayClient({
	intents: GatewayIntentBits.Guilds,
	cache: createInMemoryCache(),
	// The gateway shards the manager assigned to this worker, and the total across every worker.
	...shard.gatewayOptions,
	// Identifies go through the manager, which grants one per `max_concurrency` bucket across every worker.
	gateway: { buildIdentifyThrottler: () => shard.identifyThrottler }
});

// Reuse the manager's `GET /gateway/bot` rather than requesting it again from every worker.
client.gateway.fetchGatewayInformation = () => shard.fetchGatewayInformation();
client.on('error', (error) => container.logger.error(error));

// Other workers (and the manager) ask this one through `broadcastRequest`, see `/guilds`.
shard.setRequestHandler(async (body: ShardRequest) => {
	if (body.type === 'guildCount') return client.cache!.guilds.getSize();
	throw new Error(`Unknown request ${String(body.type)}`);
});
shard.setCloseHandler(() => client.destroy());

// The worker is ready once every gateway shard it runs is.
let pending = shard.shards.length;
client.on('shardReady', () => {
	if (--pending === 0) void shard.ready();
});

const address = envParseString('HTTP_ADDRESS', '0.0.0.0');
const port = envParseInteger('HTTP_PORT', 3000);
await client.start({ listen: { address, port } });

// Every worker loads the same commands; one push is enough.
if (shard.id === 0) void registerCommands();
