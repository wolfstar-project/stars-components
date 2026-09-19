# @wolfstar/vite-server

Vite build and watch integration for Stars projects.

The Stars CLI loads this integration on demand when `build.tool` resolves to `'vite'`. Existing `stars.config` options and the CLI commands are unchanged.
Install `vite` in the consuming project; the integration uses the project's own versions and Vite configuration.

## Programmatic usage

The package exports `ViteBuilder`. Pass a resolved `StarsConfig` and a `BuilderContext` from `@wolfstar/schema`:

```typescript
import { ViteBuilder } from '@wolfstar/vite-server';
import type { BuilderContext, ResolvedStarsConfig } from '@wolfstar/schema';

export async function build(config: ResolvedStarsConfig, context: BuilderContext) {
	const builder = new ViteBuilder(config, context);
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

Vite builds the application and uses its build watcher for rebuilds. Process supervision remains the responsibility of the host CLI.

Integration coverage lives in `packages/cli/test/vite-builder.test.ts`, including real builds through the CLI host.
