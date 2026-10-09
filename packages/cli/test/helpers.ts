import { Module } from 'node:module';
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

export async function waitFor(predicate: () => boolean | Promise<boolean>, timeout = 5000): Promise<void> {
	const deadline = Date.now() + timeout;
	while (!(await predicate())) {
		if (Date.now() > deadline) throw new Error('Timed out waiting for condition');
		await wait(20);
	}
}

/**
 * `pnpm` points `NODE_PATH` at its hoisted store, where `varlock` is: a fixture would find it wherever it lives. Dropping
 * it makes "not installed" mean the fixture's own `node_modules`.
 */
export function ignoreNodePath(): void {
	const nodePath = process.env.NODE_PATH;
	const initPaths = () => (Module as unknown as { _initPaths(): void })._initPaths();
	beforeEach(() => {
		delete process.env.NODE_PATH;
		initPaths();
	});
	afterEach(() => {
		if (nodePath !== undefined) process.env.NODE_PATH = nodePath;
		initPaths();
	});
}
