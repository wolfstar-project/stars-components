import { Box, Text } from 'ink';
import type { ReactNode } from 'react';
import type { ResolvedStarsConfig, StarsLogLevel } from '@wolfstar/schema';
import { displayPath } from '@wolfstar/schema';
import { findInstalledVersion } from '../../../../utils/project.js';
import { readOwnPackageJson } from '../../../../utils/version.js';
import type { DevStatus } from '../../../dev-service.js';
import { isChannelVisible, VIEW_LEVELS, type LogViewFilter } from '../../log-view.js';
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
}

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
	const { status, config, counters, filter, channels, focus, collapsed, live, grouped, frame, elapsedMs, width, height, confirmQuit } = props;
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

	const groupHeader = (group: SidebarGroup) => (
		<Text key={`${group}-header`} wrap="truncate-end">
			<Text color={focus.group === group ? paint('brand') : undefined}>{collapsed[group] ? '▸' : '▾'}</Text>{' '}
			<Text bold={focus.group === group} dimColor={focus.group !== group}>
				{group}
			</Text>
			{group === 'channels' && grouped && <Text dimColor> · grouped</Text>}
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

	const filters: ReactNode[] = [
		<Text key="gap-filters"> </Text>,
		groupHeader('channels'),
		...(collapsed.channels
			? []
			: wrapItems(
					channels.map((channel, index) => ({
						label: channel,
						node: item('channels', index, channel, isChannelVisible(filter, channel), channelToken(channel))
					})),
					inner - 2,
					'channels'
				)),
		groupHeader('levels'),
		...(collapsed.levels
			? []
			: wrapItems(
					VIEW_LEVELS.map((level: StarsLogLevel, index) => ({
						label: level,
						node: item('levels', index, level, filter.levels.has(level), LEVEL_TOKENS[level])
					})),
					inner - 2,
					'levels'
				))
	];

	const keys = KEYS.map((section, sectionIndex) => [
		<Text key={`gap-keys-${sectionIndex}`}> </Text>,
		...section.map(([key, label]) => (
			<Text key={key} wrap="truncate-end">
				<Text bold color={paint('url')}>
					{key}
				</Text>{' '}
				<Text dimColor>{label}</Text>
			</Text>
		))
	]);

	// The footer keeps the last line; everything else is dropped from the bottom up when the terminal is short.
	const budget = Math.max(1, height - 1);
	let body = [...head, ...filters, ...keys.flat()];
	if (body.length > budget) body = [...head, ...filters, ...keys[1]!];
	if (body.length > budget) body = [...head, ...filters];
	body = body.slice(0, budget);

	return (
		<Box flexDirection="column" width={width} height={height} paddingX={1}>
			{body.map((node, index) => (
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

/** Lays filter items out as words, wrapping to the next line when the sidebar runs out of width. */
function wrapItems(items: readonly { label: string; node: ReactNode }[], width: number, key: string): ReactNode[] {
	const lines: ReactNode[][] = [[]];
	let used = 0;
	for (const { label, node } of items) {
		if (used > 0 && used + 1 + label.length > width) {
			lines.push([]);
			used = 0;
		}

		if (used > 0) lines.at(-1)!.push(' ');
		lines.at(-1)!.push(node);
		used += (used > 0 ? 1 : 0) + label.length;
	}

	return lines
		.filter((line) => line.length > 0)
		.map((line, index) => (
			<Text key={`${key}-${index}`} wrap="truncate-end">
				{'  '}
				{line}
			</Text>
		));
}
