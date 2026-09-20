import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadStarsConfig } from '@wolfstar/schema';
export async function fixture(nitro = false) {
	// Kept outside node_modules: Vite's default watcher ignores **/node_modules/** entirely,
	// which would swallow every file-change event fixtures write during a dev-server test.
	const root = await mkdtemp(join(import.meta.dirname, '../.server-test-'));
	await mkdir(join(root, 'src'));
	await writeFile(join(root, 'package.json'), '{"type":"module","main":"dist/main.js"}');
	await writeFile(
		join(root, 'src/main.ts'),
		'export default { fetch: async (request: Request) => new Response(await request.text(), { headers: { "x-stars": "test" } }) };'
	);
	await writeFile(
		join(root, 'stars.config.mjs'),
		`export default { build: { tool: 'vite' }, dev: { debounce: 20 }, experimental: { enableVite: true, enableNitro: ${nitro} }, vite: { server: { host: '127.0.0.1', port: 0 } } };`
	);
	return { root, config: await loadStarsConfig({ cwd: root, env: {} }), cleanup: () => rm(root, { recursive: true, force: true }) };
}
