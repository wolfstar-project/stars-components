import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { registerSharedLocales, sharedNamespace } from '../src/lib/register-i18n.js';

const consumerLocalesDirectory = fileURLToPath(new URL('./fixtures/locales', import.meta.url));
const bundledLocalesPath = fileURLToPath(new URL('../src/locales/{{lng}}/{{ns}}.json', import.meta.url));

describe('registerSharedLocales', () => {
	test('GIVEN consumer and bundled locales THEN both paths and namespaces are retained', () => {
		const options = registerSharedLocales(
			{
				defaultLanguageDirectory: consumerLocalesDirectory,
				i18next: { ns: ['configured'] }
			},
			bundledLocalesPath
		);

		expect(options.backend?.paths).toEqual([join(consumerLocalesDirectory, '{{lng}}', '{{ns}}.json'), bundledLocalesPath]);
		expect(options.i18next).toBeTypeOf('function');
		expect(typeof options.i18next === 'function' ? options.i18next(['commands/consumer'], ['en-US']).ns : undefined).toEqual([
			'commands/consumer',
			'configured',
			sharedNamespace
		]);
	});
});
