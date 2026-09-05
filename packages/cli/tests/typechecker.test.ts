import { loadStarsConfig } from '@wolfstar/http-framework/config';
import { join } from 'node:path';
import { resolveTypecheckCommand } from '../src/lib/typechecker.js';
import { createFixture, type Fixture } from './helpers.js';

/** A package.json + bin script pair, the way `resolveBinary` finds an installed executable. */
async function installBinary(fixture: Fixture, packageName: string, binName: string, binPath: string): Promise<void> {
	await fixture.write(
		`node_modules/${packageName}/package.json`,
		JSON.stringify({ name: packageName, version: '1.0.0', bin: { [binName]: binPath } })
	);
	await fixture.write(`node_modules/${packageName}/${binPath}`, '');
}

const CONFIG = (checker: string) => `export default { build: { tool: 'tsc' }, dev: { typecheck: { checker: '${checker}' } } };`;

describe('resolveTypecheckCommand', () => {
	let fixture: Fixture;

	beforeEach(async () => {
		fixture = await createFixture({ 'src/main.ts': '', 'tsconfig.json': '{}', 'package.json': '{ "name": "bot" }' });
	});

	afterEach(async () => {
		await fixture?.cleanup();
	});

	test('runs the project TypeScript in watch mode for the tsc checker', async () => {
		await installBinary(fixture, 'typescript', 'tsc', 'bin/tsc');
		await fixture.write('stars.config.mjs', CONFIG('tsc'));

		const command = resolveTypecheckCommand(await loadStarsConfig({ cwd: fixture.root, env: {} }));
		expect(command).toMatchObject({ command: join(fixture.root, 'node_modules', 'typescript', 'bin', 'tsc'), node: true, watch: true });
		expect(command.args).toEqual([
			'--noEmit',
			'--watch',
			'--preserveWatchOutput',
			'--pretty',
			'false',
			'-p',
			join(fixture.root, 'tsconfig.json')
		]);
	});

	test('forwards to TypeScript through `golar tsc` for the golar checker', async () => {
		await installBinary(fixture, 'golar', 'golar', 'dist/bin.js');
		await fixture.write('stars.config.mjs', CONFIG('golar'));

		const command = resolveTypecheckCommand(await loadStarsConfig({ cwd: fixture.root, env: {} }));
		expect(command).toMatchObject({ command: join(fixture.root, 'node_modules', 'golar', 'dist', 'bin.js'), watch: true });
		expect(command.args[0]).toBe('tsc');
		expect(command.args).toContain('--watch');
	});

	test('runs tsz once per build, since it has no watch mode', async () => {
		await installBinary(fixture, '@mohsen-azimi/tsz-dev', 'tsz', 'bin/tsz.js');
		await fixture.write('stars.config.mjs', CONFIG('tsz'));

		const command = resolveTypecheckCommand(await loadStarsConfig({ cwd: fixture.root, env: {} }));
		expect(command).toMatchObject({ watch: false, node: true });
		expect(command.args).toEqual(['--noEmit', '-p', join(fixture.root, 'tsconfig.json')]);
	});

	test('falls back to try-tsz when only the comparison harness is installed', async () => {
		await installBinary(fixture, 'try-tsz', 'try-tsz', 'bin/try-tsz.js');
		await fixture.write('stars.config.mjs', CONFIG('tsz'));

		const command = resolveTypecheckCommand(await loadStarsConfig({ cwd: fixture.root, env: {} }));
		expect(command).toMatchObject({ command: join(fixture.root, 'node_modules', 'try-tsz', 'bin', 'try-tsz.js'), watch: false });
		expect(command.args).toEqual(['-p', join(fixture.root, 'tsconfig.json')]);
	});

	test('fails with an actionable error when the checker is not installed', async () => {
		await fixture.write('stars.config.mjs', CONFIG('tsz'));
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });

		expect(() => resolveTypecheckCommand(config)).toThrowError(/"tsz" is not installed/);
	});
});
