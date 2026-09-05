import { useEffect, useState } from 'react';
import type { DevService, DevStatus } from '../../../lib/dev-service.js';
import type { LogEntry } from '../../../lib/log-buffer.js';

export interface LogCounters {
	warnings: number;
	errors: number;
}

/**
 * Warnings and errors logged since the last successful build, the way Nuxt CLI v4's own panel counts them: the
 * badge's job is the current state, this line is what happened getting there.
 */
export function useLogCounters(service: DevService): LogCounters {
	const [counters, setCounters] = useState<LogCounters>({ warnings: 0, errors: 0 });

	useEffect(() => {
		let previousBuild: DevStatus['build'] = service.status.build;

		const onEntry = (entry: LogEntry) => {
			if (entry.level === 'warn') setCounters((current) => ({ ...current, warnings: current.warnings + 1 }));
			else if (entry.level === 'error') setCounters((current) => ({ ...current, errors: current.errors + 1 }));
		};

		const onStatus = (status: DevStatus) => {
			if (status.build === 'ok' && previousBuild !== 'ok') setCounters({ warnings: 0, errors: 0 });
			previousBuild = status.build;
		};

		service.logs.on('entry', onEntry);
		service.on('status', onStatus);
		return () => {
			service.logs.off('entry', onEntry);
			service.off('status', onStatus);
		};
	}, [service]);

	return counters;
}
