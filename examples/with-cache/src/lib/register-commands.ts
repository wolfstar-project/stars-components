import { envIsDefined, envParseString } from '@wolfstar/env-utilities';
import { container } from '@wolfstar/http-framework';

/** Pushes the loaded commands to `REGISTRY_GUILD_ID` when set, globally otherwise. */
export async function registerCommands() {
	const registry = container.applicationCommandRegistry;
	if (envIsDefined('REGISTRY_GUILD_ID')) await registry.pushAllCommandsInGuild(envParseString('REGISTRY_GUILD_ID'));
	else await registry.pushGlobalCommands();
}
