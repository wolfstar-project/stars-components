import Handlebars from 'handlebars';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile } from './fileSystem.js';

Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
Handlebars.registerHelper('or', (...args: unknown[]) => args.slice(0, -1).some(Boolean));
Handlebars.registerHelper('and', (...args: unknown[]) => args.slice(0, -1).every(Boolean));

const templateDir = join(fileURLToPath(import.meta.url), '../..', 'template');

export interface TemplateContext {
	name: string;
	port: number;
	i18n: boolean;
	ai: boolean;
	aiProvider: 'anthropic' | 'openai' | null;
	aiIsAnthropic: boolean;
	aiIsOpenai: boolean;
	packageManager: string;
	todaysDate: string;
	versions: {
		httpFramework: string;
		httpFrameworkI18n: string;
		discordApiTypes: string;
		typescript: string;
		tsNode: string;
		typesNode: string;
		discordJsBuilders: string;
		anthropicSdk: string;
		openaiSdk: string;
	};
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

		// Files with .if-<flag>. in their path are conditionally included based on context[flag]
		const conditionalMatch = /\.if-([a-z]+)\./.exec(relativePath);
		if (conditionalMatch) {
			const flag = conditionalMatch[1];
			if (!(context as Record<string, unknown>)[flag]) continue;
		}

		const rawContent = readFileSync(absoluteSource, 'utf-8');
		const isHandlebars = relativePath.endsWith('.hbs');

		// Strip the .if-<flag> part from the output path
		const cleanedPath = conditionalMatch ? relativePath.replace(/\.if-[a-z]+/, '') : relativePath;
		const outputRelative = isHandlebars ? cleanedPath.slice(0, -'.hbs'.length) : cleanedPath;
		const outputPath = join(outputDir, outputRelative);

		const content = isHandlebars ? Handlebars.compile(rawContent)(context) : rawContent;
		writeFile(outputPath, content);
	}
}
