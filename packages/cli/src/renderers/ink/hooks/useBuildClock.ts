import { useEffect, useState } from 'react';

/** The clock moves during a long compiler phase; the percentage only moves on real build events. */
export function useBuildClock(startedAt: number, active: boolean, reducedMotion: boolean) {
	const [now, setNow] = useState(Date.now);
	useEffect(() => {
		if (!active) return;
		setNow(Date.now());
		const timer = setInterval(() => setNow(Date.now()), reducedMotion ? 1000 : 120);
		return () => clearInterval(timer);
	}, [startedAt, active, reducedMotion]);
	const elapsedMs = Math.max(0, now - startedAt);
	return { elapsedMs, frame: reducedMotion ? 0 : Math.floor(elapsedMs / 120) };
}
