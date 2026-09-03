import { Box, Text, useInput } from 'ink';
import { useColor } from '../theme.js';

const KEYS: [string, string][] = [
	['r', 'restart the bot now'],
	['l', 'open the logs (scroll, filter by source or level)'],
	['q / Ctrl+C', 'stop the bot and quit'],
	['?', 'toggle this help']
];

export interface HelpOverlayProps {
	height: number;
	onClose: () => void;
}

/** The static keys reference, opened with `?` from the pinned panel. */
export function HelpOverlay({ height, onClose }: HelpOverlayProps) {
	const paint = useColor();
	useInput(() => onClose());

	return (
		<Box flexDirection="column" height={height}>
			<Text bold>Keys</Text>
			<Text dimColor>{'─'.repeat(60)}</Text>
			{KEYS.map(([key, description]) => (
				<Box key={key} gap={1}>
					<Text bold color={paint('white')}>
						{key.padEnd(14)}
					</Text>
					<Text dimColor>{description}</Text>
				</Box>
			))}
			<Box flexGrow={1} />
			<Text dimColor>press any key to close</Text>
		</Box>
	);
}
