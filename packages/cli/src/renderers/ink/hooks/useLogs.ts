import { useEffect, useState } from 'react';
import type { DevService } from '../../../lib/dev-service.js';
import type { LogEntry, LogLevel, LogSource } from '../../../lib/log-buffer.js';

export interface LogFilterState {
	source: LogSource | null;
	level: LogLevel | null;
}

/**
 * Returns the entries matching the active filter, re-rendering whenever the buffer changes.
 */
export function useLogs(service: DevService, filter: LogFilterState): LogEntry[] {
	const [entries, setEntries] = useState<LogEntry[]>(() => service.logs.filter(filter));

	useEffect(() => {
		const update = () => setEntries(service.logs.filter(filter));
		update();

		service.logs.on('entry', update);
		service.logs.on('clear', update);
		return () => {
			service.logs.off('entry', update);
			service.logs.off('clear', update);
		};
	}, [service, filter.source, filter.level]);

	return entries;
}
