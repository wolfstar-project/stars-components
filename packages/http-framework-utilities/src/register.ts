import { container } from '@wolfstar/http-framework';
import { registerUtilityHandlers } from './lib/registration.js';

/**
 * Registers the paginated message and prompter interaction handlers at startup. Import it before creating the client
 * when component clicks may reach a process that never called `PaginatedMessage#run` (several replicas behind a
 * shared `RedisSessionStore`):
 *
 * ```ts
 * import '@wolfstar/http-framework-utilities/register';
 * ```
 */
registerUtilityHandlers().catch((error: unknown) => container.logger.error('[http-framework-utilities] Failed to register handlers', error));
