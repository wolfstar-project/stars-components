import { defineCommand } from 'citty';
import { projectArgs } from '../lib/args.js';

export default defineCommand({
	meta: {
		name: 'prepare',
		description: 'Generate TypeScript configuration and auto imports declarations'
	},
	args: {
		...projectArgs,
		check: {
			type: 'boolean',
			description: 'Fail when the generated files are out of date instead of writing it',
			default: false
		},
		json: {
			type: 'boolean',
			description: 'Print machine-readable JSON',
			default: false
		}
	},
	async run({ args }) {
		const { runPrepare } = await import('../lib/tasks/prepare.js');
		await runPrepare({ config: args.config, cwd: args.cwd, check: args.check, json: args.json });
	}
});
