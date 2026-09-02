import { useEffect, useState } from 'react';

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] as const;
const STILL = '•';

/**
 * A spinner frame for whatever is in flight (a build, a tunnel coming up). `STARS_REDUCED_MOTION=1` and non-TTY
 * output freeze it on a static character instead.
 */
export function useSpinner(active: boolean, reducedMotion: boolean): string {
	const [frame, setFrame] = useState(0);

	useEffect(() => {
		if (!active || reducedMotion) return;

		const timer = setInterval(() => setFrame((current) => (current + 1) % FRAMES.length), 80);
		return () => clearInterval(timer);
	}, [active, reducedMotion]);

	if (!active) return ' ';
	return reducedMotion ? STILL : FRAMES[frame % FRAMES.length]!;
}
