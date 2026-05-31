import { envIsDefined, envParseString } from '@wolfstar/env-utilities';
import { container } from '@wolfstar/http-framework';

export async function registerCommands() {
	if (envIsDefined('REGISTRY_GUILD_ID')) {
		await container.applicationCommandRegistry.pushAllCommandsInGuild(envParseString('REGISTRY_GUILD_ID'));
	} else {
		await container.applicationCommandRegistry.pushGlobalCommands();
	}
}

declare module '@wolfstar/env-utilities' {
	interface Env {
		REGISTRY_GUILD_ID: string;
	}
}
