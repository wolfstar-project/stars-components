import { Diagnostic } from 'nostics';
import { cliDiagnostics } from '../src/utils/diagnostics.js';
import { ExitCode, exitCodeOf, formatError } from '../src/utils/errors.js';

describe('formatError', () => {
	test('prints a Diagnostic as its message and fix, without a stack', async () => {
		const error = cliDiagnostics.BUILD_FAILED({ message: 'Check the logs' });

		const output = await formatError(error);
		expect(output).toContain('Build failed: Check the logs');
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

describe('exitCodeOf', () => {
	test('defaults a CLI diagnostic to ExitCode.Error', () => {
		expect(exitCodeOf(cliDiagnostics.ABORTED({}))).toBe(ExitCode.Error);
	});

	test('maps BUILD_FAILED to ExitCode.BuildFailed', () => {
		expect(exitCodeOf(cliDiagnostics.BUILD_FAILED({ message: '' }))).toBe(ExitCode.BuildFailed);
	});

	test('defaults a non-diagnostic error to ExitCode.Error', () => {
		expect(exitCodeOf(new Error('boom'))).toBe(ExitCode.Error);
	});

	test('a Diagnostic instance not from either catalog still defaults to ExitCode.Error', () => {
		const generic = new Diagnostic({ code: 'SOMETHING_ELSE', why: 'boom' });
		expect(exitCodeOf(generic)).toBe(ExitCode.Error);
	});
});
