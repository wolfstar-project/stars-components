import type { ResolvedStarsConfig } from '@wolfstar/http-framework/config';
import { CliError } from '../errors.js';
import type { Builder } from './types.js';

/**
 * Fails on experiments the CLI cannot honour yet, before a command gets far enough to look like it worked.
 *
 * Called by `stars dev`/`stars build` up front, since a project whose build tool needs no build at all would
 * otherwise return early and never reach {@link createBuilder}.
 */
export function assertSupportedExperiments(config: ResolvedStarsConfig): void {
	if (config.experimental.enableNitro) {
		throw new CliError('`experimental.enableNitro` is not implemented yet', {
			code: 'EXPERIMENT_UNAVAILABLE',
			hint: "Nitro needs the framework's Fetch adapter (wolfstar-project/stars-components#81); until it lands, use `build.tool` 'tsdown', 'vite' or 'tsc'."
		});
	}
}

export async function createBuilder(config: ResolvedStarsConfig): Promise<Builder> {
	assertSupportedExperiments(config);

	// The project runs its own build, so the CLI only watches what it writes (see `ExternalBuilder`).
	if (config.experimental.enableExternalVite) {
		const { ExternalBuilder } = await import('./external.js');
		return new ExternalBuilder(config);
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
