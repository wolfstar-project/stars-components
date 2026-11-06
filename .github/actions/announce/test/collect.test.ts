import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { afterImages, cleanBody, evidenceFrom, isDependencyUpdate, isGitHubImage } from '../src/collect.ts';

const EVIDENCE = `Checked the visible change in the running app.

| Before | After |
| --- | --- |
| ![Before](https://github.com/user-attachments/assets/aaaa) | ![After](https://github.com/user-attachments/assets/bbbb) |
| <img src="https://github.com/user-attachments/assets/cccc"> | <img alt="After" src="https://github.com/user-attachments/assets/dddd" /> |`;

describe('pr-evidence screenshots', () => {
	it('takes the After column of the table', () => {
		assert.deepEqual(afterImages(EVIDENCE), [
			'https://github.com/user-attachments/assets/bbbb',
			'https://github.com/user-attachments/assets/dddd'
		]);
	});

	it('falls back to images labelled After', () => {
		assert.deepEqual(
			afterImages(
				'![after-1a2b3c4](https://github.com/user-attachments/assets/eeee)\n![before](https://github.com/user-attachments/assets/ffff)'
			),
			['https://github.com/user-attachments/assets/eeee']
		);
	});

	it('ignores images GitHub does not host', () => {
		assert.equal(isGitHubImage('https://evil.example/after.png'), false);
		assert.equal(isGitHubImage('https://github.com/wolfstar-project/x/raw/main/a.png'), false);
		assert.deepEqual(afterImages('| Before | After |\n| - | --- |\n| ![a](https://i.imgur.com/a.png) | ![b](https://i.imgur.com/b.png) |'), []);
	});

	it('prefers the newest comment', () => {
		const evidence = evidenceFrom({ number: 7, body: '' }, [
			{ body: EVIDENCE, created_at: '2026-11-01T00:00:00Z', user: null },
			{ body: EVIDENCE.replace('bbbb', 'zzzz').replace('dddd', 'yyyy'), created_at: '2026-11-02T00:00:00Z', user: null }
		]);
		assert.deepEqual(evidence, {
			pr: 7,
			images: ['https://github.com/user-attachments/assets/zzzz', 'https://github.com/user-attachments/assets/yyyy']
		});
		assert.equal(evidenceFrom({ number: 8, body: 'no images' }, []), null);
	});
});

describe('pull request text', () => {
	it('drops comments, images, and the AI disclosure', () => {
		const body = cleanBody('Why\n<!-- template -->\n![shot](https://x/y.png)\n\n\n\n> 🤖 AI disclosure: Claude Code was used.');
		assert.equal(body, 'Why');
	});

	it('recognises dependency updates', () => {
		assert.equal(isDependencyUpdate({ title: 'fix(deps): update dependency ink to v8', user: null }), true);
		assert.equal(isDependencyUpdate({ title: 'chore: lock file maintenance', user: { login: 'renovate[bot]', type: 'Bot' } }), true);
		assert.equal(isDependencyUpdate({ title: 'feat: add /note', user: { login: 'RedStar071' } }), false);
	});
});
