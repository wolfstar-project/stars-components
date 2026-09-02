import type { ResolvedStarsConfig } from '@wolfstar/http-framework/config';
import { CliError } from './errors.js';
import { readDiscordCredentials } from './tunnel.js';

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
		throw new CliError('DISCORD_TOKEN is not set', {
			code: 'DISCORD_TOKEN_MISSING',
			hint: 'Set DISCORD_TOKEN in the environment or in the project .env file.'
		});
	}

	if (!credentials.applicationId) {
		throw new CliError('The Discord application id is not set', {
			code: 'DISCORD_APPLICATION_ID_MISSING',
			hint: 'Set DISCORD_APPLICATION_ID (or APPLICATION_ID) in the environment or in the project .env file.'
		});
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
			throw new CliError(`Discord answered ${response.status}${detail ? `: ${detail}` : ''}`, {
				code: 'DISCORD_REQUEST_FAILED',
				hint: response.status === 401 ? 'Check DISCORD_TOKEN.' : 'Check the application id and the bot permissions.'
			});
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
