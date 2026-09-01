import { TestableClient } from '@wolfstar/http-framework-test-utils';
import { Events, type ClientEvents } from '../../src/index.js';

describe('Events', () => {
	test('GIVEN the enum THEN every member holds the event name it is named after', () => {
		expect(Events.Error).toBe('error');
		expect(Events.PluginLoaded).toBe('pluginLoaded');
		expect(Events.CommandRun).toBe('commandRun');
		expect(Events.AutocompleteFinish).toBe('autocompleteFinish');
		expect(Events.InteractionHandlerNameInvalid).toBe('interactionHandlerNameInvalid');
		expect(Events.HmrPieceUnloaded).toBe('hmrPieceUnloaded');
	});

	test('GIVEN the enum THEN its values are unique', () => {
		const values = Object.values(Events);
		expect(new Set(values).size).toBe(values.length);
	});

	test('GIVEN the enum THEN every member is a key of ClientEvents', () => {
		// `ClientEvents` is erased at runtime, so the mapping is asserted at the type level and the values are
		// checked against the names emitted throughout the library.
		const members: `${Events}`[] = Object.values(Events);
		const keys: (keyof ClientEvents)[] = members;
		expect(keys).toEqual(members);
	});

	test('GIVEN a listener registered with an enum member THEN it receives the emission made with the string', () => {
		const client = new TestableClient();
		const listener = vi.fn();

		client.on(Events.HmrStart, listener);
		client.emit('hmrStart', ['/pieces']);

		expect(listener).toHaveBeenCalledWith(['/pieces']);
	});

	test('GIVEN a listener registered with a string THEN it receives the emission made with the enum member', () => {
		const client = new TestableClient();
		const listener = vi.fn();

		client.on('error', listener);
		const error = new Error('boom');
		client.emit(Events.Error, error);

		expect(listener).toHaveBeenCalledWith(error);
	});
});
