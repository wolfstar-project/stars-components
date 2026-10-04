import { spawnSync } from 'node:child_process';
import { PassThrough } from 'node:stream';
import { describeCommands, generateCompletions, runCompletions, SHELLS } from '../src/commands/completions.js';
import { commands } from '../src/commands/index.js';

describe('stars completions', () => {
	test('describes every registered command, its flags and its subcommands', async () => {
		const tree = await describeCommands(commands);
		expect(tree.map((command) => command.name)).toEqual(Object.keys(commands));

		const dev = tree.find((command) => command.name === 'dev')!;
		expect(dev.flags.map((flag) => flag.name)).toEqual(expect.arrayContaining(['config', 'cwd', 'tui', 'theme', 'layout', 'channel', 'level']));
		const nested = tree.find((command) => command.name === 'commands')!;
		expect(nested.subcommands.map((command) => command.name)).toEqual(['list', 'clean', 'diff', 'deploy']);
		expect(nested.subcommands.find((command) => command.name === 'diff')!.flags.map((flag) => flag.name)).toContain('check');
		// A positional argument is not a flag.
		expect(tree.find((command) => command.name === 'completions')!.flags).toEqual([]);
	});

	test.each(SHELLS)('generates a %s script naming the commands and their flags', async (shell) => {
		const script = generateCompletions(shell, await describeCommands(commands));
		for (const name of ['dev', 'build', 'doctor', 'commands', 'deploy']) expect(script).toContain(name);
		expect(script).toContain('layout');
		expect(script).toContain('stars');
	});

	test.each(['bash', 'zsh'] as const)('the %s script is valid syntax', async (shell) => {
		const script = generateCompletions(shell, await describeCommands(commands));
		const result = spawnSync(shell, ['-n'], { input: script, encoding: 'utf8' });
		// A machine without the shell cannot check it; one with it must accept the script.
		if (result.error) return;
		expect(result.stderr).toBe('');
		expect(result.status).toBe(0);
	});

	test('bash completes commands, subcommands and flags', async () => {
		const script = generateCompletions('bash', await describeCommands(commands));
		const complete = (...words: string[]) => {
			const line = `${script}\nCOMP_WORDS=(${words.map((word) => `'${word}'`).join(' ')}); COMP_CWORD=${words.length - 1}; _stars; echo "\${COMPREPLY[@]}"`;
			return spawnSync('bash', ['-c', line], { encoding: 'utf8' });
		};
		const first = complete('stars', 'd');
		if (first.error) return;
		expect(first.stdout.trim().split(' ')).toEqual(['dev', 'doctor']);
		expect(complete('stars', 'commands', 'd').stdout.trim().split(' ')).toEqual(['diff', 'deploy']);
		expect(complete('stars', 'commands', 'diff', '--ch').stdout.trim()).toBe('--check');
		expect(complete('stars', 'dev', '--l').stdout.trim().split(' ')).toEqual(['--layout', '--level']);
	});

	test('rejects an unknown shell and prints through the command', async () => {
		expect(() => generateCompletions('powershell', [])).toThrow(expect.objectContaining({ code: 'UNKNOWN_SHELL' }));

		const stdout = new PassThrough();
		let output = '';
		stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));
		await runCompletions({ shell: 'fish', stdout });
		expect(output).toContain('complete -c stars');
		expect(output).toContain("-a dev -d 'Build, run and restart the bot on changes'");
	});
});
