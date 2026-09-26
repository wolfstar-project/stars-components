import { getRouteRules } from '../src/runtime.js';

vi.mock('nitro/app', () => ({
	getRouteRules: (method: string, pathname: string) => ({
		routeRules: { method, pathname, cors: true },
		routeRuleMiddleware: []
	})
}));

describe('getRouteRules', () => {
	test('resolves rules by the request method and pathname', () => {
		const rules = getRouteRules(new Request('http://localhost/api/ping', { method: 'POST' }));
		expect(rules).toEqual({ method: 'POST', pathname: '/api/ping', cors: true });
	});
});
