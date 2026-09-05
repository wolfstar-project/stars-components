import { loadStarsConfig } from '@wolfstar/http-framework/config';
import { createColors } from 'colorette';
import type { ProjectArgs } from '../args.js';
import { resolveCwd } from '../args.js';
import { COMMAND_TYPE_NAMES, createDiscordClient, type ApplicationCommand, type DiscordClient } from '../discord.js';
import { CliError } from '../errors.js';
import { shouldUseColor } from '../output-mode.js';
import { createClackPrompt, type CommandsPrompt } from '../prompts.js';

export interface CommandsTaskOptions extends ProjectArgs {
	/** A guild id to work on the guild-scoped commands instead of the global ones. */
	guild?: string;
	json?: boolean;
	stdout?: NodeJS.WritableStream;
	/** Overrides the client, for tests. */
	client?: DiscordClient;
}

export interface CommandsCleanOptions extends CommandsTaskOptions {
	/** Names to delete; without any, the wizard asks which of the deployed commands to remove. */
	names?: string[];
	/** Deletes without asking. Required in a non-interactive terminal. */
	yes?: boolean;
	stdin?: NodeJS.ReadableStream & { isTTY?: boolean };
	/** Overrides the interactive wizard, for tests. */
	prompt?: CommandsPrompt;
}

/**
 * Lists the application commands Discord currently has deployed, which is not necessarily what the project would
 * register today: renamed and removed commands stay until something deletes them.
 */
export async function runCommandsList(options: CommandsTaskOptions): Promise<void> {
	const stdout = options.stdout ?? process.stdout;
	const colors = createColors({ useColor: shouldUseColor() && !options.json });
	const { client, guild } = await connect(options);
	const commands = await client.listCommands(guild);

	if (options.json) {
		stdout.write(`${JSON.stringify({ applicationId: client.applicationId, guildId: guild, commands }, null, 2)}\n`);
		return;
	}

	if (commands.length === 0) {
		stdout.write(`${colors.dim('stars')} no ${guild ? `commands in guild ${guild}` : 'global commands'} are deployed\n`);
		return;
	}

	stdout.write(`${colors.dim('stars')} ${commands.length} ${guild ? `command(s) in guild ${guild}` : 'global command(s)'}\n`);
	for (const command of commands) stdout.write(`  ${colors.bold(describeName(command))} ${colors.dim(command.id)}\n`);
}

/**
 * Deletes deployed application commands. Discord keeps whatever was registered last, so this is the way to clear
 * commands a project no longer defines (or a whole guild's test deployment).
 */
export async function runCommandsClean(options: CommandsCleanOptions): Promise<void> {
	const stdout = options.stdout ?? process.stdout;
	const colors = createColors({ useColor: shouldUseColor() && !options.json });
	const { client, guild } = await connect(options);
	const deployed = await client.listCommands(guild);
	const wanted = options.names?.filter((name) => name.length > 0) ?? [];

	const missing = wanted.filter((name) => !deployed.some((command) => command.name === name));
	if (missing.length > 0) {
		throw new CliError(`No deployed command is named ${missing.join(', ')}`, {
			code: 'COMMAND_NOT_FOUND',
			hint: 'Run `stars commands list` to see what is deployed.'
		});
	}

	if (deployed.length === 0) {
		if (options.json) stdout.write(`${JSON.stringify({ deleted: [] }, null, 2)}\n`);
		else stdout.write(`${colors.dim('stars')} nothing to delete\n`);
		return;
	}

	const scope = guild ? `guild ${guild}` : 'the global scope';
	const targets = await selectTargets(options, deployed, wanted, scope, stdout, colors);
	if (targets.length === 0) {
		if (options.json) stdout.write(`${JSON.stringify({ deleted: [] }, null, 2)}\n`);
		else stdout.write(`${colors.dim('stars')} nothing to delete\n`);
		return;
	}

	for (const command of targets) {
		await client.deleteCommand(guild, command.id);
		if (!options.json) stdout.write(`${colors.dim('stars')} ${colors.red('deleted')} ${describeName(command)}\n`);
	}

	if (options.json) stdout.write(`${JSON.stringify({ deleted: targets.map((command) => ({ id: command.id, name: command.name })) }, null, 2)}\n`);
}

/**
 * Works out what to delete: `--name` (and `--yes`) keep the command scriptable, while a bare `stars commands clean`
 * on a terminal runs the wizard — a checklist of what Discord has deployed, then a confirmation.
 */
async function selectTargets(
	options: CommandsCleanOptions,
	deployed: ApplicationCommand[],
	wanted: string[],
	scope: string,
	stdout: NodeJS.WritableStream,
	colors: ReturnType<typeof createColors>
): Promise<ApplicationCommand[]> {
	if (wanted.length > 0) {
		const named = deployed.filter((command) => wanted.includes(command.name));
		if (options.yes) return named;

		await confirmOrThrow(options, stdout, colors, `delete ${colors.bold(String(named.length))} command(s) from ${scope}?`);
		return named;
	}

	if (options.yes) return deployed;

	const stdin = options.stdin ?? process.stdin;
	if (!options.prompt && !stdin.isTTY) throw confirmationRequired();

	const prompt = options.prompt ?? createClackPrompt();
	const chosen = new Set(await prompt.pick(deployed, scope));
	const targets = deployed.filter((command) => chosen.has(command.id));
	if (targets.length === 0) return [];

	const names = targets.map((command) => command.name).join(', ');
	if (!(await prompt.confirm(`Delete ${targets.length} command(s) from ${scope}: ${names}?`))) {
		throw new CliError('Aborted', { code: 'ABORTED' });
	}

	return targets;
}

async function connect(options: CommandsTaskOptions): Promise<{ client: DiscordClient; guild: string | null }> {
	const config = await loadStarsConfig({ cwd: resolveCwd(options), configFile: options.config });
	return { client: options.client ?? createDiscordClient(config), guild: options.guild ?? null };
}

function describeName(command: ApplicationCommand): string {
	const type = command.type && command.type !== 1 ? ` (${COMMAND_TYPE_NAMES[command.type] ?? `type ${command.type}`})` : '';
	return `${command.name}${type}`;
}

/**
 * Deleting deployed commands is not reversible, so a terminal run asks first; scripts pass `--yes`.
 */
async function confirmOrThrow(
	options: CommandsCleanOptions,
	stdout: NodeJS.WritableStream,
	colors: ReturnType<typeof createColors>,
	question: string
): Promise<void> {
	if (options.prompt) {
		if (await options.prompt.confirm(question)) return;
		throw new CliError('Aborted', { code: 'ABORTED' });
	}

	const stdin = options.stdin ?? process.stdin;
	if (!stdin.isTTY) throw confirmationRequired();

	stdout.write(`${colors.dim('stars')} ${question} [y/N] `);
	return new Promise((resolve, reject) => {
		stdin.setEncoding?.('utf-8');
		stdin.once('data', (chunk: string) => {
			stdin.pause?.();
			const answer = chunk.trim().toLowerCase();
			if (answer === 'y' || answer === 'yes') resolve();
			else reject(new CliError('Aborted', { code: 'ABORTED' }));
		});
		stdin.resume?.();
	});
}

function confirmationRequired(): CliError {
	return new CliError('Refusing to delete commands without a confirmation', {
		code: 'CONFIRMATION_REQUIRED',
		hint: 'Pass --yes to delete them, or --name to pick one, from a script.'
	});
}
