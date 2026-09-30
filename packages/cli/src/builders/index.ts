import type { ResolvedStarsConfig } from '@wolfstar/schema';
import type { StarsHookable } from '../utils/hooks.js';
import type { Builder } from './types.js';

/**
 * Creates the builder for `build.tool`. `hooks` reach the builders that expose hooks of their own (`tsdown:options`).
 */
export async function createBuilder(config: ResolvedStarsConfig, hooks?: StarsHookable): Promise<Builder> {
	// The project runs its own build, so the CLI only watches what it writes (see `ExternalBuilder`) — including when
	// it is driving `vite build` with its own `nitro()` plugin itself; `build.output` already points at Nitro's
	// `server/index.mjs` in that case (see `resolveBuild`).
	if (config.experimental.enableExternalVite) {
		const { ExternalBuilder } = await import('./external.js');
		return new ExternalBuilder(config);
	}

	// Nitro is itself a Vite plugin — there is no separate `nitro build` step — so it is handled before the
	// `build.tool` switch below, the same way `enableExternalVite` is.
	if (config.experimental.enableNitro) {
		const { NitroBuilder } = await import('./nitro.js');
		return new NitroBuilder(config);
	}

	switch (config.build.tool) {
		case 'tsdown': {
			const { TsdownBuilder } = await import('./tsdown.js');
			return new TsdownBuilder(config, hooks);
		}
		case 'vite': {
			const { ViteBuilder } = await import('./vite.js');
			return new ViteBuilder(config);
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
