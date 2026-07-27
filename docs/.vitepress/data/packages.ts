// Versions are read from each package's `package.json` at build time so the cards never drift after a
// release. `uppt/pr` owns the version bumps; importing the manifests keeps this file in lockstep without
// manual edits. Both the VitePress config (esbuild) and PackageGrid.vue (Vite client bundle) inline these
// JSON imports at build time.
import createHttpFramework from '../../../packages/create-http-framework/package.json';
import envUtilities from '../../../packages/env-utilities/package.json';
import httpFramework from '../../../packages/http-framework/package.json';
import httpFrameworkI18n from '../../../packages/http-framework-i18n/package.json';
import httpFrameworkTestUtils from '../../../packages/http-framework-test-utils/package.json';
import i18nextBackend from '../../../packages/i18next-backend/package.json';
import influxUtilities from '../../../packages/influx-utilities/package.json';
import logger from '../../../packages/logger/package.json';
import redditHelpers from '../../../packages/reddit-helpers/package.json';
import safeFetch from '../../../packages/safe-fetch/package.json';
import sharedHttpPieces from '../../../packages/shared-http-pieces/package.json';
import sharedInfluxPieces from '../../../packages/shared-influx-pieces/package.json';
import startBanner from '../../../packages/start-banner/package.json';
import twitchHelpers from '../../../packages/twitch-helpers/package.json';
import weatherHelpers from '../../../packages/weather-helpers/package.json';

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
		version: httpFramework.version,
		category: 'Core framework',
		description: 'Build Discord bots around fast, HTTP-only interactions.'
	},
	{
		name: '@wolfstar/create-http-framework',
		path: 'create-http-framework',
		version: createHttpFramework.version,
		category: 'Core framework',
		description: 'Scaffold a production-ready HTTP Framework bot.'
	},
	{
		name: '@wolfstar/http-framework-i18n',
		path: 'http-framework-i18n',
		version: httpFrameworkI18n.version,
		category: 'Core framework',
		description: 'Add typed i18next translations to HTTP Framework interactions.'
	},
	{
		name: '@wolfstar/i18next-backend',
		path: 'i18next-backend',
		version: i18nextBackend.version,
		category: 'Core framework',
		description: 'Load and merge i18next resources from the filesystem.'
	},
	{
		name: '@wolfstar/http-framework-test-utils',
		path: 'http-framework-test-utils',
		version: httpFrameworkTestUtils.version,
		category: 'Core framework',
		description: 'Test interactions with fixtures, a harness, and Vitest matchers.'
	},
	{
		name: '@wolfstar/env-utilities',
		path: 'env-utilities',
		version: envUtilities.version,
		category: 'Infrastructure',
		description: 'Load, type, and parse environment variables safely.'
	},
	{
		name: '@wolfstar/logger',
		path: 'logger',
		version: logger.version,
		category: 'Infrastructure',
		description: 'Use a lightweight logger with level and color support.'
	},
	{
		name: '@wolfstar/safe-fetch',
		path: 'safe-fetch',
		version: safeFetch.version,
		category: 'Infrastructure',
		description: 'Wrap native fetch responses in Result values.'
	},
	{
		name: '@wolfstar/start-banner',
		path: 'start-banner',
		version: startBanner.version,
		category: 'Infrastructure',
		description: 'Render consistent, ANSI-aware startup banners.'
	},
	{
		name: '@wolfstar/shared-http-pieces',
		path: 'shared-http-pieces',
		version: sharedHttpPieces.version,
		category: 'Shared pieces',
		description: 'Reuse commands and error listeners across Star Network bots.'
	},
	{
		name: '@wolfstar/shared-influx-pieces',
		path: 'shared-influx-pieces',
		version: sharedInfluxPieces.version,
		category: 'Shared pieces',
		description: 'Collect interaction metrics through reusable Influx pieces.'
	},
	{
		name: '@wolfstar/influx-utilities',
		path: 'influx-utilities',
		version: influxUtilities.version,
		category: 'Platform helpers',
		description: 'Work with a single InfluxDB organization through a small client.'
	},
	{
		name: '@wolfstar/reddit-helpers',
		path: 'reddit-helpers',
		version: redditHelpers.version,
		category: 'Platform helpers',
		description: 'Fetch and normalize Reddit posts for Star bots.'
	},
	{
		name: '@wolfstar/twitch-helpers',
		path: 'twitch-helpers',
		version: twitchHelpers.version,
		category: 'Platform helpers',
		description: 'Call Twitch Helix and validate EventSub requests.'
	},
	{
		name: '@wolfstar/weather-helpers',
		path: 'weather-helpers',
		version: weatherHelpers.version,
		category: 'Platform helpers',
		description: 'Fetch weather data and convert common units.'
	}
];
