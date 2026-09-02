import { Box, Text } from 'ink';
import type { LogEntry, LogLevel, LogSource } from '../../../lib/log-buffer.js';
import { useColor } from '../theme.js';

export interface LogViewProps {
	entries: readonly LogEntry[];
	/** How many lines the view may use. */
	height: number;
	/** Lines scrolled back from the newest entry; `0` follows the tail. */
	scroll: number;
	showTime: boolean;
}

const SOURCE_COLORS: Record<LogSource, string | undefined> = {
	stars: 'cyan',
	build: 'magenta',
	tsc: 'blue',
	tunnel: 'yellow',
	app: undefined
};

const LEVEL_COLORS: Record<LogLevel, string | undefined> = {
	error: 'red',
	warn: 'yellow',
	success: 'green',
	debug: 'gray',
	info: undefined
};

export function LogView({ entries, height, scroll, showTime }: LogViewProps) {
	const end = Math.max(0, entries.length - scroll);
	const visible = entries.slice(Math.max(0, end - height), end);

	if (visible.length === 0) {
		return (
			<Box height={height}>
				<Text dimColor>no logs yet</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" height={height}>
			{visible.map((entry) => (
				<LogLine key={entry.id} entry={entry} showTime={showTime} />
			))}
		</Box>
	);
}

function LogLine({ entry, showTime }: { entry: LogEntry; showTime: boolean }) {
	const paint = useColor();
	const source = SOURCE_COLORS[entry.source];
	const level = LEVEL_COLORS[entry.level];

	// Fixed columns for the time and the source, so a long message truncates instead of wrapping the whole row.
	return (
		<Box flexWrap="nowrap">
			{showTime && (
				<Box width={9} flexShrink={0}>
					<Text dimColor>{new Date(entry.time).toLocaleTimeString(undefined, { hour12: false })}</Text>
				</Box>
			)}
			<Box width={7} flexShrink={0}>
				<Text color={source ? paint(source) : undefined} dimColor={entry.source === 'app'}>
					{entry.source}
				</Text>
			</Box>
			<Box flexGrow={1} minWidth={0}>
				<Text color={level ? paint(level) : undefined} dimColor={entry.level === 'debug'} wrap="truncate-end">
					{entry.text}
				</Text>
			</Box>
		</Box>
	);
}
