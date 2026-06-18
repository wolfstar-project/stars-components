#!/usr/bin/env node

import { defineCommand, runCommand, showUsage } from 'citty';
import { readFile } from 'node:fs/promises';
import { generate } from './generate.js';

const packageFile = new URL('../package.json', import.meta.url);
const packageJson = JSON.parse(await readFile(packageFile, 'utf-8'));

const parseIndentation = (value: string): string => {
	if (value === 'tabs') return '\t';

	const parsed = Number(value);
	if (Number.isNaN(parsed)) throw new Error('The indentation must be a number or "tabs"');
	return ' '.repeat(parsed);
};

const main = defineCommand({
	meta: {
		name: 'i18next-type-generator',
		version: packageJson.version,
		description: packageJson.description
	},
	args: {
		source: {
			type: 'positional',
			description: 'The directory to generate types from',
			default: './src/locales/en-US/'
		},
		destination: {
			type: 'positional',
			description: 'The directory to generate types to',
			default: './src/@types/i18next.d.ts'
		},
		indentation: {
			type: 'string',
			description: 'The indentation to use',
			alias: 'i',
			default: '\t'
		},
		verbose: {
			type: 'boolean',
			description: 'Verbose output',
			alias: 'v'
		},
		prettier: {
			type: 'boolean',
			description: 'Format output with prettier',
			default: true
		},
		oxfmt: {
			type: 'boolean',
			description: 'Format output with oxfmt',
			default: true
		}
	},
	async run({ args }) {
		await generate([args.source, args.destination], {
			verbose: args.verbose,
			oxfmt: args.oxfmt,
			prettier: args.prettier,
			indentation: parseIndentation(args.indentation)
		});
	}
});

const rawArgs = process.argv.slice(2);

if (rawArgs.includes('--help') || rawArgs.includes('-h')) {
	await showUsage(main);
	process.exit(0);
}

if (rawArgs.includes('--version')) {
	console.log(packageJson.version);
	process.exit(0);
}

try {
	await runCommand(main, { rawArgs });
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
}
