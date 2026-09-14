import { loadStarsConfig } from '@wolfstar/http-framework/config';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { prepareProject, runPrepare } from '../src/lib/tasks/prepare.js';
import { createFixture, type Fixture } from './helpers.js';

describe('generated TypeScript configuration', () => {
	let fixture: Fixture;

	beforeEach(async () => {
		fixture = await createFixture({
			'package.json': '{"name":"bot"}',
			'src/main.ts': '',
			'src/lib/value.ts': 'export const value = 1;',
			'tsconfig.json': '{"extends":"./.stars/tsconfig.json"}',
			'stars.config.mjs': "export default { build: { tool: 'tsdown' }, imports: false };"
		});
	});

	afterEach(async () => fixture.cleanup());

	test('resolves inherited aliases even when auto imports are disabled', async () => {
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		expect((await prepareProject(config, true)).tsconfig.status).toBe('outdated');
		await expect(readFile(join(fixture.root, '.stars/tsconfig.json'))).rejects.toMatchObject({ code: 'ENOENT' });
		await prepareProject(config);
		expect((await prepareProject(config, true)).tsconfig.status).toBe('up-to-date');
		await fixture.write(
			'src/main.ts',
			[
				"import { value as a } from '@/lib/value';",
				"import { value as b } from '~/lib/value';",
				"import { value as c } from '@@/src/lib/value';",
				"import { value as d } from '~~/src/lib/value';",
				'export const total: number = a + b + c + d;'
			].join('\n')
		);
		const tsc = join(dirname(createRequire(import.meta.url).resolve('typescript/package.json')), 'bin/tsc');
		expect(() =>
			execFileSync(process.execPath, [tsc, '--noEmit', '--module', 'nodenext', '-p', join(fixture.root, 'tsconfig.json')], {
				encoding: 'utf-8'
			})
		).not.toThrow();
	});

	test('tracks entry and custom alias changes and reports stale configuration', async () => {
		await fixture.write('app/main.ts', '');
		await fixture.write(
			'stars.config.mjs',
			"export default { entry: 'app/main.ts', build: { tool: 'tsdown' }, imports: false, tsdown: { alias: { '@': './src', '#lib': './src/lib' } } };"
		);
		await prepareProject(await loadStarsConfig({ cwd: fixture.root, env: {} }));
		const generated = JSON.parse(await readFile(join(fixture.root, '.stars/tsconfig.json'), 'utf-8'));
		expect(generated.compilerOptions.paths).toMatchObject({ '~/*': ['./../app/*'], '@/*': ['./../src/*'], '#lib/*': ['./../src/lib/*'] });
		await fixture.write('.stars/tsconfig.json', '{}');
		await expect(
			runPrepare({ cwd: fixture.root, check: true, json: true, stdout: { write: () => true } as NodeJS.WritableStream })
		).rejects.toMatchObject({ code: 'PREPARE_OUTDATED' });
	});

	test('does not advertise bundler aliases for tsc builds', async () => {
		await fixture.write('stars.config.mjs', "export default { build: { tool: 'tsc' }, imports: false };");
		await prepareProject(await loadStarsConfig({ cwd: fixture.root, env: {} }));
		const generated = JSON.parse(await readFile(join(fixture.root, '.stars/tsconfig.json'), 'utf-8'));
		expect(generated.compilerOptions.paths).toEqual({});
	});
});
