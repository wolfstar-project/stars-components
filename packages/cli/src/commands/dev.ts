import { defineCommand } from 'citty';
import { projectArgs } from '../lib/args.js';
import { THEME_SETTINGS } from '../lib/theme.js';

export default defineCommand({
	meta: {
		name: 'dev',
		description: 'Build, run and restart the bot on changes'
	},
	args: {
		...projectArgs,
		tui: {
			type: 'boolean',
			description: 'Interactive terminal UI; use --no-tui (or STARS_TUI=plain) for plain line output',
			default: true
		},
		theme: {
			type: 'string',
			description: `Colour theme of the interactive UI: ${THEME_SETTINGS.join(', ')} (or STARS_THEME; press T in the UI to pick one)`
		}
	},
	async run({ args }) {
		const { runDev } = await import('../lib/tasks/dev.js');
		await runDev({ config: args.config, cwd: args.cwd, tui: args.tui ? undefined : false, theme: args.theme });
	}
});
