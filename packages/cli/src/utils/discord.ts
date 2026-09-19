import type { ResolvedStarsConfig } from '@wolfstar/stars-config';
import { cliDiagnostics } from './diagnostics.js';
import { readDiscordCredentials } from '../dev/tunnel.js';

const API = 'https://discord.com/api/v10';

export interface ApplicationCommand {
	id: string;
	application_id: string;
	name: string;
	description?: string;
	type?: number;
	guild_id?: string;
	version?: string;
}

export interface DiscordClient {
	applicationId: string;
	listCommands(guildId: string | null): Promise<ApplicationCommand[]>;
	deleteCommand(guildId: string | null, commandId: string): Promise<void>;
}

export const COMMAND_TYPE_NAMES: Record<number, string> = { 1: 'chat input', 2: 'user', 3: 'message' };

/**
 * A minimal Discord REST client for what `stars commands` manages. The credentials come from the environment or the
 * project's `.env`, the same place the bot reads them from once it starts.
 */
export function createDiscordClient(config: ResolvedStarsConfig, env: NodeJS.ProcessEnv = process.env): DiscordClient {
	const credentials = readDiscordCredentials(config, env);
	if (!credentials) {
		throw cliDiagnostics.DISCORD_TOKEN_MISSING({});
	}

	if (!credentials.applicationId) {
		throw cliDiagnostics.DISCORD_APPLICATION_ID_MISSING({});
	}

	const applicationId = credentials.applicationId;
	const scope = (guildId: string | null) =>
		guildId ? `/applications/${applicationId}/guilds/${guildId}/commands` : `/applications/${applicationId}/commands`;

	const request = async (method: string, path: string): Promise<unknown> => {
		const response = await fetch(`${API}${path}`, {
			method,
			headers: { authorization: `Bot ${credentials.token}` },
			signal: AbortSignal.timeout(15_000)
		});

		if (response.status === 204) return null;

		const body: unknown = await response.json().catch(() => null);
		if (!response.ok) {
			const detail = typeof body === 'object' && body !== null && 'message' in body ? String((body as { message: unknown }).message) : '';
			throw cliDiagnostics.DISCORD_REQUEST_FAILED({ status: response.status, detail });
		}

		return body;
	};

	return {
		applicationId,
		async listCommands(guildId) {
			const body = await request('GET', scope(guildId));
			return Array.isArray(body) ? (body as ApplicationCommand[]) : [];
		},
		async deleteCommand(guildId, commandId) {
			await request('DELETE', `${scope(guildId)}/${commandId}`);
		}
	};
}
