import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { changelogSection, parseSection, renderPackagesMessages, type PackageRelease, type TitleLookup } from '../src/packages.ts';

const CHANGELOG = `# @wolfstar/cli

## 2.12.0

### Minor Changes

- [#351](https://github.com/wolfstar-project/stars-components/pull/351) [\`3ae9bfb\`](https://github.com/wolfstar-project/stars-components/commit/3ae9bfbd35c1df49256b64e0ae3dd0c6a2094f10) - Let \`stars commands clean --name\` take the path of a subcommand. Discord cannot delete one. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#348](https://github.com/wolfstar-project/stars-components/pull/348) [\`a79b487\`](https://github.com/wolfstar-project/stars-components/commit/a79b487575d2b897a128e5a1f27abd82d614a24e) - Add \`stars dev --host [address]\`.

    A second paragraph. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- [#320](https://github.com/wolfstar-project/stars-components/pull/320) [\`8782557\`](https://github.com/wolfstar-project/stars-components/commit/87825570c600b4161fe870a89aa4ea60477df4bc) - fix(deps): update dependency ink to v8 Thanks [@renovate](https://github.com/apps/renovate)!
- Updated dependencies [[\`a79b487\`](https://github.com/wolfstar-project/stars-components/commit/a79b487575d2b897a128e5a1f27abd82d614a24e)]:
    - @wolfstar/vite-server@0.5.2
    - @wolfstar/nitro-server@0.2.13

## 2.11.0

### Minor Changes

- Something older.
`;

const titles: Record<number, string> = {
	351: 'feat(cli): let `stars commands clean --name` take a subcommand path',
	348: 'feat(cli)!: add `stars dev --host`',
	320: 'fix(deps): update dependency ink to v8'
};
const lookup: TitleLookup = async (pull) => (titles[pull] ? { title: titles[pull]!, author: 'someone' } : null);

describe('changelog parsing', () => {
	it('reads only the requested version', () => {
		const section = changelogSection(CHANGELOG, '2.12.0');
		assert.ok(section);
		assert.ok(!section.includes('Something older'));
		assert.equal(changelogSection(CHANGELOG, '9.9.9'), null);
	});

	it('splits entries, links, authors, and dependency updates', () => {
		const { entries, dependencies } = parseSection(changelogSection(CHANGELOG, '2.12.0')!);
		assert.equal(entries.length, 3);
		assert.deepEqual(
			entries.map((entry) => [entry.bump, entry.pull, entry.commit]),
			[
				['minor', 351, '3ae9bfb'],
				['minor', 348, 'a79b487'],
				['patch', 320, '8782557']
			]
		);
		assert.deepEqual(entries[0]!.authors, ['RedStar071']);
		assert.ok(entries[1]!.summary.includes('A second paragraph'));
		assert.ok(!entries[1]!.summary.includes('Thanks'));
		assert.deepEqual(dependencies, ['@wolfstar/vite-server@0.5.2', '@wolfstar/nitro-server@0.2.13']);
	});
});

describe('package messages', () => {
	const release = (): PackageRelease => ({
		name: '@wolfstar/cli',
		version: '2.12.0',
		...parseSection(changelogSection(CHANGELOG, '2.12.0')!)
	});

	it('renders Sapphire-style sections from pull request titles', async () => {
		const [message, ...rest] = await renderPackagesMessages(
			[release(), { name: '@wolfstar/kit', version: '0.3.2', entries: [], dependencies: [] }],
			{
				repository: 'wolfstar-project/stars-components',
				roleId: '123',
				date: '2026-11-06',
				lookup
			}
		);
		assert.equal(rest.length, 0);
		const content = message!.payload.content!;
		assert.ok(
			content.startsWith(
				'New announcement for <@&123>:\n# [@wolfstar/cli@2.12.0](<https://github.com/wolfstar-project/stars-components/releases/tag/%40wolfstar%2Fcli%402.12.0>) - (2026-11-06)'
			)
		);
		// The breaking marker wins over the feat type; the package scope is dropped.
		assert.match(content, /## 💥 Breaking Changes\n- Add `stars dev --host` \(\[a79b487\]/);
		assert.match(content, /## 🚀 Features\n- Let `stars commands clean --name` take a subcommand path .*\(\[#351\]\(<[^>]+>\) by @RedStar071\)/);
		assert.match(content, /## 📦 Dependencies\n- Update dependency ink to v8/);
		assert.match(content, /-# Also released with dependency updates only: \[@wolfstar\/kit@0\.3\.2\]/);
		assert.deepEqual(message!.payload.allowed_mentions, { parse: [], roles: ['123'] });
		assert.equal(message!.payload.flags, 4);
	});

	it('falls back to the first sentence of the summary without a pull request', async () => {
		const [message] = await renderPackagesMessages(
			[
				{
					name: '@wolfstar/kit',
					version: '1.0.0',
					dependencies: [],
					entries: [
						{
							bump: 'patch',
							pull: null,
							pullUrl: null,
							commit: null,
							commitUrl: null,
							authors: [],
							summary: 'fix the thing. More words here.'
						}
					]
				}
			],
			{ repository: 'o/r', roleId: '', date: '2026-11-06', lookup }
		);
		assert.match(message!.payload.content!, /## 🐛 Bug Fixes\n- Fix the thing\.$/);
	});

	it('splits many packages under the content limit', async () => {
		const many = Array.from({ length: 40 }, (_, index) => ({ ...release(), name: `@wolfstar/pkg-${index}` }));
		const messages = await renderPackagesMessages(many, { repository: 'o/r', roleId: '1', date: '2026-11-06', lookup });
		assert.ok(messages.length > 1);
		for (const message of messages) assert.ok(message.payload.content!.length <= 2000);
		assert.deepEqual(messages[1]!.payload.allowed_mentions, { parse: [] });
	});
});

describe('published packages input', () => {
	it('reads the changesets/action JSON and a manual list', async () => {
		const { parsePublished } = await import('../src/packages.ts');
		assert.deepEqual(parsePublished('[{"name":"@wolfstar/cli","version":"2.12.0"},{"name":1}]'), [{ name: '@wolfstar/cli', version: '2.12.0' }]);
		assert.deepEqual(parsePublished('@wolfstar/cli@2.12.0, @wolfstar/kit@0.3.1'), [
			{ name: '@wolfstar/cli', version: '2.12.0' },
			{ name: '@wolfstar/kit', version: '0.3.1' }
		]);
		assert.throws(() => parsePublished('cli'), /name@version/);
	});
});
