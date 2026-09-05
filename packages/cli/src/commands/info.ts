import { defineCommand } from 'citty';
import { projectArgs } from '../lib/args.js';

export default defineCommand({
	meta: {
		name: 'info',
		description: 'Print the resolved project configuration and environment'
	},
	args: {
		...projectArgs,
		json: {
			type: 'boolean',
			description: 'Print machine-readable JSON',
			default: false
		}
	},
	async run({ args }) {
		const { runInfo } = await import('../lib/tasks/info.js');
		await runInfo({ config: args.config, cwd: args.cwd, json: args.json });
	}
});
