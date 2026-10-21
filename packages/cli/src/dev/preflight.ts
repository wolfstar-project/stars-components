import { access, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createServer, isIP } from 'node:net';
import { dirname, join } from 'node:path';
import { configDiagnostics, type ResolvedStarsConfig } from '@wolfstar/schema';
import { cliDiagnostics } from '../utils/diagnostics.js';
import { isCIEnvironment } from '../utils/output-mode.js';
import { readProjectEnv } from '../utils/project-env.js';

export type PortConflictPolicy = 'prompt' | 'next' | 'error' | 'continue';
export type PortChoice = 'continue' | 'cancel' | 'next';
export type PortAvailability = 'available' | 'in-use';

export interface DevEndpointOptions {
	port?: number;
	/** Address the application binds to (`--host`), already validated by {@link parseDevHost}. */
	host?: string;
	policy?: PortConflictPolicy;
	/** Whether a question can be answered; independent of whether Ink will be used. */
	interactive?: boolean;
	selectPort?: (url: string) => Promise<PortChoice>;
	/** Bind dependency, injectable for platform-specific bind failures. */
	checkPort?: (port: number, host: string) => Promise<PortAvailability>;
}

export function parseDevPort(value: string): number {
	const port = Number(value);
	if (!/^\d+$/.test(value) || !Number.isInteger(port) || port < 1 || port > 65535) {
		throw cliDiagnostics.INVALID_OPTION({ option: '--port', value, allowed: 'an integer from 1 to 65535' });
	}
	return port;
}

const WILDCARD_HOSTS = new Set(['0.0.0.0', '::']);
const HOSTNAME = /^(?=.{1,253}$)[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;

/**
 * `--host` the way Nuxt reads it: a bare `--host` (empty value) listens on every interface, anything else is an
 * IP address or hostname. IPv6 literals may be written with or without brackets.
 */
export function parseDevHost(value: string): string {
	const host = value.trim().replace(/^\[|\]$/g, '');
	if (host === '') return '0.0.0.0';
	if (isIP(host) === 0 && !HOSTNAME.test(host)) {
		throw cliDiagnostics.INVALID_OPTION({ option: '--host', value, allowed: 'an IP address or hostname' });
	}
	return host;
}

function withHost(config: ResolvedStarsConfig, host: string): ResolvedStarsConfig {
	let url = config.dev.url;
	// A wildcard is a bind address, not somewhere to browse to: the inferred display URL keeps its own host then.
	if (url && config.dev.urlSource === 'inferred' && !WILDCARD_HOSTS.has(host)) {
		const parsed = new URL(url);
		parsed.hostname = host.includes(':') ? `[${host}]` : host;
		url = parsed.pathname === '/' && !parsed.search && !parsed.hash && !url.endsWith('/') ? parsed.href.slice(0, -1) : parsed.href;
	}
	return {
		...config,
		dev: {
			...config.dev,
			url,
			// Nitro reads `NITRO_HOST` and then `HOST`; the framework reads `HTTP_ADDRESS`.
			env: { ...config.dev.env, HTTP_ADDRESS: host, ...(config.experimental.enableNitro ? { NITRO_HOST: host, HOST: host } : {}) }
		}
	};
}

/** Release the probe before resolving; EADDRINUSE alone means a conflicting listener. */
export function checkPortAvailability(port: number, host: string): Promise<PortAvailability> {
	return new Promise((resolve, reject) => {
		const server = createServer();
		server.once('error', (error: NodeJS.ErrnoException) => {
			if (error.code === 'EADDRINUSE') resolve('in-use');
			else reject(cliDiagnostics.PORT_CHECK_FAILED({ host, port, reason: `${error.code ?? 'bind error'}: ${error.message}` }));
		});
		server.listen({ port, host, exclusive: true }, () => {
			server.close((error) => {
				if (error) reject(cliDiagnostics.PORT_CHECK_FAILED({ host, port, reason: error.message }));
				else resolve('available');
			});
		});
	});
}

function canPrompt(): boolean {
	return Boolean(process.stdin.isTTY && process.stdout.isTTY) && !isCIEnvironment() && process.env.TERM !== 'dumb';
}

async function selectPort(url: string): Promise<PortChoice> {
	const { isCancel, select } = await import('@clack/prompts');
	const choice = await select<PortChoice>({
		message: `The port at ${url} is occupied. How should stars dev continue?`,
		options: [
			{ value: 'next', label: 'Use the next available port' },
			{ value: 'continue', label: 'Start anyway on the same port', hint: 'the application must handle the existing listener' },
			{ value: 'cancel', label: 'Cancel startup' }
		]
	});
	return isCancel(choice) ? 'cancel' : choice;
}

function withPort(config: ResolvedStarsConfig, port: number): ResolvedStarsConfig {
	let url = config.dev.url;
	if (url && config.dev.urlSource === 'inferred') {
		const parsed = new URL(url);
		parsed.port = String(port);
		url = parsed.pathname === '/' && !parsed.search && !parsed.hash && !url.endsWith('/') ? parsed.href.slice(0, -1) : parsed.href;
	}
	return {
		...config,
		dev: {
			...config.dev,
			url,
			listener: { ...config.dev.listener, port: String(port) },
			// A requested port applies to the child; an explicit display/health URL can belong to a proxy.
			env: { ...config.dev.env, HTTP_PORT: String(port), PORT: String(port), NITRO_PORT: String(port) }
		}
	};
}

/** Actual application bind addresses, independent of a display/health URL that may point at a proxy. */
export function devBindHosts(config: ResolvedStarsConfig): readonly string[] {
	const fromFiles = readProjectEnv(config);
	const keys = config.experimental.enableNitro ? ['NITRO_HOST', 'HOST'] : ['HTTP_ADDRESS'];
	let address: string | undefined;
	for (const key of keys) {
		address = config.dev.env[key] ?? process.env[key] ?? fromFiles[key];
		if (address) break;
	}
	return [(address || '0.0.0.0').replace(/^\[|\]$/g, '')];
}

/** Runs before builders, generated files, renderers and process signal handlers. Null means a graceful cancellation. */
export async function prepareDevEndpoint(input: ResolvedStarsConfig, options: DevEndpointOptions = {}): Promise<ResolvedStarsConfig | null> {
	// The host goes first: the port probe below checks the address the application will actually bind.
	const config = options.host === undefined ? input : withHost(input, options.host);
	const rawPort = options.port === undefined ? config.dev.listener.port : String(options.port);
	if (!/^\d+$/.test(rawPort) || Number(rawPort) < 1 || Number(rawPort) > 65535) {
		throw configDiagnostics.INVALID_PORT({ port: rawPort });
	}
	const port = Number(rawPort);
	// Inferred project/dev ports must reach the framework, which reads HTTP_PORT rather than generic PORT.
	const resolved =
		options.port !== undefined || config.dev.urlSource === 'inferred' || config.dev.listener.source === 'dev.env'
			? withPort(config, port)
			: config;
	const policy = options.policy ?? config.dev.portConflict ?? 'prompt';
	if (policy === 'continue') return resolved;
	const check = options.checkPort ?? checkPortAvailability;
	const hosts = devBindHosts(resolved);
	const endpoint = `http://${hosts[0]!.includes(':') ? `[${hosts[0]}]` : hosts[0]}:${port}`;
	const available = async (candidate: number): Promise<boolean> => {
		for (const host of hosts) {
			if ((await check(candidate, host)) === 'in-use') return false;
		}
		return true;
	};
	if (await available(port)) return resolved;
	if (policy === 'error' || (policy === 'prompt' && !(options.interactive ?? canPrompt()))) {
		throw cliDiagnostics.PORT_IN_USE({ url: endpoint });
	}

	const choice = policy === 'next' ? 'next' : await (options.selectPort ?? selectPort)(endpoint);
	if (choice === 'cancel') return null;
	if (choice === 'continue') return resolved;

	// A bounded search avoids hanging on an exhausted range and still includes the final valid TCP port.
	const last = Math.min(port + 100, 65535);
	for (let candidate = port + 1; candidate <= last; candidate++) {
		if (await available(candidate)) return withPort(resolved, candidate);
	}
	throw cliDiagnostics.NO_AVAILABLE_PORT({ first: port, last });
}

/** Check the nearest existing ancestor without creating directories or altering permissions. */
async function checkWritableDirectory(path: string): Promise<void> {
	let target = path;
	while (true) {
		const info = await stat(target).catch((error: NodeJS.ErrnoException) => {
			if (error.code === 'ENOENT') return null;
			throw cliDiagnostics.DEV_DIRECTORY_UNWRITABLE({ path, reason: error.message });
		});
		if (info) {
			if (!info.isDirectory()) throw cliDiagnostics.DEV_DIRECTORY_UNWRITABLE({ path, reason: `${target} is a file` });
			await access(target, constants.W_OK | constants.X_OK).catch((error: Error) => {
				throw cliDiagnostics.DEV_DIRECTORY_UNWRITABLE({ path, reason: error.message });
			});
			return;
		}
		const parent = dirname(target);
		if (parent === target) throw cliDiagnostics.DEV_DIRECTORY_UNWRITABLE({ path, reason: 'no existing parent directory' });
		target = parent;
	}
}

export async function checkDevDirectories(config: ResolvedStarsConfig): Promise<void> {
	const paths = new Set([join(config.root, '.stars')]);
	if (config.build.tool !== 'none') paths.add(config.build.outDir);
	if (config.imports.enabled) paths.add(dirname(config.imports.dts));
	if (config.dev.logFile) paths.add(dirname(config.dev.logFile));
	if (config.dev.logs?.dir) paths.add(config.dev.logs.dir);
	for (const path of paths) await checkWritableDirectory(path);
}
