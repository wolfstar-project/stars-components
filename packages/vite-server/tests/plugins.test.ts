import type { ResolvedStarsConfig } from '@wolfstar/schema';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pluginRegistrations } from '../src/plugins.js';

interface RegistrationPlugin {
	transform(code: string, id: string): { code: string } | null;
}

let workspace: string;

beforeEach(async () => {
	workspace = await mkdtemp(join(tmpdir(), 'vite-server-plugins-'));
});

afterEach(async () => {
	await rm(workspace, { recursive: true, force: true });
});

async function write(files: Record<string, string>): Promise<void> {
	for (const [path, content] of Object.entries(files)) {
		const file = join(workspace, path);
		await mkdir(dirname(file), { recursive: true });
		await writeFile(file, content);
	}
}

function installed(name: string, packageJson: Record<string, unknown>, at = 'app'): Record<string, string> {
	return { [`${at}/node_modules/${name}/package.json`]: JSON.stringify({ name, ...packageJson }) };
}

/** The `/register` imports the plugin prepends to the application entry. */
function registrations(): string[] {
	const root = join(workspace, 'app');
	const entry = join(root, 'src/main.ts');
	const plugin = pluginRegistrations({ root, entry } as unknown as ResolvedStarsConfig) as RegistrationPlugin;
	const result = plugin.transform('', entry);
	return result ? result.code.split('\n').filter(Boolean) : [];
}

async function project(dependencies: string[], files: Record<string, string>): Promise<string[]> {
	await write({
		'app/package.json': JSON.stringify({ name: 'app', dependencies: Object.fromEntries(dependencies.map((name) => [name, '1.0.0'])) }),
		...files
	});
	return registrations();
}

describe('pluginRegistrations', () => {
	test('GIVEN a plugin exporting ./register THEN it is registered', async () => {
		const imports = await project(
			['@wolfstar/plugin-a'],
			installed('@wolfstar/plugin-a', { exports: { '.': './index.js', './register': './register.js' } })
		);
		expect(imports).toEqual(['import "@wolfstar/plugin-a/register";']);
	});

	test('GIVEN a plugin that is not installed or declares no exports THEN it is still registered', async () => {
		const imports = await project(
			['@wolfstar/plugin-missing', '@wolfstar/plugin-legacy'],
			installed('@wolfstar/plugin-legacy', { main: 'index.js' })
		);
		expect(imports).toEqual(['import "@wolfstar/plugin-legacy/register";', 'import "@wolfstar/plugin-missing/register";']);
	});

	test('GIVEN exports that only expose "." THEN the plugin is skipped', async () => {
		const imports = await project(['@wolfstar/plugin-string', '@wolfstar/plugin-conditions', '@wolfstar/plugin-array', '@wolfstar/plugin-root'], {
			...installed('@wolfstar/plugin-string', { exports: './index.js' }),
			...installed('@wolfstar/plugin-conditions', { exports: { import: './index.js', default: './index.cjs' } }),
			...installed('@wolfstar/plugin-array', { exports: ['./index.js'] }),
			...installed('@wolfstar/plugin-root', { exports: { '.': './index.js' } })
		});
		expect(imports).toEqual([]);
	});

	test('GIVEN ./register explicitly excluded with null THEN the plugin is skipped', async () => {
		const imports = await project(
			['@wolfstar/plugin-null'],
			installed('@wolfstar/plugin-null', { exports: { '.': './index.js', './register': null } })
		);
		expect(imports).toEqual([]);
	});

	test('GIVEN subpath patterns THEN the plugin is registered only when one matches ./register', async () => {
		const imports = await project(['@wolfstar/plugin-star', '@wolfstar/plugin-nested'], {
			...installed('@wolfstar/plugin-star', { exports: { '.': './index.js', './*': './dist/*.js' } }),
			...installed('@wolfstar/plugin-nested', { exports: { '.': './index.js', './lib/*': './dist/lib/*.js' } })
		});
		expect(imports).toEqual(['import "@wolfstar/plugin-star/register";']);
	});

	test('GIVEN a plugin hoisted to a parent node_modules THEN its exports are read from there', async () => {
		const imports = await project(['@wolfstar/plugin-hoisted'], installed('@wolfstar/plugin-hoisted', { exports: { '.': './index.js' } }, '.'));
		expect(imports).toEqual([]);
	});
});
