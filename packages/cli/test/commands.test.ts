import { PassThrough } from 'node:stream';
import type { ApplicationCommand, DiscordClient } from '../src/utils/discord.js';
import type { CommandsPrompt } from '../src/utils/prompts.js';
import { runCommandsClean, runCommandsDeploy, runCommandsDiff, runCommandsList } from '../src/commands/commands.js';
import type { CommandSnapshot } from '../src/dev/bridge.js';
import { readLocalCommands } from '../src/utils/local-commands.js';
import { loadStarsConfig } from '@wolfstar/schema';
import { createFixture, waitFor, type Fixture } from './helpers.js';

function createClient(
	commands: ApplicationCommand[]
): DiscordClient & { deleted: string[]; put: { guild: string | null; commands: readonly object[] }[] } {
	const deleted: string[] = [];
	const put: { guild: string | null; commands: readonly object[] }[] = [];
	return {
		deleted,
		put,
		putCommands: (guild, body) => {
			put.push({ guild, commands: body });
			return Promise.resolve(body.map((command, index) => ({ id: String(index), application_id: '42', ...(command as { name: string }) })));
		},
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

	test('clean --name aborts when a given prompt declines the single confirmation', async () => {
		const client = createClient([...DEPLOYED]);
		const prompt: CommandsPrompt = {
			pick: () => Promise.reject(new Error('the wizard must not run for --name')),
			confirm: () => Promise.resolve(false)
		};

		await expect(runCommandsClean({ cwd: fixture.root, names: ['ping'], prompt, client, stdout: new PassThrough() })).rejects.toMatchObject({
			code: 'ABORTED'
		});
		expect(client.deleted).toEqual([]);
	});

	test('clean --name (no prompt) aborts when a terminal answers anything but yes', async () => {
		const client = createClient([...DEPLOYED]);
		const stdin = Object.assign(new PassThrough(), { isTTY: true });
		const stdout = new PassThrough();
		let output = '';
		stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));

		const rejection = expect(runCommandsClean({ cwd: fixture.root, names: ['ping'], client, stdin, stdout })).rejects.toMatchObject({
			code: 'ABORTED'
		});

		await waitFor(() => output.includes('[y/N]'));
		stdin.emit('data', 'n\n');

		await rejection;
		expect(client.deleted).toEqual([]);
	});
	describe('diff and deploy', () => {
		const LOCAL: CommandSnapshot = {
			global: [
				{ name: 'ping', description: 'Pong' },
				{ name: 'echo', description: 'Echo' }
			],
			guilds: { '7': [{ name: 'admin', description: 'Admin' }] }
		};
		const REMOTE: ApplicationCommand[] = [
			{ id: '1', application_id: '42', name: 'ping', description: 'Ping', type: 1 },
			{ id: '2', application_id: '42', name: 'Report', type: 3 }
		];

		test('diff lists what a deploy would add, change and remove, without touching Discord', async () => {
			const client = createClient(REMOTE);
			const output = await capture((stdout) => runCommandsDiff({ cwd: fixture.root, client, stdout, local: LOCAL }));

			expect(output).toContain('3 difference(s) in the global scope');
			expect(output).toContain('~ ping changed');
			expect(output).toContain('+ echo added');
			expect(output).toContain('- Report (message) removed');
			expect(client.put).toEqual([]);
			expect(client.deleted).toEqual([]);
		});

		test('diff --json and --check, and an up to date scope', async () => {
			const client = createClient(REMOTE);
			const output = await capture((stdout) => runCommandsDiff({ cwd: fixture.root, client, stdout, local: LOCAL, json: true }));
			expect(JSON.parse(output)).toEqual({
				applicationId: '42',
				guildId: null,
				changes: [
					{ kind: 'changed', name: 'ping', type: 1, guild: null },
					{ kind: 'added', name: 'echo', type: 1, guild: null },
					{ kind: 'removed', name: 'Report', type: 3, guild: null }
				]
			});

			await expect(
				capture((stdout) => runCommandsDiff({ cwd: fixture.root, client, stdout, local: LOCAL, check: true }))
			).rejects.toMatchObject({ code: 'COMMANDS_DIFFER' });

			const same = createClient([{ id: '9', application_id: '42', name: 'admin', description: 'Admin', type: 1, version: '3' }]);
			const upToDate = await capture((stdout) =>
				runCommandsDiff({ cwd: fixture.root, client: same, stdout, local: LOCAL, guild: '7', check: true })
			);
			expect(upToDate).toContain('guild 7 is up to date');
		});

		test('deploy overwrites the scope with what the project defines, after a confirmation', async () => {
			const client = createClient(REMOTE);
			const confirm = vi.fn((_message: string) => Promise.resolve(true));
			const output = await capture((stdout) => runCommandsDeploy({ cwd: fixture.root, client, stdout, local: LOCAL, prompt: { confirm } }));

			expect(confirm).toHaveBeenCalledWith('Overwrite the commands of the global scope with the 2 the project defines?');
			expect(client.put).toEqual([{ guild: null, commands: LOCAL.global }]);
			expect(output).toContain('deployed 2 command(s) to the global scope');
		});

		test('deploy does nothing when declined, up to date, or unconfirmed from a script', async () => {
			const client = createClient(REMOTE);
			await expect(
				capture((stdout) =>
					runCommandsDeploy({ cwd: fixture.root, client, stdout, local: LOCAL, prompt: { confirm: () => Promise.resolve(false) } })
				)
			).rejects.toMatchObject({ code: 'ABORTED' });

			const stdin = Object.assign(new PassThrough(), { isTTY: false });
			await expect(capture((stdout) => runCommandsDeploy({ cwd: fixture.root, client, stdout, local: LOCAL, stdin }))).rejects.toMatchObject({
				code: 'DEPLOY_CONFIRMATION_REQUIRED'
			});

			const same = createClient([{ id: '9', application_id: '42', name: 'admin', description: 'Admin', type: 1 }]);
			const output = await capture((stdout) => runCommandsDeploy({ cwd: fixture.root, client: same, stdout, local: LOCAL, guild: '7' }));
			expect(output).toContain('nothing to deploy');
			expect([...client.put, ...same.put]).toEqual([]);
		});

		test('deploy --yes --json deploys a guild from a script', async () => {
			const client = createClient([]);
			const output = await capture((stdout) =>
				runCommandsDeploy({ cwd: fixture.root, client, stdout, local: LOCAL, guild: '7', yes: true, json: true })
			);
			expect(JSON.parse(output)).toMatchObject({ guildId: '7', deployed: 1, changes: [{ kind: 'added', name: 'admin' }] });
			expect(client.put).toEqual([{ guild: '7', commands: LOCAL.guilds['7'] }]);
		});
	});

	describe('readLocalCommands', () => {
		const FRAMEWORK = `
export const container = { stores: new Map(), client: null };
export class Client {
	static plugins = [];
	static use(plugin) { Client.plugins.push(plugin); }
	constructor() {
		container.client = this;
		this.registry = {
			getLoadedGlobalCommands: () => this.loaded ? [{ name: 'ping', description: 'Ping' }] : [],
			getLoadedGuildCommands: () => new Map([['7', [{ name: 'admin' }]]])
		};
		for (const plugin of Client.plugins) plugin.postInitialization?.(this);
	}
	async load() { this.loaded = true; }
	async listen() { console.error('listened'); setInterval(() => {}, 1000); }
}
`;
		const install = (version = '6.1.0') => ({
			'node_modules/@wolfstar/http-framework/package.json': JSON.stringify({
				name: '@wolfstar/http-framework',
				version,
				type: 'module',
				exports: './index.js'
			}),
			'node_modules/@wolfstar/http-framework/index.js': FRAMEWORK
		});

		test('reads the commands from the built bot, which exits before it listens', async () => {
			fixture = await createFixture({
				...install(),
				'package.json': '{ "type": "module" }',
				'src/main.js':
					"import { Client } from '@wolfstar/http-framework'; const client = new Client(); await client.load(); await client.listen();"
			});
			const config = await loadStarsConfig({ cwd: fixture.root, env: {} });

			expect(await readLocalCommands(config, { timeout: 10_000 })).toEqual({
				global: [{ name: 'ping', description: 'Ping' }],
				guilds: { '7': [{ name: 'admin' }] }
			});
		});

		test('explains why the commands cannot be read', async () => {
			fixture = await createFixture({ 'src/main.js': '' });
			let config = await loadStarsConfig({ cwd: fixture.root, env: {} });
			await expect(readLocalCommands(config)).rejects.toMatchObject({
				code: 'LOCAL_COMMANDS_UNAVAILABLE',
				message: expect.stringContaining('6.1.0')
			});

			// A bot that never loads its pieces has nothing to report.
			for (const [path, content] of Object.entries({
				...install(),
				'package.json': '{ "type": "module" }',
				'src/main.js': "console.error('no client here');"
			})) {
				await fixture.write(path, content);
			}
			config = await loadStarsConfig({ cwd: fixture.root, env: {} });
			await expect(readLocalCommands(config, { timeout: 10_000 })).rejects.toMatchObject({
				code: 'LOCAL_COMMANDS_UNAVAILABLE',
				message: expect.stringContaining('no client here')
			});

			config = { ...config, build: { ...config.build, output: `${config.build.output}.missing` } };
			await expect(readLocalCommands(config)).rejects.toMatchObject({ fix: expect.stringContaining('stars build') });
		});
	});
});
