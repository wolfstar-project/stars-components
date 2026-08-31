import Handlebars from 'handlebars';
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile } from './fileSystem.js';
import type { Language } from './options.js';

const templateDir = join(fileURLToPath(import.meta.url), '../..', 'template');
const baseDir = join(templateDir, 'base');
const featuresDir = join(templateDir, 'features');

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

/**
 * When re-running against a non-empty `outputDir` (`--ignore`), files written by a previously
 * enabled feature overlay (e.g. `src/commands/math.ts` from `subcommands`) survive even after that
 * feature is disabled — `processTemplate` only ever writes the currently active overlays, it never
 * deletes. Left behind, those files keep importing packages that `writeProjectFiles` just dropped
 * from `package.json` (e.g. `@wolfstar/plugin-i18next`), breaking install/build. Delete any
 * generator-owned path that belongs to a disabled feature and isn't also produced by `base/` or a
 * still-active feature this run, before rendering the new template.
 */
function removeStaleFeatureFiles(outputDir: string, context: TemplateContext): void {
	const activeFeatures = new Set(resolveFeatureDirs(context));
	const keepPaths = collectOutputPaths(baseDir, context.language);
	for (const feature of activeFeatures) {
		for (const path of collectOutputPaths(join(featuresDir, feature), context.language)) keepPaths.add(path);
	}

	for (const feature of readdirSync(featuresDir)) {
		if (activeFeatures.has(feature)) continue;

		for (const path of collectOutputPaths(join(featuresDir, feature), context.language)) {
			if (keepPaths.has(path)) continue;
			const target = join(outputDir, path);
			if (existsSync(target)) rmSync(target);
		}
	}
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
 */
export async function processTemplate(outputDir: string, context: TemplateContext): Promise<void> {
	removeStaleFeatureFiles(outputDir, context);

	processDir(baseDir, outputDir, context);

	for (const feature of resolveFeatureDirs(context)) {
		processDir(join(featuresDir, feature), outputDir, context);
	}
}
