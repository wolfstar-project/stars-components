import { Box, Text } from 'ink';
import { useColor } from '../theme.js';

const KEYS: [string, string][] = [
	['r', 'restart the bot now'],
	['c', 'clear the logs'],
	['f', 'cycle the source filter: all › app › build › tsc › tunnel › stars'],
	['e', 'cycle the level filter: all › warnings › errors'],
	['↑ ↓ / j k', 'scroll one line (PgUp/PgDn a page, End to follow again)'],
	['h / ?', 'toggle this help'],
	['q / Esc / Ctrl+C', 'stop the bot and quit']
];

export function HelpCard({ height }: { height: number }) {
	const paint = useColor();

	return (
		<Box flexDirection="column" height={height} borderStyle="round" borderColor={paint('cyan')} paddingX={1}>
			<Text bold>Keys</Text>
			{KEYS.slice(0, Math.max(0, height - 3)).map(([key, description]) => (
				<Box key={key} gap={1}>
					<Text bold color={paint('cyan')}>
						{key.padEnd(17)}
					</Text>
					<Text wrap="truncate-end">{description}</Text>
				</Box>
			))}
		</Box>
	);
}
