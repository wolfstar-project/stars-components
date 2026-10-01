import type { StarsEnvSetupOptions } from '@wolfstar/schema';
import type { EnvSetupOptions } from '../src/index.js';

/**
 * `env` in `stars.config` (`StarsEnvSetupOptions` in `@wolfstar/schema`) mirrors the serializable part of
 * `EnvSetupOptions`. `@wolfstar/schema` cannot depend on this package, so this is where a drift between the two fails.
 */
describe('StarsEnvSetupOptions', () => {
	test('is assignable to EnvSetupOptions', () => {
		expectTypeOf<StarsEnvSetupOptions>().toExtend<EnvSetupOptions>();
	});

	test('mirrors every EnvSetupOptions key the loader honours', () => {
		// Not mirrored: `processEnv` is not serializable, `DOTENV_KEY` is a secret, and the loader never forwards
		// `quiet`/`override` to dotenv.
		type Mirrored = Exclude<keyof EnvSetupOptions, 'processEnv' | 'DOTENV_KEY' | 'quiet' | 'override'>;
		expectTypeOf<keyof StarsEnvSetupOptions>().toEqualTypeOf<Mirrored>();
	});
});
