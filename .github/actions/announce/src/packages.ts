import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { MESSAGE_FLAGS, allowedMentions, chunkBlocks, pingLine, type StoredMessage } from './discord.ts';
import { parseConventionalTitle, type GitHub } from './github.ts';

// Sapphire-style package release notes, built from what Changesets wrote into
// each CHANGELOG.md. No AI is involved: the same release always renders the same
// message.

export interface PublishedPackage {
	name: string;
	version: string;
}

export type Bump = 'major' | 'minor' | 'patch';

export interface ChangelogEntry {
	bump: Bump;
	pull: number | null;
	pullUrl: string | null;
	commit: string | null;
	commitUrl: string | null;
	authors: string[];
	summary: string;
}

export interface PackageRelease extends PublishedPackage {
	entries: ChangelogEntry[];
	dependencies: string[];
}

/** Accepts the changesets/action JSON, or `name@version` entries split by commas or spaces for a manual re-send. */
export function parsePublished(value: string): PublishedPackage[] {
	const text = value.trim();
	if (text.startsWith('[')) {
		const parsed = JSON.parse(text) as unknown;
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((item): item is PublishedPackage => typeof item?.name === 'string' && typeof item?.version === 'string');
	}
	return text
		.split(/[\s,]+/)
		.filter(Boolean)
		.map((entry) => {
			const at = entry.lastIndexOf('@');
			if (at <= 0) throw new Error(`Expected name@version, got "${entry}"`);
			return { name: entry.slice(0, at), version: entry.slice(at + 1) };
		});
}

const BUMP_HEADINGS: Record<string, Bump> = {
	'major changes': 'major',
	'minor changes': 'minor',
	'patch changes': 'patch'
};

/** Returns the body of `## <version>` in a Changesets CHANGELOG, or `null`. */
export function changelogSection(changelog: string, version: string): string | null {
	const lines = changelog.split(/\r?\n/);
	const start = lines.findIndex((line) => line.trim() === `## ${version}`);
	if (start === -1) return null;
	let end = lines.length;
	for (let index = start + 1; index < lines.length; index++) {
		if (lines[index]!.startsWith('## ')) {
			end = index;
			break;
		}
	}
	return lines.slice(start + 1, end).join('\n');
}

const PULL_LINK = /^\[#(\d+)\]\(([^)]+)\)\s*/;
const COMMIT_LINK = /^\[`([0-9a-f]{7,40})`\]\(([^)]+)\)\s*/;
const THANKS = /\s*Thanks ((?:\[@[^\]]+\]\([^)]+\)(?:,\s*)?)+)!\s*$/;

/** Parses one entry as `.changeset/generator.ts` writes it. */
export function parseEntry(text: string, bump: Bump): ChangelogEntry {
	let rest = text.trim();
	let pull: number | null = null;
	let pullUrl: string | null = null;
	let commit: string | null = null;
	let commitUrl: string | null = null;

	const pullMatch = PULL_LINK.exec(rest);
	if (pullMatch) {
		pull = Number(pullMatch[1]);
		pullUrl = pullMatch[2]!;
		rest = rest.slice(pullMatch[0].length);
	}
	const commitMatch = COMMIT_LINK.exec(rest);
	if (commitMatch) {
		commit = commitMatch[1]!;
		commitUrl = commitMatch[2]!;
		rest = rest.slice(commitMatch[0].length);
	}
	rest = rest.replace(/^-\s+/, '');

	const authors: string[] = [];
	const thanks = THANKS.exec(rest);
	if (thanks) {
		for (const match of thanks[1]!.matchAll(/\[@([^\]]+)\]/g)) authors.push(match[1]!);
		rest = rest.slice(0, thanks.index);
	}

	return { bump, pull, pullUrl, commit, commitUrl, authors, summary: rest.trim() };
}

/** Splits a version section into entries and the names of updated dependencies. */
export function parseSection(section: string): { entries: ChangelogEntry[]; dependencies: string[] } {
	const entries: ChangelogEntry[] = [];
	const dependencies: string[] = [];
	let bump: Bump | null = null;
	let current: string[] | null = null;
	let inDependencies = false;

	const flush = () => {
		if (current && bump && !inDependencies) entries.push(parseEntry(current.join('\n'), bump));
		current = null;
	};

	for (const line of section.split('\n')) {
		const heading = /^###\s+(.+)$/.exec(line);
		if (heading) {
			flush();
			bump = BUMP_HEADINGS[heading[1]!.trim().toLowerCase()] ?? null;
			inDependencies = false;
			continue;
		}
		if (line.startsWith('- ')) {
			flush();
			inDependencies = line.startsWith('- Updated dependencies');
			if (!inDependencies) current = [line.slice(2)];
			continue;
		}
		if (inDependencies) {
			const dependency = /^\s+-\s+(\S+)/.exec(line);
			if (dependency) dependencies.push(dependency[1]!);
			continue;
		}
		if (current && line.trim()) current.push(line.trim());
	}
	flush();
	return { entries, dependencies: [...new Set(dependencies)] };
}

/** Maps package names to their folders by reading `<dir>/*\/package.json`. */
export async function packageDirectories(root: string): Promise<Map<string, string>> {
	const directories = new Map<string, string>();
	for (const entry of await readdir(root, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		try {
			const manifest = JSON.parse(await readFile(join(root, entry.name, 'package.json'), 'utf8')) as { name?: string };
			if (manifest.name) directories.set(manifest.name, join(root, entry.name));
		} catch {
			// Not a package.
		}
	}
	return directories;
}

export async function readReleases(published: PublishedPackage[], packagesRoot: string): Promise<PackageRelease[]> {
	const directories = await packageDirectories(packagesRoot);
	const releases: PackageRelease[] = [];
	for (const pkg of published) {
		const directory = directories.get(pkg.name);
		let section: string | null = null;
		if (directory) {
			try {
				section = changelogSection(await readFile(join(directory, 'CHANGELOG.md'), 'utf8'), pkg.version);
			} catch {
				section = null;
			}
		}
		const parsed = section ? parseSection(section) : { entries: [], dependencies: [] };
		releases.push({ ...pkg, ...parsed });
	}
	return releases;
}

interface Category {
	key: string;
	heading: string;
}

const CATEGORIES: Category[] = [
	{ key: 'breaking', heading: '💥 Breaking Changes' },
	{ key: 'feat', heading: '🚀 Features' },
	{ key: 'fix', heading: '🐛 Bug Fixes' },
	{ key: 'perf', heading: '🏃 Performance' },
	{ key: 'refactor', heading: '🏠 Refactor' },
	{ key: 'docs', heading: '📝 Documentation' },
	{ key: 'deps', heading: '📦 Dependencies' }
];

export interface RenderedEntry {
	category: string;
	line: string;
}

/** Pull request titles, fetched once per number. A title beats the changeset summary as a one-line bullet. */
export type TitleLookup = (pull: number) => Promise<{ title: string; author: string | null } | null>;

export function githubTitleLookup(github: GitHub): TitleLookup {
	const cache = new Map<number, Promise<{ title: string; author: string | null } | null>>();
	return (pull) => {
		let pending = cache.get(pull);
		if (!pending) {
			pending = github
				.pull(pull)
				.then((pr) => ({ title: pr.title, author: pr.user?.login ?? null }))
				.catch(() => null);
			cache.set(pull, pending);
		}
		return pending;
	};
}

function firstSentence(summary: string): string {
	const paragraph = summary
		.split(/\n\s*\n/)[0]!
		.replace(/\s+/g, ' ')
		.trim();
	const sentence = /^(.+?[.!?])(\s|$)/.exec(paragraph)?.[1] ?? paragraph;
	return sentence.length > 200 ? `${sentence.slice(0, 199).trimEnd()}…` : sentence;
}

function capitalize(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

function shortName(name: string): string {
	return name.replace(/^@[^/]+\//, '');
}

export async function renderEntry(pkg: PackageRelease, entry: ChangelogEntry, lookup: TitleLookup): Promise<RenderedEntry> {
	const pr = entry.pull === null ? null : await lookup(entry.pull);
	const title = pr ? parseConventionalTitle(pr.title) : parseConventionalTitle(firstSentence(entry.summary));

	let category: string;
	if (entry.bump === 'major' || title.breaking) category = 'breaking';
	else if (title.scope === 'deps' || /^update dependency /i.test(title.subject)) category = 'deps';
	else if (title.type && CATEGORIES.some((candidate) => candidate.key === title.type)) category = title.type;
	else category = entry.bump === 'minor' ? 'feat' : 'fix';

	// The scope is noise when it names the package being announced.
	const scope = title.scope && title.scope !== 'deps' && title.scope !== shortName(pkg.name) ? `**${title.scope}:** ` : '';
	const subject = pr ? title.subject : firstSentence(title.subject);
	const links: string[] = [];
	if (entry.commit && entry.commitUrl) links.push(`([${entry.commit.slice(0, 7)}](<${entry.commitUrl}>))`);
	const author = entry.authors[0] ?? pr?.author ?? null;
	if (entry.pull !== null && entry.pullUrl) links.push(`([#${entry.pull}](<${entry.pullUrl}>)${author ? ` by @${author}` : ''})`);

	return { category, line: `- ${scope}${capitalize(subject)}${links.length ? ` ${links.join(' ')}` : ''}` };
}

export function releaseUrl(repository: string, pkg: PublishedPackage): string {
	return `https://github.com/${repository}/releases/tag/${encodeURIComponent(`${pkg.name}@${pkg.version}`)}`;
}

export async function renderPackage(pkg: PackageRelease, repository: string, date: string, lookup: TitleLookup): Promise<string> {
	const rendered = await Promise.all(pkg.entries.map((entry) => renderEntry(pkg, entry, lookup)));
	const lines = [`# [${pkg.name}@${pkg.version}](<${releaseUrl(repository, pkg)}>) - (${date})`];
	for (const category of CATEGORIES) {
		const items = rendered.filter((entry) => entry.category === category.key);
		if (items.length === 0) continue;
		lines.push(`## ${category.heading}`, ...items.map((item) => item.line));
	}
	return lines.join('\n');
}

export interface PackagesMessageOptions {
	repository: string;
	roleId: string;
	date: string;
	lookup: TitleLookup;
	username?: string;
	avatarUrl?: string;
}

/** One block per package with changes of its own; dependency-only releases share one closing line. */
export async function renderPackagesMessages(releases: PackageRelease[], options: PackagesMessageOptions): Promise<StoredMessage[]> {
	const withChanges = releases.filter((pkg) => pkg.entries.length > 0);
	const dependencyOnly = releases.filter((pkg) => pkg.entries.length === 0);

	const blocks: string[] = [];
	for (const pkg of withChanges) blocks.push(await renderPackage(pkg, options.repository, options.date, options.lookup));
	if (dependencyOnly.length > 0) {
		const names = dependencyOnly.map((pkg) => `[${pkg.name}@${pkg.version}](<${releaseUrl(options.repository, pkg)}>)`);
		blocks.push(`-# Also released with dependency updates only: ${names.join(', ')}`);
	}
	if (blocks.length === 0) return [];

	const ping = pingLine(options.roleId);
	if (ping) blocks[0] = `${ping}\n${blocks[0]}`;

	return chunkBlocks(blocks).map((content, index) => ({
		payload: {
			content,
			flags: MESSAGE_FLAGS.SuppressEmbeds,
			allowed_mentions: allowedMentions(index === 0 ? options.roleId : ''),
			...(options.username ? { username: options.username } : {}),
			...(options.avatarUrl ? { avatar_url: options.avatarUrl } : {})
		},
		files: []
	}));
}
