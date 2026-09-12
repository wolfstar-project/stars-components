import { getRootData } from '@sapphire/pieces';
import type { InternationalizationOptions } from '@wolfstar/plugin-i18next';
import type { InitOptions } from 'i18next';
import { join } from 'node:path';

export const sharedNamespace = 'commands/shared';

function addSharedNamespace(options: InitOptions | undefined, discoveredNamespaces: string[]): InitOptions {
	const configuredNamespaces = options?.ns === undefined ? [] : [options.ns].flat();

	return {
		...options,
		ns: [...new Set([...discoveredNamespaces, ...configuredNamespaces, sharedNamespace])]
	};
}

/**
 * Adds this package's locales without losing locales and namespaces discovered by the consumer.
 *
 * `@wolfstar/plugin-i18next@2` lets `backend.paths` replace its generated consumer path and only
 * discovers namespaces below `defaultLanguageDirectory`. Supplying both values explicitly keeps
 * the consumer resources and makes this package's namespace available to i18next.
 */
export function registerSharedLocales(i18n: InternationalizationOptions, localesPath: string): InternationalizationOptions {
	const languagesDirectory = i18n.defaultLanguageDirectory ?? join(getRootData().root, 'languages');
	const consumerLocalesPath = join(languagesDirectory, '{{lng}}', '{{ns}}.json');
	const configuredI18next = i18n.i18next;

	return {
		...i18n,
		backend: {
			...i18n.backend,
			paths: [...new Set([consumerLocalesPath, ...(i18n.backend?.paths ?? []), localesPath])]
		},
		i18next(namespaces, languages) {
			const options = typeof configuredI18next === 'function' ? configuredI18next(namespaces, languages) : configuredI18next;
			return addSharedNamespace(options, namespaces);
		}
	};
}
