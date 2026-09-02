import { PassThrough } from 'node:stream';
import type { ApplicationCommand, DiscordClient } from '../src/lib/discord.js';
import type { CommandsPrompt } from '../src/lib/prompts.js';
import { runCommandsClean, runCommandsList } from '../src/lib/tasks/commands.js';
import { createFixture, type Fixture } from './helpers.js';

function createClient(commands: ApplicationCommand[]): DiscordClient & { deleted: string[] } {
	const deleted: string[] = [];
	return {
		deleted,
		applicationId: '42',
		listCommands: () => Promise.resolve(commands.filter((command) => !deleted.includes(command.id))),
		deleteCommand: (_guildId, commandId) => {
			deleted.push(commandId);
			return Promise.resolve();
		}
	};
}

async function capture(run: (stdout: NodeJS.WritableStream) => Promise<void>): Promise<string> {
	const stream = new PassThrough();
	let output = '';
	stream.on('data', (chunk: Buffer) => (output += chunk.toString()));
	await run(stream);
	stream.end();
	return output;
}

const DEPLOYED: ApplicationCommand[] = [
	{ id: '1', application_id: '42', name: 'ping', type: 1 },
	{ id: '2', application_id: '42', name: 'Report', type: 3 }
];

describe('stars commands', () => {
	let fixture: Fixture;

	beforeEach(async () => {
		fixture = await createFixture({ 'src/main.js': '' });
	});

	afterEach(async () => {
		await fixture?.cleanup();
	});

	test('list --json reports what Discord has deployed', async () => {
		const client = createClient(DEPLOYED);
		const output = await capture((stdout) => runCommandsList({ cwd: fixture.root, json: true, client, stdout }));

		expect(JSON.parse(output)).toEqual({ applicationId: '42', guildId: null, commands: DEPLOYED });
	});

	test('list prints the command type for context menu entries', async () => {
		const client = createClient(DEPLOYED);
		const output = await capture((stdout) => runCommandsList({ cwd: fixture.root, client, stdout }));

		expect(output).toContain('ping');
		expect(output).toContain('Report (message)');
	});

	test('clean --yes deletes every deployed command', async () => {
		const client = createClient([...DEPLOYED]);
		await capture((stdout) => runCommandsClean({ cwd: fixture.root, yes: true, client, stdout }));

		expect(client.deleted).toEqual(['1', '2']);
	});

	test('clean --name only deletes the named command', async () => {
		const client = createClient([...DEPLOYED]);
		await capture((stdout) => runCommandsClean({ cwd: fixture.root, yes: true, names: ['ping'], client, stdout }));

		expect(client.deleted).toEqual(['1']);
	});

	test('clean rejects an unknown name and never deletes anything', async () => {
		const client = createClient([...DEPLOYED]);
		await expect(runCommandsClean({ cwd: fixture.root, yes: true, names: ['nope'], client, stdout: new PassThrough() })).rejects.toMatchObject({
			code: 'COMMAND_NOT_FOUND'
		});
		expect(client.deleted).toEqual([]);
	});

	test('clean runs the wizard: pick the commands, then confirm', async () => {
		const client = createClient([...DEPLOYED]);
		const asked: string[] = [];
		const prompt: CommandsPrompt = {
			pick: (commands, scope) => {
				asked.push(`pick:${scope}:${commands.map((command) => command.name).join(',')}`);
				return Promise.resolve(['2']);
			},
			confirm: (message) => {
				asked.push(`confirm:${message}`);
				return Promise.resolve(true);
			}
		};

		await capture((stdout) => runCommandsClean({ cwd: fixture.root, prompt, client, stdout }));

		expect(asked[0]).toBe('pick:the global scope:ping,Report');
		expect(asked[1]).toContain('Delete 1 command(s) from the global scope: Report');
		expect(client.deleted).toEqual(['2']);
	});

	test('clean deletes nothing when the wizard selection is empty or the confirmation is declined', async () => {
		const client = createClient([...DEPLOYED]);
		const empty: CommandsPrompt = { pick: () => Promise.resolve([]), confirm: () => Promise.resolve(true) };
		await capture((stdout) => runCommandsClean({ cwd: fixture.root, prompt: empty, client, stdout }));
		expect(client.deleted).toEqual([]);

		const declined: CommandsPrompt = { pick: () => Promise.resolve(['1']), confirm: () => Promise.resolve(false) };
		await expect(runCommandsClean({ cwd: fixture.root, prompt: declined, client, stdout: new PassThrough() })).rejects.toMatchObject({
			code: 'ABORTED'
		});
		expect(client.deleted).toEqual([]);
	});

	test('clean --name still asks for a single confirmation instead of the wizard', async () => {
		const client = createClient([...DEPLOYED]);
		const seen: string[] = [];
		const prompt: CommandsPrompt = {
			pick: () => Promise.reject(new Error('the wizard must not run for --name')),
			confirm: (message) => {
				seen.push(message);
				return Promise.resolve(true);
			}
		};

		await capture((stdout) => runCommandsClean({ cwd: fixture.root, names: ['ping'], prompt, client, stdout }));
		expect(seen).toHaveLength(1);
		expect(client.deleted).toEqual(['1']);
	});

	test('clean refuses to delete without a confirmation outside a terminal', async () => {
		const client = createClient([...DEPLOYED]);
		const stdin = Object.assign(new PassThrough(), { isTTY: false });
		await expect(runCommandsClean({ cwd: fixture.root, client, stdin, stdout: new PassThrough() })).rejects.toMatchObject({
			code: 'CONFIRMATION_REQUIRED'
		});
		expect(client.deleted).toEqual([]);
	});
});
