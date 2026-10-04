export * from './lib/setup';
export * from './lib/types';
export * from './lib/utils';
export * from './lib/varlock-types';

import type { Env } from './lib/types';

declare global {
	namespace NodeJS {
		interface ProcessEnv extends Env {}
	}
}
