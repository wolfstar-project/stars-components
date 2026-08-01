/**
 * Ensure Tolgee project languages exist for every tag in `.tolgeerc.cjs` LOCALE_MAP.
 *
 * Uses the same CLI login store as `tolgee` (`~/.config/tolgee/authentication.json`)
 * or `TOLGEE_API_KEY` when set. Creates only missing tags (idempotent).
 *
 * Usage: node scripts/tolgee-ensure-languages.mjs
 *        (or: pnpm tolgee:ensure-languages)
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const config = require('../.tolgeerc.cjs');

const API = (process.env.TOLGEE_API_URL || 'https://app.tolgee.io').replace(/\/$/, '');
const PROJECT_ID = Number(config.projectId);

/** Display metadata for tags we push (matches Wolfstar / Tolgee defaults). */
const LANGUAGE_META = {
	'en-GB': {
		name: 'English (United Kingdom)',
		originalName: 'English (United Kingdom)',
		flagEmoji: '🇬🇧'
	},
	es: { name: 'Spanish', originalName: 'español', flagEmoji: '🇪🇸' },
	'es-419': {
		name: 'Spanish (Latin America)',
		originalName: 'español (Latinoamérica)',
		flagEmoji: '🇲🇽'
	},
	bg: { name: 'Bulgarian', originalName: 'български', flagEmoji: '🇧🇬' },
	cs: { name: 'Czech', originalName: 'čeština', flagEmoji: '🇨🇿' },
	da: { name: 'Danish', originalName: 'dansk', flagEmoji: '🇩🇰' },
	de: { name: 'German', originalName: 'Deutsch', flagEmoji: '🇩🇪' },
	el: { name: 'Greek', originalName: 'Ελληνικά', flagEmoji: '🇬🇷' },
	fi: { name: 'Finnish', originalName: 'suomi', flagEmoji: '🇫🇮' },
	fr: { name: 'French', originalName: 'français', flagEmoji: '🇫🇷' },
	hi: { name: 'Hindi', originalName: 'हिन्दी', flagEmoji: '🇮🇳' },
	hr: { name: 'Croatian', originalName: 'hrvatski', flagEmoji: '🇭🇷' },
	hu: { name: 'Hungarian', originalName: 'magyar', flagEmoji: '🇭🇺' },
	id: { name: 'Indonesian', originalName: 'Indonesia', flagEmoji: '🇮🇩' },
	it: { name: 'Italian', originalName: 'italiano', flagEmoji: '🇮🇹' },
	ja: { name: 'Japanese', originalName: '日本語', flagEmoji: '🇯🇵' },
	ko: { name: 'Korean', originalName: '한국어', flagEmoji: '🇰🇷' },
	lt: { name: 'Lithuanian', originalName: 'lietuvių', flagEmoji: '🇱🇹' },
	nl: { name: 'Dutch', originalName: 'Nederlands', flagEmoji: '🇳🇱' },
	no: { name: 'Norwegian', originalName: 'norsk', flagEmoji: '🇳🇴' },
	pl: { name: 'Polish', originalName: 'polski', flagEmoji: '🇵🇱' },
	pt: { name: 'Portuguese', originalName: 'português', flagEmoji: '🇵🇹' },
	ro: { name: 'Romanian', originalName: 'română', flagEmoji: '🇷🇴' },
	ru: { name: 'Russian', originalName: 'русский', flagEmoji: '🇷🇺' },
	sv: { name: 'Swedish', originalName: 'svenska', flagEmoji: '🇸🇪' },
	th: { name: 'Thai', originalName: 'ไทย', flagEmoji: '🇹🇭' },
	tr: { name: 'Turkish', originalName: 'Türkçe', flagEmoji: '🇹🇷' },
	uk: { name: 'Ukrainian', originalName: 'українська', flagEmoji: '🇺🇦' },
	vi: { name: 'Vietnamese', originalName: 'Tiếng Việt', flagEmoji: '🇻🇳' },
	'zh-Hans': { name: 'Simplified Chinese', originalName: '简体中文', flagEmoji: '🇨🇳' },
	'zh-Hant': { name: 'Traditional Chinese', originalName: '繁體中文', flagEmoji: '🇨🇳' }
};

function resolveApiKey() {
	if (process.env.TOLGEE_API_KEY) return process.env.TOLGEE_API_KEY;
	const authPath = join(homedir(), '.config/tolgee/authentication.json');
	const auth = JSON.parse(readFileSync(authPath, 'utf8'));
	const host = new URL(API).host;
	const entry = auth[host] || auth['app.tolgee.io'];
	const key = entry?.user?.token || entry?.projects?.[String(PROJECT_ID)]?.token;
	if (!key) {
		throw new Error(`No Tolgee API key found. Set TOLGEE_API_KEY or run \`pnpm exec tolgee login\`.`);
	}
	return key;
}

async function api(path, { method = 'GET', body, apiKey } = {}) {
	const res = await fetch(`${API}${path}`, {
		method,
		headers: {
			'X-API-Key': apiKey,
			...(body ? { 'Content-Type': 'application/json' } : {})
		},
		body: body ? JSON.stringify(body) : undefined
	});
	const text = await res.text();
	let json;
	try {
		json = text ? JSON.parse(text) : null;
	} catch {
		json = { raw: text };
	}
	if (!res.ok) {
		const err = new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 300)}`);
		err.status = res.status;
		err.body = json;
		throw err;
	}
	return json;
}

const neededTags = [...new Set(Object.values(config.localeMap || {}))].toSorted();
if (neededTags.length === 0) {
	throw new Error('No languages found in .tolgeerc.cjs localeMap');
}
const apiKey = resolveApiKey();

const project = await api(`/v2/projects/${PROJECT_ID}`, { apiKey });
console.log(`Project ${PROJECT_ID} (${project.name})`);

const listed = await api(`/v2/projects/${PROJECT_ID}/languages?size=100`, { apiKey });
const existing = new Set((listed._embedded?.languages || []).map((l) => l.tag));
console.log(`Existing: ${[...existing].toSorted().join(', ') || '(none)'}`);

let created = 0;
let skipped = 0;
for (const tag of neededTags) {
	if (existing.has(tag)) {
		skipped++;
		continue;
	}
	const meta = LANGUAGE_META[tag] || {
		name: tag,
		originalName: tag,
		flagEmoji: '🏳️'
	};
	if (tag === 'en') {
		console.warn(`Base language "en" missing — create it in the Tolgee UI first.`);
		continue;
	}
	await api(`/v2/projects/${PROJECT_ID}/languages`, {
		method: 'POST',
		apiKey,
		body: { tag, ...meta }
	});
	created++;
	console.log(`Created ${tag}`);
}

const after = await api(`/v2/projects/${PROJECT_ID}/languages?size=100`, { apiKey });
const tags = (after._embedded?.languages || []).map((l) => l.tag).toSorted();
const missing = neededTags.filter((t) => !tags.includes(t));
console.log(`Done. created=${created} alreadyPresent=${skipped}`);
console.log(`Languages: ${tags.join(', ')}`);
if (missing.length) {
	console.error(`Still missing: ${missing.join(', ')}`);
	process.exit(1);
}
