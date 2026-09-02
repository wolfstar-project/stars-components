import { generateAutoImportsDts } from '@wolfstar/http-framework/auto-imports';
import { displayPath, loadStarsConfig, type ResolvedStarsConfig } from '@wolfstar/http-framework/config';
import { createColors } from 'colorette';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { ProjectArgs } from '../args.js';
import { resolveCwd } from '../args.js';
import { CliError, ExitCode } from '../errors.js';
import { shouldUseColor } from '../output-mode.js';

export interface PrepareTaskOptions extends ProjectArgs {
	check?: boolean;
	json?: boolean;
	stdout?: NodeJS.WritableStream;
}

export type PrepareResult =
	| { enabled: false; dts: null; status: null }
	| { enabled: true; dts: string; status: 'written' | 'up-to-date' | 'outdated' };

/**
 * Generates `imports.dts` (see {@link StarsImportsConfig} in `@wolfstar/http-framework/config`), the way `nuxt
 * prepare` regenerates `.nuxt/imports.d.ts`. Run automatically by `stars dev` and `stars build` before the first
 * build; `--check` fails instead of writing, for CI.
 */
export async function runPrepare(options: PrepareTaskOptions): Promise<void> {
	const stdout = options.stdout ?? process.stdout;
	const colors = createColors({ useColor: shouldUseColor() && !options.json });
	const config = await loadStarsConfig({ cwd: resolveCwd(options), configFile: options.config });
	const result = await prepareAutoImports(config, Boolean(options.check));

	if (options.json) {
		stdout.write(`${JSON.stringify(result, null, 2)}\n`);
	} else if (!result.enabled) {
		stdout.write(`${colors.dim('stars')} nothing to prepare (auto imports are disabled)\n`);
	} else {
		const paint = result.status === 'outdated' ? colors.red : colors.green;
		stdout.write(`${colors.dim('stars')} imports: ${paint(result.status)} ${displayPath(config.root, result.dts)}\n`);
	}

	if (result.status === 'outdated') {
		throw new CliError('The auto imports declaration file is out of date, run `stars prepare` to update it.', {
			code: 'PREPARE_OUTDATED',
			exitCode: ExitCode.Error
		});
	}
}

/**
 * Regenerates `imports.dts` unconditionally, used by `stars dev`/`stars build` before the first build so the
 * declaration file exists (and is current) even when the user never ran `stars prepare` themselves.
 */
export async function prepareAutoImports(config: ResolvedStarsConfig, check = false): Promise<PrepareResult> {
	if (!config.imports.enabled) return { enabled: false, dts: null, status: null };

	const { dirs, presets, exclude, dts } = config.imports;
	const content = await generateAutoImportsDts({ root: config.root, dirs, presets, exclude });

	if (check) {
		const existing = await readFile(dts, 'utf-8').catch(() => null);
		return { enabled: true, dts, status: existing === content ? 'up-to-date' : 'outdated' };
	}

	await mkdir(dirname(dts), { recursive: true });
	await writeFile(dts, content);
	return { enabled: true, dts, status: 'written' };
}
