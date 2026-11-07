import { copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, type UserConfig } from 'tsdown';
import config from '../tsdown.config.js';

const root = fileURLToPath(new URL('..', import.meta.url));

// What a bundler keeps of the package: the bots built by the Stars CLI bundle `dist/pieces.js` (the plugin of
// `./module.ts`), and drop every file of `dist/` that `sideEffects` in package.json does not list as having effects.
async function bundleConsumer(directory: string, entry: string) {
	const consumer = join(directory, 'consumer.js');
	await writeFile(consumer, `import './dist/${entry}';\n`);
	await build({
		config: false,
		cwd: directory,
		entry: [consumer],
		outDir: join(directory, 'out'),
		deps: { neverBundle: (id) => !id.startsWith('.') && !id.startsWith('/') },
		dts: false,
		sourcemap: false,
		attw: false,
		publint: false,
		logLevel: 'silent'
	});
	return readFile(join(directory, 'out', 'consumer.mjs'), 'utf8');
}

describe('sideEffects', () => {
	let directory: string;

	beforeAll(async () => {
		directory = await mkdtemp(join(tmpdir(), 'shared-http-pieces-'));
		const { esm } = (config as UserConfig & { format: { esm: object } }).format;
		await build({
			...(config as UserConfig),
			config: false,
			cwd: root,
			format: { esm: { ...esm, outDir: join(directory, 'dist') } },
			dts: false,
			sourcemap: false,
			attw: false,
			publint: false,
			logLevel: 'silent'
		});
		// The published package.json, so the bundler reads the same `sideEffects`:
		await copyFile(join(root, 'package.json'), join(directory, 'package.json'));
	}, 60_000);

	afterAll(async () => {
		await rm(directory, { recursive: true, force: true });
	});

	test.each(['pieces.js', 'register.js'])(
		'GIVEN a bot that bundles dist/%s THEN the shared command and listeners are still loaded',
		async (entry) => {
			const code = await bundleConsumer(directory, entry);

			expect(code).toContain('name: "info"');
			expect(code).toContain('name: "SharedError"');
			expect(code).toContain('container.stores.loadPiece');
		},
		60_000
	);
});
