import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { LogBuffer } from '../src/utils/log-buffer.js';
import { LogFileWriter, runLogFile } from '../src/dev/log-file.js';
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
		expect(contents).toContain('info    cli          before open');
		expect(contents).toContain('error   bot          after open');
		expect(contents).toContain('error   types        src/main.ts(1,1): error TS2304: Cannot find name.');
		// Every line is prefixed with an ISO timestamp so a session can be read back in order.
		expect(contents.split('\n')[0]).toMatch(/^\d{4}-\d{2}-\d{2}T/);
	});

	test('writes the channel and the detail lines of an entry, without colour codes', async () => {
		fixture = await createFixture();
		const file = join(fixture.root, 'dev.log');
		const logs = new LogBuffer();
		const writer = new LogFileWriter(file, logs);
		writer.open();
		logs.push({ source: 'stars', channel: 'commands', level: 'info', text: '\u001B[32mCommands updated\u001B[39m', detail: ['changed ping'] });
		await waitFor(async () => (await readFile(file, 'utf-8').catch(() => '')).includes('changed ping'));
		writer.close();

		expect(await readFile(file, 'utf-8')).toMatch(/info {4}commands {5}Commands updated\n {2}changed ping\n$/);
	});

	test('runLogFile names one file per run and keeps the newest ones', async () => {
		fixture = await createFixture({
			'logs/dev-2026-01-01T00-00-00.000Z.log': 'a',
			'logs/dev-2026-01-02T00-00-00.000Z.log': 'b',
			'logs/dev-2026-01-03T00-00-00.000Z.log': 'c',
			'logs/notes.txt': 'kept'
		});
		const directory = join(fixture.root, 'logs');
		const file = runLogFile(directory, 2, new Date('2026-10-03T20:00:00.000Z'));

		expect(file).toBe(join(directory, 'dev-2026-10-03T20-00-00.000Z.log'));
		// One older run stays next to the new one; anything that is not a run file is left alone.
		expect((await readdir(directory)).sort()).toEqual(['dev-2026-01-03T00-00-00.000Z.log', 'notes.txt']);
		expect(runLogFile(join(fixture.root, 'missing'), 2)).toContain('missing');
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
