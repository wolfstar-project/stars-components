import { defineCommand } from 'citty';
import { projectArgs } from '../lib/args.js';

export default defineCommand({
	meta: {
		name: 'codegen',
		description: 'Run the configured code generators (i18next types)'
	},
	args: {
		...projectArgs,
		check: {
			type: 'boolean',
			description: 'Fail when the generated files are out of date instead of writing them',
			default: false
		},
		json: {
			type: 'boolean',
			description: 'Print machine-readable JSON',
			default: false
		}
	},
	async run({ args }) {
		const { runCodegen } = await import('../lib/tasks/codegen.js');
		await runCodegen({ config: args.config, cwd: args.cwd, check: args.check, json: args.json });
	}
});
