import { PassThrough } from 'node:stream';
import type { DevService } from '../src/lib/dev-service.js';
import { captureOutput } from '../src/renderers/capture-output.js';

test('captures third-party output and restores writes, callbacks and split UTF-8', async () => {
	const stream = new PassThrough();
	const original = stream.write;
	const log = vi.fn();
	const restore = captureOutput({ log } as unknown as DevService, stream as unknown as NodeJS.WriteStream, 'info');
	let leaked = '';
	stream.on('data', (chunk) => (leaked += String(chunk)));
	const text = Buffer.from('price €\n');
	stream.write(text.subarray(0, 7));
	stream.write(text.subarray(7));
	await new Promise<void>((resolve) => stream.write('\u001b[33mWARN plugin warning\u001b[0m\n', resolve));
	stream.write('partial line');
	strictRestore();
	expect(log.mock.calls).toEqual([
		['build', 'info', 'price €'],
		['build', 'warn', '\u001b[33mWARN plugin warning\u001b[0m'],
		['build', 'info', 'partial line']
	]);
	expect(leaked).toBe('');
	expect(stream.write).toBe(original);
	stream.write('visible again');
	expect(leaked).toBe('visible again');
	function strictRestore() {
		restore();
		restore();
	}
});
