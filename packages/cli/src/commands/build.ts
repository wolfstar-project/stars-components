import { defineCommand } from 'citty';
import { projectArgs } from '../lib/args.js';

export default defineCommand({
	meta: {
		name: 'build',
		description: 'Build the project once with the configured build tool'
	},
	args: { ...projectArgs },
	async run({ args }) {
		const { runBuild } = await import('../lib/tasks/build.js');
		await runBuild({ config: args.config, cwd: args.cwd });
	}
});
