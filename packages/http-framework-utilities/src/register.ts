import { container } from '@wolfstar/http-framework';
import { registerUtilityHandlers } from './lib/registration.js';

/**
 * Registers the paginated message and prompter interaction handlers at startup. Importing it before creating the
 * client is required, so every process handles their clicks, including one that never called `PaginatedMessage#run`
 * (e.g. several replicas behind a shared `RedisSessionStore`). The `stars` CLI does not auto-register it.
 * Self-registration on the first `run` is only a safety net.
 *
 * ```ts
 * import '@wolfstar/http-framework-utilities/register';
 * ```
 */
registerUtilityHandlers().catch((error: unknown) => container.logger.error('[http-framework-utilities] Failed to register handlers', error));
