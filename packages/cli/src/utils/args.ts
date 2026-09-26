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

export function resolveCwd(args: ProjectArgs): string {
	return args.cwd ? resolve(process.cwd(), args.cwd) : process.cwd();
}
