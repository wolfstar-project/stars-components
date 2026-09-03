import { Text } from 'ink';
import type { LogEntry, LogSource } from '../../../lib/log-buffer.js';
import { useColor } from '../theme.js';

const SOURCE_COLORS: Partial<Record<LogSource, string>> = { stars: 'cyan', build: 'magenta', tsc: 'cyan', tunnel: 'yellow' };

/** One committed log line, formatted the same way plain mode prints it, so scrollback reads identically either way. */
export function LogLine({ entry }: { entry: LogEntry }) {
	const paint = useColor();
	const source = SOURCE_COLORS[entry.source];
	const level = entry.level === 'error' ? 'red' : entry.level === 'warn' ? 'yellow' : entry.level === 'success' ? 'green' : undefined;

	if (!source) return <Text color={level ? paint(level) : undefined}>{entry.text}</Text>;

	return (
		<Text>
			<Text color={paint(source)}>{entry.source}</Text> <Text color={level ? paint(level) : undefined}>{entry.text}</Text>
		</Text>
	);
}
