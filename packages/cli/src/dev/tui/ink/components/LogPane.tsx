import { Box, Text } from 'ink';
import type { ThemeToken } from '../../../../utils/theme.js';
import { formatClock, highlight, levelBadge, type LogRow, type TokenKind } from '../../log-view.js';
import { useColorEnabled, usePaint } from '../theme.js';

export interface LogPaneProps {
	rows: readonly LogRow[];
	/** One past the last row shown; rows above it fill the pane. */
	end: number;
	width: number;
	height: number;
	/** The width the channel column is padded to. */
	channelWidth: number;
	/** The entry the view jumped to (`e`), marked in the gutter. */
	marked: number | null;
}

const LEVEL_TOKENS = { trace: 'trace', debug: 'debug', info: 'info', success: 'success', warn: 'warning', error: 'error' } as const;
const SEGMENT_TOKENS: Record<TokenKind, ThemeToken | null> = {
	url: 'url',
	path: null,
	number: 'accent',
	name: 'trace',
	dim: null,
	ok: 'success',
	warn: 'warning',
	error: 'error'
};
/** The colours a channel's dot is picked from, by name, so a channel keeps its colour for the whole session. */
const CHANNEL_TOKENS: readonly ThemeToken[] = ['info', 'debug', 'trace', 'accent', 'url', 'tunnel'];

export function channelToken(channel: string): ThemeToken {
	let hash = 0;
	for (const character of channel) hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
	return CHANNEL_TOKENS[hash % CHANNEL_TOKENS.length]!;
}

/** The log stream: one line per row, the newest at the bottom unless the view is scrolled. */
export function LogPane({ rows, end, width, height, channelWidth, marked }: LogPaneProps) {
	const paint = usePaint();
	const color = useColorEnabled();
	const visible = rows.slice(Math.max(0, end - height), end);
	// ` B  hh:mm:ss  channel ● `, which detail lines are indented by.
	const gutter = ' '.repeat(3 + 2 + 8 + 2 + channelWidth + 1);

	return (
		<Box flexDirection="column" width={width} height={height} overflow="hidden" justifyContent="flex-end">
			{visible.length === 0 && <Text dimColor> no matching logs</Text>}
			{visible.map((row, index) => {
				const key = `${end - visible.length + index}`;
				if (row.kind === 'rule') {
					return (
						<Text key={key} dimColor wrap="truncate-end">
							{'─'.repeat(width)}
						</Text>
					);
				}

				if (row.kind === 'header') {
					return (
						<Text key={key} wrap="truncate-end">
							<Text bold color={paint(channelToken(row.channel))}>{` ${row.channel}`}</Text>
							<Text dimColor>{` · ${row.count}`}</Text>
						</Text>
					);
				}

				const { entry } = row;
				const failed = entry.level === 'error';
				if (row.kind === 'detail') {
					return (
						<Text key={key} wrap="truncate-end">
							{gutter}
							<Text dimColor>{'│ '}</Text>
							<Message text={row.text} channel={entry.channel} color={failed ? paint('error') : undefined} dim={!failed} />
						</Text>
					);
				}

				const level = LEVEL_TOKENS[entry.level];
				return (
					<Text key={key} wrap="truncate-end">
						{color ? (
							<Text
								bold
								backgroundColor={paint(level)}
								color={paint(failed ? 'onError' : 'onBright')}
							>{` ${levelBadge(entry.level)} `}</Text>
						) : (
							<Text bold>{`[${levelBadge(entry.level)}]`}</Text>
						)}
						<Text color={paint('brand')}>{entry.id === marked ? '▎' : ' '}</Text>{' '}
						<Text dimColor={!failed} color={failed ? paint('error') : undefined}>
							{formatClock(entry.time)}
						</Text>
						{'  '}
						<Text bold={failed} color={failed ? paint('error') : undefined}>
							{entry.channel.slice(0, channelWidth).padStart(channelWidth)}
						</Text>{' '}
						<Text color={paint(channelToken(entry.channel))}>●</Text>{' '}
						<Message text={row.text} channel={entry.channel} color={entry.level === 'warn' ? paint('warning') : undefined} />
					</Text>
				);
			})}
		</Box>
	);
}

function Message({ text, channel, color, dim = false }: { text: string; channel: string; color?: string | undefined; dim?: boolean }) {
	const paint = usePaint();
	return (
		<Text color={color} dimColor={dim}>
			{highlight(text, channel).map((segment, index) => {
				if (segment.token === undefined) return segment.text;
				const token = SEGMENT_TOKENS[segment.token];
				return (
					<Text key={index} color={token === null ? color : paint(token)} dimColor={token === null || dim} bold={segment.token === 'name'}>
						{segment.text}
					</Text>
				);
			})}
		</Text>
	);
}
