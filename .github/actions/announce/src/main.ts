import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { appendSummary, booleanInput, input, notice, setOutput, warning } from './actions.ts';
import { ANNOUNCEMENT_SCHEMA, parseAnnouncement, preview, render, type Button } from './announcement.ts';
import { collectContext, type ReleaseContext } from './collect.ts';
import { ATTACHMENT_LIMIT, sendMessages, validate, type StoredMessage } from './discord.ts';
import { GitHub } from './github.ts';
import { createNotifier, type Notifier } from './notify.ts';
import { githubTitleLookup, parsePublished, readReleases, renderPackagesMessages } from './packages.ts';
import { buildPrompt } from './prompt.ts';

const mode = input('mode');
const repository = input('repository', process.env.GITHUB_REPOSITORY ?? '');
const dryRun = booleanInput('dry-run');
const outputDir = resolve(input('output-dir', join(process.env.RUNNER_TEMP ?? '.', 'announcement')));
const notify: Notifier = createNotifier({
	url: process.env.RELEASE_WEBHOOK_URL,
	secret: process.env.RELEASE_WEBHOOK_SECRET,
	mode: input('kind', mode),
	repository
});

function github(): GitHub {
	return new GitHub(repository, process.env.GITHUB_TOKEN ?? '');
}

function identity() {
	return { username: input('username') || undefined, avatarUrl: input('avatar-url') || undefined };
}

async function deliver(messages: StoredMessage[], directory: string): Promise<void> {
	const webhookUrl = process.env.DISCORD_WEBHOOK_URL ?? '';
	if (dryRun || !webhookUrl) {
		notice(dryRun ? 'Dry run: nothing was sent to Discord.' : 'No webhook-url: nothing was sent to Discord.');
		return;
	}
	const ids = await sendMessages(messages, directory, { webhookUrl, threadId: input('thread-id') || undefined });
	notice(`Sent ${ids.length} Discord message(s).`);
	await notify('completed', { messages: ids });
}

async function packages(): Promise<void> {
	const published = parsePublished(input('published-packages', '[]'));
	if (published.length === 0) {
		notice('No published packages to announce.');
		setOutput('skipped', true);
		return;
	}
	await notify('started', { packages: published });

	const root = resolve(process.env.GITHUB_WORKSPACE ?? '.', input('packages-dir', 'packages'));
	const releases = await readReleases(published, root);
	const messages = await renderPackagesMessages(releases, {
		repository,
		roleId: input('role-id'),
		date: new Date().toISOString().slice(0, 10),
		lookup: githubTitleLookup(github()),
		...identity()
	});
	messages.forEach(validate);

	setOutput('message-count', messages.length);
	setOutput('skipped', messages.length === 0);
	appendSummary(`### 📣 Package announcement\n\n${preview(messages)}`);
	await deliver(messages, outputDir);
}

async function collect(): Promise<void> {
	const kind = input('kind', 'bot') === 'site' ? 'site' : 'bot';
	const format = input('format', 'auto');
	const fromRef = input('from-ref');
	if (!fromRef) throw new Error('from-ref is required in draft mode');

	const context = await collectContext(github(), {
		kind,
		product: input('product'),
		version: input('version'),
		fromRef,
		toRef: input('to-ref', 'HEAD'),
		stage: input('stage', 'stable').toLowerCase(),
		format: format === 'text' || format === 'components' ? format : 'auto',
		language: input('language', 'English'),
		notes: input('notes'),
		includeOpenPulls: booleanInput('include-open-pulls', true),
		releaseBranches: ['release']
	});
	await notify('started', { version: context.version, pulls: context.merged.map((pr) => pr.number) });

	await mkdir(outputDir, { recursive: true });
	await writeFile(join(outputDir, 'context.json'), JSON.stringify(context, null, '\t'));

	if (context.merged.length === 0 && !context.notes) {
		notice('No user-facing pull request in this range and no notes: nothing to announce.');
		setOutput('skipped', true);
		return;
	}

	// Pullfrog reads prompt_file relative to GITHUB_WORKSPACE.
	const workspace = resolve(process.env.GITHUB_WORKSPACE ?? '.');
	const promptFile = join(workspace, '.announce', 'prompt.md');
	await mkdir(join(workspace, '.announce'), { recursive: true });
	await writeFile(promptFile, buildPrompt(context, maxScreenshots()));

	setOutput('prompt-file', relative(workspace, promptFile));
	setOutput('schema', JSON.stringify(ANNOUNCEMENT_SCHEMA));
	setOutput('skipped', false);
}

function maxScreenshots(): number {
	const value = Number(input('max-screenshots', '3'));
	return Number.isInteger(value) && value >= 0 ? Math.min(value, 4) : 3;
}

const EXTENSIONS: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' };

/** Downloads one After screenshot into the output folder. Returns its file name, or `null` when it cannot be used. */
async function downloadImage(url: string, name: string): Promise<string | null> {
	try {
		const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20_000) });
		const type = response.headers.get('content-type')?.split(';')[0]?.trim() ?? '';
		const extension = EXTENSIONS[type];
		if (!response.ok || !extension) return null;
		const data = Buffer.from(await response.arrayBuffer());
		if (data.byteLength > ATTACHMENT_LIMIT) return null;
		const file = `${name}.${extension}`;
		await writeFile(join(outputDir, file), data);
		return file;
	} catch {
		return null;
	}
}

async function screenshotsFor(context: ReleaseContext, chosen: { pr: number; caption: string }[]): Promise<{ file: string; caption: string }[]> {
	const images: { file: string; caption: string }[] = [];
	for (const shot of chosen.slice(0, maxScreenshots())) {
		const url = context.evidence.find((item) => item.pr === shot.pr)?.images[0];
		if (!url) {
			warning(`The agent picked #${shot.pr}, which has no After screenshot; skipped.`);
			continue;
		}
		const file = await downloadImage(url, `after-${shot.pr}`);
		if (file) images.push({ file, caption: shot.caption });
		else warning(`The After screenshot of #${shot.pr} could not be downloaded; skipped.`);
	}
	return images;
}

function buttons(): Button[] {
	const list: Button[] = [];
	const label = input('button-label');
	const url = input('button-url');
	if (label && url) list.push({ label, url });
	const release = input('release-url');
	if (release) list.push({ label: 'Release notes', url: release });
	return list;
}

async function renderDraft(): Promise<void> {
	const context = JSON.parse(await readFile(join(outputDir, 'context.json'), 'utf8')) as ReleaseContext;
	const announcement = parseAnnouncement(input('agent-result'));
	if (announcement.skip) {
		notice(`Nothing to announce: ${announcement.skipReason || 'no user-visible change'}.`);
		appendSummary(`### 📣 No announcement\n\n${announcement.skipReason}`);
		setOutput('skipped', true);
		setOutput('message-count', 0);
		return;
	}

	const images = context.kind === 'site' ? await screenshotsFor(context, announcement.screenshots) : [];
	const messages = render(announcement, { roleId: input('role-id'), buttons: buttons(), images, ...identity() });
	messages.forEach(validate);

	await writeFile(join(outputDir, 'announcement.json'), JSON.stringify(announcement, null, '\t'));
	await writeFile(join(outputDir, 'message.json'), JSON.stringify(messages, null, '\t'));
	setOutput('message-count', messages.length);
	setOutput('output-dir', outputDir);
	setOutput('skipped', false);

	appendSummary(
		[
			`### 📣 Draft announcement for ${context.product || context.repository} ${context.version}`,
			`Format: \`${announcement.format}\` · ${messages.length} message(s) · approve the \`post\` job to send it.`,
			preview(messages),
			'<details><summary>Discord payload</summary>\n\n```json\n' + JSON.stringify(messages, null, 2).slice(0, 60_000) + '\n```\n</details>'
		].join('\n\n')
	);
	await notify('drafted', { version: context.version, format: announcement.format, messages: messages.length });
}

async function post(): Promise<void> {
	const messages = JSON.parse(await readFile(join(outputDir, 'message.json'), 'utf8')) as StoredMessage[];
	messages.forEach(validate);
	appendSummary(`### 📣 Posting announcement\n\n${preview(messages)}`);
	setOutput('message-count', messages.length);
	await deliver(messages, outputDir);
}

const MODES: Record<string, () => Promise<void>> = { packages, collect, render: renderDraft, post };

const run = MODES[mode];
if (!run) {
	console.log(`::error::Unknown mode "${mode}". Use packages, draft, or post.`);
	process.exit(1);
}

try {
	await run();
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	await notify('failed', { stage: mode, error: message.slice(0, 500) });
	console.log(`::error::${message}`);
	process.exit(1);
}
