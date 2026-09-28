import { fetchDependencyVersions, type VersionSelections } from '../src/tools/npmHelpers.js';

function makeSelections(overrides: Partial<VersionSelections> = {}): VersionSelections {
	return {
		i18n: false,
		subcommands: false,
		subcommandsAdvanced: false,
		testing: false,
		gateway: false,
		cache: false,
		redis: false,
		sharder: false,
		language: 'ts',
		buildTool: 'tsdown',
		linter: 'oxlint',
		formatter: 'oxfmt',
		...overrides
	};
}

function requestedPackageNames(fetchMock: ReturnType<typeof vi.fn>): string[] {
	// fetchVersion() calls `fetch(\`https://registry.npmjs.org/${packageName}/latest\`)`.
	return fetchMock.mock.calls.map(([url]) => {
		const match = /^https:\/\/registry\.npmjs\.org\/(.+)\/latest$/.exec(url as string);
		if (!match) throw new Error(`Unexpected fetch URL: ${url}`);
		return match[1]!;
	});
}

describe('fetchDependencyVersions', () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		fetchMock = vi.fn(async () => ({
			ok: true,
			status: 200,
			statusText: 'OK',
			json: async () => ({ version: '1.0.0' })
		}));
		vi.stubGlobal('fetch', fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test('GIVEN i18n enabled THEN requests both @wolfstar/plugin-i18next and @wolfstar/i18next-type-generator', async () => {
		await fetchDependencyVersions(makeSelections({ i18n: true }));

		const names = requestedPackageNames(fetchMock);

		expect(names).toContain('@wolfstar/plugin-i18next');
		expect(names).toContain('@wolfstar/i18next-type-generator');
	});

	test('GIVEN any selection THEN never requests @wolfstar/http-framework-i18n or @discordjs/builders', async () => {
		await fetchDependencyVersions(makeSelections({ i18n: true, subcommands: true, testing: true }));

		const names = requestedPackageNames(fetchMock);

		expect(names).not.toContain('@wolfstar/http-framework-i18n');
		expect(names).not.toContain('@discordjs/builders');
	});

	test('GIVEN i18n disabled THEN does not request @wolfstar/plugin-i18next or @wolfstar/i18next-type-generator', async () => {
		await fetchDependencyVersions(makeSelections({ i18n: false }));

		const names = requestedPackageNames(fetchMock);

		expect(names).not.toContain('@wolfstar/plugin-i18next');
		expect(names).not.toContain('@wolfstar/i18next-type-generator');
	});

	test('GIVEN testing enabled THEN requests vitest and @wolfstar/http-framework-test-utils', async () => {
		await fetchDependencyVersions(makeSelections({ testing: true }));

		const names = requestedPackageNames(fetchMock);

		expect(names).toContain('vitest');
		expect(names).toContain('@wolfstar/http-framework-test-utils');
	});

	test('GIVEN testing disabled THEN does not request vitest or @wolfstar/http-framework-test-utils', async () => {
		await fetchDependencyVersions(makeSelections({ testing: false }));

		const names = requestedPackageNames(fetchMock);

		expect(names).not.toContain('vitest');
		expect(names).not.toContain('@wolfstar/http-framework-test-utils');
	});

	test('GIVEN a resolved version THEN maps it back onto the requested package name', async () => {
		const versions = await fetchDependencyVersions(makeSelections({ i18n: true }));

		expect(versions['@wolfstar/plugin-i18next']).toBe('1.0.0');
		expect(versions['@wolfstar/http-framework']).toBe('1.0.0');
	});

	test('GIVEN tsc7 build tool THEN pins typescript to the rc version instead of fetching it', async () => {
		const versions = await fetchDependencyVersions(makeSelections({ buildTool: 'tsc7' }));
		const names = requestedPackageNames(fetchMock);

		expect(names).not.toContain('typescript');
		expect(names).not.toContain('tsc-watch');
		expect(versions['typescript']).toBe('7.0.1-rc');
	});

	test.each([
		makeSelections({ language: 'js' }),
		makeSelections({ language: 'ts', buildTool: 'tsdown' }),
		makeSelections({ language: 'ts', buildTool: 'tsc6' })
	])('GIVEN any project kind THEN requests @wolfstar/cli for the dev/build scripts', async (selections) => {
		await fetchDependencyVersions(selections);

		expect(requestedPackageNames(fetchMock)).toContain('@wolfstar/cli');
	});

	test.each([
		['gateway', { gateway: true }, ['@wolfstar/plugin-gateway'], ['@wolfstar/plugin-cache', '@wolfstar/plugin-sharder', 'ioredis']],
		['cache', { gateway: true, cache: true }, ['@wolfstar/plugin-gateway', '@wolfstar/plugin-cache'], ['ioredis']],
		['redis', { gateway: true, cache: true, redis: true }, ['@wolfstar/plugin-cache', 'ioredis'], ['@wolfstar/plugin-sharder']],
		['sharder', { gateway: true, sharder: true }, ['@wolfstar/plugin-gateway', '@wolfstar/plugin-sharder'], ['@wolfstar/plugin-cache', 'ioredis']]
	] as const)('GIVEN the %s feature THEN requests only its own packages', async (_name, selections, expected, unexpected) => {
		await fetchDependencyVersions(makeSelections(selections));

		const names = requestedPackageNames(fetchMock);
		for (const name of expected) expect(names).toContain(name);
		for (const name of unexpected) expect(names).not.toContain(name);
	});

	test('GIVEN no gateway feature THEN requests none of the gateway packages', async () => {
		await fetchDependencyVersions(makeSelections());

		const names = requestedPackageNames(fetchMock);
		expect(names.filter((name) => /plugin-(gateway|cache|sharder)|ioredis/.test(name))).toStrictEqual([]);
	});

	test('GIVEN the vite build tool THEN requests vite and typescript but neither nitro nor tsdown', async () => {
		await fetchDependencyVersions(makeSelections({ buildTool: 'vite' }));

		const names = requestedPackageNames(fetchMock);
		expect(names).toStrictEqual(expect.arrayContaining(['vite', 'typescript']));
		expect(names).not.toContain('nitro');
		expect(names).not.toContain('tsdown');
	});

	test('GIVEN the vite-nitro build tool THEN also requests nitro', async () => {
		await fetchDependencyVersions(makeSelections({ buildTool: 'vite-nitro' }));

		expect(requestedPackageNames(fetchMock)).toStrictEqual(expect.arrayContaining(['vite', 'nitro', 'typescript']));
	});

	test('GIVEN a JavaScript project with vite-nitro selected THEN requests neither vite nor nitro', async () => {
		await fetchDependencyVersions(makeSelections({ language: 'js', buildTool: 'vite-nitro' }));

		const names = requestedPackageNames(fetchMock);
		expect(names).not.toContain('vite');
		expect(names).not.toContain('nitro');
	});
});
