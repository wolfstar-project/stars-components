import { isBot, parseConventionalTitle, type GitHub, type IssueComment, type PullRequest } from './github.ts';

export interface PullSummary {
	number: number;
	title: string;
	url: string;
	author: string | null;
	labels: string[];
	body: string;
	draft: boolean;
}

export interface Evidence {
	pr: number;
	/** The After image URLs, newest capture first. */
	images: string[];
}

export interface ReleaseContext {
	repository: string;
	kind: 'bot' | 'site';
	product: string;
	version: string;
	fromRef: string;
	toRef: string;
	stage: string;
	format: 'auto' | 'text' | 'components';
	language: string;
	notes: string;
	merged: PullSummary[];
	dependencyUpdates: number;
	open: PullSummary[];
	evidence: Evidence[];
}

const BODY_LIMIT = 3000;
const MERGED_LIMIT = 80;

/** Drops HTML comments, images, and the AI disclosure, which tell the writer nothing. */
export function cleanBody(body: string | null): string {
	if (!body) return '';
	const cleaned = body
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
		.replace(/<img[^>]*>/gi, '')
		.replace(/^>\s*🤖 AI disclosure:.*$/gim, '')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
	return cleaned.length > BODY_LIMIT ? `${cleaned.slice(0, BODY_LIMIT)}\n[…truncated]` : cleaned;
}

export function isDependencyUpdate(pr: Pick<PullRequest, 'title' | 'user'>): boolean {
	const title = parseConventionalTitle(pr.title);
	return title.scope === 'deps' || (isBot(pr.user) && /renovate|dependabot/i.test(pr.user?.login ?? ''));
}

function summarize(pr: PullRequest): PullSummary {
	return {
		number: pr.number,
		title: pr.title,
		url: pr.html_url,
		author: pr.user?.login ?? null,
		labels: pr.labels.map((label) => label.name),
		body: cleanBody(pr.body),
		draft: Boolean(pr.draft)
	};
}

/** Pull requests merged between two refs, found through the commits the compare API lists. */
export async function mergedPulls(github: GitHub, from: string, to: string, releaseBranches: string[]): Promise<PullRequest[]> {
	const commits = await github.commitsBetween(from, to);
	const pulls = new Map<number, PullRequest>();
	for (const commit of commits) {
		let associated: PullRequest[];
		try {
			associated = await github.pullsForCommit(commit.sha);
		} catch {
			continue;
		}
		for (const pr of associated) {
			// The release PR itself (main into release) only repeats what it carries.
			if (!pr.merged_at || releaseBranches.includes(pr.base.ref)) continue;
			pulls.set(pr.number, pr);
		}
	}
	return [...pulls.values()].sort((a, b) => a.number - b.number);
}

const IMAGE = /!\[(?<alt>[^\]]*)\]\((?<url>[^)\s]+)[^)]*\)|<img[^>]*?src=["'](?<src>[^"']+)["'][^>]*>/gi;

function images(cell: string): { alt: string; url: string }[] {
	const found: { alt: string; url: string }[] = [];
	for (const match of cell.matchAll(IMAGE)) {
		const url = match.groups?.url ?? match.groups?.src;
		if (url) found.push({ alt: match.groups?.alt ?? '', url });
	}
	return found;
}

function cells(row: string): string[] {
	return row
		.trim()
		.replace(/^\|/, '')
		.replace(/\|$/, '')
		.split('|')
		.map((cell) => cell.trim());
}

/**
 * Finds the After images of a pr-evidence comment: a `| Before | After |` table,
 * or, without one, images whose alt text says After.
 */
export function afterImages(markdown: string): string[] {
	const found: string[] = [];
	const lines = markdown.split(/\r?\n/);
	for (let index = 0; index < lines.length - 1; index++) {
		const header = lines[index]!;
		if (!header.includes('|') || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1]!)) continue;
		const column = cells(header).findIndex((cell) => /^\**after\**$/i.test(cell.replace(/[`_]/g, '')));
		if (column === -1) continue;
		for (let row = index + 2; row < lines.length && lines[row]!.includes('|'); row++) {
			const cell = cells(lines[row]!)[column];
			if (cell) found.push(...images(cell).map((image) => image.url));
		}
	}
	if (found.length === 0) {
		for (const image of images(markdown)) if (/\bafter\b/i.test(image.alt)) found.push(image.url);
	}
	return [...new Set(found)].filter(isGitHubImage);
}

/** Only images GitHub hosts for the pull request: nothing from other services ends up in the announcement. */
export function isGitHubImage(url: string): boolean {
	try {
		const { protocol, hostname, pathname } = new URL(url);
		if (protocol !== 'https:') return false;
		if (hostname === 'github.com') return pathname.startsWith('/user-attachments/assets/');
		return hostname === 'user-images.githubusercontent.com' || hostname === 'private-user-images.githubusercontent.com';
	} catch {
		return false;
	}
}

export function evidenceFrom(pr: Pick<PullRequest, 'number' | 'body'>, comments: IssueComment[]): Evidence | null {
	// The newest capture wins: pr-evidence names recaptures by revision instead of replacing them.
	const sources = [...comments].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((comment) => comment.body ?? '');
	sources.push(pr.body ?? '');
	for (const source of sources) {
		const found = afterImages(source);
		if (found.length > 0) return { pr: pr.number, images: found };
	}
	return null;
}

export interface CollectOptions {
	kind: 'bot' | 'site';
	product: string;
	version: string;
	fromRef: string;
	toRef: string;
	stage: string;
	format: 'auto' | 'text' | 'components';
	language: string;
	notes: string;
	includeOpenPulls: boolean;
	releaseBranches: string[];
}

export async function collectContext(github: GitHub, options: CollectOptions): Promise<ReleaseContext> {
	const merged = await mergedPulls(github, options.fromRef, options.toRef, options.releaseBranches);
	const dependencyUpdates = merged.filter(isDependencyUpdate).length;
	const relevant = merged.filter((pr) => !isDependencyUpdate(pr)).slice(-MERGED_LIMIT);

	const evidence: Evidence[] = [];
	if (options.kind === 'site') {
		for (const pr of relevant) {
			const found = evidenceFrom(pr, await github.comments(pr.number).catch(() => []));
			if (found) evidence.push(found);
		}
	}

	let open: PullSummary[] = [];
	if (options.includeOpenPulls) {
		const pulls = await github.openPulls(40).catch(() => []);
		open = pulls
			.filter((pr) => !isDependencyUpdate(pr) && !options.releaseBranches.includes(pr.base.ref) && !isBot(pr.user))
			.map((pr) => ({ ...summarize(pr), body: cleanBody(pr.body).slice(0, 800) }));
	}

	return {
		repository: github.slug,
		kind: options.kind,
		product: options.product,
		version: options.version,
		fromRef: options.fromRef,
		toRef: options.toRef,
		stage: options.stage,
		format: options.format,
		language: options.language,
		notes: options.notes,
		merged: relevant.map(summarize),
		dependencyUpdates,
		open,
		evidence
	};
}
