import { envParseInteger, envParseString, setup } from '@wolfstar/env-utilities';
import { container } from '@wolfstar/http-framework';
import { createInMemoryCache } from '@wolfstar/plugin-cache';
import { GatewayClient } from '@wolfstar/plugin-gateway';
import { GatewayIntentBits } from 'discord-api-types/v10';
import { registerCommands } from './lib/register-commands.js';

setup();

const client = new GatewayClient({
	// `MessageContent` is privileged: enable it under Bot → Privileged Gateway Intents in the Developer Portal.
	intents: GatewayIntentBits.Guilds | GatewayIntentBits.GuildMessages | GatewayIntentBits.MessageContent,
	// Every dispatch is written into the cache before its event is emitted. Keep the latest 1,000 messages, every
	// other entity is unbounded.
	cache: createInMemoryCache({ maxSize: { messages: 1_000 } })
});

client.on('error', (error) => container.logger.error(error));

const address = envParseString('HTTP_ADDRESS', '0.0.0.0');
const port = envParseInteger('HTTP_PORT', 3000);

// Loads the pieces (the `/server` command and the gateway listeners), starts the HTTP interactions endpoint, then
// connects every gateway shard.
await client.start({ listen: { address, port } });
void registerCommands();

container.logger.info(`Listening on ${address}:${port}`);
