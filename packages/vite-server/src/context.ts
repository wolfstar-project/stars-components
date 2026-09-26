import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { BuilderContext } from '@wolfstar/schema';
import { pluginRegistrations } from './plugins.js';

/** Default host for standalone use. Dependencies always resolve from the application. */
export const defaultBuilderContext: BuilderContext = {
	pluginRegistrations,
	async importFromProject<T>(root: string, id: string, hint: string): Promise<T> {
		let entry: string;
		try {
			entry = createRequire(join(root, 'package.json')).resolve(id);
		} catch (cause) {
			throw new Error(`Cannot resolve ${id} from ${root}. ${hint}`, { cause });
		}
		return (await import(pathToFileURL(entry).href)) as T;
	}
};
