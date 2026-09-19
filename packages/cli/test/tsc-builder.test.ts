import { loadStarsConfig } from '@wolfstar/stars-config';
import { TscBuilder } from '../src/builders/tsc.js';
import { createFixture, type Fixture } from './helpers.js';

describe('TscBuilder', () => {
	let fixture: Fixture;

	afterEach(async () => fixture?.cleanup());

	test('fails with an actionable error when typescript is not installed', async () => {
		fixture = await createFixture({
			'src/main.ts': '',
			'tsconfig.json': '{}',
			'stars.config.mjs': "export default { build: { tool: 'tsc' } };"
		});
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		const builder = new TscBuilder(config);

		expect(() => builder.build()).toThrowError(/"typescript" is not installed/);
	});
});
