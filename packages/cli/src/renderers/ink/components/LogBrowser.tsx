import { Box, Text, useInput } from 'ink';
import { useMemo, useState } from 'react';
import { stripVTControlCharacters } from 'node:util';
import type { DevService } from '../../../lib/dev-service.js';
import { isErrorDetail, type LogEntry, type LogLevel } from '../../../lib/log-buffer.js';
import { useLogVersion } from '../hooks/useLogVersion.js';
import { useColor } from '../theme.js';
import { Hints } from './Hints.js';

export interface LogBrowserProps {
	service: DevService;
	height: number;
	width: number;
	lastError?: boolean;
	onClose: () => void;
	onCopy?: (text: string) => void;
}

const group = (entry: LogEntry) => (entry.source === 'app' ? 'runtime' : entry.source === 'build' || entry.source === 'tsc' ? 'build' : 'cli');

/** Filterable history, using Nuxt's keys and selecting the last error without discarding its context. */
export function LogBrowser({ service, height, width, lastError = false, onClose, onCopy }: LogBrowserProps) {
	const paint = useColor();
	const [sources, setSources] = useState({ cli: true, build: true, runtime: true });
	const [level, setLevel] = useState<LogLevel | null>(null);
	const [query, setQuery] = useState('');
	const [searching, setSearching] = useState(false);
	const [selected, setSelected] = useState<number | null>(() =>
		lastError ? (service.logs.entries().findLast((entry) => entry.level === 'error' && !isErrorDetail(entry))?.id ?? null) : null
	);
	const version = useLogVersion(service.logs);
	const entries = useMemo(
		() =>
			service.logs
				.filter({ level })
				.filter((entry) => sources[group(entry)] && stripVTControlCharacters(entry.text).toLowerCase().includes(query.toLowerCase())),
		[service, sources, level, query, version]
	);
	const bodyHeight = Math.max(0, height - 3);
	const index = entries.findIndex((entry) => entry.id === selected);
	const rows = entries.flatMap((entry) =>
		stripVTControlCharacters(entry.text)
			.split('\n')
			.map((line, i) => ({
				entry,
				text: i === 0 ? `${new Date(entry.time).toLocaleTimeString()}  ${entry.source.padEnd(6)} ${line}` : `          ${line}`
			}))
	);
	const selectedStart = rows.findIndex((row) => row.entry.id === selected);
	const selectedEnd = rows.findLastIndex((row) => row.entry.id === selected) + 1;
	const end =
		index < 0 ? rows.length : Math.min(rows.length, selectedStart + Math.max(bodyHeight, Math.min(selectedEnd - selectedStart, bodyHeight)));
	const visible = rows.slice(Math.max(0, end - bodyHeight), end);
	const move = (delta: number) => {
		if (!entries.length) return;
		const next = index < 0 ? (delta < 0 ? entries.length - 1 : 0) : Math.max(0, Math.min(entries.length - 1, index + delta));
		setSelected(entries[next]!.id);
	};

	useInput((input, key) => {
		if (key.ctrl) return;
		if (searching) {
			if (key.escape) {
				setSearching(false);
				setQuery('');
			} else if (key.return) setSearching(false);
			else if (key.backspace || key.delete) setQuery((value) => [...value].slice(0, -1).join(''));
			else if (input && !key.upArrow && !key.downArrow) setQuery((value) => value + input);
			setSelected(null);
			return;
		}
		if (key.escape || input === 'l' || input === 'q') return onClose();
		if (input === '/') return setSearching(true);
		if (input === 'e' || input === 'w' || input === 'a') {
			const next = input === 'e' ? 'error' : input === 'w' ? 'warn' : null;
			setLevel((current) => (current === next ? null : next));
			return setSelected(null);
		}
		if (input === 'c' || input === 'b' || input === 'r') {
			const source = input === 'c' ? 'cli' : input === 'b' ? 'build' : 'runtime';
			setSources((current) => {
				const next = { ...current, [source]: !current[source] };
				return Object.values(next).some(Boolean) ? next : current;
			});
			return setSelected(null);
		}
		if (input === 'x') {
			service.clearLogs();
			return setSelected(null);
		}
		if (key.upArrow || input === 'k') return move(-1);
		if (key.downArrow || input === 'j') return move(1);
		if (key.pageUp) return move(-Math.max(1, bodyHeight));
		if (key.pageDown) return move(Math.max(1, bodyHeight));
		if (key.home || input === 'g') return setSelected(entries[0]?.id ?? null);
		if (key.end || input === 'G') return setSelected(null);
		if ((key.return || input === 'y') && index >= 0) onCopy?.(stripVTControlCharacters(entries[index]!.text));
	});

	const hints = searching
		? [
				['enter', 'apply'],
				['esc', 'cancel']
			]
		: [
				['↑/↓', 'select'],
				['g/G', 'top/bottom'],
				['e', 'errors'],
				['w', 'warnings'],
				['a', 'all'],
				['c/b/r', 'sources'],
				['/', 'search'],
				['x', 'clear'],
				['enter', 'copy'],
				['q', 'close']
			];
	return (
		<Box flexDirection="column" height={height}>
			<Text wrap="truncate-end">
				{' '}
				<Text bold>logs</Text>
				<Text dimColor>{` · ${Object.entries(sources)
					.filter(([, shown]) => shown)
					.map(([source]) => source)
					.join(
						'+'
					)} · ${level ? `${level}+ only` : 'all levels'}${query || searching ? ` · search ${query}${searching ? '▏' : ''}` : ''}`}</Text>
			</Text>
			<Text dimColor>{'─'.repeat(width)}</Text>
			<Box flexDirection="column" height={bodyHeight} overflow="hidden">
				{visible.length === 0 && <Text dimColor> no matching logs</Text>}
				{visible.map(({ entry, text }, i) => (
					<Text key={`${entry.id}-${i}`} wrap="truncate-end">
						<Text color={paint('green')}>{entry.id === selected ? '▎ ' : '  '}</Text>
						<Text
							color={paint(
								entry.level === 'error' ? 'red' : entry.level === 'warn' ? 'yellow' : entry.level === 'success' ? 'green' : 'white'
							)}
							dimColor={isErrorDetail(entry)}
						>
							{text}
						</Text>
					</Text>
				))}
			</Box>
			<Hints
				width={width}
				hints={hints.map(([key, label], i) => ({ key: key!, label: label!, priority: i === hints.length - 1 ? 100 : hints.length - i }))}
			/>
		</Box>
	);
}
