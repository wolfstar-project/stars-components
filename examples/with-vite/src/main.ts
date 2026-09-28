import { envParseInteger, envParseString, setup } from '@wolfstar/env-utilities';
import { Client, container } from '@wolfstar/http-framework';
import { PingCommand } from './commands/ping.js';
import { registerCommands } from './lib/register-commands.js';

setup();

const client = new Client();

// Vite bundles the application into a single `dist/main.js`, so there is no `commands` directory next to it for the
// stores to scan: pieces are loaded explicitly instead.
await container.stores.loadPiece({ name: 'ping', piece: PingCommand, store: 'commands' });
await client.load({ baseUserDirectory: null });
void registerCommands();

const address = envParseString('HTTP_ADDRESS', '0.0.0.0');
const port = envParseInteger('HTTP_PORT', 3000);
await client.listen({ address, port });

container.logger.info(`Listening on ${address}:${port}`);
