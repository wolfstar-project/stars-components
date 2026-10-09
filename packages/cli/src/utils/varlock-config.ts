import type { ResolvedStarsConfig } from '@wolfstar/schema';
import { writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import type { ProxifiedModule } from 'magicast';

/** What `stars doctor --fix` would do to make `stars.config` say that varlock loads the environment. */
export type VarlockConfigPlan =
	/** There is no `stars.config.*`: write one, the way `@wolfstar/create-http-framework` does. */
	| { action: 'create'; file: string; contents: string }
	/** The configuration is a literal `defineConfig({ ... })` or object: add `env.loader` to it. */
	| { action: 'patch'; file: string; contents: string }
	/** The configuration is too dynamic to edit safely: show the snippet and leave the file alone. */
	| { action: 'manual'; file: string; reason: string };

/** What belongs in `stars.config`, whether it is created, patched or typed in by hand. */
export const VARLOCK_SNIPPET = "env: { loader: 'varlock' }";

const PATCHABLE_EXTENSIONS = new Set(['.ts', '.mts', '.js', '.mjs']);

/** `stars.config.ts` for a TypeScript bot, a JavaScript one gets a file its `package.json#type` can load. */
function newConfigName(config: ResolvedStarsConfig): string {
	if (/\.[cm]?tsx?$/.test(config.entry)) return 'stars.config.ts';
	return config.packageJson?.type === 'module' ? 'stars.config.js' : 'stars.config.mjs';
}

/** The file `@wolfstar/create-http-framework` writes, with the loader. */
function scaffold(): string {
	return ["import { defineConfig } from '@wolfstar/http-framework/config';", '', `export default defineConfig({ ${VARLOCK_SNIPPET} });`, ''].join(
		'\n'
	);
}

export async function planVarlockConfig(config: ResolvedStarsConfig): Promise<VarlockConfigPlan> {
	if (config.configFile === null) {
		return { action: 'create', file: join(config.root, newConfigName(config)), contents: scaffold() };
	}

	const file = config.configFile;
	if (!PATCHABLE_EXTENSIONS.has(extname(file))) {
		return { action: 'manual', file, reason: `${extname(file) || 'This kind of'} configuration file cannot be edited automatically` };
	}

	const { loadFile, generateCode } = await import('magicast');
	let patched: string | null;
	try {
		const mod = await loadFile(file);
		patched = patchConfigModule(mod) ? generateCode(mod, { format: { quote: 'single' } }).code : null;
	} catch (error) {
		return {
			action: 'manual',
			file,
			reason: `The configuration file could not be parsed: ${error instanceof Error ? error.message : String(error)}`
		};
	}

	if (patched === null) return { action: 'manual', file, reason: 'The configuration is not a literal object, or `env` is not' };
	return { action: 'patch', file, contents: patched.endsWith('\n') ? patched : `${patched}\n` };
}

/** Writes what {@link planVarlockConfig} planned; a `manual` plan writes nothing. */
export async function applyVarlockConfig(plan: VarlockConfigPlan): Promise<void> {
	if (plan.action === 'manual') return;
	await writeFile(plan.file, plan.contents, 'utf-8');
}

interface ProxifiedObject {
	$type?: string;
	$ast?: { properties?: readonly { type: string }[] };
	env?: unknown;
}

/**
 * Sets `env.loader` on the default export when it is `defineConfig({ ... })` or an object literal. Anything that
 * could hide an `env` of its own — a spread, an `env` that is not an object (or `true`) — is left to the user.
 */
function patchConfigModule(mod: ProxifiedModule): boolean {
	const exported = (mod.exports as { default?: unknown }).default as (ProxifiedObject & { $args?: ProxifiedObject[] }) | undefined;
	if (exported === undefined) return false;

	const target = exported.$type === 'function-call' ? exported.$args?.[0] : exported;
	if (target?.$type !== 'object' || target.$ast?.properties?.some((property) => property.type !== 'ObjectProperty')) return false;

	const env = target.env as (ProxifiedObject & { loader?: unknown }) | boolean | undefined;
	if (env === undefined || env === true) {
		target.env = { loader: 'varlock' };
		return true;
	}

	if (typeof env !== 'object' || env.$type !== 'object' || env.$ast?.properties?.some((property) => property.type !== 'ObjectProperty'))
		return false;
	env.loader = 'varlock';
	return true;
}
