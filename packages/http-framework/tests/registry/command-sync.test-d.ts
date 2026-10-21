import type { ApplicationCommandRegistry, Client, ClientCommandOptions, ClientOptions } from '../../src/index.js';

describe('command registration types', () => {
	test('accepts opt-in registration and asynchronous process selection', () => {
		const options = {
			commands: { register: 'on-start', onConflict: 'log', guildIds: ['123'], removeUnknown: false, when: async () => true }
		} satisfies ClientOptions;
		expectTypeOf(options).toExtend<ClientOptions>();
		expectTypeOf<Client.CommandOptions>().toEqualTypeOf<ClientCommandOptions>();
	});
	test('restricts registration and conflict modes', () => {
		expectTypeOf<ClientCommandOptions['register']>().toEqualTypeOf<'off' | 'on-start' | undefined>();
		expectTypeOf<ApplicationCommandRegistry.SyncOptions['onConflict']>().toEqualTypeOf<'overwrite' | 'log' | 'ignore' | undefined>();
		expectTypeOf<ReturnType<ApplicationCommandRegistry['sync']>>().toEqualTypeOf<Promise<ApplicationCommandRegistry.SyncResult>>();
	});
});
