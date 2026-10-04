import { applyEnvOptions, loadProject, withProjectEnv } from '../utils/hooks.js';
import { defineCommand } from 'citty';
import { createColors } from 'colorette';
import type { Diagnostic } from 'nostics';
import type { ResolvedStarsConfig } from '@wolfstar/schema';
import type { CommandData, CommandSnapshot } from '../dev/bridge.js';
import { describeCommand, diffCommands, matchesDeployed, type CommandChange } from '../utils/command-diff.js';
import { COMMAND_TYPE_NAMES, createDiscordClient, type ApplicationCommand, type DiscordClient } from '../utils/discord.js';
import { cliDiagnostics } from '../utils/diagnostics.js';
import { readLocalCommands } from '../utils/local-commands.js';
import { shouldUseColor } from '../utils/output-mode.js';
import { createClackPrompt, type CommandsPrompt } from '../utils/prompts.js';
import { projectArgs, resolveCwd, type ProjectArgs } from '../utils/args.js';

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

export interface CommandsDiffOptions extends CommandsTaskOptions {
	/** Fails when the deployed commands differ, for CI. */
	check?: boolean;
	/** Overrides the commands read from the built bot, for tests. */
	local?: CommandSnapshot;
}

export interface CommandsDeployOptions extends CommandsDiffOptions {
	/** Deploys without asking. Required in a non-interactive terminal. */
	yes?: boolean;
	stdin?: NodeJS.ReadableStream & { isTTY?: boolean };
	/** Overrides the confirmation, for tests. */
	prompt?: Pick<CommandsPrompt, 'confirm'>;
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
		throw cliDiagnostics.COMMAND_NOT_FOUND({ names: missing.join(', ') });
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

const SYMBOLS = { added: '+', removed: '-', changed: '~' } as const;

/**
 * What a deploy of `guild` (or the global scope) would change: the commands the project defines for it against the
 * ones Discord has. A command is `changed` when the project's definition no longer matches (see `matchesDeployed`).
 */
async function compare(options: CommandsDiffOptions): Promise<{
	client: DiscordClient;
	guild: string | null;
	local: CommandData[];
	changes: CommandChange[];
}> {
	const project = await loadProject({ cwd: resolveCwd(options), configFile: options.config });
	// What the bot is started with: `env:options` (and varlock) may pick other env files than the defaults.
	const config = withProjectEnv(await applyEnvOptions(project.config, project.hooks));
	const { client, guild } = connectTo(config, options);
	const snapshot = options.local ?? (await readLocalCommands(config));
	const local = guild === null ? snapshot.global : (snapshot.guilds[guild] ?? []);
	const deployed = (await client.listCommands(guild)) as unknown as CommandData[];
	// Seen from Discord: what a deploy would add to, change in and remove from the deployed commands.
	return { client, guild, local, changes: diffCommands(deployed, local, guild, (old, next) => matchesDeployed(next, old)) };
}

function writeChanges(stdout: NodeJS.WritableStream, colors: ReturnType<typeof createColors>, changes: readonly CommandChange[]): void {
	const paint = { added: colors.green, removed: colors.red, changed: colors.yellow };
	for (const change of changes) {
		stdout.write(
			`  ${paint[change.kind](`${SYMBOLS[change.kind]} ${describeCommand({ ...change, guild: null })}`)} ${colors.dim(change.kind)}\n`
		);
	}
}

/**
 * Compares the commands the project defines with the ones Discord has deployed, without changing anything: what
 * `stars commands deploy` would do. `--check` makes a difference an error, for CI.
 */
export async function runCommandsDiff(options: CommandsDiffOptions): Promise<void> {
	const stdout = options.stdout ?? process.stdout;
	const colors = createColors({ useColor: shouldUseColor() && !options.json });
	const { client, guild, changes } = await compare(options);

	if (options.json) {
		stdout.write(`${JSON.stringify({ applicationId: client.applicationId, guildId: guild, changes }, null, 2)}\n`);
	} else if (changes.length === 0) {
		stdout.write(`${colors.dim('stars')} ${guild ? `guild ${guild}` : 'the global scope'} is up to date\n`);
	} else {
		stdout.write(`${colors.dim('stars')} ${changes.length} difference(s) in ${guild ? `guild ${guild}` : 'the global scope'}\n`);
		writeChanges(stdout, colors, changes);
	}

	if (options.check && changes.length > 0) throw cliDiagnostics.COMMANDS_DIFFER({ count: changes.length });
}

/**
 * Deploys the commands the project defines to Discord with a bulk overwrite: a deployed command the project no
 * longer defines is deleted. It shows what will change and asks first; scripts pass `--yes`.
 */
export async function runCommandsDeploy(options: CommandsDeployOptions): Promise<void> {
	const stdout = options.stdout ?? process.stdout;
	const colors = createColors({ useColor: shouldUseColor() && !options.json });
	const { client, guild, local, changes } = await compare(options);
	const scope = guild ? `guild ${guild}` : 'the global scope';

	if (changes.length === 0) {
		if (options.json) stdout.write(`${JSON.stringify({ applicationId: client.applicationId, guildId: guild, deployed: 0, changes }, null, 2)}\n`);
		else stdout.write(`${colors.dim('stars')} ${scope} is up to date, nothing to deploy\n`);
		return;
	}

	if (!options.json) {
		stdout.write(`${colors.dim('stars')} deploying to ${scope}\n`);
		writeChanges(stdout, colors, changes);
	}

	if (!options.yes) {
		const stdin = options.stdin ?? process.stdin;
		// `--json` owns stdout: a question printed there would end up in front of the document.
		if (!options.prompt && (!stdin.isTTY || options.json)) throw cliDiagnostics.DEPLOY_CONFIRMATION_REQUIRED({});
		const prompt = options.prompt ?? createClackPrompt();
		if (!(await prompt.confirm(`Overwrite the commands of ${scope} with the ${local.length} the project defines?`))) {
			throw cliDiagnostics.ABORTED({});
		}
	}

	const deployed = await client.putCommands(guild, local);
	if (options.json) {
		stdout.write(`${JSON.stringify({ applicationId: client.applicationId, guildId: guild, deployed: deployed.length, changes }, null, 2)}\n`);
	} else {
		stdout.write(`${colors.dim('stars')} ${colors.green('deployed')} ${deployed.length} command(s) to ${scope}\n`);
	}
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
		throw cliDiagnostics.ABORTED({});
	}

	return targets;
}

async function connect(options: CommandsTaskOptions): Promise<{ client: DiscordClient; guild: string | null }> {
	const { config } = await loadProject({ cwd: resolveCwd(options), configFile: options.config });
	return connectTo(config, options);
}

function connectTo(config: ResolvedStarsConfig, options: CommandsTaskOptions): { client: DiscordClient; guild: string | null } {
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
		throw cliDiagnostics.ABORTED({});
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
			else reject(cliDiagnostics.ABORTED({}));
		});
		stdin.resume?.();
	});
}

function confirmationRequired(): Diagnostic {
	return cliDiagnostics.CONFIRMATION_REQUIRED({});
}

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
		const names = Array.isArray(args.name) ? args.name : args.name ? [args.name] : [];
		await runCommandsClean({ config: args.config, cwd: args.cwd, guild: args.guild, json: args.json, names, yes: args.yes });
	}
});

const diff = defineCommand({
	meta: { name: 'diff', description: 'Compare the commands the built bot defines with the ones Discord has deployed' },
	args: {
		...scopeArgs,
		check: {
			type: 'boolean',
			description: 'Fail when the deployed commands differ, for CI',
			default: false
		}
	},
	async run({ args }) {
		await runCommandsDiff({ config: args.config, cwd: args.cwd, guild: args.guild, json: args.json, check: args.check });
	}
});

const deploy = defineCommand({
	meta: { name: 'deploy', description: 'Deploy the commands the built bot defines, replacing the deployed ones' },
	args: {
		...scopeArgs,
		yes: {
			type: 'boolean',
			alias: 'y',
			description: 'Deploy without asking for a confirmation',
			default: false
		}
	},
	async run({ args }) {
		await runCommandsDeploy({ config: args.config, cwd: args.cwd, guild: args.guild, json: args.json, yes: args.yes });
	}
});

const SUBCOMMANDS = ['list', 'clean', 'diff', 'deploy'];

export default defineCommand({
	meta: {
		name: 'commands',
		description: 'Inspect, compare, deploy and clean the application commands deployed to Discord'
	},
	subCommands: { list, clean, diff, deploy },
	args: scopeArgs,
	async run({ args, rawArgs }) {
		// `stars commands` with no subcommand lists, the way `git branch` does.
		if (rawArgs.some((argument) => SUBCOMMANDS.includes(argument))) return;

		await runCommandsList({ config: args.config, cwd: args.cwd, guild: args.guild, json: args.json });
	}
});
