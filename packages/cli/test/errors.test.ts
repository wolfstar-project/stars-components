import { CliError, ExitCode, exitCodeOf, formatError } from '../src/utils/errors.js';

describe('formatError', () => {
	test('prints a CliError as its message and hint, without a stack', async () => {
		const error = new CliError('Build failed', { code: 'BUILD_FAILED', hint: 'Check the logs', exitCode: ExitCode.BuildFailed });

		await expect(formatError(error)).resolves.toBe('Build failed\n  hint: Check the logs');
		expect(exitCodeOf(error)).toBe(ExitCode.BuildFailed);
	});

	test('renders an unexpected error as a report that carries its message', async () => {
		const output = await formatError(new TypeError('boom from a bug'));

		expect(output).toContain('boom from a bug');
	});

	test('stringifies a non-error value', async () => {
		await expect(formatError('plain')).resolves.toBe('plain');
	});
});
