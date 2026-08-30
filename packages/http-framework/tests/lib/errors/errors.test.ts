import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import { ArgumentError, Identifiers, PreconditionError, UserError } from '../../../src/index.js';

describe('UserError', () => {
	test('GIVEN identifier only THEN sets defaults', () => {
		const error = new UserError({ identifier: Identifiers.ArgumentMissing });

		expect(error).toBeInstanceOf(Error);
		expect(error.name).toBe('UserError');
		expect(error.identifier).toBe(Identifiers.ArgumentMissing);
		expect(error.message).toBe('');
		expect(error.context).toBeNull();
	});

	test('GIVEN message and context THEN stores them', () => {
		const context = { received: 2, minimum: 3 };
		const error = new UserError({ identifier: Identifiers.ArgumentIntegerTooSmall, message: 'Too small', context });

		expect(error.message).toBe('Too small');
		expect(error.context).toBe(context);
	});
});

describe('ArgumentError', () => {
	test('GIVEN no identifier THEN defaults to the argument name', () => {
		const error = new ArgumentError({ argument: 'amount', parameter: 0 });

		expect(error).toBeInstanceOf(UserError);
		expect(error.name).toBe('ArgumentError');
		expect(error.identifier).toBe('amount');
		expect(error.argument).toBe('amount');
		expect(error.parameter).toBe(0);
		expect(error.type).toBeNull();
	});

	test('GIVEN identifier and type THEN uses them', () => {
		const error = new ArgumentError({
			argument: 'amount',
			parameter: 0,
			type: ApplicationCommandOptionType.Integer,
			identifier: Identifiers.ArgumentIntegerTooSmall,
			message: 'The amount must be at least 1.',
			context: { minimum: 1 }
		});

		expect(error.identifier).toBe(Identifiers.ArgumentIntegerTooSmall);
		expect(error.type).toBe(ApplicationCommandOptionType.Integer);
		expect(error.message).toBe('The amount must be at least 1.');
		expect(error.context).toEqual({ minimum: 1 });
	});
});

describe('PreconditionError', () => {
	test('GIVEN no identifier THEN defaults to the precondition name', () => {
		const error = new PreconditionError({ precondition: 'GuildIds' });

		expect(error).toBeInstanceOf(UserError);
		expect(error.name).toBe('PreconditionError');
		expect(error.identifier).toBe('GuildIds');
		expect(error.precondition).toBe('GuildIds');
		expect(error.context).toBeNull();
	});

	test('GIVEN identifier THEN uses it', () => {
		const error = new PreconditionError({
			precondition: 'GuildIds',
			identifier: Identifiers.PreconditionGuildIds,
			message: 'Not available here',
			context: { guildIds: ['737141877803057244'] }
		});

		expect(error.identifier).toBe(Identifiers.PreconditionGuildIds);
		expect(error.message).toBe('Not available here');
		expect(error.context).toEqual({ guildIds: ['737141877803057244'] });
	});
});
