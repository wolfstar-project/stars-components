import type { APIRole } from 'discord-api-types/v10';
import type { Command, MakeArguments, TransformedArguments } from '../../src/index.js';

declare module '../../src/index.js' {
	interface CommandOptionsRegistry {
		ping: {};
		'stickyroles add': { role: TransformedArguments.Role; user: TransformedArguments.User };
		'subscriptions twitch add': {
			channel: TransformedArguments.Channel & { type: Extract<TransformedArguments.Channel['type'], 0 | 5> };
			message?: string;
			streamer: string;
			type: 'live' | 'offline';
		};
	}
}

/**
 * What `stars codegen` writes is an augmentation of `CommandOptionsRegistry`, so `Command.OptionsOf` has to see it and
 * the entries have to be the shapes the framework resolves the options to at runtime.
 */
describe('Command.OptionsOf', () => {
	test('reads the entry of a command path', () => {
		expectTypeOf<Command.OptionsOf<'stickyroles add'>>().toEqualTypeOf<{ role: APIRole; user: TransformedArguments.User }>();
	});

	test('keeps what the builder declared: required, optional and choices', () => {
		type Options = Command.OptionsOf<'subscriptions twitch add'>;
		expectTypeOf<Options['streamer']>().toEqualTypeOf<string>();
		expectTypeOf<Options['message']>().toEqualTypeOf<string | undefined>();
		expectTypeOf<Options['type']>().toEqualTypeOf<'live' | 'offline'>();
	});

	test('narrows a channel to the channel types of the builder', () => {
		type Channel = Command.OptionsOf<'subscriptions twitch add'>['channel'];
		expectTypeOf<Channel['type']>().toExtend<0 | 5>();
		expectTypeOf<2>().not.toExtend<Channel['type']>();
	});

	test('is the same shape MakeArguments gives for the same option types', () => {
		expectTypeOf<Command.OptionsOf<'stickyroles add'>>().toEqualTypeOf<MakeArguments<{ role: 'role'; user: 'user' }>>();
	});

	test('types the focused option of an autocomplete', () => {
		type Arguments = Command.AutocompleteArguments<Command.OptionsOf<'stickyroles add'>>;
		expectTypeOf<Arguments['focused']>().toEqualTypeOf<'role' | 'user' | null>();
		expectTypeOf<Arguments['user']>().toEqualTypeOf<TransformedArguments.User>();
	});

	test('only accepts a path the registry knows', () => {
		expectTypeOf<keyof import('../../src/index.js').CommandOptionsRegistry>().toEqualTypeOf<
			'ping' | 'stickyroles add' | 'subscriptions twitch add'
		>();
	});
});
