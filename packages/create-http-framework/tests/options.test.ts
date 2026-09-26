import { isNitroBuild, isViteBuild, resolveGatewayFeatures } from '../src/tools/options.js';

describe('build tool helpers', () => {
	test.each([
		['tsc6', false, false],
		['tsc7', false, false],
		['tsdown', false, false],
		['vite', true, false],
		['vite-nitro', true, true]
	] as const)('GIVEN %s THEN isViteBuild is %s and isNitroBuild is %s', (buildTool, vite, nitro) => {
		expect(isViteBuild(buildTool)).toBe(vite);
		expect(isNitroBuild(buildTool)).toBe(nitro);
	});
});

describe('resolveGatewayFeatures', () => {
	const none = { gateway: false, cache: false, redis: false, sharder: false };

	test('GIVEN nothing selected THEN nothing is implied', () => {
		expect(resolveGatewayFeatures(none)).toStrictEqual({ features: none, implied: [] });
	});

	test('GIVEN the cache THEN the gateway is implied', () => {
		expect(resolveGatewayFeatures({ ...none, cache: true })).toStrictEqual({
			features: { ...none, cache: true, gateway: true },
			implied: ['gateway']
		});
	});

	test('GIVEN the sharder THEN the gateway is implied', () => {
		expect(resolveGatewayFeatures({ ...none, sharder: true }).features).toStrictEqual({ ...none, sharder: true, gateway: true });
	});

	test('GIVEN redis alone THEN the cache and the gateway are implied', () => {
		expect(resolveGatewayFeatures({ ...none, redis: true })).toStrictEqual({
			features: { gateway: true, cache: true, redis: true, sharder: false },
			implied: ['cache', 'gateway']
		});
	});

	test('GIVEN every dependency already selected THEN nothing is implied', () => {
		const all = { gateway: true, cache: true, redis: true, sharder: true };
		expect(resolveGatewayFeatures(all)).toStrictEqual({ features: all, implied: [] });
	});
});
