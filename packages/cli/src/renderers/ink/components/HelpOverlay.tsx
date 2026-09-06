import { Box, Text, useInput } from 'ink';
import { useColor } from '../theme.js';

const KEYS: [string, string][] = [
	['r', 'restart the bot now'],
	['o', 'open the local URL in a browser'],
	['i', 'show versions, URLs and session info'],
	['l', 'open the logs (scroll, filter by source or level)'],
	['e', 'jump to the last error, keeping its context'],
	['c / Ctrl+L', 'clear the log history'],
	['q / Ctrl+C', 'stop the bot and quit'],
	['?', 'toggle this help']
];

export interface HelpOverlayProps {
	height: number;
	width: number;
	onClose: () => void;
}

/** The static keys reference, opened with `?` from the pinned panel. */
export function HelpOverlay({ height, width, onClose }: HelpOverlayProps) {
	const paint = useColor();
	useInput((input, key) => {
		if (!key.ctrl && (key.escape || ['q', 'h', '?'].includes(input))) onClose();
	});

	return (
		<Box flexDirection="column" height={height}>
			<Text bold> keyboard shortcuts</Text>
			<Text dimColor>{'─'.repeat(width)}</Text>
			{KEYS.slice(0, Math.max(0, height - 3)).map(([key, description]) => (
				<Text key={key} wrap="truncate-end">
					{'  '}
					<Text bold color={paint('white')}>
						{key.padEnd(14)}
					</Text>
					<Text dimColor>{description}</Text>
				</Text>
			))}
			<Box flexGrow={1} />
			<Text dimColor> q close</Text>
		</Box>
	);
}
