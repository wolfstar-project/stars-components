import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defaultBuilderContext } from '../src/context.js';

test('importFromProject rejects with an actionable error when the module is not installed', async () => {
	const root = await mkdtemp(join(tmpdir(), 'vite-server-context-'));
	try {
		await writeFile(join(root, 'package.json'), '{"type":"module"}');
		await expect(defaultBuilderContext.importFromProject(root, 'this-package-does-not-exist', 'Install it first.')).rejects.toThrow(
			/Cannot resolve this-package-does-not-exist.*Install it first\./
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
