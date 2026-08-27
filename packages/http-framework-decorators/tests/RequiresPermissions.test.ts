import type { BaseInteraction } from '@wolfstar/http-framework';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { Identifiers, MissingPermissionsError, RequiresClientPermissions, RequiresUserPermissions } from '../src/index.js';
import { makeInteraction } from './shared.js';

describe('RequiresUserPermissions', () => {
	class UserCommand {
		@RequiresUserPermissions('BanMembers')
		public chatInputRun(_interaction: BaseInteraction) {
			return 'ran';
		}
	}

	test('GIVEN a member with the permission THEN it runs the method', async () => {
		const interaction = makeInteraction({ guildId: '737141877803057244', memberPermissions: PermissionFlagsBits.BanMembers });
		await expect(new UserCommand().chatInputRun(interaction)).resolves.toBe('ran');
	});

	test('GIVEN a member with Administrator THEN it runs the method', async () => {
		const interaction = makeInteraction({ guildId: '737141877803057244', memberPermissions: PermissionFlagsBits.Administrator });
		await expect(new UserCommand().chatInputRun(interaction)).resolves.toBe('ran');
	});

	test('GIVEN a non-guild interaction THEN it runs the method', async () => {
		await expect(new UserCommand().chatInputRun(makeInteraction())).resolves.toBe('ran');
	});

	test('GIVEN a member without the permission THEN it throws MissingPermissionsError', async () => {
		const interaction = makeInteraction({ guildId: '737141877803057244', memberPermissions: PermissionFlagsBits.KickMembers });
		const promise = new UserCommand().chatInputRun(interaction) as unknown as Promise<string>;

		await expect(promise).rejects.toBeInstanceOf(MissingPermissionsError);
		await expect(promise).rejects.toMatchObject({
			identifier: Identifiers.RequiresUserPermissionsMissingPermissions,
			target: 'user',
			missing: PermissionFlagsBits.BanMembers,
			missingNames: ['BanMembers'],
			message: 'Sorry, but you are not allowed to do that. You are missing the permissions: BanMembers'
		});
	});
});

describe('RequiresClientPermissions', () => {
	class UserCommand {
		@RequiresClientPermissions('ManageMessages', PermissionFlagsBits.EmbedLinks)
		public chatInputRun(_interaction: BaseInteraction) {
			return 'ran';
		}
	}

	test('GIVEN an application with the permissions THEN it runs the method', async () => {
		const interaction = makeInteraction({ applicationPermissions: PermissionFlagsBits.ManageMessages | PermissionFlagsBits.EmbedLinks });
		await expect(new UserCommand().chatInputRun(interaction)).resolves.toBe('ran');
	});

	test('GIVEN no app_permissions THEN it runs the method', async () => {
		await expect(new UserCommand().chatInputRun(makeInteraction())).resolves.toBe('ran');
	});

	test('GIVEN an application missing a permission THEN it throws MissingPermissionsError', async () => {
		const interaction = makeInteraction({ applicationPermissions: PermissionFlagsBits.ManageMessages });
		const promise = new UserCommand().chatInputRun(interaction) as unknown as Promise<string>;

		await expect(promise).rejects.toBeInstanceOf(MissingPermissionsError);
		await expect(promise).rejects.toMatchObject({
			identifier: Identifiers.RequiresClientPermissionsMissingPermissions,
			target: 'client',
			missing: PermissionFlagsBits.EmbedLinks,
			missingNames: ['EmbedLinks'],
			message: 'Sorry, but I am not allowed to do that. I am missing the permissions: EmbedLinks'
		});
	});
});
