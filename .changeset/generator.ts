import { getCommitInfo, getPullRequestInfo } from '@changesets/get-github-info';
import type { ChangelogFunctions } from '@changesets/types';

// "match what you skip, capture what you want": the left alternative
// consumes markdown links so the right alternative only matches bare refs
function linkifyIssueRefs(line: string, { serverUrl, repo }: { serverUrl: string; repo: string }): string {
	return line.replace(/\[.*?\]\(.*?\)|\B#([1-9]\d*)\b/g, (match, issue) =>
		// PRs and issues are the same thing on GitHub (to some extent, of course)
		// this relies on GitHub redirecting from /issues/1234 to /pull/1234 when necessary
		issue ? `[#${issue}](${serverUrl}/${repo}/issues/${issue})` : match
	);
}

function readEnv() {
	const GITHUB_SERVER_URL =
		// @ts-expect-error -- this is injected by GitHub Actions, but TypeScript doesn't know about it
		process.env.GITHUB_SERVER_URL || 'https://github.com';
	return { GITHUB_SERVER_URL };
}

// since @changesets/types v7 the changelog options are typed as
// `null | Record<string, unknown>` instead of `any`, so `repo` has to be narrowed by hand
function readRepo(options: null | Record<string, unknown>): string {
	const repo = options?.repo;
	if (typeof repo !== 'string') {
		throw new Error('Please provide a repo to this changelog generator like this:\n"changelog": ["./generator.ts", { "repo": "org/repo" }]');
	}
	return repo;
}

const ignoredUsers = new Set<string>(['redstar071']);
const ignoredLinkedAuthors = new Set<string>(['thewilloftheshadow']);

const changelogFunctions: ChangelogFunctions = {
	getDependencyReleaseLine: async (changesets, dependenciesUpdated, options) => {
		const repo = readRepo(options);
		if (dependenciesUpdated.length === 0) return '';

		const changesetLink = `- Updated dependencies [${(
			await Promise.all(
				changesets.map(async (cs) => {
					if (cs.commit) {
						// getCommitInfo resolves to undefined when the commit cannot be found
						const info = await getCommitInfo({ repo, commit: cs.commit });
						return info?.commit.markdownLink;
					}
				})
			)
		)
			.filter((_) => _)
			.join(', ')}]:`;

		const updatedDependenciesList = dependenciesUpdated.map((dependency) => `  - ${dependency.name}@${dependency.newVersion}`);

		return [changesetLink, ...updatedDependenciesList].join('\n');
	},
	getReleaseLine: async (changeset, _type, options) => {
		const { GITHUB_SERVER_URL } = readEnv();
		const repo = readRepo(options);

		let prFromSummary: number | undefined;
		let commitFromSummary: string | undefined;
		const usersFromSummary: string[] = [];

		const replacedChangelog = changeset.summary
			.replace(/^\s*(?:pr|pull|pull\s+request):\s*#?(\d+)/im, (_, pr) => {
				const num = Number(pr);
				if (!Number.isNaN(num)) prFromSummary = num;
				return '';
			})
			.replace(/^\s*commit:\s*([^\s]+)/im, (_, commit) => {
				commitFromSummary = commit;
				return '';
			})
			.replace(/^\s*(?:author|user):\s*@?([^\s]+)/gim, (_, user) => {
				if (!ignoredUsers.has(String(user).toLowerCase())) {
					usersFromSummary.push(user);
				}
				return '';
			})
			.trim();

		const [firstLine, ...futureLines] = replacedChangelog.split('\n').map((l) => l.trimEnd());

		const links = await (async () => {
			if (prFromSummary !== undefined) {
				// getPullRequestInfo resolves to undefined when the pull request cannot be found
				const info = await getPullRequestInfo({
					repo,
					pull: prFromSummary
				});
				return {
					commit: commitFromSummary
						? `[\`${commitFromSummary.slice(0, 7)}\`](${GITHUB_SERVER_URL}/${repo}/commit/${commitFromSummary})`
						: (info?.commit?.markdownLink ?? null),
					pull: info?.pull.markdownLink ?? null,
					author: info?.author ?? null
				};
			}
			const commitToFetchFrom = commitFromSummary || changeset.commit;
			if (commitToFetchFrom) {
				const info = await getCommitInfo({
					repo,
					commit: commitToFetchFrom
				});
				return {
					commit: info?.commit.markdownLink ?? null,
					pull: info?.pull?.markdownLink ?? null,
					author: info?.author ?? null
				};
			}
			return {
				commit: null,
				pull: null,
				author: null
			};
		})();

		const users = usersFromSummary.length
			? usersFromSummary.map((userFromSummary) => `[@${userFromSummary}](${GITHUB_SERVER_URL}/${userFromSummary})`).join(', ')
			: links.author && !ignoredLinkedAuthors.has(links.author.login.toLowerCase())
				? links.author.markdownLink
				: null;

		const prefix = [links.pull === null ? '' : ` ${links.pull}`, links.commit === null ? '' : ` ${links.commit}`].join('');

		const releaseLine = `\n\n-${prefix ? `${prefix} -` : ''} ${linkifyIssueRefs(firstLine, {
			serverUrl: GITHUB_SERVER_URL,
			repo
		})}`;
		const futureReleaseLines = futureLines
			.map(
				(l) =>
					`  ${linkifyIssueRefs(l, {
						serverUrl: GITHUB_SERVER_URL,
						repo
					})}`
			)
			.join('\n');
		const thanks = users === null ? '' : ` Thanks ${users}!`;

		return `${releaseLine}${futureReleaseLines ? `\n${futureReleaseLines}` : ''}${thanks}`;
	}
};

export default changelogFunctions;
