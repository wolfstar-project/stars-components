import { envParseString } from '@wolfstar/env-utilities';
import { initializeSentry, setInvite, setRepository } from '@wolfstar/shared-http-pieces';
/* oxlint-disable import/first -- side-effect setup modules; `stars` loads the environment before any of them */
import '@wolfstar/shared-http-pieces/register';

export function setup() {
	setRepository('stars-components');
	setInvite(envParseString('DISCORD_CLIENT_ID'), '0');
	initializeSentry();
}
