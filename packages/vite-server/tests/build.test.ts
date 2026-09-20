import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ViteBuilder } from '../src/index.js';
import { fixture } from './helpers.js';

test('a throwing afterBuild hook turns a watch rebuild into a reported failure, without stopping the watcher', async () => {
	const f = await fixture();
	const builder = new ViteBuilder(f.config, undefined, {
		afterBuild: () => {
			throw new Error('afterBuild boom');
		}
	});
	const failures: string[] = [];
	builder.on('failure', (outcome) => failures.push(outcome.message ?? ''));
	try {
		await new Promise<void>((resolve) => {
			builder.once('failure', () => resolve());
			void builder.watch();
		});
		expect(failures).toEqual(['Error: afterBuild boom']);

		await writeFile(join(f.root, 'src/main.ts'), 'export default { fetch: () => new Response("v2") };');
		await new Promise<void>((resolve) => builder.once('failure', () => resolve()));
		expect(failures).toEqual(['Error: afterBuild boom', 'Error: afterBuild boom']);
	} finally {
		await builder.close();
		await f.cleanup();
	}
});
