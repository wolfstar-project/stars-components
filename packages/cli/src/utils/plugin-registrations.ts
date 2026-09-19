import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { ResolvedStarsConfig } from '@wolfstar/stars-config';

interface PackageJson {
	dependencies?: Record<string, string>;
	optionalDependencies?: Record<string, string>;
}

const PLUGIN_PACKAGE = /^@wolfstar\/plugin-[^/]+$/;

/**
 * Activates installed WolfStar plugins without making applications maintain a list
 * of side-effect-only plugin registration imports in their entry point.
 */
export function pluginRegistrations(config: ResolvedStarsConfig): object {
	const plugins = findPluginDependencies(config.root);
	const entry = resolve(config.entry);

	return {
		name: 'stars:plugin-registrations',
		transform(code: string, id: string) {
			if (plugins.length === 0 || cleanId(id) !== entry) return null;

			const registrations = plugins.map((name) => `import ${JSON.stringify(`${name}/register`)};`).join('\n');
			return { code: `${registrations}\n${code}`, map: null };
		}
	};
}

function findPluginDependencies(root: string): string[] {
	const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as PackageJson;
	return [...new Set([...Object.keys(packageJson.dependencies ?? {}), ...Object.keys(packageJson.optionalDependencies ?? {})])]
		.filter((name) => PLUGIN_PACKAGE.test(name))
		.sort();
}

function cleanId(id: string): string {
	return resolve(id.replace(/^\0/, '').split('?', 1)[0]!);
}
