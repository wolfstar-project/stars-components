import { captureException } from '@sentry/node';
import { Listener, container, isUserError, type ClientEvents } from '@wolfstar/http-framework';
import { isSentryInitialized } from '../lib/sentry.js';

export class SharedListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, { ...options, event: 'error' satisfies keyof ClientEvents, enabled: isSentryInitialized() });
	}

	public run(error: unknown) {
		// A `UserError` is an expected failure that is emitted as a `*Denied` event too, not a bug to report.
		if (isUserError(error)) return;

		captureException(error, (scope) => scope.setLevel('error').setTag('event', this.name));
	}
}

void container.stores.loadPiece({ name: 'SharedError', piece: SharedListener as any, store: 'listeners' });
