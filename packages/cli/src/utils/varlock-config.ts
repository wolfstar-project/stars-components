import type { ResolvedStarsConfig } from '@wolfstar/schema';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import type { ProxifiedModule } from 'magicast';
import { findInstalledVersion } from './project.js';

/** What `stars doctor --fix` would do to make `stars.config` say that varlock loads the environment. */
export type VarlockConfigPlan =
	/** There is no `stars.config.*`: write one, the way `@wolfstar/create-http-framework` does. */
	| { action: 'create'; file: string; contents: string }
	/**
	 * The configuration is a literal `defineConfig({ ... })` or object: add `env.loader` to it. `original` is what the
	 * plan was computed from, so a file edited while the question was open is not overwritten.
	 */
	| { action: 'patch'; file: string; contents: string; original: string }
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

/**
 * The file `@wolfstar/create-http-framework` writes, with the loader. Without the framework there is no
 * `@wolfstar/http-framework/config` to import, and a file that cannot be imported would break every `stars` command, so
 * it is a plain object then.
 */
function scaffold(root: string): string {
	if (findInstalledVersion(root, '@wolfstar/http-framework') === null) return `export default { ${VARLOCK_SNIPPET} };\n`;
	return ["import { defineConfig } from '@wolfstar/http-framework/config';", '', `export default defineConfig({ ${VARLOCK_SNIPPET} });`, ''].join(
		'\n'
	);
}

export async function planVarlockConfig(config: ResolvedStarsConfig): Promise<VarlockConfigPlan> {
	if (config.configFile === null) {
		return { action: 'create', file: join(config.root, newConfigName(config)), contents: scaffold(config.root) };
	}

	const file = config.configFile;
	if (!PATCHABLE_EXTENSIONS.has(extname(file))) {
		return { action: 'manual', file, reason: `${extname(file) || 'This kind of'} configuration file cannot be edited automatically` };
	}

	const { parseModule, generateCode } = await import('magicast');
	let patched: string | null;
	let original: string;
	try {
		original = await readFile(file, 'utf-8');
		const mod = parseModule(original);
		patched = patchConfigModule(mod) ? generateCode(mod, { format: { quote: 'single' } }).code : null;
	} catch (error) {
		return {
			action: 'manual',
			file,
			reason: `The configuration file could not be parsed: ${error instanceof Error ? error.message : String(error)}`
		};
	}

	if (patched === null) return { action: 'manual', file, reason: 'The configuration is not a literal object, or `env` is not' };
	return { action: 'patch', file, contents: patched.endsWith('\n') ? patched : `${patched}\n`, original };
}

/**
 * Writes what {@link planVarlockConfig} planned; a `manual` plan writes nothing. The plan is made before the user is
 * asked, so the file is checked again first: one created or edited in the meantime is not overwritten.
 *
 * @throws {Error} When the file changed since it was planned.
 */
export async function applyVarlockConfig(plan: VarlockConfigPlan): Promise<void> {
	if (plan.action === 'manual') return;

	if (plan.action === 'create') {
		// `wx` fails if the file appeared since the plan was made.
		await writeFile(plan.file, plan.contents, { encoding: 'utf-8', flag: 'wx' }).catch((error: NodeJS.ErrnoException) => {
			throw error.code === 'EEXIST' ? new Error(`${plan.file} was created in the meantime`) : error;
		});
		return;
	}

	if ((await readFile(plan.file, 'utf-8')) !== plan.original) throw new Error(`${plan.file} was changed in the meantime`);
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
