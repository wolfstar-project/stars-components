import { Box, Text, useInput, type Key } from 'ink';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import type { MouseEvent, MouseInput } from '../../mouse.js';
import type { LogCounters } from '../hooks/useLogCounters.js';
import { useLogVersion } from '../hooks/useLogVersion.js';
import { usePaint } from '../theme.js';
import { LogPane } from './LogPane.js';
import { PromptCard, promptHeight } from './PromptCard.js';
import { findSidebarRegion, Sidebar, type SidebarFocus, type SidebarGroup, type SidebarRegion } from './Sidebar.js';

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
	/** The mouse of the terminal, when `dev.mouse` is on. */
	mouse?: Pick<MouseInput, 'subscribe'>;
	/** Runs a key of the app (`q`, `r`, `?`…), for a click on its hint in the sidebar. */
	onKey: (input: string) => void;
}

/** How many rows a notch of the wheel scrolls. */
const WHEEL_ROWS = 3;
/** Two clicks on the same entry within this many milliseconds are a double click. */
const DOUBLE_CLICK_MS = 400;
const NO_KEY = {} as Key;
/** The keys of the sidebar a click can press, by how the sidebar writes them: the others stand for several keys. */
const HINT_KEYS: Readonly<Record<string, readonly [input: string, key: Partial<Key>]>> = {
	tab: ['', { tab: true }],
	space: [' ', {}],
	s: ['s', {}]
};

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
	const { service, status, counters, frame, elapsedMs, width, height, confirmQuit, initialFilter, active, onCapture, mouse, onKey } = props;
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
	const regions = useRef<readonly SidebarRegion[]>([]);
	const lastClick = useRef<{ group: SidebarGroup; index: number; at: number; filter: LogViewFilter } | null>(null);
	const onRegions = useCallback((next: readonly SidebarRegion[]) => {
		regions.current = next;
	}, []);

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

	const handleKey = (input: string, key: Key) => {
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
	};
	useInput(handleKey, { isActive: active });

	const select = (from: LogViewFilter, group: SidebarGroup, index: number, solo: boolean) => {
		const target = (group === 'channels' ? channels : VIEW_LEVELS)[index];
		if (target === undefined) return;
		setFocus({ group, index });
		if (group === 'channels') return change(solo ? soloChannel(from, target) : toggleChannel(from, target));
		const level = target as (typeof VIEW_LEVELS)[number];
		return change(solo ? soloLevel(from, level) : toggleLevel(from, level));
	};

	const handleMouse = (event: MouseEvent) => {
		if (confirmQuit) return;
		if (event.kind === 'wheel') {
			// Over the sidebar the wheel does nothing: its groups scroll with the selection.
			if (event.column >= side) scroll(event.wheel * WHEEL_ROWS);
			return;
		}
		if (event.kind !== 'press' || event.button !== 'left' || event.column >= side) return;

		const region = findSidebarRegion(regions.current, event.row, event.column);
		if (region === null) return;
		if (region.kind === 'header') {
			setFocus((current) => (current.group === region.group ? current : { group: region.group, index: 0 }));
			return setCollapsed((current) => ({ ...current, [region.group]: !current[region.group] }));
		}
		if (region.kind === 'key') {
			// While searching the keys are text: a click must not type one into the query, nor quit behind the search box.
			if (searching) return;
			const own = HINT_KEYS[region.key];
			return own ? handleKey(own[0], { ...NO_KEY, ...own[1] }) : onKey(region.key);
		}

		// A click toggles, like space. A second click on the same entry solos it like `s`, from the filter as it was
		// before the first one, so that a double click on an entry that is already alone shows everything again.
		const now = Date.now();
		const previous = lastClick.current;
		const double =
			previous !== null && previous.group === region.group && previous.index === region.index && now - previous.at <= DOUBLE_CLICK_MS;
		lastClick.current = double ? null : { group: region.group, index: region.index, at: now, filter };
		if (double) return select(previous.filter, region.group, region.index, true);
		// alt or ctrl + click solos at once.
		return select(filter, region.group, region.index, event.alt || event.ctrl);
	};
	// The subscription outlives a paint, the handler does not: it reads the state of the paint it was made in.
	const mouseHandler = useRef(handleMouse);
	mouseHandler.current = handleMouse;
	useEffect(() => {
		if (!mouse || !active) return undefined;
		return mouse.subscribe((event) => mouseHandler.current(event));
	}, [mouse, active]);

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
				onRegions={onRegions}
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
