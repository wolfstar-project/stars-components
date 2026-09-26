import { Client, container } from '@wolfstar/http-framework';
import { PingCommand } from './commands/ping.js';

// Nitro loads `.env` in development; in production the variables come from the deployment platform.
const client = new Client();

// Nitro bundles the application, dependencies included, into `.output/server`: pieces are loaded explicitly.
await container.stores.loadPiece({ name: 'ping', piece: PingCommand, store: 'commands' });
await client.load({ baseUserDirectory: null });

const guildId = process.env.REGISTRY_GUILD_ID;
void (guildId ? container.applicationCommandRegistry.pushAllCommandsInGuild(guildId) : container.applicationCommandRegistry.pushGlobalCommands());

// No `listen()`: the server entry Nitro generates imports this default export and forwards every request to
// `client.fetch(request)`, which verifies the signature and answers the interaction like `listen()` does.
export default client;
