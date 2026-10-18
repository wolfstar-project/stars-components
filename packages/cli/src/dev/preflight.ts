import { access, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createServer, isIP } from 'node:net';
import { networkInterfaces } from 'node:os';
import { dirname, join } from 'node:path';
import type { ResolvedStarsConfig } from '@wolfstar/schema';
import { cliDiagnostics } from '../utils/diagnostics.js';
import { isCIEnvironment } from '../utils/output-mode.js';
import { readProjectEnv } from '../utils/project-env.js';

export type PortConflictPolicy = 'prompt' | 'next' | 'error' | 'continue';
export type PortChoice = 'continue' | 'cancel' | 'next';
export type PortAvailability = 'available' | 'in-use';

export interface DevEndpointOptions {
	port?: number;
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

/** URL.hostname keeps IPv6 brackets; node:net expects an unbracketed address. Remote endpoints are never bound. */
export function localEndpoint(url: string): { host: string; port: number } | null {
	const parsed = new URL(url);
	const host = parsed.hostname.replace(/^\[|\]$/g, '');
	const local =
		host === 'localhost' ||
		host === '::' ||
		host === '0.0.0.0' ||
		host === '::1' ||
		(isIP(host) === 4 && host.startsWith('127.')) ||
		Object.values(networkInterfaces()).some((addresses) => addresses?.some(({ address }) => address === host));
	return local ? { host, port: Number(parsed.port || (parsed.protocol === 'https:' ? 443 : 80)) } : null;
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
	const url = new URL(config.dev.url!);
	url.port = String(port);
	return {
		...config,
		dev: {
			...config.dev,
			url: url.pathname === '/' && !url.search && !url.hash && !config.dev.url!.endsWith('/') ? url.href.slice(0, -1) : url.href,
			// The framework, generic Node servers, and Nitro must all see the selected endpoint.
			env: { ...config.dev.env, HTTP_PORT: String(port), PORT: String(port), NITRO_PORT: String(port) }
		}
	};
}

/** The advertised URL may be loopback while the application listens on every interface. */
export function devBindHosts(config: ResolvedStarsConfig, advertisedHost: string): readonly string[] {
	const fromFiles = readProjectEnv(config);
	const keys = config.experimental.enableNitro ? ['NITRO_HOST', 'HOST'] : ['HTTP_ADDRESS'];
	let address: string | undefined;
	for (const key of keys) {
		address = config.dev.env[key] ?? process.env[key] ?? fromFiles[key];
		if (address) break;
	}
	return [...new Set([advertisedHost, (address || '0.0.0.0').replace(/^\[|\]$/g, '')])];
}

/** Runs before builders, generated files, renderers and process signal handlers. Null means a graceful cancellation. */
export async function prepareDevEndpoint(config: ResolvedStarsConfig, options: DevEndpointOptions = {}): Promise<ResolvedStarsConfig | null> {
	if (!config.dev.url) return config;
	let resolved = options.port === undefined ? config : withPort(config, options.port);
	const endpoint = localEndpoint(resolved.dev.url!);
	if (!endpoint) return resolved;

	// Also carry an inferred PORT or an explicit dev.url through to the framework's HTTP_PORT listener.
	resolved = withPort(resolved, endpoint.port);
	const policy = options.policy ?? config.dev.portConflict ?? 'prompt';
	if (policy === 'continue') return resolved;
	const check = options.checkPort ?? checkPortAvailability;
	const hosts = devBindHosts(resolved, endpoint.host);
	const available = async (port: number): Promise<boolean> => {
		for (const host of hosts) {
			if ((await check(port, host)) === 'in-use') return false;
		}
		return true;
	};
	if (await available(endpoint.port)) return resolved;
	if (policy === 'error' || (policy === 'prompt' && !(options.interactive ?? canPrompt()))) {
		throw cliDiagnostics.PORT_IN_USE({ url: resolved.dev.url! });
	}

	const choice = policy === 'next' ? 'next' : await (options.selectPort ?? selectPort)(resolved.dev.url!);
	if (choice === 'cancel') return null;
	if (choice === 'continue') return resolved;

	// A bounded search avoids hanging on an exhausted range and still includes the final valid TCP port.
	const last = Math.min(endpoint.port + 100, 65535);
	for (let port = endpoint.port + 1; port <= last; port++) {
		if (await available(port)) return withPort(resolved, port);
	}
	throw cliDiagnostics.NO_AVAILABLE_PORT({ first: endpoint.port, last });
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
