import { container } from '@sapphire/pieces';
import { TestableClient, makeResponse } from '@wolfstar/http-framework-test-utils';
import { handleError } from '../../../src/lib/interactions/utils/util.js';
import { ErrorMessages } from '../../../src/lib/utils/constants.js';

describe('handleError', () => {
	const error = new Error('boom');
	let client: TestableClient;
	let onError: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		client = new TestableClient();
		container.client = client;
		onError = vi.fn();
		client.on('error', onError as never);
	});

	test('GIVEN a pending response THEN it emits the error and replies with a 500', () => {
		const response = makeResponse();
		const end = vi.spyOn(response, 'end');

		expect(handleError(response, error)).toBe(response);

		expect(onError).toHaveBeenCalledExactlyOnceWith(error);
		expect(response.statusCode).toBe(500);
		expect(end).toHaveBeenCalledExactlyOnceWith(ErrorMessages.InternalError);
	});

	test('GIVEN a response that already ended but did not close yet THEN it emits the error and writes nothing', () => {
		const response = makeResponse();
		response.end('first');
		expect(response.writableEnded).toBe(true);
		expect(response.closed).toBe(false);
		const end = vi.spyOn(response, 'end');

		expect(() => handleError(response, error)).not.toThrow();

		expect(onError).toHaveBeenCalledExactlyOnceWith(error);
		expect(response.statusCode).toBe(200);
		expect(end).not.toHaveBeenCalled();
	});

	test('GIVEN a response that already closed THEN it emits the error and writes nothing', () => {
		const response = makeResponse();
		Object.defineProperty(response, 'closed', { value: true });
		const end = vi.spyOn(response, 'end');

		handleError(response, error);

		expect(onError).toHaveBeenCalledExactlyOnceWith(error);
		expect(end).not.toHaveBeenCalled();
	});

	test('GIVEN httpReplyOnError disabled THEN it emits the error and writes nothing', () => {
		container.client = new TestableClient({ httpReplyOnError: false });
		const clientOnError = vi.fn();
		container.client.on('error', clientOnError as never);
		const response = makeResponse();
		const end = vi.spyOn(response, 'end');

		handleError(response, error);

		expect(clientOnError).toHaveBeenCalledExactlyOnceWith(error);
		expect(end).not.toHaveBeenCalled();
	});
});
