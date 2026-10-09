import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { detectVarlock } from '../../schema/src/config/varlock.js';
import { fetchDependencyVersions } from '../src/tools/npmHelpers.js';
import { ENV_LOADERS } from '../src/tools/options.js';
import { buildDependencies, writeProjectFiles, type ProjectContext } from '../src/tools/projectFiles.js';
import { processTemplate, resolveFeatureDirs, type TemplateContext } from '../src/tools/templateProcessor.js';
import { detectExistingVarlock } from '../src/tools/varlock.js';

// See `templateProcessor.test.ts`: the module locates `template/` as if it were bundled into `dist/index.js`.
vi.mock('node:url', async (importOriginal) => {
	const actual = await importOriginal<typeof import('node:url')>();
	return {
		...actual,
		fileURLToPath: (url: string | URL) => {
			const real = actual.fileURLToPath(url);
			return real.replace(/([\\/])src[\\/]tools[\\/]templateProcessor\.ts$/, '$1dist$1index.js');
		}
	};
});

const SCHEMA = '# @defaultRequired=false\nHTTP_PORT=4800\n';
const runtimeFixture = (name: string) => fileURLToPath(new URL(`../../env-utilities/tests/varlock-fixtures/detect/${name}`, import.meta.url));

describe('--env varlock', () => {
	let directory: string;

	beforeEach(async () => {
		directory = await mkdtemp(join(tmpdir(), 'create-http-framework-varlock-'));
	});

	afterEach(async () => {
		await rm(directory, { recursive: true, force: true });
	});

	const write = async (path: string, content: string) => {
		await mkdir(join(directory, path, '..'), { recursive: true });
		await writeFile(join(directory, path), content);
	};
	const read = (path: string) => readFile(join(directory, path), 'utf-8');

	test('varlock is the one loader --env scaffolds', () => {
		expect(ENV_LOADERS).toStrictEqual(['varlock']);
	});

	describe('detectExistingVarlock', () => {
		test.each(['src-schema', 'root-schema', 'load-path', 'none'])(
			'finds the schema of the env-utilities fixture %s like @wolfstar/schema does',
			(name) => {
				const root = runtimeFixture(name);
				expect(detectExistingVarlock(root).schema).toBe(detectVarlock(root).schema !== null);
			}
		);

		test('reads the varlock dependency, whichever section it is in', async () => {
			expect(detectExistingVarlock(directory)).toStrictEqual({ schema: false, dependency: false });

			await write('package.json', JSON.stringify({ dependencies: { varlock: '^1.0.0' } }));
			expect(detectExistingVarlock(directory)).toStrictEqual({ schema: false, dependency: true });

			await write('package.json', JSON.stringify({ devDependencies: { varlock: '^1.0.0' } }));
			expect(detectExistingVarlock(directory)).toStrictEqual({ schema: false, dependency: true });
		});

		test('reads a schema at the root, in src or through varlock.loadPath', async () => {
			await write('.env.schema', SCHEMA);
			expect(detectExistingVarlock(directory).schema).toBe(true);
			await rm(join(directory, '.env.schema'));

			await write('src/.env.schema', SCHEMA);
			expect(detectExistingVarlock(directory).schema).toBe(true);
			await rm(join(directory, 'src'), { recursive: true });

			await write('package.json', JSON.stringify({ varlock: { loadPath: 'config' } }));
			expect(detectExistingVarlock(directory).schema).toBe(true);
		});

		test('reports the varlock.loadPath, so a regenerated package.json can keep it', async () => {
			await write('package.json', JSON.stringify({ varlock: { loadPath: 'config' } }));
			expect(detectExistingVarlock(directory)).toStrictEqual({ schema: true, dependency: false, loadPath: 'config' });
		});

		test('copes with a package.json that is not JSON', async () => {
			await write('package.json', '{');
			expect(detectExistingVarlock(directory)).toStrictEqual({ schema: false, dependency: false });
		});
	});

	describe('fetchDependencyVersions', () => {
		test('resolves varlock only when the project uses it', async () => {
			const fetchMock = vi.fn(async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => ({ version: '1.0.0' }) }));
			vi.stubGlobal('fetch', fetchMock);
			const selections = {
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
				linter: 'none',
				formatter: 'none'
			} as const;
			try {
				expect(Object.keys(await fetchDependencyVersions(selections))).not.toContain('varlock');
				expect(Object.keys(await fetchDependencyVersions({ ...selections, varlock: true }))).toContain('varlock');
			} finally {
				vi.unstubAllGlobals();
			}
		});
	});

	describe('writeProjectFiles', () => {
		const versions: ProjectContext['versions'] = {
			'@wolfstar/http-framework': '1.0.0',
			'@wolfstar/cli': '1.0.0',
			'@sapphire/pieces': '1.0.0',
			'discord-api-types': '1.0.0',
			'@wolfstar/env-utilities': '1.0.0',
			'@wolfstar/start-banner': '1.0.0',
			'gradient-string': '1.0.0',
			'@types/node': '1.0.0',
			typescript: '1.0.0',
			tsdown: '1.0.0',
			vite: '1.0.0',
			nitro: '3.0.0-beta',
			varlock: '1.21.1'
		};
		const context = (overrides: Partial<ProjectContext> = {}): ProjectContext => ({
			name: 'bot',
			port: 3000,
			i18n: false,
			subcommands: false,
			subcommandsAdvanced: false,
			testing: false,
			gateway: false,
			cache: false,
			redis: false,
			sharder: false,
			packageManager: 'pnpm',
			language: 'ts',
			buildTool: 'tsdown',
			linter: 'none',
			formatter: 'none',
			versions,
			...overrides
		});

		test('adds varlock as a dependency only for a varlock project', () => {
			expect(buildDependencies(context())).not.toHaveProperty('varlock');
			expect(buildDependencies(context({ varlock: true }))).toHaveProperty('varlock', '^1.21.1');
		});

		test.each([
			['tsdown', 'ts', 'stars.config.ts', "defineConfig({ env: { loader: 'varlock' } })"],
			['vite', 'ts', 'stars.config.ts', "env: { loader: 'varlock' }"]
		] as const)('sets env.loader in stars.config for a %s %s project', async (buildTool, language, file, expected) => {
			writeProjectFiles(directory, context({ buildTool, language, varlock: true, varlockLoader: true }));
			expect(await read(file)).toContain(expected);
		});

		test.each([
			['tsc7', 'ts', 'stars.config.ts', "defineConfig({ build: { tool: 'tsc' }, env: false })"],
			['tsdown', 'js', 'stars.config.js', 'defineConfig({ env: false })'],
			['vite-nitro', 'ts', 'stars.config.ts', 'enableNitro: true']
		] as const)('leaves env alone for a %s %s project, where the runtime picks varlock itself', async (buildTool, language, file, expected) => {
			writeProjectFiles(directory, context({ buildTool, language, varlock: true, varlockLoader: true }));
			const config = await read(file);
			expect(config).toContain(expected);
			expect(config).not.toContain('loader');
		});

		test('keeps the dependency without setting the loader when the project has varlock but no schema', async () => {
			writeProjectFiles(directory, context({ varlock: true, varlockLoader: false }));
			expect(await read('stars.config.ts')).toContain('defineConfig({})');
			expect(JSON.parse(await read('package.json')).dependencies).toHaveProperty('varlock');
		});

		test('keeps the varlock.loadPath of the project it regenerates the package.json of', async () => {
			writeProjectFiles(directory, context({ varlock: true, varlockLoader: true, varlockLoadPath: 'config' }));
			expect(JSON.parse(await read('package.json'))).toMatchObject({ varlock: { loadPath: 'config' } });

			writeProjectFiles(directory, context());
			expect(JSON.parse(await read('package.json'))).not.toHaveProperty('varlock');
		});

		test('combines with the tunnel', async () => {
			writeProjectFiles(directory, context({ varlock: true, varlockLoader: true, tunnel: true }));
			expect(await read('stars.config.ts')).toContain("defineConfig({ env: { loader: 'varlock' }, dev: { tunnel: true } })");
		});
	});

	describe('processTemplate', () => {
		const templateContext = (overrides: Partial<TemplateContext> = {}): TemplateContext => ({
			name: 'bot',
			port: 3000,
			language: 'ts',
			i18n: false,
			subcommands: false,
			subcommandsAdvanced: false,
			testing: false,
			gateway: false,
			cache: false,
			redis: false,
			sharder: false,
			buildTool: 'tsdown',
			...overrides
		});

		test('layers the varlock directory after the gateway features, before nothing that rewrites augments', () => {
			expect(resolveFeatureDirs({ i18n: false, subcommands: false, subcommandsAdvanced: false, testing: false, varlock: true })).toStrictEqual([
				'varlock'
			]);
			expect(resolveFeatureDirs({ i18n: false, subcommands: false, subcommandsAdvanced: false, testing: false })).toStrictEqual([]);
		});

		test('scaffolds a schema and derives Env from it', async () => {
			await processTemplate(directory, templateContext({ varlock: true, port: 4100 }));

			const schema = await read('.env.schema');
			expect(schema).toContain('@generateTsTypes(path=src/@types/env.d.ts)');
			expect(schema).toContain('DISCORD_TOKEN=');
			expect(schema).toContain('# @type=string @sensitive\nDISCORD_TOKEN=');
			expect(schema).toContain('HTTP_PORT=4100');
			expect(schema).not.toContain('REDIS_URL');
			expect(schema).not.toContain('{{');

			const augments = await read('src/lib/types/augments.ts');
			expect(augments).toContain("import type { EnvFromVarlock } from '@wolfstar/env-utilities/varlock';");
			expect(augments).toContain("import type { CoercedEnvSchema } from '../../@types/env.js';");
			expect(augments).toContain('interface Env extends EnvFromVarlock<CoercedEnvSchema> {}');
			// The values are still the dotenv file's.
			expect(await read('.env')).toContain('DISCORD_TOKEN=');
			expect(await read('AGENTS.md')).toContain('`.env.schema`');
			expect(await read('README.md')).toContain('.env.schema');
		});

		test('declares what the other features need in the schema', async () => {
			await processTemplate(directory, templateContext({ varlock: true, gateway: true, cache: true, redis: true, sharder: true }));

			const schema = await read('.env.schema');
			expect(schema).toContain('REDIS_URL=redis://localhost:6379');
			expect(schema).toContain('SHARDER_CLUSTERS=2');
		});

		test('uses PORT, not HTTP_PORT, for Nitro', async () => {
			await processTemplate(directory, templateContext({ varlock: true, buildTool: 'vite-nitro' }));

			const schema = await read('.env.schema');
			expect(schema).toContain('PORT=3000');
			expect(schema).not.toContain('HTTP_PORT');
		});

		test('writes the schema for a JavaScript project too, which has no augments file', async () => {
			await processTemplate(directory, templateContext({ varlock: true, language: 'js' }));

			expect(await read('.env.schema')).toContain('DISCORD_TOKEN=');
			expect(existsSync(join(directory, 'src/lib/types/augments.ts'))).toBe(false);
		});

		test('does not write a schema, or touch Env, without --env varlock', async () => {
			await processTemplate(directory, templateContext());

			expect(existsSync(join(directory, '.env.schema'))).toBe(false);
			expect(await read('src/lib/types/augments.ts')).toContain('DISCORD_TOKEN: string;');
		});

		test('ships a stand-in for the generated types, so Env type-checks before varlock has run', async () => {
			await processTemplate(directory, templateContext({ varlock: true, redis: true, sharder: true, gateway: true, cache: true }));

			const types = await read('src/@types/env.d.ts');
			expect(types).toContain('export type CoercedEnvSchema = {');
			expect(types).toContain('HTTP_PORT: number;');
			expect(types).toContain('REDIS_URL: string;');
			expect(types).toContain('SHARDER_CLUSTERS: number;');
			expect(types).not.toContain('{{');
		});

		test('keeps a .env.schema somebody else wrote and leaves Env hand-written, and says so', async () => {
			await write('.env.schema', SCHEMA);
			const kept: string[] = [];

			await processTemplate(directory, templateContext({ varlock: true }), (path) => kept.push(path));

			expect(kept).toStrictEqual(['.env.schema']);
			expect(await read('.env.schema')).toBe(SCHEMA);
			// The types would only exist if that schema asked varlock to generate them.
			expect(existsSync(join(directory, 'src/@types/env.d.ts'))).toBe(false);
			expect(await read('src/lib/types/augments.ts')).toContain('DISCORD_TOKEN: string;');
		});

		test('leaves a project schema alone when a run does not ask for varlock', async () => {
			await write('.env.schema', SCHEMA);

			const preserved = await processTemplate(directory, templateContext());

			expect(preserved).toStrictEqual([]);
			expect(await read('.env.schema')).toBe(SCHEMA);
			expect(await read('src/lib/types/augments.ts')).toContain('DISCORD_TOKEN: string;');
		});

		test('keeps varlock on in a rerun without the flag, and regenerates its own unedited schema', async () => {
			await processTemplate(directory, templateContext({ varlock: true, port: 3000 }));
			const kept: string[] = [];

			await processTemplate(directory, templateContext({ port: 4200 }), (path) => kept.push(path));

			expect(kept).toStrictEqual([]);
			expect(await read('.env.schema')).toContain('HTTP_PORT=4200');
			expect(await read('src/lib/types/augments.ts')).toContain('EnvFromVarlock');
			expect(JSON.parse(await read('.create-http-framework.json'))).toMatchObject({ varlock: true });
		});

		test('keeps an edited schema, and the types varlock generated, on a rerun', async () => {
			await processTemplate(directory, templateContext({ varlock: true }));
			await write('.env.schema', `${await read('.env.schema')}# @type=string\nMY_KEY=\n`);
			await write('src/@types/env.d.ts', 'export type CoercedEnvSchema = { MY_KEY: string };\n');
			const kept: string[] = [];

			await processTemplate(directory, templateContext(), (path) => kept.push(path));

			expect(kept.sort()).toStrictEqual(['.env.schema', 'src/@types/env.d.ts']);
			expect(await read('.env.schema')).toContain('MY_KEY=');
			expect(await read('src/@types/env.d.ts')).toContain('MY_KEY');
			expect(await read('src/lib/types/augments.ts')).toContain('EnvFromVarlock');
		});

		test('turns varlock off once its schema is deleted, taking the stand-in types with it', async () => {
			await processTemplate(directory, templateContext({ varlock: true }));
			await rm(join(directory, '.env.schema'));

			const preserved = await processTemplate(directory, templateContext());

			expect(preserved).toStrictEqual([]);
			expect(existsSync(join(directory, 'src/@types/env.d.ts'))).toBe(false);
			expect(await read('src/lib/types/augments.ts')).toContain('DISCORD_TOKEN: string;');
		});
	});
});
