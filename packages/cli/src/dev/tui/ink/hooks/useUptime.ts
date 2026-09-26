import { useEffect, useState } from 'react';

/**
 * Re-renders once a second while the bot is up, so the uptime in the header keeps counting.
 */
export function useUptime(startedAt: number | null): number | null {
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		if (startedAt === null) return;

		setNow(Date.now());
		const timer = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(timer);
	}, [startedAt]);

	return startedAt === null ? null : now - startedAt;
}
