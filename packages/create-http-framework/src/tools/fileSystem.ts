import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function directoryExists(path: string): boolean {
	return existsSync(path);
}

export function isEmpty(path: string): boolean {
	try {
		return readdirSync(path).length === 0;
	} catch {
		return true;
	}
}

export function emptyDir(dir: string): void {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		rmSync(join(dir, entry.name), { recursive: true, force: true });
	}
}

export function writeFile(filePath: string, content: string): void {
	mkdirSync(dirname(filePath), { recursive: true });
	writeFileSync(filePath, content, 'utf-8');
}
