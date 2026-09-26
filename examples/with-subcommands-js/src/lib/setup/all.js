import { envParseString, setup as envRun } from '@wolfstar/env-utilities';
import { initializeSentry, setInvite, setRepository } from '@wolfstar/shared-http-pieces';
/* oxlint-disable import/first -- side-effect setup modules must run after env load preparation */
// Also activates `@wolfstar/plugin-i18next`: without a bundler (`build.tool: 'none'`) the Stars CLI cannot inject
// installed plugins' `register` entries, so the explicit side-effect import stays.
import '@wolfstar/shared-http-pieces/register';

export function setup() {
	// From src/lib/setup → src/.env
	envRun();

	setRepository('stars-components');
	setInvite(envParseString('DISCORD_CLIENT_ID'), '0');
	initializeSentry();
}
