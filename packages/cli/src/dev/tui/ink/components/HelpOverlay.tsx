import { Box, Text, useInput } from 'ink';
import { usePaint } from '../theme.js';

const KEYS: [string, string][] = [
	['r', 'restart the bot now'],
	['d', 'disconnect: stop the bot until the next r'],
	['o', 'open the local URL in a browser'],
	['t', 'toggle the public tunnel'],
	['i', 'show versions, URLs and session info'],
	['T', 'pick a colour theme (dark, light, colour-blind friendly, ANSI)'],
	['v', 'switch between the dashboard and the compact panel'],
	['l', 'open the logs (select, copy, filter by source or level)'],
	['e', 'jump to the last error, keeping its context'],
	['y / n', 'answer a prompt (refresh the commands)'],
	['c / Ctrl+L', 'clear the log history'],
	['q / Ctrl+C', 'stop the bot and quit'],
	['?', 'toggle this help'],
	['', ''],
	['dashboard', ''],
	['← / →', 'select a channel or a level'],
	['tab', 'switch between channels and levels'],
	['space', 'show or hide the selected one'],
	['s', 'solo: only the selected one, again for all'],
	['a', 'show every channel and level'],
	['enter', 'fold or unfold the selected group'],
	['b', 'group the stream by channel'],
	['↑ / ↓', 'scroll (PgUp/PgDn by page)'],
	['g / G', 'top / back to live'],
	['/', 'search (Esc clears)']
];

export interface HelpOverlayProps {
	height: number;
	width: number;
	onClose: () => void;
}

/** The static keys reference, opened with `?` from the pinned panel. */
export function HelpOverlay({ height, width, onClose }: HelpOverlayProps) {
	const paint = usePaint();
	useInput((input, key) => {
		if (!key.ctrl && (key.escape || ['q', 'h', '?'].includes(input))) onClose();
	});

	return (
		<Box flexDirection="column" height={height}>
			<Text bold> keyboard shortcuts</Text>
			<Text dimColor>{'─'.repeat(width)}</Text>
			{KEYS.slice(0, Math.max(0, height - 3)).map(([key, description], index) => (
				<Text key={index} wrap="truncate-end">
					{'  '}
					<Text bold color={paint('text')}>
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
