import { envParseString, setup as envRun } from '@wolfstar/env-utilities';
import { initializeSentry, setInvite, setRepository } from '@wolfstar/shared-http-pieces';
/* oxlint-disable import/first -- side-effect setup modules must run after env load preparation */
import '#lib/setup/logger';
import '@wolfstar/shared-http-pieces/register';

export function setup() {
	// From dist/lib/setup → src/.env (same path pattern as ring/staryl/teryl)
	envRun(new URL('../../../src/.env', import.meta.url));

	setRepository('stars-components');
	setInvite(envParseString('DISCORD_CLIENT_ID'), '0');
	initializeSentry();
}
