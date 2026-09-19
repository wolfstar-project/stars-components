import { getRouteRules as getNitroRouteRules } from 'nitro/app';
import type { ResolvedRouteRules } from 'nitro/types';

/**
 * The route rules Nitro resolved for a request (`headers`, `cors`, `redirect`, ...), matched by
 * method and pathname against `stars.config`'s `experimental.nitro.routeRules`.
 *
 * Nitro applies these rules before dispatching to the app entry regardless of whether a specific
 * route matched, so they are meaningful even for a Stars app that has no `routes/` directory.
 */
export function getRouteRules(request: Request): ResolvedRouteRules {
	const { pathname } = new URL(request.url);
	return getNitroRouteRules(request.method, pathname).routeRules;
}
