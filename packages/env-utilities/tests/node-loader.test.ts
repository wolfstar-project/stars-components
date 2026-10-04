import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { loadEnvFiles as loadEnv, type EnvLoaderOptions } from '../src/lib/env-loader';

const KEYS = [
	'NODE_LOADER_PLAIN',
	'NODE_LOADER_QUOTED',
	'NODE_LOADER_SINGLE',
	'NODE_LOADER_MULTILINE',
	'NODE_LOADER_EXPORTED',
	'NODE_LOADER_COMMENTED',
	'NODE_LOADER_ALT',
	'NODE_LOADER_NO_COLON',
	'NODE_LOADER_ESCAPED',
	'NODE_LOADER_DOLLAR',
	'NODE_LOADER_UNBRACED',
	'NODE_LOADER_BASE'
];

let directory: string;

describe('Node loader', () => {
	beforeEach(() => {
		process.env.NODE_ENV = 'development';
		for (const key of KEYS) delete process.env[key];
		directory = mkdtempSync(join(tmpdir(), 'env-utilities-node-'));
	});

	afterEach(() => {
		for (const key of KEYS) delete process.env[key];
		rmSync(directory, { recursive: true, force: true });
	});

	function load(contents: string, options?: EnvLoaderOptions) {
		writeFileSync(join(directory, '.env'), contents);
		return loadEnv({ loader: 'node', path: join(directory, '.env'), ...options }).parsed;
	}

	// The same file through both loaders, so a difference between Node.js' parser and `dotenv` shows up here.
	const FILE = [
		'NODE_LOADER_PLAIN=plain',
		'NODE_LOADER_QUOTED="double quoted"',
		"NODE_LOADER_SINGLE='single quoted'",
		'NODE_LOADER_MULTILINE="line one\nline two"',
		'export NODE_LOADER_EXPORTED=exported',
		'NODE_LOADER_COMMENTED=value # a comment',
		'# a whole line comment'
	].join('\n');

	test('parses plain, quoted, multiline, exported and commented values', () => {
		expect(load(FILE)).toEqual({
			NODE_LOADER_PLAIN: 'plain',
			NODE_LOADER_QUOTED: 'double quoted',
			NODE_LOADER_SINGLE: 'single quoted',
			NODE_LOADER_MULTILINE: 'line one\nline two',
			NODE_LOADER_EXPORTED: 'exported',
			NODE_LOADER_COMMENTED: 'value'
		});
	});

	test('parses the same file as the dotenv loader', () => {
		writeFileSync(join(directory, '.env'), FILE);
		const parsedBy = (loader: 'node' | 'dotenv') => {
			for (const key of KEYS) delete process.env[key];
			return loadEnv({ loader, path: join(directory, '.env') }).parsed;
		};

		expect(parsedBy('node')).toEqual(parsedBy('dotenv'));
	});

	test('expands `$VAR`, `${VAR}`, defaults, alternates and the `\\$` escape like dotenv-expand', () => {
		const contents = [
			'NODE_LOADER_BASE=base',
			'NODE_LOADER_UNBRACED=$NODE_LOADER_BASE-u',
			'NODE_LOADER_DOLLAR=${NODE_LOADER_BASE}-b',
			'NODE_LOADER_ALT=${NODE_LOADER_BASE:+alt}',
			'NODE_LOADER_NO_COLON=${NODE_LOADER_MISSING-fallback}',
			'NODE_LOADER_ESCAPED=\\$NODE_LOADER_BASE'
		].join('\n');

		const expected = {
			NODE_LOADER_BASE: 'base',
			NODE_LOADER_UNBRACED: 'base-u',
			NODE_LOADER_DOLLAR: 'base-b',
			NODE_LOADER_ALT: 'alt',
			NODE_LOADER_NO_COLON: 'fallback',
			NODE_LOADER_ESCAPED: '$NODE_LOADER_BASE'
		};

		expect(load(contents)).toEqual(expected);

		for (const key of KEYS) delete process.env[key];
		expect(loadEnv({ loader: 'dotenv', path: join(directory, '.env') }).parsed).toEqual(expected);
	});

	test('reads the files with the requested `encoding`', () => {
		writeFileSync(join(directory, '.env'), Buffer.from('NODE_LOADER_PLAIN=café', 'latin1'));

		expect(loadEnv({ loader: 'node', path: join(directory, '.env'), encoding: 'latin1' }).parsed).toEqual({ NODE_LOADER_PLAIN: 'café' });
	});
});
