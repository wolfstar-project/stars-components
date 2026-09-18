import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface OwnPackageJson {
	name: string;
	version: string;
	description: string;
}

let cached: OwnPackageJson | null = null;

/**
 * Reads this package's own `package.json`, from `src/` and from the bundled `dist/` chunks alike.
 */
export function readOwnPackageJson(): OwnPackageJson {
	if (cached) return cached;

	let directory = dirname(fileURLToPath(import.meta.url));
	for (;;) {
		const file = join(directory, 'package.json');
		if (existsSync(file)) {
			const parsed = JSON.parse(readFileSync(file, 'utf-8')) as OwnPackageJson;
			if (parsed.name === '@wolfstar/cli') {
				cached = parsed;
				return parsed;
			}
		}

		const parent = dirname(directory);
		if (parent === directory) throw new Error('Could not locate the package.json of @wolfstar/cli');
		directory = parent;
	}
}
