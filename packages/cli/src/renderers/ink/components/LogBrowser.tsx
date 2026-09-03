import { Box, Text, useInput } from 'ink';
import { useMemo, useState } from 'react';
import type { DevService } from '../../../lib/dev-service.js';
import type { LogEntry, LogLevel, LogSource } from '../../../lib/log-buffer.js';
import { useLogVersion } from '../hooks/useLogVersion.js';
import { useColor } from '../theme.js';
import { LogLine } from './LogLine.js';

const SOURCE_FILTERS: (LogSource | null)[] = [null, 'app', 'build', 'tsc', 'tunnel', 'stars'];
const LEVEL_FILTERS: (LogLevel | null)[] = [null, 'warn', 'error'];

export interface LogBrowserProps {
	service: DevService;
	height: number;
	onClose: () => void;
}

/**
 * The full, filterable log history, opened with `l` from the panel. The pinned panel only ever shows a live count
 * of warnings/errors (Nuxt CLI v4's own dev panel does the same); browsing what actually happened lives here.
 */
export function LogBrowser({ service, height, onClose }: LogBrowserProps) {
	const paint = useColor();
	const [sourceIndex, setSourceIndex] = useState(0);
	const [levelIndex, setLevelIndex] = useState(0);
	const [scroll, setScroll] = useState(0);

	const source = SOURCE_FILTERS[sourceIndex] ?? null;
	const level = LEVEL_FILTERS[levelIndex] ?? null;
	const version = useLogVersion(service.logs);
	const entries = useMemo(() => service.logs.filter({ source, level }), [service, source, level, version]);

	const bodyHeight = Math.max(1, height - 3);
	const maxScroll = Math.max(0, entries.length - bodyHeight);
	const clamped = Math.min(scroll, maxScroll);
	const end = entries.length - clamped;
	const visible = entries.slice(Math.max(0, end - bodyHeight), end);

	useInput((input, key) => {
		if (key.escape || input === 'l' || input === 'q') return onClose();
		if (key.ctrl && input === 'c') return onClose();

		switch (input) {
			case 'f':
				setSourceIndex((current) => (current + 1) % SOURCE_FILTERS.length);
				return setScroll(0);
			case 'e':
				setLevelIndex((current) => (current + 1) % LEVEL_FILTERS.length);
				return setScroll(0);
			case 'c':
				service.logs.clear();
				return forceRender((value) => value + 1);
			default:
				break;
		}

		if (key.downArrow || input === 'j') return setScroll((current) => Math.max(0, current - 1));
		if (key.upArrow || input === 'k') return setScroll((current) => Math.min(maxScroll, current + 1));
		if (key.pageDown) return setScroll((current) => Math.max(0, current - bodyHeight));
		if (key.pageUp) return setScroll((current) => Math.min(maxScroll, current + bodyHeight));
		if (key.end) return setScroll(0);
	});

	return (
		<Box flexDirection="column" height={height}>
			<Box gap={1}>
				<Text bold>stars dev logs</Text>
				<Text dimColor>{`filter ${source ?? 'all'}${level ? `, level ≥ ${level}` : ''}`}</Text>
			</Box>
			<Text dimColor>{'─'.repeat(60)}</Text>
			<Box flexDirection="column" height={bodyHeight}>
				{visible.length === 0 ? (
					<Text dimColor>no logs yet</Text>
				) : (
					visible.map((entry: LogEntry) => <LogLine key={entry.id} entry={entry} />)
				)}
			</Box>
			<Box gap={2}>
				<Text>
					<Text bold color={paint('white')}>
						f
					</Text>{' '}
					<Text dimColor>source</Text>
				</Text>
				<Text>
					<Text bold color={paint('white')}>
						e
					</Text>{' '}
					<Text dimColor>errors</Text>
				</Text>
				<Text>
					<Text bold color={paint('white')}>
						c
					</Text>{' '}
					<Text dimColor>clear</Text>
				</Text>
				<Text>
					<Text bold color={paint('white')}>
						↑↓
					</Text>{' '}
					<Text dimColor>scroll</Text>
				</Text>
				<Text>
					<Text bold color={paint('white')}>
						q / esc / l
					</Text>{' '}
					<Text dimColor>close</Text>
				</Text>
			</Box>
		</Box>
	);
}
