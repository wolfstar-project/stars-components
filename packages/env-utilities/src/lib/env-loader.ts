import { Logger } from '@wolfstar/logger';
import { config, type DotenvConfigOptions, type DotenvConfigOutput, type DotenvParseOutput } from 'dotenv';
import { expand } from 'dotenv-expand';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface EnvLoaderOptions extends Omit<DotenvConfigOptions, 'path'> {
	/**
	 * You may specify a custom environment if `NODE_ENV` isn't sufficient.
	 */
	env?: string;
	/**
	 * You may specify a required prefix for your dotenv variables (ex. `APP_`).
	 */
	prefix?: string;
	/**
	 * Specify a custom path if your file containing environment variables is located elsewhere.
	 * Can also be an array of strings, specifying multiple paths.
	 *
	 * @default `src/.env*`, then `.env*` in `process.cwd()`
	 *
	 * @example with CJS
	 * ```typescript
	 * require('@wolfstar/env-utilities').setup({ path: '/custom/path/to/.env' })
	 * ```
	 * @example with ESM
	 * ```typescript
	 * import { setup } from '@wolfstar/env-utilities';
	 *
	 * const envFile = new URL('../.env', import.meta.url);
	 * setup({ path: envFile })
	 * ```
	 */
	path?: string | URL;
}

const packageVersion: string = '[VI]{{inject}}[/VI]';

const logger = new Logger({ level: Logger.Level.Debug });

export function loadEnvFiles(options?: EnvLoaderOptions): DotenvConfigOutput {
	const log = options?.debug ? (message: string) => logger.debug(`[@wolfstar/env-utilities@${packageVersion}] ${message}`) : () => undefined;

	/**
	 * @see {@linkplain https://github.com/facebook/create-react-app/blob/d960b9e38c062584ff6cfb1a70e1512509a966e7/packages/react-scripts/config/env.js#L18-L23}
	 */
	if (!process.env.NODE_ENV) {
		throw new Error('The NODE_ENV environment variable is required but was not specified.');
	}

	const env = options?.env || process.env.NODE_ENV;
	const dotenvPaths = options?.path ? [options.path] : [resolve(process.cwd(), 'src', '.env'), resolve(process.cwd(), '.env')];

	/**
	 * @see {@linkplain https://github.com/facebook/create-react-app/blob/d960b9e38c062584ff6cfb1a70e1512509a966e7/packages/react-scripts/config/env.js#L25-L34}
	 */
	const suffixes = [`.${env}.local`, ...(process.env.NODE_ENV === 'test' ? [] : ['.local']), `.${env}`, ''];
	// Specific files win over generic ones, while `src/.env*` wins over the corresponding root file. This keeps the
	// historical source-local convention working without configuration and still supports the ecosystem-standard
	// root files. dotenv itself preserves the first value loaded into process.env.
	const dotenvFiles = suffixes.flatMap((suffix) => dotenvPaths.map((path) => appendSuffix(path, suffix)));

	/**
	 * @see {@linkplain https://github.com/facebook/create-react-app/blob/d960b9e38c062584ff6cfb1a70e1512509a966e7/packages/react-scripts/config/env.js#L36-L49}
	 */
	let parsed: DotenvParseOutput = {};

	for (const dotenvFile of dotenvFiles) {
		const dotenvFileString = typeof dotenvFile === 'string' ? dotenvFile : fileURLToPath(dotenvFile);

		log(`loading \`${basename(dotenvFileString)}\``);

		const result = expand(
			config({
				debug: options?.debug,
				encoding: options?.encoding,
				path: dotenvFile
			})
		);

		if (result.error) {
			if ((result.error as FSError).code === 'ENOENT') {
				log(`\`${basename(dotenvFileString)}\` file not found`);
				continue;
			}

			throw result.error;
		}

		parsed = { ...result.parsed, ...parsed };
	}

	/**
	 * @see {@linkplain https://github.com/facebook/create-react-app/blob/d960b9e38c062584ff6cfb1a70e1512509a966e7/packages/react-scripts/config/env.js#L72-L89}
	 */
	if (options?.prefix) {
		const prefixRegExp = new RegExp(`^${options.prefix}`, 'i');
		parsed = Object.keys(parsed)
			.filter((key) => {
				const match = prefixRegExp.test(key);
				log(`Prefix for key \`${key}\` ${match ? 'matches' : 'does not match'} \`${options.prefix}\``);
				return match;
			})
			.reduce<DotenvParseOutput>((obj, key) => {
				obj[key] = parsed[key];
				return obj;
			}, {});
	}

	return {
		parsed
	};
}

function appendSuffix(path: string | URL, suffix: string): string | URL {
	if (typeof path === 'string') return `${path}${suffix}`;
	const file = fileURLToPath(path);
	return join(dirname(file), `${basename(file)}${suffix}`);
}

interface FSError extends Error {
	code: string;
}
