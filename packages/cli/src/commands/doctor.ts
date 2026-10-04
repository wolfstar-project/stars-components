import { displayPath, type ResolvedStarsConfig } from '@wolfstar/schema';
import { defineCommand } from 'citty';
import { createColors } from 'colorette';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { delimiter, join } from 'node:path';
import { BRIDGE_FRAMEWORK_VERSION, isAtLeast } from '../dev/bridge.js';
import { endpointUrl, readDiscordCredentials } from '../dev/tunnel.js';
import { projectArgs, resolveCwd, type ProjectArgs } from '../utils/args.js';
import { cliDiagnostics } from '../utils/diagnostics.js';
import { loadProject, withProjectEnv, applyEnvOptions, type StarsHookable } from '../utils/hooks.js';
import { modulesPreloadWarning } from '../utils/modules.js';
import { shouldUseColor } from '../utils/output-mode.js';
import { readProjectEnv } from '../utils/project-env.js';
import { findInstalledVersion } from '../utils/project.js';
import { readOwnPackageJson } from '../utils/version.js';
import { prepareProject } from './_shared.js';

export type CheckStatus = 'ok' | 'info' | 'warn' | 'error';

export interface Check {
	name: string;
	status: CheckStatus;
	message: string;
	/** What to do about it. */
	fix?: string;
}

export interface DoctorOptions extends ProjectArgs {
	json?: boolean;
	/** Also asks Discord whether the token works and where the application's interactions go. */
	online?: boolean;
	stdout?: NodeJS.WritableStream;
	/** Overrides for tests. */
	env?: NodeJS.ProcessEnv;
	nodeVersion?: string;
	fetch?: typeof fetch;
	isPortFree?: (port: number, host: string) => Promise<boolean>;
}

/** The Node.js versions `@wolfstar/cli` runs on (`engines.node` of its `package.json`). */
const MINIMUM_NODE = 22;

/**
 * Checks what a project needs before `stars dev` can do its job: the runtime, the framework, the credentials, the
 * interactions endpoint and the generated files. Each check says what is wrong and what to do about it; nothing is
 * changed.
 */
export async function collectChecks(config: ResolvedStarsConfig, hooks: StarsHookable, options: DoctorOptions = {}): Promise<Check[]> {
	const env = options.env ?? process.env;
	const checks: Check[] = [];
	const show = (path: string) => displayPath(config.root, path);

	const node = options.nodeVersion ?? process.version;
	const major = Number.parseInt(node.replace(/^v/, ''), 10);
	checks.push(
		major >= MINIMUM_NODE
			? { name: 'node', status: 'ok', message: `Node.js ${node}` }
			: { name: 'node', status: 'error', message: `Node.js ${node} is too old`, fix: `Use Node.js ${MINIMUM_NODE} or later.` }
	);
	const wanted = readEnginesNode(config.root);
	const minimum = wanted === null ? null : /^\s*>=\s*(\d+)/.exec(wanted);
	if (minimum && major < Number(minimum[1])) {
		checks.push({
			name: 'engines',
			status: 'warn',
			message: `The project asks for Node.js ${wanted}, this is ${node}`,
			fix: `Use Node.js ${wanted}.`
		});
	}

	checks.push({ name: 'config', status: 'ok', message: config.configFile ? show(config.configFile) : 'no stars.config, running on defaults' });
	for (const warning of [...config.warnings, modulesPreloadWarning(config)]) {
		if (warning) checks.push({ name: 'config', status: 'warn', message: warning.message, ...(warning.fix ? { fix: warning.fix } : {}) });
	}

	const framework = findInstalledVersion(config.root, '@wolfstar/http-framework');
	if (framework === null) {
		checks.push({
			name: 'framework',
			status: 'error',
			message: '@wolfstar/http-framework is not installed',
			fix: 'Install @wolfstar/http-framework in the project.'
		});
	} else if (isAtLeast(framework, BRIDGE_FRAMEWORK_VERSION)) {
		checks.push({ name: 'framework', status: 'ok', message: `@wolfstar/http-framework v${framework}` });
	} else {
		checks.push({
			name: 'framework',
			status: 'warn',
			message: `@wolfstar/http-framework v${framework} cannot report to the dev UI`,
			fix: `Update to ${BRIDGE_FRAMEWORK_VERSION} or later for the hmr, commands, interactions and http channels.`
		});
	}

	checks.push({ name: 'entry', status: 'ok', message: `${show(config.entry)} (${config.build.tool})` });
	if (config.build.tool !== 'none' && !existsSync(config.build.output)) {
		checks.push({
			name: 'build',
			status: 'info',
			message: `${show(config.build.output)} is not built yet`,
			fix: 'Run `stars build` (or `stars dev`).'
		});
	}

	const values = { ...readProjectEnv(config), ...definedOnly(env), ...config.dev.env };
	const credentials = readDiscordCredentials(config, env);
	checks.push(
		credentials
			? { name: 'token', status: 'ok', message: 'DISCORD_TOKEN is set' }
			: {
					name: 'token',
					status: 'error',
					message: 'DISCORD_TOKEN is not set',
					fix: 'Set DISCORD_TOKEN in the environment or in the project .env file.'
				}
	);
	checks.push(
		values.DISCORD_PUBLIC_KEY
			? { name: 'public key', status: 'ok', message: 'DISCORD_PUBLIC_KEY is set' }
			: {
					name: 'public key',
					status: 'warn',
					message: 'DISCORD_PUBLIC_KEY is not set',
					fix: 'Set it in the project .env file, unless the bot passes `discordPublicKey` to its Client.'
				}
	);
	if (credentials && !credentials.applicationId) {
		checks.push({
			name: 'application',
			status: 'warn',
			message: 'The Discord application id is not set',
			fix: 'Set DISCORD_APPLICATION_ID for `stars commands`.'
		});
	}

	if (config.dev.url) {
		const url = new URL(config.dev.url);
		const port = Number(url.port || (url.protocol === 'https:' ? 443 : 80));
		const free = await (options.isPortFree ?? isPortFree)(port, url.hostname);
		checks.push(
			free
				? { name: 'port', status: 'ok', message: `${config.dev.url} is free` }
				: {
						name: 'port',
						status: 'warn',
						message: `Something already listens on ${config.dev.url}`,
						fix: 'Stop it, or set another HTTP_PORT, unless it is this bot running.'
					}
		);
	}

	const { tunnel } = config.dev;
	if (tunnel.mode === 'off') {
		checks.push({
			name: 'tunnel',
			status: 'info',
			message: 'No tunnel: Discord cannot reach a bot on localhost',
			fix: 'Set `dev.tunnel: true` for a cloudflared quick tunnel, or press t in `stars dev`.'
		});
	} else if (tunnel.mode === 'quick') {
		checks.push(
			findOnPath('cloudflared', env)
				? { name: 'tunnel', status: 'ok', message: 'cloudflared quick tunnel' }
				: { name: 'tunnel', status: 'info', message: 'cloudflared is not on the PATH: it is downloaded the first time the tunnel opens' }
		);
	} else {
		checks.push({ name: 'tunnel', status: 'ok', message: tunnel.url });
	}

	try {
		const prepared = await prepareProject(config, hooks, true);
		const stale = [
			prepared.tsconfig.status === 'outdated' ? show(prepared.tsconfig.path) : null,
			prepared.status === 'outdated' ? show(prepared.dts) : null,
			prepared.modules?.status === 'outdated' ? show(prepared.modules.path) : null
		].filter((path) => path !== null);
		checks.push(
			stale.length === 0
				? { name: 'prepare', status: 'ok', message: 'The generated files are up to date' }
				: { name: 'prepare', status: 'warn', message: `Out of date: ${stale.join(', ')}`, fix: 'Run `stars prepare`.' }
		);
	} catch (error) {
		checks.push({ name: 'prepare', status: 'error', message: error instanceof Error ? error.message : String(error) });
	}

	if (options.online && credentials) checks.push(await checkApplication(credentials.token, config, options.fetch ?? fetch));
	return checks;
}

/** Asks Discord who the token belongs to and where it sends interactions: the one thing only Discord knows. */
async function checkApplication(token: string, config: ResolvedStarsConfig, request: typeof fetch): Promise<Check> {
	try {
		const response = await request('https://discord.com/api/v10/applications/@me', {
			headers: { authorization: `Bot ${token}` },
			signal: AbortSignal.timeout(10_000)
		});
		if (!response.ok) {
			return {
				name: 'discord',
				status: 'error',
				message: `Discord answered ${response.status}`,
				fix: response.status === 401 ? 'Check DISCORD_TOKEN.' : 'Try again later.'
			};
		}

		const application = (await response.json()) as { name?: string; interactions_endpoint_url?: string | null };
		const endpoint = application.interactions_endpoint_url;
		const name = application.name ?? 'the application';
		if (!endpoint) {
			return {
				name: 'discord',
				status: 'warn',
				message: `${name} has no interactions endpoint URL`,
				fix: 'Set `dev.tunnel.updateEndpoint: true`, or set it in the Discord developer portal.'
			};
		}

		const tunnel = config.dev.tunnel;
		// The whole endpoint: the same origin with another path, or a host that merely starts the same, is elsewhere.
		const expected = tunnel.mode === 'url' ? endpointUrl(tunnel.url, tunnel.path) : null;
		if (expected !== null && normalizeUrl(endpoint) !== normalizeUrl(expected)) {
			return {
				name: 'discord',
				status: 'warn',
				message: `${name} sends interactions to ${endpoint}, not to ${expected}`,
				fix: 'Set `dev.tunnel.updateEndpoint: true`, or update it in the Discord developer portal.'
			};
		}

		return { name: 'discord', status: 'ok', message: `${name} sends interactions to ${endpoint}` };
	} catch (error) {
		return { name: 'discord', status: 'warn', message: `Could not reach Discord: ${error instanceof Error ? error.message : String(error)}` };
	}
}

/** A URL without the difference a trailing slash makes, or the text itself when it is not one. */
function normalizeUrl(url: string): string {
	try {
		const parsed = new URL(url);
		return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}${parsed.search}`;
	} catch {
		return url;
	}
}

function readEnginesNode(root: string): string | null {
	try {
		const parsed = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8')) as { engines?: { node?: unknown } };
		return typeof parsed.engines?.node === 'string' ? parsed.engines.node : null;
	} catch {
		return null;
	}
}

function definedOnly(env: NodeJS.ProcessEnv): Record<string, string> {
	return Object.fromEntries(Object.entries(env).filter((entry): entry is [string, string] => entry[1] !== undefined));
}

function findOnPath(binary: string, env: NodeJS.ProcessEnv): boolean {
	const extensions = process.platform === 'win32' ? ['.exe', '.cmd', ''] : [''];
	return (env.PATH ?? '')
		.split(delimiter)
		.filter(Boolean)
		.some((directory) => extensions.some((extension) => existsSync(join(directory, `${binary}${extension}`))));
}

/** Whether nothing listens on `host:port`: the port is bound for an instant and released. */
function isPortFree(port: number, host: string): Promise<boolean> {
	return new Promise((resolve) => {
		const server = createServer();
		server.once('error', () => resolve(false));
		server.listen({ port, host, exclusive: true }, () => server.close(() => resolve(true)));
	});
}

const SYMBOLS: Record<CheckStatus, string> = { ok: '✔', info: 'ℹ', warn: '⚠', error: '✖' };

export function formatChecks(checks: readonly Check[], useColor: boolean): string {
	const colors = createColors({ useColor });
	const paint = { ok: colors.green, info: colors.cyan, warn: colors.yellow, error: colors.red };
	const width = Math.max(...checks.map((check) => check.name.length));
	const lines = checks.flatMap((check) => [
		`  ${paint[check.status](SYMBOLS[check.status])} ${colors.dim(check.name.padEnd(width))}  ${check.message}`,
		...(check.fix ? [`    ${' '.repeat(width)}  ${colors.dim(`→ ${check.fix}`)}`] : [])
	]);
	const count = (status: CheckStatus) => checks.filter((check) => check.status === status).length;
	const summary = count('error') > 0 ? colors.red(`${count('error')} error(s)`) : colors.green('no errors');
	return [
		colors.bold(`stars doctor ${colors.dim(`v${readOwnPackageJson().version}`)}`),
		...lines,
		'',
		`  ${summary}, ${count('warn')} warning(s)`
	].join('\n');
}

export async function runDoctor(options: DoctorOptions): Promise<void> {
	const stdout = options.stdout ?? process.stdout;
	const project = await loadProject({ cwd: resolveCwd(options), configFile: options.config });
	// What `stars dev` would run with: `env:options` and varlock may change the port and the credentials.
	const config = withProjectEnv(await applyEnvOptions(project.config, project.hooks));
	const checks = await collectChecks(config, project.hooks, options);
	const errors = checks.filter((check) => check.status === 'error').length;

	stdout.write(`${options.json ? JSON.stringify({ ok: errors === 0, checks }, null, 2) : formatChecks(checks, shouldUseColor())}\n`);
	if (errors > 0) throw cliDiagnostics.DOCTOR_FAILED({ count: errors });
}

export default defineCommand({
	meta: {
		name: 'doctor',
		description: 'Check that the project is ready for `stars dev`: runtime, framework, credentials, endpoint, generated files'
	},
	args: {
		...projectArgs,
		json: {
			type: 'boolean',
			description: 'Print machine-readable JSON',
			default: false
		},
		online: {
			type: 'boolean',
			description: 'Also ask Discord whether the token works and where the application sends interactions',
			default: false
		}
	},
	async run({ args }) {
		await runDoctor({ config: args.config, cwd: args.cwd, json: args.json, online: args.online });
	}
});
