/**
 * Tolgee CLI config for Stars Components — Shared HTTP Pieces (project id 33773).
 *
 * Local layout: packages/shared-http-pieces/src/locales/{discordLocale}/{namespace}.json
 * Tolgee tags are shorter (en-US → en, es-ES → es, zh-CN → zh-Hans, …).
 *
 * Push uses an explicit files list so local folder names ≠ Tolgee tags.
 * Pull stages into `.tolgee-pull/`; `pnpm tolgee:pull` remaps via
 * scripts/tolgee-pull-remap.ts using `tolgeeToLocal` below.
 *
 * The Tolgee project has namespaces disabled; keys live in the default namespace.
 * Locally they remain under `commands/shared.json` (i18next ns). Default script
 * pushes base English only (`pnpm tolgee:push` → `--languages en`).
 *
 * Set TOLGEE_API_KEY (Project API Key or PAT) in the environment — never commit it.
 */
const { existsSync, readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');

/** Local directory under packages/shared-http-pieces/src/locales/ → Tolgee language tag. */
const LOCALE_MAP = {
	'en-US': 'en',
	'en-GB': 'en-GB',
	'es-ES': 'es',
	'es-419': 'es-419',
	bg: 'bg',
	cs: 'cs',
	da: 'da',
	de: 'de',
	el: 'el',
	fi: 'fi',
	fr: 'fr',
	hi: 'hi',
	hr: 'hr',
	hu: 'hu',
	id: 'id',
	it: 'it',
	ja: 'ja',
	ko: 'ko',
	lt: 'lt',
	nl: 'nl',
	no: 'no',
	pl: 'pl',
	'pt-BR': 'pt',
	ro: 'ro',
	ru: 'ru',
	'sv-SE': 'sv',
	th: 'th',
	tr: 'tr',
	uk: 'uk',
	vi: 'vi',
	'zh-CN': 'zh-Hans',
	'zh-TW': 'zh-Hant'
};

/** Tolgee language tag → local directory (for pull remapping). */
const TOLGEE_TO_LOCAL = Object.fromEntries(Object.entries(LOCALE_MAP).map(([local, tag]) => [tag, local]));

/** Collect namespace-relative paths (e.g. commands/shared). */
function collectNamespaces(dir, relative = '') {
	const entries = readdirSync(dir, { withFileTypes: true });
	const namespaces = [];
	for (const entry of entries) {
		const rel = relative ? `${relative}/${entry.name}` : entry.name;
		if (entry.isDirectory()) {
			namespaces.push(...collectNamespaces(join(dir, entry.name), rel));
		} else if (entry.isFile() && entry.name.endsWith('.json')) {
			namespaces.push(rel.replace(/\.json$/, ''));
		}
	}
	return namespaces;
}

const languagesRoot = join(__dirname, 'packages/shared-http-pieces/src/locales');
const baseLocaleDir = join(languagesRoot, 'en-US');
if (!existsSync(baseLocaleDir)) {
	throw new Error(`Missing base locale directory: ${baseLocaleDir}`);
}

const NAMESPACES = [
	...new Set(
		Object.keys(LOCALE_MAP).flatMap((localDir) => {
			const dir = join(languagesRoot, localDir);
			return existsSync(dir) ? collectNamespaces(dir) : [];
		})
	)
].sort();

// This Tolgee project keeps namespaces disabled (single i18next ns `commands/shared`).
// Push without a Tolgee namespace so keys land in the default namespace; pull remaps
// `{languageTag}.json` → `{locale}/commands/shared.json`.
const LOCAL_NAMESPACE = 'commands/shared';

/** Skip Crowdin-era empty stubs (`{}`) — Tolgee rejects `no_data_to_import`. */
function hasTranslationKeys(absPath) {
	try {
		const data = JSON.parse(readFileSync(absPath, 'utf8'));
		return data && typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length > 0;
	} catch {
		return false;
	}
}

const pushFiles = Object.entries(LOCALE_MAP).flatMap(([localDir, language]) => {
	const abs = join(languagesRoot, localDir, `${LOCAL_NAMESPACE}.json`);
	const path = `./packages/shared-http-pieces/src/locales/${localDir}/${LOCAL_NAMESPACE}.json`;
	if (!existsSync(abs) || !hasTranslationKeys(abs)) return [];
	return [{ path, language }];
});

module.exports = {
	$schema: 'https://raw.githubusercontent.com/tolgee/tolgee-cli/main/schema.json',
	projectId: 33773,
	format: 'JSON_I18NEXT',
	push: {
		forceMode: 'KEEP',
		files: pushFiles
	},
	pull: {
		path: '.tolgee-pull',
		fileStructureTemplate: '{languageTag}.json'
	},
	// Exported for scripts/tolgee-pull-remap.ts (single source of truth with push)
	tolgeeToLocal: TOLGEE_TO_LOCAL,
	localeMap: LOCALE_MAP,
	namespaces: NAMESPACES,
	localNamespace: LOCAL_NAMESPACE
};
