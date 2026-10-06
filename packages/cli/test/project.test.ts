import { importFromProject, resolveBinary } from '../src/utils/project.js';
import { createFixture, type Fixture } from './helpers.js';

describe('importFromProject', () => {
	let fixture: Fixture;

	afterEach(async () => fixture?.cleanup());

	test('fails with an actionable error when the module is not installed', async () => {
		fixture = await createFixture({ 'package.json': '{"name":"bot"}' });

		await expect(importFromProject(fixture.root, 'not-a-real-package', 'Install it with `pnpm add not-a-real-package`.')).rejects.toMatchObject({
			code: 'DEPENDENCY_MISSING'
		});
	});
});

describe('resolveBinary', () => {
	let fixture: Fixture;

	afterEach(async () => {
		await fixture?.cleanup();
	});

	test('finds the bin of a package whose exports map hides package.json', async () => {
		fixture = await createFixture({
			'package.json': '{"name":"bot"}',
			'node_modules/golar/package.json': JSON.stringify({
				name: 'golar',
				bin: { golar: './dist/bin.js' },
				exports: { '.': './dist/index.js' }
			}),
			'node_modules/golar/dist/bin.js': ''
		});

		expect(resolveBinary(fixture.root, 'golar', 'golar')).toBe(`${fixture.root}/node_modules/golar/dist/bin.js`);
		expect(resolveBinary(fixture.root, 'missing', 'missing')).toBeNull();
	});
});
