import { useEffect, useState } from 'react';
import type { DevService } from '../../../lib/dev-service.js';
import type { LogEntry } from '../../../lib/log-buffer.js';

/**
 * The append-only stream `<Static>` prints once and never revisits, so a session's output becomes real terminal
 * scrollback exactly like plain mode's — the panel below stays a handful of lines, the way Nuxt CLI v4's own dev
 * server never mixes its log stream into the panel it pins.
 */
export function useStaticLog(service: DevService): LogEntry[] {
	const [entries, setEntries] = useState<LogEntry[]>(() => service.logs.entries().slice());

	useEffect(() => {
		const onEntry = (entry: LogEntry) => setEntries((current) => [...current, entry]);
		service.logs.on('entry', onEntry);
		return () => {
			service.logs.off('entry', onEntry);
		};
	}, [service]);

	return entries;
}
