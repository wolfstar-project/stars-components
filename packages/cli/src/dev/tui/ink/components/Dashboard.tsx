import { Box, Text, useInput } from 'ink';
import { useEffect, useMemo, useState } from 'react';
import type { DevService, DevStatus } from '../../../dev-service.js';
import {
	buildRows,
	matchesView,
	newestErrorRow,
	pinAt,
	pinnedEnd,
	soloChannel,
	soloLevel,
	toggleChannel,
	toggleLevel,
	VIEW_LEVELS,
	type LogPin,
	type LogViewFilter
} from '../../log-view.js';
import type { LogCounters } from '../hooks/useLogCounters.js';
import { useLogVersion } from '../hooks/useLogVersion.js';
import { usePaint } from '../theme.js';
import { LogPane } from './LogPane.js';
import { PromptCard, promptHeight } from './PromptCard.js';
import { Sidebar, type SidebarFocus, type SidebarGroup } from './Sidebar.js';

export interface DashboardProps {
	service: DevService;
	status: DevStatus;
	counters: LogCounters;
	frame: number;
	elapsedMs: number;
	width: number;
	height: number;
	confirmQuit: boolean;
	/** The filter the session starts with (`dev.logs`, `--channel`, `--level`). */
	initialFilter: LogViewFilter;
	/** Whether the dashboard is the view on screen: an overlay above it takes the keys. */
	active: boolean;
	/** Tells the app that typed characters are text (the search box), not shortcuts. */
	onCapture: (capturing: boolean) => void;
}

/** The sidebar takes about a quarter of the terminal, within what its longest lines need and can spare. */
export function sidebarWidth(columns: number): number {
	return Math.max(24, Math.min(34, Math.floor(columns * 0.26)));
}

/**
 * The full-screen dev view: the session's state and the log filters on the left, the log stream on the right, and a
 * card under the stream when `stars dev` has something to ask. Everything it shows comes from the service; the keys
 * here only change what is looked at.
 */
export function Dashboard(props: DashboardProps) {
	const { service, status, counters, frame, elapsedMs, width, height, confirmQuit, initialFilter, active, onCapture } = props;
	const paint = usePaint();
	const [filter, setFilter] = useState(initialFilter);
	const [focus, setFocus] = useState<SidebarFocus>({ group: 'channels', index: 0 });
	const [collapsed, setCollapsed] = useState<Record<SidebarGroup, boolean>>({ channels: false, levels: false });
	const [grouped, setGrouped] = useState(false);
	const [searching, setSearching] = useState(false);
	// Where the view stops while scrolled back; `null` follows the newest entry.
	const [pinned, setPinned] = useState<LogPin | null>(null);
	const [marked, setMarked] = useState<number | null>(null);
	const version = useLogVersion(service.logs);

	const channels = useMemo(
		() => [...new Set([...(initialFilter.allow ?? []), ...service.logs.channels()])].sort(),
		[service, initialFilter, version]
	);
	const rows = useMemo(
		() =>
			buildRows(
				service.logs.entries().filter((entry) => matchesView(entry, filter)),
				{ group: grouped }
			),
		[service, filter, grouped, version]
	);

	useEffect(() => {
		onCapture(searching);
		// Unmounted with the search box open (the terminal shrank to the panel): the keys go back to the app.
		return () => onCapture(false);
	}, [searching, onCapture]);

	const side = sidebarWidth(width);
	// The pane's left border takes one column.
	const mainWidth = Math.max(1, width - side - 1);
	const searchRows = searching || filter.query ? 1 : 0;
	const cardRows = status.prompt ? promptHeight(status.prompt, Math.max(4, height - searchRows - 3)) : 0;
	const paneHeight = Math.max(1, height - searchRows - cardRows);
	const end = pinnedEnd(rows, pinned, paneHeight);
	const channelWidth = Math.min(12, Math.max(3, ...channels.map((channel) => channel.length)));
	const items = focus.group === 'channels' ? channels : VIEW_LEVELS;

	const change = (next: LogViewFilter) => {
		setFilter(next);
		setPinned(null);
	};
	const scroll = (delta: number) => {
		setPinned(pinAt(rows, Math.max(Math.min(paneHeight, rows.length), end + delta)));
	};

	useInput(
		(input, key) => {
			if (key.ctrl || confirmQuit) return;
			if (searching) {
				if (key.escape) {
					setSearching(false);
					change({ ...filter, query: '' });
				} else if (key.return) setSearching(false);
				else if (key.backspace || key.delete) change({ ...filter, query: [...filter.query].slice(0, -1).join('') });
				else if (input && !key.upArrow && !key.downArrow && !key.leftArrow && !key.rightArrow && !key.tab) {
					change({ ...filter, query: filter.query + input });
				}
				return;
			}

			if (key.escape) {
				if (filter.query) change({ ...filter, query: '' });
				else setPinned(null);
				return setMarked(null);
			}
			if (input === '/') return setSearching(true);
			if (key.tab) return setFocus((current) => ({ group: current.group === 'channels' ? 'levels' : 'channels', index: 0 }));
			if (key.leftArrow || key.rightArrow) {
				if (items.length === 0) return;
				const delta = key.leftArrow ? -1 : 1;
				return setFocus((current) => ({ ...current, index: (current.index + delta + items.length) % items.length }));
			}
			if (key.return) return setCollapsed((current) => ({ ...current, [focus.group]: !current[focus.group] }));
			if (input === ' ' || input === 's') {
				const target = items[Math.min(focus.index, items.length - 1)];
				if (target === undefined) return;
				if (focus.group === 'channels') return change(input === ' ' ? toggleChannel(filter, target) : soloChannel(filter, target));
				const level = target as (typeof VIEW_LEVELS)[number];
				return change(input === ' ' ? toggleLevel(filter, level) : soloLevel(filter, level));
			}
			if (input === 'a') return change({ ...filter, allow: null, hidden: new Set(), levels: new Set(VIEW_LEVELS), query: '' });
			if (input === 'b') {
				setGrouped((current) => !current);
				return setPinned(null);
			}
			if (key.upArrow || input === 'k') return scroll(-1);
			if (key.downArrow || input === 'j') return scroll(1);
			if (key.pageUp) return scroll(-Math.max(1, paneHeight - 1));
			if (key.pageDown) return scroll(Math.max(1, paneHeight - 1));
			if (key.home || input === 'g') return setPinned(pinAt(rows, Math.min(paneHeight, rows.length)));
			if (key.end || input === 'G') return setPinned(null);
			if (input === 'e') {
				// The most recent error of what is shown: grouped by channel, that is not the last row.
				const index = newestErrorRow(rows);
				if (index < 0) return;
				const row = rows[index]!;
				setMarked(row.kind === 'entry' ? row.entry.id : null);
				setPinned(pinAt(rows, Math.max(paneHeight, index + Math.ceil(paneHeight / 2))));
			}
		},
		{ isActive: active }
	);

	return (
		<Box width={width} height={height}>
			<Sidebar
				status={status}
				config={service.config}
				counters={counters}
				filter={filter}
				channels={channels}
				focus={focus}
				collapsed={collapsed}
				live={pinned === null}
				grouped={grouped}
				frame={frame}
				elapsedMs={elapsedMs}
				width={side}
				height={height}
				confirmQuit={confirmQuit}
			/>
			<Box
				flexDirection="column"
				width={mainWidth + 1}
				height={height}
				borderStyle="single"
				borderTop={false}
				borderRight={false}
				borderBottom={false}
				borderDimColor
			>
				<LogPane rows={rows} end={end} width={mainWidth} height={paneHeight} channelWidth={channelWidth} marked={marked} />
				{status.prompt && <PromptCard prompt={status.prompt} width={mainWidth} height={cardRows} />}
				{searchRows > 0 && (
					<Text wrap="truncate-end">
						<Text bold color={paint('url')}>
							{' / '}
						</Text>
						{filter.query}
						{searching ? '▏' : <Text dimColor> · esc clears</Text>}
					</Text>
				)}
			</Box>
		</Box>
	);
}
