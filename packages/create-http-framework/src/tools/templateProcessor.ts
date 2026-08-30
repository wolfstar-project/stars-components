import Handlebars from 'handlebars';
import { readdirSync, readFileSync, statSync } from 'node:fs';
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
export function resolveFeatureDirs(ctx: Pick<TemplateContext, 'i18n' | 'subcommands' | 'testing'>): string[] {
	const dirs: string[] = [];
	if (ctx.i18n) dirs.push('i18n');
	if (ctx.subcommands) dirs.push(ctx.i18n ? 'subcommands-i18n' : 'subcommands');
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

/**
 * Walks `root` and writes every file into `outputDir`, preserving the relative path.
 *
 * - `*.ts.hbs` / `*.js.hbs` files are skipped unless they match `context.language`.
 * - Other `*.hbs` files (e.g. `.env.hbs`, `.gitignore.hbs`, `README.md.hbs`) are compiled unconditionally.
 * - Non-`.hbs` files (e.g. static locale JSON under a feature's `src/locales/**`) are copied verbatim —
 *   no extension stripped, no Handlebars compilation.
 */
function processDir(root: string, outputDir: string, context: TemplateContext): void {
	const allFiles = walkDir(root);

	for (const absoluteSource of allFiles) {
		const relativePath = relative(root, absoluteSource);

		// Source files exist in both `.ts.hbs` and `.js.hbs` variants — keep only the chosen language.
		if (context.language === 'js' && relativePath.endsWith('.ts.hbs')) continue;
		if (context.language === 'ts' && relativePath.endsWith('.js.hbs')) continue;

		const rawContent = readFileSync(absoluteSource, 'utf-8');
		const isHandlebars = relativePath.endsWith('.hbs');
		const outputRelative = isHandlebars ? relativePath.slice(0, -'.hbs'.length) : relativePath;
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
	processDir(baseDir, outputDir, context);

	for (const feature of resolveFeatureDirs(context)) {
		processDir(join(featuresDir, feature), outputDir, context);
	}
}
