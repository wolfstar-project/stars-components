import type { IntegerString } from '@wolfstar/env-utilities';

declare module '@wolfstar/env-utilities' {
	interface Env {
		DISCORD_CLIENT_ID: string;
		DISCORD_TOKEN: string;
		DISCORD_PUBLIC_KEY: string;

		HTTP_ADDRESS: string;
		HTTP_PORT: IntegerString;
		HTTP_POST_PATH: string;

		REGISTRY_GUILD_ID: string;
	}
}
