import { Collection } from '@discordjs/collection';
import { REST } from '@discordjs/rest';
import { TestableClient } from '@wolfstar/http-framework-test-utils';
import { Routes, type APIApplicationCommand } from 'discord-api-types/v10';
import { ApplicationCommandRegistry, ApplicationCommandRegistryEntry, type ClientCommandOptions } from '../../src/index.js';
import { commandSyncBody, matchesCommand } from '../../src/lib/interactions/shared/command-sync.js';

const ping: ApplicationCommandRegistryEntry.Command = { type: 1, name: 'ping', description: 'Ping!' };
const deployed = (command = ping, id = '10') => ({ ...command, id, application_id: '123', version: '1' }) as APIApplicationCommand;

function fixture() {
	const client = new TestableClient();
	const rest = new REST();
	const get = vi.spyOn(rest, 'get').mockResolvedValue([]);
	const post = vi.spyOn(rest, 'post').mockImplementation(async (_route, data) => ({ ...(data?.body as object), id: '20' }));
	const patch = vi.spyOn(rest, 'patch').mockImplementation(async (_route, data) => ({ ...(data?.body as object), id: '10' }));
	const remove = vi.spyOn(rest, 'delete').mockResolvedValue(undefined);
	const registry = new ApplicationCommandRegistry().setup({ rest, clientId: '123', authPrefix: 'Bearer' });
	vi.spyOn(registry, 'getLoadedGlobalCommands').mockReturnValue([ping]);
	vi.spyOn(registry, 'getLoadedGuildCommands').mockReturnValue(new Collection());
	const info = vi.spyOn(client.logger, 'info').mockImplementation(() => {});
	const warn = vi.spyOn(client.logger, 'warn').mockImplementation(() => {});
	return { registry, get, post, patch, remove, info, warn };
}

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllEnvs();
});

describe('ApplicationCommandRegistry.sync', () => {
	test('does not write equal commands and records their deployed ids', async () => {
		const { registry, get, post, patch, remove, info } = fixture();
		get.mockResolvedValue([{ ...deployed(), options: [], nsfw: false, default_member_permissions: null }]);
		const entry = new ApplicationCommandRegistryEntry();
		vi.spyOn(registry.store.router, 'getChatInput').mockReturnValue({ registry: entry } as never);
		expect(await registry.sync()).toEqual({ created: 0, updated: 0, removed: 0, unchanged: 1 });
		expect(entry.getGlobalId()).toBe('10');
		expect(get).toHaveBeenCalledWith(
			Routes.applicationCommands('123'),
			expect.objectContaining({ authPrefix: 'Bearer', query: new URLSearchParams({ with_localizations: 'true' }) })
		);
		expect(post).not.toHaveBeenCalled();
		expect(patch).not.toHaveBeenCalled();
		expect(remove).not.toHaveBeenCalled();
		expect(info).toHaveBeenCalledWith('Commands: 1 up to date');
	});

	test('creates and updates only differences, preserving unrelated commands', async () => {
		const { registry, get, post, patch, remove } = fixture();
		const added = { ...ping, name: 'new' };
		vi.mocked(registry.getLoadedGlobalCommands).mockReturnValue([ping, added]);
		get.mockResolvedValue([deployed({ ...ping, description: 'old' }), deployed({ ...ping, name: 'external' }, '30')]);
		expect(await registry.sync()).toEqual({ created: 1, updated: 1, removed: 0, unchanged: 0 });
		expect(patch).toHaveBeenCalledExactlyOnceWith(
			Routes.applicationCommand('123', '10'),
			expect.objectContaining({ body: expect.objectContaining(ping), authPrefix: 'Bearer' })
		);
		expect(post).toHaveBeenCalledExactlyOnceWith(
			Routes.applicationCommands('123'),
			expect.objectContaining({ body: expect.objectContaining(added) })
		);
		expect(remove).not.toHaveBeenCalled();
	});

	test('deletes unknown commands only with removeUnknown', async () => {
		const { registry, get, remove } = fixture();
		get.mockResolvedValue([deployed(), deployed({ ...ping, name: 'external' }, '30')]);
		expect(await registry.sync({ removeUnknown: true })).toEqual({ created: 0, updated: 0, removed: 1, unchanged: 1 });
		expect(remove).toHaveBeenCalledExactlyOnceWith(Routes.applicationCommand('123', '30'), { authPrefix: 'Bearer' });
	});

	test('log reports proposed changes without any writes', async () => {
		const { registry, get, post, patch, remove, warn } = fixture();
		get.mockResolvedValue([deployed({ ...ping, name: 'external' }, '30')]);
		expect(await registry.sync({ onConflict: 'log', removeUnknown: true })).toEqual({ created: 1, updated: 0, removed: 1, unchanged: 0 });
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('no changes written'));
		expect(post).not.toHaveBeenCalled();
		expect(patch).not.toHaveBeenCalled();
		expect(remove).not.toHaveBeenCalled();
	});

	test.each([{ onConflict: 'ignore' }, { when: async () => false }] satisfies ApplicationCommandRegistry.SyncOptions[])(
		'skips API calls and logs for %o',
		async (options) => {
			const { registry, get, post, info, warn } = fixture();
			await registry.sync(options);
			expect(get).not.toHaveBeenCalled();
			expect(post).not.toHaveBeenCalled();
			expect(info).not.toHaveBeenCalled();
			expect(warn).not.toHaveBeenCalled();
		}
	);

	test('syncs global and restricted guild scopes, recording guild ids', async () => {
		const { registry, get, post } = fixture();
		const restricted = { ...ping, name: 'guild' };
		vi.mocked(registry.getLoadedGuildCommands).mockReturnValue(new Collection([['456', [restricted]]]));
		get.mockResolvedValue([]);
		const entry = new ApplicationCommandRegistryEntry();
		vi.spyOn(registry.store.router, 'getChatInput').mockReturnValue({ registry: entry } as never);
		expect(await registry.sync()).toEqual({ created: 2, updated: 0, removed: 0, unchanged: 0 });
		expect(post.mock.calls.map(([route]) => route)).toEqual([Routes.applicationCommands('123'), Routes.applicationGuildCommands('123', '456')]);
		expect(entry.getGuildId('456')).toBe('20');
	});

	test('target guilds receive globals plus only their restricted commands, once per guild', async () => {
		const { registry, get, post } = fixture();
		vi.mocked(registry.getLoadedGuildCommands).mockReturnValue(
			new Collection([
				['456', [{ ...ping, name: 'guild' }]],
				['999', [{ ...ping, name: 'other' }]]
			])
		);
		await registry.sync({ guildIds: ['456', '456', '789'] });
		expect(get.mock.calls.map(([route]) => route)).toEqual([
			Routes.applicationGuildCommands('123', '456'),
			Routes.applicationGuildCommands('123', '789')
		]);
		expect(post.mock.calls.map(([, data]) => (data!.body as { name: string }).name)).toEqual(['ping', 'guild', 'ping']);
		expect(post.mock.calls[0]?.[1]?.body).not.toHaveProperty('dm_permission');
	});

	test('identifies commands by name and type', async () => {
		const { registry, get, post } = fixture();
		get.mockResolvedValue([deployed({ type: 2, name: 'ping' })]);
		await registry.sync();
		expect(post).toHaveBeenCalledOnce();
	});

	test('attempts later scopes after fetch failures and aggregates each scope with its cause', async () => {
		const { registry, get, post, info, warn } = fixture();
		vi.mocked(registry.getLoadedGuildCommands).mockReturnValue(
			new Collection([
				['456', [ping]],
				['789', [ping]]
			])
		);
		const globalFailure = new Error('Discord unavailable');
		const guildFailure = new Error('Missing access');
		get.mockRejectedValueOnce(globalFailure).mockRejectedValueOnce(guildFailure);
		await expect(registry.sync()).rejects.toMatchObject({
			name: 'AggregateError',
			errors: [
				expect.objectContaining({ message: 'Failed to synchronize commands in global scope', cause: globalFailure }),
				expect.objectContaining({ message: 'Failed to synchronize commands in guild 456', cause: guildFailure })
			]
		});
		expect(get.mock.calls.map(([route]) => route)).toEqual([
			Routes.applicationCommands('123'),
			Routes.applicationGuildCommands('123', '456'),
			Routes.applicationGuildCommands('123', '789')
		]);
		expect(post).toHaveBeenCalledExactlyOnceWith(Routes.applicationGuildCommands('123', '789'), expect.anything());
		expect(warn).toHaveBeenCalledWith('Commands: partial synchronization (1 created, 0 updated, 0 removed, 0 unchanged); 2 scopes failed');
		expect(info).not.toHaveBeenCalled();
	});

	test('continues after a write fails and logs successful writes from the partially applied scope', async () => {
		const { registry, post, warn } = fixture();
		vi.mocked(registry.getLoadedGlobalCommands).mockReturnValue([ping, { ...ping, name: 'new' }]);
		vi.mocked(registry.getLoadedGuildCommands).mockReturnValue(new Collection([['456', [ping]]]));
		const cause = new Error('Rate limit exhausted');
		post.mockResolvedValueOnce(deployed()).mockRejectedValueOnce(cause);
		await expect(registry.sync()).rejects.toMatchObject({ name: 'AggregateError', errors: [expect.objectContaining({ cause })] });
		expect(post.mock.calls.map(([route]) => route)).toEqual([
			Routes.applicationCommands('123'),
			Routes.applicationCommands('123'),
			Routes.applicationGuildCommands('123', '456')
		]);
		expect(warn).toHaveBeenCalledWith('Commands: partial synchronization (2 created, 0 updated, 0 removed, 0 unchanged); 1 scopes failed');
	});

	test('continues dry-run comparisons after a failed scope without writing or reporting applied changes', async () => {
		const { registry, get, post, patch, remove, warn } = fixture();
		get.mockRejectedValueOnce(new Error('Missing access'));
		await expect(registry.sync({ guildIds: ['456', '789'], onConflict: 'log' })).rejects.toBeInstanceOf(AggregateError);
		expect(get).toHaveBeenCalledTimes(2);
		expect(warn).toHaveBeenCalledWith(
			'Commands: differences detected; no changes written (1 created, 0 updated, 0 removed, 0 unchanged); 1 scopes failed'
		);
		expect(post).not.toHaveBeenCalled();
		expect(patch).not.toHaveBeenCalled();
		expect(remove).not.toHaveBeenCalled();
	});

	test('shares concurrent synchronization and allows retry after a failure', async () => {
		const { registry, get } = fixture();
		const cause = new Error('Discord unavailable');
		get.mockRejectedValueOnce(cause);
		const first = registry.sync();
		expect(registry.sync()).toBe(first);
		await expect(first).rejects.toMatchObject({ name: 'AggregateError', errors: [expect.objectContaining({ cause })] });
		await registry.sync();
		expect(get).toHaveBeenCalledTimes(2);
	});
});

describe('command comparison', () => {
	test('clears removed options, permissions and localizations', () => {
		const body = commandSyncBody(ping, null);
		expect(matchesCommand(body, { ...deployed(), options: [{ type: 3, name: 'old', description: 'old' }] })).toBe(false);
		expect(matchesCommand(body, { ...deployed(), default_member_permissions: '8' })).toBe(false);
		expect(matchesCommand(body, { ...deployed(), name_localizations: { it: 'prova' } })).toBe(false);
		expect(body).toMatchObject({ options: [], default_member_permissions: null, name_localizations: null, nsfw: false });
	});

	test.each(['contexts', 'integration_types', 'channel_types'])('compares unique values for %s', (field) => {
		expect(matchesCommand({ [field]: [0, 0] }, { [field]: [0, 1] })).toBe(false);
		expect(matchesCommand({ [field]: [0, 1] }, { [field]: [0, 0] })).toBe(false);
		expect(matchesCommand({ [field]: [0, 0, 1] }, { [field]: [1, 0] })).toBe(true);
	});

	test('normalizes Discord defaults and set ordering without losing meaningful order', () => {
		const local = commandSyncBody(
			{ ...ping, contexts: [0, 1], default_member_permissions: '8', options: [{ type: 3, name: 'input', description: 'Input' }] },
			null
		);
		const remote = {
			...local,
			id: '10',
			contexts: [1, 0],
			options: [{ type: 3, name: 'input', description: 'Input', required: false, autocomplete: false }]
		};
		expect(matchesCommand(local, remote)).toBe(true);
		expect(matchesCommand(local, { ...remote, options: [] })).toBe(false);
	});
});

describe('Client startup registration', () => {
	async function start(options?: ClientCommandOptions, fail = false) {
		const client = new TestableClient({
			commands: options,
			plugins: {
				name: 'test:post',
				postListen() {
					expect(sync).not.toHaveBeenCalled();
				}
			}
		});
		const sync = vi.spyOn(client.registry, 'sync');
		if (fail) sync.mockRejectedValue(new Error('Discord unavailable'));
		else sync.mockResolvedValue({ created: 0, updated: 0, removed: 0, unchanged: 1 });
		const warn = vi.spyOn(client.logger, 'warn').mockImplementation(() => {});
		await client.load({ baseUserDirectory: null });
		await client.listen({ port: 0 });
		await new Promise<void>((resolve) => client.server.close(() => resolve()));
		return { sync, warn };
	}

	test('defaults to off', async () => {
		expect((await start()).sync).not.toHaveBeenCalled();
	});
	test('runs after postListen hooks when enabled', async () => {
		const options = { register: 'on-start', when: () => true } as const;
		expect((await start(options)).sync).toHaveBeenCalledExactlyOnceWith(options);
	});
	test('warns on failure while keeping startup successful', async () => {
		const { sync, warn } = await start({ register: 'on-start' }, true);
		expect(sync).toHaveBeenCalledOnce();
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('registration failed'), expect.any(Error));
	});
	test('does not register while dumping commands for the CLI', async () => {
		vi.stubEnv('STARS_COMMANDS_DUMP', '1');
		expect((await start({ register: 'on-start' })).sync).not.toHaveBeenCalled();
	});
});
