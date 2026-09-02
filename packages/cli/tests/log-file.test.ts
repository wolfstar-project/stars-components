import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { LogBuffer } from '../src/lib/log-buffer.js';
import { LogFileWriter } from '../src/lib/log-file.js';
import { createFixture, waitFor, type Fixture } from './helpers.js';

describe('LogFileWriter', () => {
	let fixture: Fixture;

	afterEach(async () => {
		await fixture?.cleanup();
	});

	test('mirrors buffered and later entries into the file, creating its directory', async () => {
		fixture = await createFixture();
		const file = join(fixture.root, '.stars', 'dev.log');
		const logs = new LogBuffer();
		logs.push({ source: 'stars', level: 'info', text: 'before open' });

		const writer = new LogFileWriter(file, logs);
		writer.open();
		logs.push({ source: 'app', level: 'error', text: 'after open' });
		logs.push({ source: 'tsc', level: 'error', text: 'src/main.ts(1,1): error TS2304: Cannot find name.' });

		await waitFor(async () => (await readFile(file, 'utf-8').catch(() => '')).includes('TS2304'));
		writer.close();

		const contents = await readFile(file, 'utf-8');
		expect(contents).toContain('info    stars  before open');
		expect(contents).toContain('error   app    after open');
		expect(contents).toContain('error   tsc    src/main.ts(1,1): error TS2304: Cannot find name.');
		// Every line is prefixed with an ISO timestamp so a session can be read back in order.
		expect(contents.split('\n')[0]).toMatch(/^\d{4}-\d{2}-\d{2}T/);
	});

	test('stops writing once closed', async () => {
		fixture = await createFixture();
		const file = join(fixture.root, 'logs', 'dev.log');
		const logs = new LogBuffer();
		const writer = new LogFileWriter(file, logs);

		writer.open();
		logs.push({ source: 'stars', level: 'info', text: 'kept' });
		await waitFor(async () => (await readFile(file, 'utf-8').catch(() => '')).includes('kept'));
		writer.close();

		logs.push({ source: 'stars', level: 'info', text: 'dropped' });
		expect(await readFile(file, 'utf-8')).not.toContain('dropped');
	});
});
