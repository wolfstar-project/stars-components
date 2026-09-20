import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NitroBuilder } from '../src/index.js';
import { fixture } from './helpers.js';

describe('NitroBuilder watch mode', () => {
	test('builds once ready, rebuilds on a source change, and stops cleanly on close', async () => {
		const f = await fixture(true);
		const builder = new NitroBuilder(f.config);
		const successes: number[] = [];
		builder.on('success', () => successes.push(successes.length));
		try {
			await builder.watch();
			await vi.waitFor(() => expect(successes.length).toBe(1), { timeout: 15000 });

			await writeFile(join(f.root, 'src/main.ts'), 'export default { fetch: () => new Response("updated") };');
			await vi.waitFor(() => expect(successes.length).toBe(2), { timeout: 15000 });

			await builder.close();
			// A second close must not hang or throw (idempotent).
			await builder.close();
		} finally {
			await builder.close();
			await f.cleanup();
		}
	}, 30000);

	test('ignores changes under the output directory and node_modules, but still reacts to real source changes', async () => {
		const f = await fixture(true);
		const builder = new NitroBuilder(f.config);
		const successes: number[] = [];
		builder.on('success', () => successes.push(successes.length));
		try {
			await builder.watch();
			await vi.waitFor(() => expect(successes.length).toBe(1), { timeout: 15000 });

			await mkdir(join(f.root, 'node_modules', 'noise'), { recursive: true });
			await writeFile(join(f.root, 'node_modules', 'noise', 'index.js'), 'export default 1;');
			await mkdir(f.config.build.outDir, { recursive: true });
			await writeFile(join(f.config.build.outDir, 'stray.txt'), 'noise');

			// Give the watcher a beat to (not) react to the ignored paths above.
			await new Promise((resolve) => setTimeout(resolve, 200));
			expect(successes.length).toBe(1);

			await writeFile(join(f.root, 'src/main.ts'), 'export default { fetch: () => new Response("real change") };');
			await vi.waitFor(() => expect(successes.length).toBe(2), { timeout: 15000 });
		} finally {
			await builder.close();
			await f.cleanup();
		}
	}, 30000);

	test('reports a failed rebuild without throwing, and keeps watching for the next change', async () => {
		const f = await fixture(true);
		const builder = new NitroBuilder(f.config);
		const logs: string[] = [];
		const successes: number[] = [];
		const failures: number[] = [];
		builder.on('log', (level, text) => logs.push(`${level}: ${text}`));
		builder.on('success', () => successes.push(successes.length));
		builder.on('failure', () => failures.push(failures.length));
		try {
			await builder.watch();
			await vi.waitFor(() => expect(successes.length).toBe(1), { timeout: 15000 });

			await writeFile(join(f.root, 'src/main.ts'), 'this is not valid typescript {{{\n');
			await vi.waitFor(() => expect(failures.length).toBe(1), { timeout: 15000 });

			await writeFile(join(f.root, 'src/main.ts'), 'export default { fetch: () => new Response("fixed") };');
			await vi.waitFor(() => expect(successes.length).toBe(2), { timeout: 15000 });
		} finally {
			await builder.close();
			await f.cleanup();
		}
	}, 30000);
});
