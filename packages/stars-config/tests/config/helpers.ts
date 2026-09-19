import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export interface Fixture {
	root: string;
	write(path: string, content: string): Promise<string>;
	cleanup(): Promise<void>;
}

export async function createFixture(files: Record<string, string> = {}): Promise<Fixture> {
	const root = await mkdtemp(join(tmpdir(), 'http-framework-config-'));
	const fixture: Fixture = {
		root,
		async write(path, content) {
			const file = join(root, path);
			await mkdir(dirname(file), { recursive: true });
			await writeFile(file, content);
			return file;
		},
		cleanup: () => rm(root, { recursive: true, force: true })
	};

	for (const [path, content] of Object.entries(files)) await fixture.write(path, content);
	return fixture;
}
