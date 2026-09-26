export const PACKAGE_MANAGERS = ['npm', 'yarn', 'pnpm', 'bun'] as const;

export const LANGUAGES = ['ts', 'js'] as const;
export type Language = (typeof LANGUAGES)[number];

export const BUILD_TOOLS = ['tsc6', 'tsc7', 'tsdown', 'vite', 'vite-nitro'] as const;
export type BuildTool = (typeof BUILD_TOOLS)[number];

/** `vite` and `vite-nitro` both bundle the app with Vite, so pieces are loaded explicitly instead of scanned from disk. */
export function isViteBuild(buildTool: BuildTool): boolean {
	return buildTool === 'vite' || buildTool === 'vite-nitro';
}

/** `vite-nitro` hands the built client to Nitro, which owns the HTTP server. */
export function isNitroBuild(buildTool: BuildTool): boolean {
	return buildTool === 'vite-nitro';
}

/** Optional plugins layered on top of the plain HTTP bot. */
export interface GatewayFeatures {
	gateway: boolean;
	cache: boolean;
	redis: boolean;
	sharder: boolean;
}

/**
 * Applies the dependencies between the gateway features: Redis needs the cache, and the cache and the sharder both
 * need the gateway client. `implied` names the features that were switched on to satisfy another one.
 */
export function resolveGatewayFeatures(features: GatewayFeatures): { features: GatewayFeatures; implied: string[] } {
	const resolved = { ...features };
	const implied: string[] = [];

	if (resolved.redis && !resolved.cache) {
		resolved.cache = true;
		implied.push('cache');
	}
	if ((resolved.cache || resolved.sharder) && !resolved.gateway) {
		resolved.gateway = true;
		implied.push('gateway');
	}

	return { features: resolved, implied };
}

/** The Nitro entry must default-export the HTTP client, which the sharder's manager process never has. */
export const SHARDER_WITH_NITRO_ERROR =
	'--sharder cannot be combined with --build vite-nitro: Nitro needs a client to forward requests to in every process.';

export const LINTERS = ['none', 'eslint', 'oxlint'] as const;
export type Linter = (typeof LINTERS)[number];

export const FORMATTERS = ['none', 'prettier', 'oxfmt'] as const;
export type Formatter = (typeof FORMATTERS)[number];

/**
 * TypeScript 7.0 (the native compiler) ships under the main `typescript` package on the `rc`
 * dist-tag. We pin it exactly because it is a prerelease (the old separate `@typescript/native-preview`
 * package only has dev builds).
 */
export const TYPESCRIPT_RC_VERSION = '7.0.1-rc';
