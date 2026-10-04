import { fileURLToPath } from 'node:url';
import type { loadEnvFiles as LoadEnvFiles } from '../src/lib/env-loader';

const project = (name: string) => fileURLToPath(new URL(`./varlock-fixtures/detect/${name}`, import.meta.url));

describe('Loader auto-detection', () => {
	let loadEnvFiles: typeof LoadEnvFiles;

	beforeAll(async () => {
		// The workspace vitest config runs with `isolate: false`: make sure `env-loader.ts` is not bound to a mocked
		// `node:module` left over by another test file.
		vi.doUnmock('node:module');
		vi.resetModules();
		({ loadEnvFiles } = await import('../src/lib/env-loader'));
	});

	beforeEach(() => {
		process.env.NODE_ENV = 'development';
	});

	afterEach(() => {
		vi.restoreAllMocks();
		delete process.env.VARLOCK_TEST_SOURCE;
		delete (globalThis as { __varlockLoadedEnv?: unknown }).__varlockLoadedEnv;
	});

	function inProject(name: string) {
		vi.spyOn(process, 'cwd').mockReturnValue(project(name));
	}

	test('should pick varlock for a `.env.schema` at the project root', () => {
		inProject('root-schema');

		expect(loadEnvFiles().parsed).toEqual({ VARLOCK_TEST_SOURCE: 'root' });
	});

	test('should look in `src` before the project root, like the `.env*` files', () => {
		inProject('src-schema');

		expect(loadEnvFiles().parsed).toEqual({ VARLOCK_TEST_SOURCE: 'src' });
	});

	test('should pick varlock for a `varlock.loadPath` in `package.json`', () => {
		inProject('load-path');

		expect(loadEnvFiles().parsed).toEqual({ VARLOCK_TEST_SOURCE: 'load-path' });
	});

	test('should keep dotenv when there is no schema', () => {
		inProject('none');

		expect(loadEnvFiles().parsed).toEqual({ VARLOCK_TEST_SOURCE: 'dotenv' });
	});

	test('should let `loader: "dotenv"` win over a schema', () => {
		inProject('src-schema');

		expect(loadEnvFiles({ loader: 'dotenv' }).parsed).toEqual({ VARLOCK_TEST_SOURCE: 'dotenv' });
	});

	test('should keep dotenv for an explicit `path`', () => {
		inProject('root-schema');

		expect(loadEnvFiles({ path: `${project('none')}/.env` }).parsed).toEqual({ VARLOCK_TEST_SOURCE: 'dotenv' });
	});

	test('should discover `src/.env.schema` for an explicit `loader: "varlock"` too', () => {
		inProject('src-schema');

		expect(loadEnvFiles({ loader: 'varlock' }).parsed).toEqual({ VARLOCK_TEST_SOURCE: 'src' });
	});
});
