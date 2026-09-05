import { existsSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import type { StarsConfig } from '../../config.js';
import { ConfigError } from './errors.js';

export const CONFIG_EXTENSIONS = ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs'] as const;
export const CONFIG_FILE_NAMES = CONFIG_EXTENSIONS.map((extension) => `stars.config.${extension}`);

export interface LoadConfigFileOptions {
	/** The directory to discover the configuration file from. */
	cwd: string;
	/** An explicit configuration file (`--config`), resolved from `cwd`. */
	configFile?: string | null;
}

export interface LoadedConfigFile {
	/** The absolute path of the loaded file, `null` when running on defaults. */
	configFile: string | null;
	config: StarsConfig;
}

/**
 * Finds the first `stars.config.*` file in `cwd`, in {@link CONFIG_FILE_NAMES} order.
 */
export function discoverConfigFile(cwd: string): string | null {
	for (const name of CONFIG_FILE_NAMES) {
		const candidate = join(cwd, name);
		if (isFile(candidate)) return candidate;
	}

	return null;
}

/**
 * Loads the raw configuration object. The loader (`c12`) is imported lazily so
 * commands that never touch the configuration stay fast.
 */
export async function loadConfigFile(options: LoadConfigFileOptions): Promise<LoadedConfigFile> {
	const cwd = resolve(options.cwd);
	let file: string | null;

	if (options.configFile) {
		file = resolve(cwd, options.configFile);
		if (!isFile(file)) {
			throw new ConfigError(`Configuration file not found: ${file}`, {
				code: 'CONFIG_NOT_FOUND',
				hint: `Pass an existing file to --config, or create one of ${CONFIG_FILE_NAMES.join(', ')} in ${cwd}.`
			});
		}
	} else {
		file = discoverConfigFile(cwd);
		if (!file) return { configFile: null, config: {} };
	}

	const { loadConfig } = await import('c12');

	let loaded: unknown;
	try {
		const result = await loadConfig<StarsConfig>({
			name: 'stars',
			cwd: dirname(file),
			configFile: basename(file),
			rcFile: false,
			globalRc: false,
			dotenv: false,
			packageJson: false,
			defaults: {}
		});
		// c12 merges every layer with the defaults, which turns non-object exports into `{}`: inspect the raw layer.
		const layer = result.layers?.find(
			(candidate) => candidate.configFile && resolve(candidate.cwd ?? dirname(file), candidate.configFile) === file
		);
		loaded = layer ? layer.config : result.config;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new ConfigError(`Failed to load the configuration: ${message}`, {
			code: 'CONFIG_LOAD_FAILED',
			file,
			hint: 'The file must be valid TypeScript/JavaScript and export the configuration as its default export.',
			cause: error
		});
	}

	if (loaded === null || typeof loaded !== 'object' || Array.isArray(loaded)) {
		throw new ConfigError('The configuration file must export an object as its default export.', {
			code: 'CONFIG_NOT_OBJECT',
			file,
			hint: "Use `export default defineConfig({ ... })` from '@wolfstar/http-framework/config'."
		});
	}

	return { configFile: file, config: loaded as StarsConfig };
}

function isFile(path: string): boolean {
	try {
		return existsSync(path) && statSync(path).isFile();
	} catch {
		return false;
	}
}
