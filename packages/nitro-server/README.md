# @wolfstar/nitro-server

Nitro server integration for Stars projects.

The Stars CLI loads this integration on demand when `experimental.enableNitro` is enabled. Existing `stars.config` options and the CLI commands are unchanged.
Install `vite` and `nitro` in the consuming project; the integration uses the project's own versions and Vite configuration.

## Programmatic usage

The package exports `NitroBuilder`. Pass a resolved `StarsConfig` and a `BuilderContext` from `@wolfstar/schema`:

```typescript
import { NitroBuilder } from '@wolfstar/nitro-server';
import type { BuilderContext, ResolvedStarsConfig } from '@wolfstar/schema';

export async function build(config: ResolvedStarsConfig, context: BuilderContext) {
	const builder = new NitroBuilder(config, context);
	try {
		return await builder.build();
	} finally {
		await builder.close();
	}
}
```

The host supplies `importFromProject` (project-relative dependency loading with diagnostics) and
`pluginRegistrations` (the entry transform that activates installed plugins). This explicit boundary keeps the
integration independent of the CLI and framework runtimes. `watch()` and `close()` implement the shared builder
lifecycle; `start`, `success`, `failure`, and `log` events expose build status.

Nitro uses `nitro/vite` with a virtual server entry forwarding requests to the application default export’s `fetch` method. The configured preset and output directory are preserved.

Integration coverage lives in `packages/cli/test/nitro-builder.test.ts`, including real builds through the CLI host.
