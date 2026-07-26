import { container } from '@wolfstar/http-framework';
import { ChatInputApplicationCommandInteractionData, createTestHarness } from '@wolfstar/http-framework-test-utils';
import { MessageFlags } from 'discord-api-types/v10';
import { describe, expect, it } from 'vitest';
import { UserCommand } from '../src/commands/ping.js';

describe('ping command', () => {
	it('replies with Pong', async () => {
		const { client, runner } = createTestHarness();

		await container.stores.loadPiece({ name: 'ping', piece: UserCommand, store: 'commands' });
		await client.load({ baseUserDirectory: null });

		const result = await runner.run({
			...ChatInputApplicationCommandInteractionData,
			data: {
				id: '0',
				name: 'ping',
				type: 1,
				options: []
			}
		});

		expect(result).toHaveStatus(200);
		expect(result.json()).toMatchObject({
			type: 4,
			data: {
				content: 'Pong!',
				flags: MessageFlags.Ephemeral
			}
		});
	});
});
