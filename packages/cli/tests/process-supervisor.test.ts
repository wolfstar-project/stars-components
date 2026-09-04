import { createLineSplitter, ProcessSupervisor, type ProcessExit } from '../src/lib/process-supervisor.js';
import { CRASH_SCRIPT, KEEPALIVE_SCRIPT, waitFor } from './helpers.js';

function createSupervisor(script: string, killTimeout = 2000) {
	return new ProcessSupervisor({ command: process.execPath, args: ['-e', script], cwd: process.cwd(), env: process.env, killTimeout });
}

describe('ProcessSupervisor', () => {
	test('streams stdout and stderr line by line and stops on request', async () => {
		const supervisor = createSupervisor(KEEPALIVE_SCRIPT);
		const stdout: string[] = [];
		const stderr: string[] = [];
		const states: string[] = [];
		supervisor.on('stdout', (line) => stdout.push(line));
		supervisor.on('stderr', (line) => stderr.push(line));
		supervisor.on('state', (state) => states.push(state));

		supervisor.start();
		await waitFor(() => stdout.includes('ready') && stderr.includes('warned'));
		expect(supervisor.state).toBe('running');
		expect(supervisor.pid).toBeGreaterThan(0);

		const exit = new Promise<ProcessExit>((resolve) => supervisor.once('exit', resolve));
		await supervisor.stop();
		expect(await exit).toMatchObject({ requested: true });
		expect(supervisor.state).toBe('stopped');
		expect(supervisor.pid).toBeNull();
		expect(states).toEqual(['starting', 'running', 'stopping', 'stopped']);
	});

	test('reports crashes as unrequested exits', async () => {
		const supervisor = createSupervisor(CRASH_SCRIPT);
		const exit = new Promise<ProcessExit>((resolve) => supervisor.once('exit', resolve));
		supervisor.start();

		expect(await exit).toMatchObject({ code: 1, requested: false });
		expect(supervisor.state).toBe('crashed');
	});

	test('escalates to SIGKILL when the process ignores SIGTERM', async () => {
		const supervisor = createSupervisor("process.on('SIGTERM', () => {}); console.log('ready'); setInterval(() => {}, 1000);", 300);
		const lines: string[] = [];
		supervisor.on('stdout', (line) => lines.push(line));
		supervisor.start();
		await waitFor(() => lines.includes('ready'));

		const started = Date.now();
		await supervisor.stop();
		expect(Date.now() - started).toBeLessThan(5000);
		expect(supervisor.state).toBe('stopped');
	});

	test('stop() without a process resolves immediately and restart() starts again', async () => {
		const supervisor = createSupervisor(KEEPALIVE_SCRIPT);
		await supervisor.stop();
		supervisor.start();
		const firstPid = supervisor.pid;
		await waitFor(() => supervisor.state === 'running');
		await supervisor.restart();
		await waitFor(() => supervisor.state === 'running');
		expect(supervisor.pid).not.toBe(firstPid);
		await supervisor.stop();
	});
});

describe('createLineSplitter', () => {
	test('splits chunks on newlines and keeps partial lines until flushed', () => {
		const lines: string[] = [];
		const splitter = createLineSplitter((line) => lines.push(line));
		splitter.push('a\nb');
		splitter.push('c\r\nd');
		expect(lines).toEqual(['a', 'bc']);
		splitter.flush();
		expect(lines).toEqual(['a', 'bc', 'd']);
	});
});
