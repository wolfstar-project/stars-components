import Handlebars from 'handlebars';
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile } from './fileSystem.js';
import type { Language } from './options.js';

const templateDir = join(fileURLToPath(import.meta.url), '../..', 'template');
const baseDir = join(templateDir, 'base');
const featuresDir = join(templateDir, 'features');

/**
 * Records the `TemplateContext` used for the last successful {@link processTemplate} run. Reruns
 * use it to compare a stale file against an *exact* rendering of whatever produced it, so a
 * genuinely pristine file is recognized regardless of what `--port`/name/`--language` changed this
 * run, while a hand-edit — however small, even a single digit inside what would otherwise be a
 * `{{port}}` slot — still fails the comparison and is preserved. See {@link removeStaleGeneratedFiles}
 * for the (deliberately less precise) fallback used when this manifest is missing.
 */
const manifestFilename = '.create-http-framework.json';

function readManifest(outputDir: string): TemplateContext | undefined {
	try {
		return JSON.parse(readFileSync(join(outputDir, manifestFilename), 'utf-8')) as TemplateContext;
	} catch {
		return undefined;
	}
}

function writeManifest(outputDir: string, context: TemplateContext): void {
	writeFile(join(outputDir, manifestFilename), `${JSON.stringify(context, null, '\t')}\n`);
}

/**
 * `@wolfstar/i18next-type-generator` writes this file when the CLI runs it after `processTemplate`
 * (see `index.ts`). It isn't part of the Handlebars template set — its content is derived from the
 * project's own locale keys, not from a static source file — so {@link removeStaleGeneratedFiles}
 * has no candidate to diff it against and would never touch it, manifest or not. Delete it directly
 * whenever i18n is disabled: it's pure `generate:i18n` output, never meant to be hand-edited.
 */
function removeI18nDeclaration(outputDir: string): void {
	const target = join(outputDir, 'src', '@types', 'i18next.d.ts');
	if (!existsSync(target)) return;

	rmSync(target);
	const typesDir = dirname(target);
	if (existsSync(typesDir) && readdirSync(typesDir).length === 0) rmSync(typesDir, { recursive: true });
}

/** Context for the Handlebars source files. Config files (package.json, tsconfig, …) are generated in projectFiles.ts. */
export interface TemplateContext {
	name: string;
	port: number;
	language: Language;
	i18n: boolean;
	subcommands: boolean;
	subcommandsAdvanced: boolean;
	testing: boolean;
}

function walkDir(dir: string): string[] {
	const entries = readdirSync(dir);
	const files: string[] = [];

	for (const entry of entries) {
		const fullPath = join(dir, entry);
		if (statSync(fullPath).isDirectory()) {
			files.push(...walkDir(fullPath));
		} else {
			files.push(fullPath);
		}
	}

	return files;
}

/**
 * Resolves which `template/features/*` directories should be layered on top of `template/base/`,
 * in application order. Later entries overwrite earlier ones (and `base/`) on path collisions.
 */
export function resolveFeatureDirs(ctx: Pick<TemplateContext, 'i18n' | 'subcommands' | 'subcommandsAdvanced' | 'testing'>): string[] {
	const dirs: string[] = [];
	if (ctx.i18n) dirs.push('i18n');
	if (ctx.subcommandsAdvanced) {
		dirs.push(ctx.i18n ? 'subcommands-advanced-i18n' : 'subcommands-advanced');
	} else if (ctx.subcommands) {
		dirs.push(ctx.i18n ? 'subcommands-i18n' : 'subcommands');
	}
	if (ctx.testing) {
		dirs.push('testing');
		// `applyLocalizedBuilder` requires `container.i18n` to be initialized, so the generated
		// `tests/ping.test.*` needs to register the i18next plugin and pass the same `i18n` client
		// option as `src/main.*` — layer that overlay on top of the plain `testing` directory instead
		// of duplicating `vitest.config.*`/`vitest.setup.*`, which don't change with i18n.
		if (ctx.i18n) dirs.push('testing-i18n');
	}
	return dirs;
}

/** The output-relative path a source file under a template root resolves to for the given language, or `null` if the file doesn't apply to that language. */
function toOutputRelative(root: string, absoluteSource: string, language: Language): string | null {
	const relativePath = relative(root, absoluteSource);

	if (language === 'js' && relativePath.endsWith('.ts.hbs')) return null;
	if (language === 'ts' && relativePath.endsWith('.js.hbs')) return null;

	return relativePath.endsWith('.hbs') ? relativePath.slice(0, -'.hbs'.length) : relativePath;
}

/** The set of output-relative paths that writing `root` for `language` would produce. */
function collectOutputPaths(root: string, language: Language): Set<string> {
	const paths = new Set<string>();
	for (const absoluteSource of walkDir(root)) {
		const outputRelative = toOutputRelative(root, absoluteSource, language);
		if (outputRelative !== null) paths.add(outputRelative);
	}
	return paths;
}

function renderSource(absoluteSource: string, context: TemplateContext): string {
	const rawContent = readFileSync(absoluteSource, 'utf-8');
	return absoluteSource.endsWith('.hbs') ? Handlebars.compile(rawContent)(context) : rawContent;
}

function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** True unless `rawSource` uses a Handlebars block helper (`{{#if}}`, `{{#each}}`, …) — see {@link buildStaleFileMatcher}. */
function isSimpleInterpolationOnly(rawSource: string): boolean {
	return !/\{\{[#/]/.test(rawSource);
}

/**
 * Builds a *legacy-migration-only* fallback matcher for what `absoluteSource` could have rendered
 * to, treating each `{{variable}}` interpolation as an unrestricted wildcard. This is deliberately
 * imprecise — a hand-edit confined to what would otherwise be a `{{port}}` slot (e.g. the user
 * changing just the fallback port number) is indistinguishable from a stale-but-pristine file and
 * gets deleted. It only runs when there's no manifest to compare against exactly (see
 * {@link removeStaleGeneratedFiles}), which is limited to projects generated before the manifest
 * existed — every run after this one writes a manifest, closing the gap for good.
 *
 * `null` for files with block helpers (`{{#if}}`, …), which can't be turned into a simple wildcard
 * pattern this way; none currently end up in "stale candidate" position, but this keeps the caller's
 * exact-render fallback available if that changes.
 */
function buildStaleFileMatcher(absoluteSource: string): RegExp | null {
	const rawContent = readFileSync(absoluteSource, 'utf-8');
	if (!absoluteSource.endsWith('.hbs')) return new RegExp(`^${escapeRegExp(rawContent)}$`);
	if (!isSimpleInterpolationOnly(rawContent)) return null;

	const literalChunks = rawContent.split(/\{\{\s*[\w.]+\s*\}\}/g).map(escapeRegExp);
	return new RegExp(`^${literalChunks.join('[\\s\\S]*?')}$`);
}

/**
 * Maps every output-relative path `root` could ever produce — for either language — to the source
 * file(s) that render it. Unlike {@link collectOutputPaths} this ignores `context.language`, so it
 * also surfaces paths left behind by a previous run under the *other* language (e.g. `src/main.ts`
 * after rerunning with `--language js`).
 */
function collectCandidateSources(root: string): Map<string, string[]> {
	const candidates = new Map<string, string[]>();
	for (const absoluteSource of walkDir(root)) {
		const relativePath = relative(root, absoluteSource);
		const outputRelative = relativePath.endsWith('.hbs') ? relativePath.slice(0, -'.hbs'.length) : relativePath;
		const sources = candidates.get(outputRelative);
		if (sources) sources.push(absoluteSource);
		else candidates.set(outputRelative, [absoluteSource]);
	}
	return candidates;
}

/**
 * When re-running against a non-empty `outputDir` (`--ignore`), files written by a previous run
 * survive even after the feature that produced them is disabled, or the project's language is
 * switched — `processTemplate` only ever (re)writes the paths the *current* selections produce, it
 * never deletes. Left behind, those files can keep importing packages that `writeProjectFiles` just
 * dropped from `package.json` (e.g. `@wolfstar/plugin-i18next`), breaking install/build.
 *
 * Deletes any known generator output path that isn't produced by `base/` or an active feature this
 * run, but only when the file on disk still matches what the generator would have written for it —
 * i.e. it wasn't hand-edited since. Hand-edited files are left in place (and their paths returned)
 * so the caller can warn instead of silently discarding user work.
 *
 * When a manifest is present, the comparison is an *exact* render of the candidate against the
 * context recorded there — the one that actually produced the file — so it's precise even after
 * `--port`/name/`--language` changed this run, and still catches a hand-edit as small as one digit.
 * When it's missing (a project generated before the manifest existed), falls back to
 * {@link buildStaleFileMatcher}'s wildcard comparison: less precise (a hand-edit confined to a
 * `{{variable}}` slot won't be caught), but still correctly cleans up the common case instead of
 * leaving a dangling import forever. That gap closes after this run, which always writes a manifest.
 */
function removeStaleGeneratedFiles(outputDir: string, context: TemplateContext): string[] {
	const manifestContext = readManifest(outputDir);

	const keepPaths = collectOutputPaths(baseDir, context.language);
	for (const feature of resolveFeatureDirs(context)) {
		for (const path of collectOutputPaths(join(featuresDir, feature), context.language)) keepPaths.add(path);
	}

	const candidates = collectCandidateSources(baseDir);
	for (const feature of readdirSync(featuresDir)) {
		for (const [path, sources] of collectCandidateSources(join(featuresDir, feature))) {
			const existing = candidates.get(path);
			if (existing) existing.push(...sources);
			else candidates.set(path, sources);
		}
	}

	const preserved: string[] = [];
	for (const [path, sources] of candidates) {
		if (keepPaths.has(path)) continue;

		const target = join(outputDir, path);
		if (!existsSync(target)) continue;

		const actual = readFileSync(target, 'utf-8');
		const isUnmodifiedGeneratorOutput = manifestContext
			? sources.some((source) => renderSource(source, manifestContext) === actual)
			: sources.some((source) => {
					const matcher = buildStaleFileMatcher(source);
					return matcher ? matcher.test(actual) : renderSource(source, context) === actual;
				});
		if (isUnmodifiedGeneratorOutput) rmSync(target);
		else preserved.push(path);
	}

	return preserved;
}

/**
 * Walks `root` and writes every file into `outputDir`, preserving the relative path.
 *
 * - `*.ts.hbs` / `*.js.hbs` files are skipped unless they match `context.language`.
 * - Other `*.hbs` files (e.g. `.env.hbs`, `.gitignore.hbs`, `README.md.hbs`) are compiled unconditionally.
 * - Non-`.hbs` files (e.g. static locale JSON under a feature's `src/locales/**`) are copied verbatim —
 *   no extension stripped, no Handlebars compilation.
 */
function processDir(root: string, outputDir: string, context: TemplateContext): void {
	for (const absoluteSource of walkDir(root)) {
		// Source files exist in both `.ts.hbs` and `.js.hbs` variants — keep only the chosen language.
		const outputRelative = toOutputRelative(root, absoluteSource, context.language);
		if (outputRelative === null) continue;

		const rawContent = readFileSync(absoluteSource, 'utf-8');
		const isHandlebars = absoluteSource.endsWith('.hbs');
		const outputPath = join(outputDir, outputRelative);
		const content = isHandlebars ? Handlebars.compile(rawContent)(context) : rawContent;
		writeFile(outputPath, content);
	}
}

/**
 * Renders `template/base/` into `outputDir`, then layers the feature directories resolved by
 * {@link resolveFeatureDirs} on top, in order — feature files overwrite base files at the same
 * output-relative path (e.g. `features/i18n/src/main.ts.hbs` overwrites `base/src/main.ts.hbs`).
 *
 * @returns Output-relative paths that looked stale (belong to a disabled feature or the other
 * language) but were left in place because they'd been hand-edited since the last run.
 */
export async function processTemplate(outputDir: string, context: TemplateContext): Promise<string[]> {
	const preserved = removeStaleGeneratedFiles(outputDir, context);
	if (!context.i18n) removeI18nDeclaration(outputDir);

	processDir(baseDir, outputDir, context);

	for (const feature of resolveFeatureDirs(context)) {
		processDir(join(featuresDir, feature), outputDir, context);
	}

	writeManifest(outputDir, context);

	return preserved;
}
