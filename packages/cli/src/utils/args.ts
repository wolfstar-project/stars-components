import type { ArgsDef } from 'citty';
import { resolve } from 'node:path';

/**
 * Arguments shared by every command that reads the project configuration.
 */
export const projectArgs = {
	config: {
		type: 'string',
		alias: 'c',
		description: 'Path to the configuration file (defaults to stars.config.* in the working directory)'
	},
	cwd: {
		type: 'string',
		description: 'Working directory to run from (defaults to the current directory)'
	}
} as const satisfies ArgsDef;

export interface ProjectArgs {
	config?: string;
	cwd?: string;
}

/**
 * Every value of a flag given more than once (`--channel a --channel=b`). citty keeps only the last one of a
 * repeated string flag, so a repeatable flag reads the raw arguments.
 */
export function collectFlag(rawArgs: readonly string[], name: string): string[] {
	const values: string[] = [];
	for (const [index, argument] of rawArgs.entries()) {
		if (argument === '--') break;
		if (argument.startsWith(`--${name}=`)) values.push(argument.slice(name.length + 3));
		else if (argument === `--${name}`) {
			const next = rawArgs[index + 1];
			if (next !== undefined && !next.startsWith('-')) values.push(next);
		}
	}

	return values;
}

export function resolveCwd(args: ProjectArgs): string {
	return args.cwd ? resolve(process.cwd(), args.cwd) : process.cwd();
}
