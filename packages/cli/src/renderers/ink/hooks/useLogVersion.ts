import { useEffect, useState } from 'react';
import type { LogBuffer } from '../../../lib/log-buffer.js';

/** Bumps whenever the buffer changes, so a consumer can re-derive a filtered view without re-filtering on every render. */
export function useLogVersion(logs: LogBuffer): number {
	const [version, setVersion] = useState(0);

	useEffect(() => {
		const bump = () => setVersion((current) => current + 1);
		logs.on('entry', bump);
		logs.on('clear', bump);
		return () => {
			logs.off('entry', bump);
			logs.off('clear', bump);
		};
	}, [logs]);

	return version;
}
