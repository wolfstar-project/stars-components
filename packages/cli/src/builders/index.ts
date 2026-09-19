import type { ResolvedStarsConfig } from '@wolfstar/http-framework/config';
import type { Builder } from './types.js';

export async function createBuilder(config: ResolvedStarsConfig): Promise<Builder> {
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
			return new TsdownBuilder(config);
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
