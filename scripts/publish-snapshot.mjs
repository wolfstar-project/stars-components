import { spawnSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';

const rootDir = new URL('../', import.meta.url);
const changesetDir = new URL('.changeset/', rootDir);

/**
 * Every `.changeset/*.md` file other than the docs README is an unreleased changeset.
 *
 * @returns {Promise<boolean>}
 */
async function hasUnreleasedChangesets() {
	const entries = await readdir(changesetDir, { withFileTypes: true });
	return entries.some((entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md');
}

/**
 * Runs a command from the repository root, exiting the process when it fails.
 *
 * @param {string} command
 * @param {string[]} args
 * @returns {void}
 */
function run(command, args) {
	const { status, error } = spawnSync(command, args, { cwd: rootDir, stdio: 'inherit', shell: process.platform === 'win32' });
	if (error) throw error;
	if (status !== 0) process.exit(status ?? 1);
}

// Since v3, `changeset version` exits with code 1 when there is nothing to release.
// A push to `main` without pending changesets is a normal state for the snapshot
// workflow, so bail out early instead of reporting a failed release.
if (!(await hasUnreleasedChangesets())) {
	console.log('No unreleased changesets found, skipping the @next snapshot publish.');
	process.exit(0);
}

run('changeset', ['version', '--snapshot', 'next']);
run('pnpm', ['build']);
run('changeset', ['publish', '--tag', 'next', '--no-git-tag']);
