import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export interface Fixture {
	root: string;
	write(path: string, content: string): Promise<string>;
	cleanup(): Promise<void>;
}

export async function createFixture(files: Record<string, string> = {}): Promise<Fixture> {
	const root = await mkdtemp(join(tmpdir(), 'stars-cli-'));
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

/** A bot stand-in: prints a line, then stays alive until terminated. */
export const KEEPALIVE_SCRIPT = "console.log('ready'); console.error('warned'); setInterval(() => {}, 1000);";
/** A bot stand-in that exits immediately with an error. */
export const CRASH_SCRIPT = "console.log('boom'); process.exit(1);";

export function wait(milliseconds: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function waitFor(predicate: () => boolean, timeout = 5000): Promise<void> {
	const deadline = Date.now() + timeout;
	while (!predicate()) {
		if (Date.now() > deadline) throw new Error('Timed out waiting for condition');
		await wait(20);
	}
}
