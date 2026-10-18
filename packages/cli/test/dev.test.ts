import { createServer } from 'node:net';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
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

		void runDev({ cwd: fixture.root, tui: false, portConflict: 'continue' });
		await waitFor(() => write.mock.calls.some(([chunk]) => String(chunk).includes('ready')), 15_000);

		expect(process.env.NODE_ENV).toBe('development');
		process.emit('SIGTERM');
		await waitFor(() => exit.mock.calls.length > 0, 15_000);

		expect(exit).toHaveBeenCalledWith(ExitCode.Terminated);
	});

	test('fails an occupied port before initializing the builder or generating project files', async () => {
		const server = createServer();
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
		const address = server.address();
		if (!address || typeof address === 'string') throw new Error('Expected TCP address');
		await fixture.write(
			'stars.config.mjs',
			`import { writeFileSync } from 'node:fs'; export default { build: { tool: 'none' }, imports: false, hooks: { 'builder:created': () => writeFileSync(${JSON.stringify(join(fixture.root, 'builder-started'))}, '') }, dev: { typecheck: false, url: 'http://127.0.0.1:${address.port}', env: { HTTP_PORT: '${address.port}', HTTP_ADDRESS: '127.0.0.1' } } };`
		);
		try {
			await expect(runDev({ cwd: fixture.root, tui: false, portConflict: 'error' })).rejects.toMatchObject({ code: 'PORT_IN_USE' });
			expect(existsSync(join(fixture.root, 'builder-started'))).toBe(false);
			expect(existsSync(join(fixture.root, '.stars'))).toBe(false);
		} finally {
			await new Promise<void>((resolve) => server.close(() => resolve()));
		}
	});

	test('reports a fallback listener port when the display URL points at a proxy', async () => {
		const server = createServer();
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
		const address = server.address();
		if (!address || typeof address === 'string') throw new Error('Expected TCP address');
		const write = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
		await fixture.write(
			'stars.config.mjs',
			`export default { build: { tool: 'none' }, imports: false, hooks: { 'builder:created': () => { throw new Error('stop after preflight'); } }, dev: { typecheck: false, url: 'https://localhost/proxy', env: { HTTP_PORT: '${address.port}', HTTP_ADDRESS: '127.0.0.1' } } };`
		);
		try {
			await expect(runDev({ cwd: fixture.root, tui: false, portConflict: 'next' })).rejects.toThrow('stop after preflight');
			const output = write.mock.calls.map(([chunk]) => String(chunk)).join('');
			const selected = /Development listener port: (\d+)/.exec(output);
			expect(selected).not.toBeNull();
			expect(Number(selected![1])).toBeGreaterThan(address.port);
		} finally {
			await new Promise<void>((resolve) => server.close(() => resolve()));
		}
	});

	test.each([{ port: '0' }, { style: 'panel' }, { portConflict: 'silent' }])(
		'rejects invalid dev flags before touching the config: %j',
		async (flags) => {
			await expect(runDev({ cwd: '/missing/project', ...flags })).rejects.toMatchObject({ code: 'INVALID_OPTION' });
		}
	);

	test('rejects an unknown theme before touching the config', async () => {
		await expect(runDev({ cwd: fixture.root, theme: 'not-a-real-theme' })).rejects.toMatchObject({ code: 'INVALID_THEME' });
	});
});
