import { importFromProject } from '../src/utils/project.js';
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
