export interface PackageInfo {
	category: 'Core framework' | 'Infrastructure' | 'Shared pieces' | 'Platform helpers';
	description: string;
	name: string;
	path: string;
	version: string;
}

export const packages: PackageInfo[] = [
	{
		name: '@wolfstar/http-framework',
		path: 'http-framework',
		version: '3.0.0',
		category: 'Core framework',
		description: 'Build Discord bots around fast, HTTP-only interactions.'
	},
	{
		name: '@wolfstar/create-http-framework',
		path: 'create-http-framework',
		version: '2.0.1',
		category: 'Core framework',
		description: 'Scaffold a production-ready HTTP Framework bot.'
	},
	{
		name: '@wolfstar/http-framework-i18n',
		path: 'http-framework-i18n',
		version: '1.2.3',
		category: 'Core framework',
		description: 'Add typed i18next translations to HTTP Framework interactions.'
	},
	{
		name: '@wolfstar/i18next-backend',
		path: 'i18next-backend',
		version: '2.0.8',
		category: 'Core framework',
		description: 'Load and merge i18next resources from the filesystem.'
	},
	{
		name: '@wolfstar/http-framework-test-utils',
		path: 'http-framework-test-utils',
		version: '3.0.0',
		category: 'Core framework',
		description: 'Test interactions with fixtures, a harness, and Vitest matchers.'
	},
	{
		name: '@wolfstar/env-utilities',
		path: 'env-utilities',
		version: '2.0.3',
		category: 'Infrastructure',
		description: 'Load, type, and parse environment variables safely.'
	},
	{
		name: '@wolfstar/logger',
		path: 'logger',
		version: '2.1.1',
		category: 'Infrastructure',
		description: 'Use a lightweight logger with level and color support.'
	},
	{
		name: '@wolfstar/safe-fetch',
		path: 'safe-fetch',
		version: '1.1.6',
		category: 'Infrastructure',
		description: 'Wrap native fetch responses in Result values.'
	},
	{
		name: '@wolfstar/start-banner',
		path: 'start-banner',
		version: '2.0.4',
		category: 'Infrastructure',
		description: 'Render consistent, ANSI-aware startup banners.'
	},
	{
		name: '@wolfstar/shared-http-pieces',
		path: 'shared-http-pieces',
		version: '1.2.6',
		category: 'Shared pieces',
		description: 'Reuse commands and error listeners across Star Network bots.'
	},
	{
		name: '@wolfstar/shared-influx-pieces',
		path: 'shared-influx-pieces',
		version: '1.1.3',
		category: 'Shared pieces',
		description: 'Collect interaction metrics through reusable Influx pieces.'
	},
	{
		name: '@wolfstar/influx-utilities',
		path: 'influx-utilities',
		version: '1.1.2',
		category: 'Platform helpers',
		description: 'Work with a single InfluxDB organization through a small client.'
	},
	{
		name: '@wolfstar/reddit-helpers',
		path: 'reddit-helpers',
		version: '1.2.3',
		category: 'Platform helpers',
		description: 'Fetch and normalize Reddit posts for Star bots.'
	},
	{
		name: '@wolfstar/twitch-helpers',
		path: 'twitch-helpers',
		version: '2.0.4',
		category: 'Platform helpers',
		description: 'Call Twitch Helix and validate EventSub requests.'
	},
	{
		name: '@wolfstar/weather-helpers',
		path: 'weather-helpers',
		version: '1.1.3',
		category: 'Platform helpers',
		description: 'Fetch weather data and convert common units.'
	}
];
