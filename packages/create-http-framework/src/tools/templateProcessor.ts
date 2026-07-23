import Handlebars from 'handlebars';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile } from './fileSystem.js';
import type { Language } from './options.js';

const templateDir = join(fileURLToPath(import.meta.url), '../..', 'template');

/** Context for the Handlebars source files. Config files (package.json, tsconfig, …) are generated in projectFiles.ts. */
export interface TemplateContext {
	name: string;
	port: number;
	language: Language;
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

export function processTemplate(outputDir: string, context: TemplateContext): void {
	const allFiles = walkDir(templateDir);

	for (const absoluteSource of allFiles) {
		const relativePath = relative(templateDir, absoluteSource);

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
