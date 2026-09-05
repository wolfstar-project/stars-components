import { setup } from '#lib/setup/all.js';
import { envParseInteger, envParseString } from '@wolfstar/env-utilities';
import { Client, container } from '@wolfstar/http-framework';
import { init, load } from '@wolfstar/http-framework-i18n';
import { registerCommands } from '@wolfstar/shared-http-pieces';
import { createStarsBanner } from '@wolfstar/start-banner';
import { morning } from 'gradient-string';

await setup();

await load(new URL('./locales', import.meta.url));
await init({
	fallbackLng: 'en-US',
	returnNull: false,
	returnEmptyString: false,
	returnObjects: true
});

const client = new Client();
await client.load();

void registerCommands();

const address = envParseString('HTTP_ADDRESS', '0.0.0.0');
const port = envParseInteger('HTTP_PORT', 3000);
await client.listen({ address, port });

console.log(
	morning.multiline(
		createStarsBanner({
			name: ['Stars Components', 'with-subcommands-js example'],
			extra: [
				'',
				`Loaded: ${container.stores.get('commands').size} commands`,
				`      : ${container.stores.get('interaction-handlers').size} interaction handlers`,
				`Listening: ${address}:${port}`
			]
		})
	)
);

container.logger.info('Ready');
