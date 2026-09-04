import { defineCommand } from 'citty';
import { projectArgs } from '../lib/args.js';

const scopeArgs = {
	...projectArgs,
	guild: {
		type: 'string',
		description: 'Work on a guild’s commands instead of the global ones'
	},
	json: {
		type: 'boolean',
		description: 'Print machine-readable JSON',
		default: false
	}
} as const;

const list = defineCommand({
	meta: { name: 'list', description: 'List the application commands Discord has deployed' },
	args: scopeArgs,
	async run({ args }) {
		const { runCommandsList } = await import('../lib/tasks/commands.js');
		await runCommandsList({ config: args.config, cwd: args.cwd, guild: args.guild, json: args.json });
	}
});

const clean = defineCommand({
	meta: { name: 'clean', description: 'Delete deployed application commands (all of them, or the named ones)' },
	args: {
		...scopeArgs,
		name: {
			type: 'string',
			description: 'Only delete the command with this name (repeatable)'
		},
		yes: {
			type: 'boolean',
			alias: 'y',
			description: 'Delete without asking for a confirmation',
			default: false
		}
	},
	async run({ args }) {
		const { runCommandsClean } = await import('../lib/tasks/commands.js');
		const names = Array.isArray(args.name) ? args.name : args.name ? [args.name] : [];
		await runCommandsClean({ config: args.config, cwd: args.cwd, guild: args.guild, json: args.json, names, yes: args.yes });
	}
});

export default defineCommand({
	meta: {
		name: 'commands',
		description: 'Inspect and clean the application commands deployed to Discord'
	},
	subCommands: { list, clean },
	args: scopeArgs,
	async run({ args, rawArgs }) {
		// `stars commands` with no subcommand lists, the way `git branch` does.
		if (rawArgs.some((argument) => argument === 'list' || argument === 'clean')) return;

		const { runCommandsList } = await import('../lib/tasks/commands.js');
		await runCommandsList({ config: args.config, cwd: args.cwd, guild: args.guild, json: args.json });
	}
});
