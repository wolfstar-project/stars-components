import type { ResolvedStarsConfig } from '@wolfstar/http-framework/config';
import type { Builder } from './types.js';

export async function createBuilder(config: ResolvedStarsConfig): Promise<Builder> {
	switch (config.build.tool) {
		case 'tsdown': {
			const { TsdownBuilder } = await import('./tsdown.js');
			return new TsdownBuilder(config);
		}
		case 'tsc': {
			const { TscBuilder } = await import('./tsc.js');
			return new TscBuilder(config);
		}
		case 'none': {
			const { NoneBuilder } = await import('./none.js');
			return new NoneBuilder(config);
		}
	}
}

export type { Builder, BuilderEvents, BuildOutcome } from './types.js';
