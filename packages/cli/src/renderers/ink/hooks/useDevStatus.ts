import { useEffect, useState } from 'react';
import type { DevService, DevStatus } from '../../../lib/dev-service.js';

/**
 * Mirrors the service's status into React state. The service stays the single source of truth: the UI only
 * subscribes to it, exactly like the plain renderer does.
 */
export function useDevStatus(service: DevService): DevStatus {
	const [status, setStatus] = useState<DevStatus>(() => service.status);

	useEffect(() => {
		const onStatus = (next: DevStatus) => setStatus(next);
		service.on('status', onStatus);
		setStatus(service.status);
		return () => {
			service.off('status', onStatus);
		};
	}, [service]);

	return status;
}
