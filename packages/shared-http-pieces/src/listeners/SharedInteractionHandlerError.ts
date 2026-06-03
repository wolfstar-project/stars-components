import { captureException } from '@sentry/node';
import { Listener, container, type ClientEventInteractionHandlerContext, type ClientEvents } from '@wolfstar/http-framework';
import { isSentryInitialized } from '../lib/sentry.js';

export class SharedListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, { ...options, event: 'interactionHandlerError' satisfies keyof ClientEvents, enabled: isSentryInitialized() });
	}

	public run(error: unknown, context: ClientEventInteractionHandlerContext) {
		captureException(error, (scope) => scope.setLevel('error').setTag('event', this.name).setExtra('handler', context.handler.name));
	}
}

void container.stores.loadPiece({ name: 'SharedInteractionHandlerError', piece: SharedListener as any, store: 'listeners' });
