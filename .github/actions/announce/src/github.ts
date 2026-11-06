const API = process.env.GITHUB_API_URL || 'https://api.github.com';

export interface PullRequest {
	number: number;
	title: string;
	body: string | null;
	html_url: string;
	draft?: boolean;
	merged_at: string | null;
	user: { login: string; type?: string } | null;
	labels: { name: string }[];
	base: { ref: string };
}

export interface IssueComment {
	body: string | null;
	created_at: string;
	user: { login: string; type?: string } | null;
}

interface CompareCommit {
	sha: string;
	commit: { message: string };
}

export class GitHub {
	readonly owner: string;
	readonly repo: string;
	readonly #token: string;

	constructor(repository: string, token: string) {
		const [owner, repo] = repository.split('/');
		if (!owner || !repo) throw new Error(`Expected an "owner/name" repository, got "${repository}"`);
		this.owner = owner;
		this.repo = repo;
		this.#token = token;
	}

	get slug(): string {
		return `${this.owner}/${this.repo}`;
	}

	async request<T>(path: string): Promise<T> {
		const url = path.startsWith('http') ? path : `${API}${path}`;
		const response = await fetch(url, {
			headers: {
				accept: 'application/vnd.github+json',
				'x-github-api-version': '2022-11-28',
				'user-agent': 'wolfstar-announce-action',
				...(this.#token ? { authorization: `Bearer ${this.#token}` } : {})
			},
			signal: AbortSignal.timeout(20_000)
		});
		if (!response.ok) {
			throw new Error(`GitHub ${response.status} for ${new URL(url).pathname}: ${(await response.text()).slice(0, 200)}`);
		}
		return (await response.json()) as T;
	}

	/** Fetches every page of a list endpoint, up to `limit` items. */
	async paginate<T>(path: string, limit = 500): Promise<T[]> {
		const items: T[] = [];
		const separator = path.includes('?') ? '&' : '?';
		for (let page = 1; items.length < limit; page++) {
			const batch = await this.request<T[]>(`${path}${separator}per_page=100&page=${page}`);
			items.push(...batch);
			if (batch.length < 100) break;
		}
		return items.slice(0, limit);
	}

	pull(number: number): Promise<PullRequest> {
		return this.request<PullRequest>(`/repos/${this.slug}/pulls/${number}`);
	}

	comments(number: number): Promise<IssueComment[]> {
		return this.paginate<IssueComment>(`/repos/${this.slug}/issues/${number}/comments`, 200);
	}

	openPulls(limit: number): Promise<PullRequest[]> {
		return this.paginate<PullRequest>(`/repos/${this.slug}/pulls?state=open&sort=updated&direction=desc`, limit);
	}

	/** Commits reachable from `head` and not from `base`, oldest first (the compare API caps at 250). */
	async commitsBetween(base: string, head: string): Promise<CompareCommit[]> {
		const commits: CompareCommit[] = [];
		for (let page = 1; page <= 3; page++) {
			const result = await this.request<{ commits: CompareCommit[] }>(
				`/repos/${this.slug}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}?per_page=100&page=${page}`
			);
			commits.push(...result.commits);
			if (result.commits.length < 100) break;
		}
		return commits;
	}

	pullsForCommit(sha: string): Promise<PullRequest[]> {
		return this.request<PullRequest[]>(`/repos/${this.slug}/commits/${sha}/pulls`);
	}
}

const CONVENTIONAL = /^(?<type>[a-z]+)(?:\((?<scope>[^)]*)\))?(?<breaking>!)?:\s*(?<subject>.+)$/i;

export interface ConventionalTitle {
	type: string | null;
	scope: string | null;
	breaking: boolean;
	subject: string;
}

export function parseConventionalTitle(title: string): ConventionalTitle {
	const match = CONVENTIONAL.exec(title.trim());
	if (!match?.groups) return { type: null, scope: null, breaking: false, subject: title.trim() };
	return {
		type: match.groups.type!.toLowerCase(),
		scope: match.groups.scope?.trim() || null,
		breaking: match.groups.breaking === '!',
		subject: match.groups.subject!.trim()
	};
}

export function isBot(user: { login: string; type?: string } | null): boolean {
	if (!user) return false;
	return user.type === 'Bot' || user.login.endsWith('[bot]');
}
