import { useEffect, useState } from 'react';
import type { DevService, DevStatus } from '../../../lib/dev-service.js';
import { isErrorDetail, type LogEntry } from '../../../lib/log-buffer.js';

export interface LogCounters {
	warnings: number;
	errors: number;
}

/**
 * Warnings and errors logged since the last successful build, the way Nuxt CLI v4's own panel counts them: the
 * badge's job is the current state, this line is what happened getting there.
 */
export function useLogCounters(service: DevService): LogCounters {
	const count = () =>
		service.logs.entries().reduce<LogCounters>(
			(total, entry) => ({
				warnings: total.warnings + Number(entry.level === 'warn'),
				errors: total.errors + Number(entry.level === 'error' && !isErrorDetail(entry))
			}),
			{ warnings: 0, errors: 0 }
		);
	const [counters, setCounters] = useState<LogCounters>(count);

	useEffect(() => {
		let previousBuild: DevStatus['build'] = service.status.build;
		let previousStart = service.status.startedAt;

		const onEntry = (entry: LogEntry) => {
			if (entry.level === 'warn') setCounters((current) => ({ ...current, warnings: current.warnings + 1 }));
			else if (entry.level === 'error' && !isErrorDetail(entry)) setCounters((current) => ({ ...current, errors: current.errors + 1 }));
		};

		const onStatus = (status: DevStatus) => {
			if (
				(status.build === 'building' && previousBuild !== 'building' && previousBuild !== 'idle') ||
				(status.lastRestartReason === 'manual' && status.startedAt !== null && status.startedAt !== previousStart)
			)
				setCounters({ warnings: 0, errors: 0 });
			previousBuild = status.build;
			previousStart = status.startedAt;
		};

		service.logs.on('entry', onEntry);
		const onClear = () => setCounters({ warnings: 0, errors: 0 });
		service.logs.on('clear', onClear);
		service.on('status', onStatus);
		setCounters(count());
		return () => {
			service.logs.off('entry', onEntry);
			service.logs.off('clear', onClear);
			service.off('status', onStatus);
		};
	}, [service]);

	return counters;
}
