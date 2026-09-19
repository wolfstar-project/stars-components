import { ExitCode } from '../src/utils/errors.js';
import { runDev } from '../src/commands/dev.js';
import { KEEPALIVE_SCRIPT, createFixture, waitFor, type Fixture } from './helpers.js';

describe('runDev', () => {
	let fixture: Fixture;
	const nodeEnv = process.env.NODE_ENV;

	beforeEach(async () => {
		fixture = await createFixture({
			'package.json': '{"name":"bot","type":"module"}',
			'src/main.js': KEEPALIVE_SCRIPT,
			'stars.config.mjs': "export default { build: { tool: 'none' }, imports: false, dev: { typecheck: false } };"
		});
	});

	afterEach(async () => {
		process.env.NODE_ENV = nodeEnv;
		vi.restoreAllMocks();
		await fixture.cleanup();
	});

	test('runs the bot in development mode and shuts down cleanly on SIGTERM', async () => {
		const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
		const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

		void runDev({ cwd: fixture.root, tui: false });
		await waitFor(() => write.mock.calls.some(([chunk]) => String(chunk).includes('ready')), 15_000);

		expect(process.env.NODE_ENV).toBe('development');
		process.emit('SIGTERM');
		await waitFor(() => exit.mock.calls.length > 0, 15_000);

		expect(exit).toHaveBeenCalledWith(ExitCode.Terminated);
	});

	test('rejects an unknown theme before touching the config', async () => {
		await expect(runDev({ cwd: fixture.root, theme: 'not-a-real-theme' })).rejects.toMatchObject({ code: 'INVALID_THEME' });
	});
});
