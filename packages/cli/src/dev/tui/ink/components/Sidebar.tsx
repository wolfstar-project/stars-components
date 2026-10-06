import { Box, Text } from 'ink';
import { useEffect, type ReactNode } from 'react';
import type { ResolvedStarsConfig, StarsLogLevel } from '@wolfstar/schema';
import { displayPath } from '@wolfstar/schema';
import { findInstalledVersion } from '../../../../utils/project.js';
import { readOwnPackageJson } from '../../../../utils/version.js';
import type { DevStatus } from '../../../dev-service.js';
import { isChannelVisible, VIEW_LEVELS, windowAround, wrapLabels, type LogViewFilter } from '../../log-view.js';
import { describeBadge, formatUptime, isBusy } from '../../panel-logic.js';
import { useUptime } from '../hooks/useUptime.js';
import { usePaint } from '../theme.js';
import type { LogCounters } from '../hooks/useLogCounters.js';
import { channelToken } from './LogPane.js';

export type SidebarGroup = 'channels' | 'levels';

export interface SidebarFocus {
	group: SidebarGroup;
	index: number;
}

/**
 * What a click on the sidebar lands on. Rows and columns are counted from 0 at the top-left corner of the sidebar;
 * `end` is exclusive.
 */
export type SidebarRegion =
	| { kind: 'header'; group: SidebarGroup; row: number }
	| { kind: 'item'; group: SidebarGroup; index: number; row: number; start: number; end: number }
	| { kind: 'key'; key: string; row: number };

/** A region before its row is known: the rows are numbered once the sidebar knows which of them fit. */
type SidebarHit =
	| { kind: 'header'; group: SidebarGroup }
	| { kind: 'items'; group: SidebarGroup; items: readonly { index: number; start: number; end: number }[] }
	| { kind: 'key'; key: string };

interface SidebarRow {
	node: ReactNode;
	hit?: SidebarHit;
}

/** The region of the sidebar at a cell, if a click there does something. */
export function findSidebarRegion(regions: readonly SidebarRegion[], row: number, column: number): SidebarRegion | null {
	return regions.find((region) => region.row === row && (region.kind !== 'item' || (column >= region.start && column < region.end))) ?? null;
}

export interface SidebarProps {
	status: DevStatus;
	config: ResolvedStarsConfig;
	counters: LogCounters;
	filter: LogViewFilter;
	channels: readonly string[];
	focus: SidebarFocus;
	collapsed: Readonly<Record<SidebarGroup, boolean>>;
	/** Whether the log pane follows the newest entry. */
	live: boolean;
	grouped: boolean;
	frame: number;
	elapsedMs: number;
	width: number;
	height: number;
	confirmQuit: boolean;
	/** Told where the clickable entries are after every paint, for the mouse. */
	onRegions?: (regions: readonly SidebarRegion[]) => void;
}

/** The padding of the sidebar, then the indentation of the lines of a group. */
const PADDING = 1;
const INDENT = 2;

const LEVEL_TOKENS = { error: 'error', warn: 'warning', info: 'info', debug: 'debug', trace: 'trace' } as const;
const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const KEYS: readonly (readonly [key: string, label: string])[][] = [
	[
		['←→', 'select'],
		['tab', 'group'],
		['space', 'filter'],
		['s', 'solo']
	],
	[
		['q', 'quit'],
		['r', 'restart'],
		['d', 'disconnect'],
		['c', 'clear'],
		['↑↓', 'scroll'],
		['g/G', 'top/bottom'],
		['?', 'help']
	]
];

let frameworkVersion: { root: string; version: string | null } | null = null;

/** Looked up once per project: it walks `node_modules`, and the sidebar repaints on every log entry. */
function readFrameworkVersion(root: string): string | null {
	if (frameworkVersion?.root !== root) frameworkVersion = { root, version: findInstalledVersion(root, '@wolfstar/http-framework') };
	return frameworkVersion.version;
}

/**
 * The left column of the dashboard: what the session is doing, the filters of the log stream, and the keys. Under a
 * short terminal the key help goes first, then the filters' own hints: the status and the filters are what it is for.
 */
export function Sidebar(props: SidebarProps) {
	const { status, config, counters, filter, channels, focus, collapsed, live, grouped, frame, elapsedMs, width, height, confirmQuit, onRegions } =
		props;
	const paint = usePaint();
	const uptime = useUptime(status.startedAt);
	const state = describeBadge(status);
	const busy = isBusy(state.badge);
	const failed = state.badge === 'error';
	const name = config.packageJson?.name ?? 'stars project';
	const inner = Math.max(1, width - 2);

	const row = (label: string, value: ReactNode, key = label) => (
		<Text key={key} wrap="truncate-end">
			<Text dimColor>{label.padEnd(8)}</Text>
			{value}
		</Text>
	);

	const stateColor = paint(failed ? 'error' : busy || state.badge === 'stopped' ? 'busy' : 'success');
	const tunnel =
		status.tunnel === 'up' ? (
			<Text color={paint('tunnel')}>live</Text>
		) : status.tunnel === 'starting' ? (
			<Text color={paint('busy')}>connecting</Text>
		) : status.tunnel === 'failed' ? (
			<Text color={paint('error')}>failed</Text>
		) : (
			<Text dimColor>off</Text>
		);
	const port = status.port ?? (status.url ? new URL(status.url).port || null : null);
	const framework = readFrameworkVersion(config.root);

	const head: ReactNode[] = [
		<Text key="title" wrap="truncate-end">
			<Text bold color={paint('brand')}>
				{name}
			</Text>
			<Text dimColor>{` • stars v${readOwnPackageJson().version}`}</Text>
		</Text>,
		<Text key="gap-title"> </Text>,
		<Text key="state" wrap="truncate-end">
			<Text color={stateColor}>{busy ? SPINNER[frame % SPINNER.length] : failed ? '✖' : '●'}</Text>{' '}
			<Text bold color={stateColor}>
				{confirmQuit ? 'quit?' : state.badge === 'ready' ? 'running' : state.badge}
			</Text>
			{busy && <Text dimColor>{` ${Math.round(status.progress.fraction * 100)}% · ${(elapsedMs / 1000).toFixed(1)}s`}</Text>}
		</Text>,
		<Text key="note" wrap="truncate-end">
			{confirmQuit ? (
				<Text dimColor>press y to confirm, esc to stay</Text>
			) : state.badge === 'ready' ? (
				<>
					<Text bold>{name}</Text> is ready!
				</>
			) : (
				<Text dimColor>{state.note}</Text>
			)}
		</Text>,
		row('http', framework ? `v${framework}` : <Text dimColor>not installed</Text>),
		row('up', uptime === null ? <Text dimColor>—</Text> : formatUptime(uptime)),
		row('port', port ?? <Text dimColor>—</Text>),
		row('tunnel', tunnel),
		row('logs', config.dev.logFile ? displayPath(config.root, config.dev.logFile) : <Text dimColor>off</Text>),
		...(config.dev.typecheck.enabled
			? [
					row(
						'types',
						status.typecheck === 'failed' ? (
							<Text color={paint('error')}>{`${status.typeErrors} ${status.typeErrors === 1 ? 'error' : 'errors'}`}</Text>
						) : (
							status.typecheck
						)
					)
				]
			: []),
		...(counters.errors > 0 || counters.warnings > 0
			? [
					<Text key="counters" wrap="truncate-end">
						{counters.errors > 0 && <Text bold color={paint('error')}>{`✖ ${counters.errors} `}</Text>}
						{counters.warnings > 0 && <Text color={paint('warning')}>{`⚠ ${counters.warnings}`}</Text>}
					</Text>
				]
			: [])
	];

	const groupHeader = (group: SidebarGroup, suffix = '') => (
		<Text key={`${group}-header`} wrap="truncate-end">
			<Text color={focus.group === group ? paint('brand') : undefined}>{collapsed[group] ? '▸' : '▾'}</Text>{' '}
			<Text bold={focus.group === group} dimColor={focus.group !== group}>
				{group}
			</Text>
			{group === 'channels' && grouped && <Text dimColor> · grouped</Text>}
			{suffix && <Text dimColor>{suffix}</Text>}
		</Text>
	);

	const item = (group: SidebarGroup, index: number, label: string, on: boolean, token: Parameters<typeof paint>[0]) => {
		const focused = focus.group === group && focus.index === index;
		return (
			<Text key={label} color={on ? paint(token) : undefined} dimColor={!on} strikethrough={!on} underline={focused} bold={focused}>
				{label}
			</Text>
		);
	};

	const budget = Math.max(1, height - 1);
	const labelWidth = Math.max(1, inner - 2);
	const lines = (
		group: SidebarGroup,
		labels: readonly string[],
		nodes: readonly ReactNode[],
		range: [number, number] = [0, Infinity]
	): SidebarRow[] =>
		wrapLabels(labels, labelWidth)
			.slice(...range)
			.map((line, index) => {
				// Where each label of the line starts: the labels are separated by one space.
				let column = PADDING + INDENT;
				const items = line.map((label) => {
					const start = column;
					column += labels[label]!.length + 1;
					return { index: label, start, end: column - 1 };
				});
				return {
					hit: { kind: 'items', group, items },
					node: (
						<Text key={`${group}-${index}`} wrap="truncate-end">
							{' '.repeat(INDENT)}
							{line.flatMap((label, position) => (position > 0 ? [' ', nodes[label]] : [nodes[label]]))}
						</Text>
					)
				};
			});

	const levelNodes = VIEW_LEVELS.map((level: StarsLogLevel, index) => item('levels', index, level, filter.levels.has(level), LEVEL_TOKENS[level]));
	const levelLines: SidebarRow[] = collapsed.levels ? [] : lines('levels', VIEW_LEVELS, levelNodes);
	const channelNodes = channels.map((channel, index) => item('channels', index, channel, isChannelVisible(filter, channel), channelToken(channel)));
	// The levels always stay in sight: many channels scroll inside the rows left over, around the selected one.
	const channelLayout = wrapLabels(channels, labelWidth);
	const focusedLine =
		focus.group === 'channels'
			? Math.max(
					0,
					channelLayout.findIndex((line) => line.includes(focus.index))
				)
			: 0;
	const range = windowAround(channelLayout.length, focusedLine, Math.max(1, budget - head.length - 3 - levelLines.length));
	const hiddenChannels = channelLayout.length - (range[1] - range[0]);

	const filters: SidebarRow[] = [
		{ node: <Text key="gap-filters"> </Text> },
		{
			hit: { kind: 'header', group: 'channels' },
			node: groupHeader('channels', !collapsed.channels && hiddenChannels > 0 ? ` · ${range[0] + 1}-${range[1]}/${channelLayout.length}` : '')
		},
		...(collapsed.channels ? [] : lines('channels', channels, channelNodes, range)),
		{ hit: { kind: 'header', group: 'levels' }, node: groupHeader('levels') },
		...levelLines
	];

	const keys: SidebarRow[][] = KEYS.map((section, sectionIndex) => [
		{ node: <Text key={`gap-keys-${sectionIndex}`}> </Text> },
		...section.map(([key, label]) => ({
			hit: { kind: 'key', key } satisfies SidebarHit,
			node: (
				<Text key={key} wrap="truncate-end">
					<Text bold color={paint('url')}>
						{key}
					</Text>{' '}
					<Text dimColor>{label}</Text>
				</Text>
			)
		}))
	]);

	// The footer keeps the last line; everything else is dropped from the bottom up when the terminal is short.
	const statusRows = head.map((node): SidebarRow => ({ node }));
	let body = [...statusRows, ...filters, ...keys.flat()];
	if (body.length > budget) body = [...statusRows, ...filters, ...keys[1]!];
	if (body.length > budget) body = [...statusRows, ...filters];
	body = body.slice(0, budget);

	const regions = body.flatMap(({ hit }, row): SidebarRegion[] => {
		if (hit === undefined) return [];
		if (hit.kind === 'items') return hit.items.map((item) => ({ kind: 'item', group: hit.group, row, ...item }));
		return [{ ...hit, row }];
	});
	// Compared by value: the regions only move when the layout does, and the dashboard repaints on every log entry.
	const regionsKey = JSON.stringify(regions);
	useEffect(() => onRegions?.(regions), [regionsKey, onRegions]);

	return (
		<Box flexDirection="column" width={width} height={height} paddingX={PADDING}>
			{body.map(({ node }, index) => (
				<Box key={index} height={1} width={inner}>
					{node}
				</Box>
			))}
			<Box flexGrow={1} />
			<Box height={1} width={inner} justifyContent="flex-end">
				<Text wrap="truncate-end">
					<Text color={paint(live ? 'error' : 'busy')}>●</Text> <Text dimColor>{live ? 'live' : 'paused'}</Text>
				</Text>
			</Box>
		</Box>
	);
}
