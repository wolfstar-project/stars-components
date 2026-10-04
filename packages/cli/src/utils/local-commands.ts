import type { ResolvedStarsConfig } from '@wolfstar/schema';
import { displayPath } from '@wolfstar/schema';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { BRIDGE_FRAMEWORK_VERSION, bridgeImportArgs, DUMP_ENV, parseBridgeMessage, type CommandSnapshot } from '../dev/bridge.js';
import { cliDiagnostics } from './diagnostics.js';
import { envImportArgs, moduleImportArgs } from './env-import.js';

export interface ReadLocalCommandsOptions {
	/** Milliseconds the bot gets to load its pieces. */
	timeout?: number;
}

/**
 * The application commands the project defines, as the bot itself would register them.
 *
 * Commands are declared with builders and decorators that only exist once the bot's modules ran, so nothing short of
 * running them knows the answer. This starts the built bot with the dev bridge in its "dump" mode: it loads its
 * pieces, reports its registry over IPC and exits before it listens or talks to Discord.
 *
 * It is a plain start of the bot, not a `stars dev` session: `STARS_DEV` is not set, so commands a project only
 * registers while developing are not part of what `stars commands deploy` deploys.
 */
export async function readLocalCommands(config: ResolvedStarsConfig, options: ReadLocalCommandsOptions = {}): Promise<CommandSnapshot> {
	if (!existsSync(config.build.output)) {
		throw cliDiagnostics.LOCAL_COMMANDS_UNAVAILABLE({
			reason: `${displayPath(config.root, config.build.output)} does not exist`,
			fix: 'Run `stars build` first: the commands are read from the built bot.'
		});
	}

	const bridge = bridgeImportArgs(config);
	if (bridge.length === 0) {
		throw cliDiagnostics.LOCAL_COMMANDS_UNAVAILABLE({
			reason: `@wolfstar/http-framework ${BRIDGE_FRAMEWORK_VERSION} or later is not installed in ${config.root}`,
			fix: `Install @wolfstar/http-framework@^${BRIDGE_FRAMEWORK_VERSION} in the project.`
		});
	}

	const child = spawn(
		process.execPath,
		[...envImportArgs(config), ...moduleImportArgs(config), ...bridge, ...config.dev.nodeArgs, config.build.output, ...config.dev.args],
		{
			cwd: config.root,
			// The environment the commands are read under is the caller's: `NODE_ENV=production stars commands deploy`
			// deploys what a production start registers. Unset, it is development, like the project's env files.
			env: { ...process.env, ...config.dev.env, NODE_ENV: process.env.NODE_ENV ?? 'development', [DUMP_ENV]: '1' },
			stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
			windowsHide: true
		}
	);

	return new Promise<CommandSnapshot>((resolve, reject) => {
		let stderr = '';
		let settled = false;
		const finish = (action: () => void) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			action();
		};
		const unavailable = (reason: string) =>
			cliDiagnostics.LOCAL_COMMANDS_UNAVAILABLE({
				reason,
				fix: 'Check that the bot starts with `stars dev`: it has to construct its `Client` and call `client.load()`.'
			});

		const timer = setTimeout(() => {
			child.kill('SIGKILL');
			finish(() => reject(unavailable('the bot did not load its commands in time')));
		}, options.timeout ?? 30_000);

		child.stderr?.on('data', (chunk: Buffer) => (stderr = `${stderr}${chunk.toString()}`.slice(-2000)));
		let snapshot: CommandSnapshot | null = null;
		child.on('message', (message) => {
			const parsed = parseBridgeMessage(message);
			if (parsed?.type !== 'commands' || snapshot !== null) return;
			snapshot = { global: parsed.global, guilds: parsed.guilds };
			// The bot exits on its own once the message is flushed. The answer waits for that: until then the process
			// still holds the project directory (its working directory), which Windows refuses to let go of.
			setTimeout(() => child.kill('SIGKILL'), 2000).unref();
		});
		child.once('error', (error) => finish(() => reject(unavailable(error.message))));
		child.once('exit', (code) => {
			if (snapshot !== null) {
				const commands = snapshot;
				finish(() => resolve(commands));
				return;
			}

			const detail = stderr.trim().split('\n').at(-1);
			finish(() => reject(unavailable(`the bot exited with code ${code} before loading its commands${detail ? ` (${detail})` : ''}`)));
		});
	});
}
