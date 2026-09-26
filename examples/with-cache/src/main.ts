import { envIsDefined, envParseInteger, envParseString, setup } from '@wolfstar/env-utilities';
import { container } from '@wolfstar/http-framework';
import { GatewayClient } from '@wolfstar/plugin-gateway';
import { GatewayIntentBits } from 'discord-api-types/v10';
import { createCache } from './lib/cache.js';
import { registerCommands } from './lib/register-commands.js';

setup();

const client = new GatewayClient({
	intents: GatewayIntentBits.Guilds | GatewayIntentBits.GuildMembers | GatewayIntentBits.GuildMessages,
	cache: createCache(),
	// A cache read or write failure (Redis down, a corrupt value) is reported through `error`. `emitUncached` still
	// emits the event, built from the payload alone, instead of dropping it.
	cacheFailure: 'emitUncached'
});

client.on('error', (error) => container.logger.error(error));

const address = envParseString('HTTP_ADDRESS', '0.0.0.0');
const port = envParseInteger('HTTP_PORT', 3000);
await client.start({ listen: { address, port } });
void registerCommands();

container.logger.info(`Listening on ${address}:${port}, caching in ${envIsDefined('REDIS_URL') ? 'Redis' : 'memory'}`);
