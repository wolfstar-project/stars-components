import type { ResolvedStarsConfig } from '@wolfstar/schema';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { loadAutoImportsModule } from '../utils/framework-auto-imports.js';
import { formatError } from '../utils/errors.js';
import type { StarsHookable } from '../utils/hooks.js';
import { prepareModulesPreload } from '../utils/modules.js';
import { prepareTsconfig } from '../utils/tsconfig.js';

export type PrepareResult =
	| { enabled: false; dts: null; status: null }
	| { enabled: true; dts: string; status: 'written' | 'up-to-date' | 'outdated' };

/**
 * Regenerates `imports.dts` unconditionally, used by `stars dev`/`stars build` before the first build so the
 * declaration file exists (and is current) even when the user never ran `stars prepare` themselves.
 */
export async function prepareAutoImports(config: ResolvedStarsConfig, check = false): Promise<PrepareResult> {
	if (!config.imports.enabled) return { enabled: false, dts: null, status: null };

	const { dirs, presets, exclude, dts } = config.imports;
	const { generateAutoImportsDts } = await loadAutoImportsModule(config.root);
	const content = await generateAutoImportsDts({ root: config.root, dirs, presets, exclude });

	if (check) {
		const existing = await readFile(dts, 'utf-8').catch(() => null);
		return { enabled: true, dts, status: existing === content ? 'up-to-date' : 'outdated' };
	}

	await mkdir(dirname(dts), { recursive: true });
	await writeFile(dts, content);
	return { enabled: true, dts, status: 'written' };
}

/** Prepares TypeScript configuration and auto import declarations before building. */
export async function prepareProject(config: ResolvedStarsConfig, hooks?: StarsHookable, check = false) {
	await hooks?.callHook('prepare:before', config);
	const tsconfig = await prepareTsconfig(config, check);
	const result = { ...(await prepareAutoImports(config, check)), tsconfig, modules: await prepareModulesPreload(config, check) };
	await hooks?.callHook('prepare:done', config, { dts: result.dts, status: result.status });
	return result;
}

/** Prints the non-fatal configuration diagnostics (e.g. an end-of-life compatibility version). */
export async function reportWarnings(config: ResolvedStarsConfig, write: (text: string) => void): Promise<void> {
	for (const warning of config.warnings) write(await formatError(warning));
}
