import '@wolfstar/env-utilities/setup';
import { Client } from '@wolfstar/http-framework';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORT ?? 3000);
const client = new Client();

await client.load({
	baseUserDirectory: dirname(fileURLToPath(import.meta.url))
});

if (process.env.REGISTER_COMMANDS === 'true') {
	const guildId = process.env.DISCORD_GUILD_ID;
	if (guildId) {
		await client.registry.pushAllCommandsInGuild(guildId);
	} else {
		await client.registry.pushGlobalCommands();
	}
}

await client.listen({ port });
console.log(`Bot is running on port ${port}`);
