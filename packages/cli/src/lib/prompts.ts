import type { ApplicationCommand } from './discord.js';
import { CliError } from './errors.js';

export interface CommandsPrompt {
	/** Asks which of the deployed commands to delete. Returns the chosen ids. */
	pick(commands: readonly ApplicationCommand[], scope: string): Promise<string[]>;
	/** Final go/no-go before anything is deleted. */
	confirm(message: string): Promise<boolean>;
}

/**
 * The interactive wizard behind `stars commands clean`: a checklist of what Discord has deployed, then a
 * confirmation, so a destructive cleanup is never one keystroke away. `@clack/prompts` is loaded lazily — the
 * non-interactive paths (`--yes`, `--json`, CI) never pay for it.
 */
export function createClackPrompt(): CommandsPrompt {
	return {
		async pick(commands, scope) {
			const { isCancel, multiselect } = await import('@clack/prompts');
			const answer = await multiselect({
				message: `Which commands should be deleted from ${scope}?`,
				options: commands.map((command) => ({
					value: command.id,
					label: command.name,
					hint: [describeType(command), command.id].filter(Boolean).join(' · ')
				})),
				required: false
			});

			if (isCancel(answer)) throw aborted();
			return answer as string[];
		},
		async confirm(message) {
			const { confirm, isCancel } = await import('@clack/prompts');
			const answer = await confirm({ message, initialValue: false });

			if (isCancel(answer)) throw aborted();
			return answer;
		}
	};
}

function describeType(command: ApplicationCommand): string {
	switch (command.type) {
		case 2:
			return 'user';
		case 3:
			return 'message';
		default:
			return 'chat input';
	}
}

function aborted(): CliError {
	return new CliError('Aborted', { code: 'ABORTED' });
}
