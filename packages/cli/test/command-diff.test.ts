import { describeCommand, diffCommands, diffSnapshots, matchesDeployed, stableStringify } from '../src/utils/command-diff.js';

describe('command diff', () => {
	test('stableStringify ignores key order and undefined values', () => {
		expect(stableStringify({ b: 1, a: [{ d: 2, c: undefined }] })).toBe(stableStringify({ a: [{ d: 2 }], b: 1 }));
		expect(stableStringify({ a: 1 })).not.toBe(stableStringify({ a: 2 }));
	});

	test('reports added, removed and changed commands across scopes', () => {
		const changes = diffSnapshots(
			{ global: [{ name: 'ping', description: 'Ping' }, { name: 'old' }], guilds: { '1': [{ name: 'admin' }], '2': [{ name: 'gone' }] } },
			{
				global: [
					{ description: 'Pong', name: 'ping' },
					{ name: 'Report', type: 3 }
				],
				guilds: { '1': [{ name: 'admin' }], '3': [{ name: 'fresh' }] }
			}
		);

		expect(changes).toEqual([
			{ kind: 'changed', name: 'ping', type: 1, guild: null },
			{ kind: 'added', name: 'Report', type: 3, guild: null },
			{ kind: 'removed', name: 'old', type: 1, guild: null },
			{ kind: 'removed', name: 'gone', type: 1, guild: '2' },
			{ kind: 'added', name: 'fresh', type: 1, guild: '3' }
		]);
		expect(changes.map(describeCommand)).toEqual(['ping', 'Report (message)', 'old', 'gone @ 2', 'fresh @ 3']);
	});

	test('a chat input command and a context menu command of the same name are two commands', () => {
		expect(diffCommands([{ name: 'report' }], [{ name: 'report' }, { name: 'report', type: 2 }], null)).toEqual([
			{ kind: 'added', name: 'report', type: 2, guild: null }
		]);
	});

	test('matchesDeployed ignores what Discord fills in and catches what the project changed', () => {
		const local = {
			name: 'ping',
			description: 'Ping',
			default_member_permissions: 8,
			options: [{ type: 3, name: 'text', description: 'Text', required: true, choices: [] }]
		};
		const deployed = {
			id: '1',
			application_id: '2',
			version: '3',
			type: 1,
			name: 'ping',
			description: 'Ping',
			default_member_permissions: '8',
			dm_permission: true,
			nsfw: false,
			options: [{ type: 3, name: 'text', description: 'Text', required: true }]
		};

		expect(matchesDeployed(local, deployed)).toBe(true);
		expect(matchesDeployed({ ...local, description: 'Pong' }, deployed)).toBe(false);
		expect(matchesDeployed({ ...local, options: [] }, deployed)).toBe(false);
		expect(matchesDeployed({ ...local, nsfw: true }, deployed)).toBe(false);
		expect(matchesDeployed({ ...local, nsfw: false, options: local.options }, deployed)).toBe(true);
	});
});
