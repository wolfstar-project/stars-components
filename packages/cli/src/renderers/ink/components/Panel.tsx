import { Box, Text } from 'ink';
import type { ReactNode } from 'react';
import type { ResolvedStarsConfig } from '@wolfstar/http-framework/config';
import type { DevStatus } from '../../../lib/dev-service.js';
import { readOwnPackageJson } from '../../../lib/version.js';
import type { LogCounters } from '../hooks/useLogCounters.js';
import { describeBadge } from '../../panel-logic.js';
import { useColor } from '../theme.js';
import { Hints, PANEL_HINTS } from './Hints.js';

export interface PanelProps {
	status: DevStatus;
	config: ResolvedStarsConfig;
	counters: LogCounters;
	frame: number;
	elapsedMs: number;
	width: number;
	height: number;
	confirmQuit: boolean;
}

/** Nuxt's wordmark / URLs / progress / status / hints layout, with Stars branding. */
export function Panel({ status, config, counters, frame, elapsedMs, width, height, confirmQuit }: PanelProps) {
	const paint = useColor();
	const state = describeBadge(status);
	const busy = state.badge !== 'ready' && state.badge !== 'error';
	const badge = !busy && counters.errors > 0 ? 'error' : state.badge;
	const note = badge === 'error' && state.badge === 'ready' ? 'an error was logged · press e to view it' : state.note;
	const filled = Math.round(Math.min(1, Math.max(0, status.progress.fraction)) * 20);
	const wordmark = config.dev.banner === false ? [] : (config.dev.banner?.flatMap((line) => line.split('\n')) ?? [null]);
	const blocks: { name: string; content: ReactNode }[] = [
		...wordmark.slice(0, 4).map((line, index) => ({
			name: 'wordmark',
			content: (
				<Box key={index} justifyContent="space-between">
					<Text wrap="truncate-end">
						{' '}
						{line === null ? (
							<>
								<Text color={paint('green')}>
									{[...'·✦★✦'].map((cell, i) => (
										<Text key={i} dimColor={busy && i !== frame % 4}>
											{cell}
										</Text>
									))}
								</Text>
								{'  '}
								<Text bold color={paint('green')}>
									Stars
								</Text>
								<Text dimColor>{` ${readOwnPackageJson().version}`}</Text>
							</>
						) : (
							<Text color={paint('green')}>{line}</Text>
						)}
					</Text>
					{index === 0 && width >= 60 && badge === 'ready' && status.progress.readyMs !== null && (
						<Text dimColor>{`ready in ${(status.progress.readyMs / 1000).toFixed(2)}s `}</Text>
					)}
				</Box>
			)
		})),
		{ name: 'space', content: <Text> </Text> },
		...(status.url
			? [
					{
						name: 'urls',
						content: (
							<Text wrap="truncate-end">
								{'   '}
								<Text dimColor>{'Local    '}</Text>
								<Text color={paint('cyan')} dimColor={busy}>
									{status.url}
								</Text>
								{busy && <Text color={paint('yellow')}>{` ${['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'][frame % 10]}`}</Text>}
							</Text>
						)
					}
				]
			: []),
		...(status.tunnelUrl
			? [
					{
						name: 'urls',
						content: (
							<Text wrap="truncate-end">
								{'   '}
								<Text dimColor>{'Tunnel   '}</Text>
								<Text color={paint('magenta')}>{status.tunnelUrl}</Text>
							</Text>
						)
					}
				]
			: []),
		{ name: 'space', content: <Text> </Text> },
		{
			name: 'summary',
			content: busy ? (
				<Text wrap="truncate-end">
					{'   '}
					<Text color={paint('green')}>{'━'.repeat(filled)}</Text>
					<Text dimColor>
						{'━'.repeat(20 - filled)}
						{` ${Math.round(status.progress.fraction * 100)}% · ${(elapsedMs / 1000).toFixed(1)}s`}
					</Text>
				</Text>
			) : (
				<Text wrap="truncate-end">
					{'   '}
					{counters.warnings > 0 && (
						<Text color={paint('yellow')}>{`⚠ ${counters.warnings} ${plural(counters.warnings, 'warning')}   `}</Text>
					)}
					{counters.errors > 0 && <Text bold color={paint('red')}>{`✖ ${counters.errors} ${plural(counters.errors, 'error')}   `}</Text>}
					{counters.errors === 0 && counters.warnings === 0 && (
						<Text dimColor>
							{status.typecheck === 'checking'
								? 'checking types'
								: status.tunnel === 'failed'
									? 'tunnel failed · press l to view logs'
									: 'logs folded away · press l to view'}
						</Text>
					)}
				</Text>
			)
		},
		{ name: 'space', content: <Text> </Text> },
		{
			name: 'status',
			content: (
				<Text wrap="truncate-end">
					{' '}
					<Text
						bold
						backgroundColor={paint(confirmQuit || busy ? 'yellow' : badge === 'error' ? 'red' : 'green')}
						color={paint(badge === 'error' && !confirmQuit ? 'white' : 'black')}
					>{` ${confirmQuit ? 'QUIT?' : badge === 'restarting' ? 'RESTART' : badge.toUpperCase()} `}</Text>
					{'  '}
					<Text dimColor>{confirmQuit ? 'press y to confirm, esc to stay' : note}</Text>
				</Text>
			)
		},
		{
			name: 'hints',
			content: confirmQuit ? (
				<Text> </Text>
			) : (
				<Hints width={width} hints={[...(counters.errors ? [{ key: 'e', label: 'last error', priority: Infinity }] : []), ...PANEL_HINTS]} />
			)
		}
	];
	let shown = blocks;
	const budget = Math.max(2, Math.min(height, 14));
	for (const name of ['space', 'summary', 'urls', 'wordmark']) {
		if (shown.length <= budget) break;
		shown = shown.filter((block) => block.name !== name);
	}
	shown = shown.filter((block, i, all) => block.name !== 'space' || (i > 0 && i < all.length - 1 && all[i - 1]?.name !== 'space'));
	return (
		<Box flexDirection="column">
			{shown.map((block, index) => (
				<Box key={index} flexDirection="column" height={1}>
					{block.content}
				</Box>
			))}
		</Box>
	);
}

function plural(count: number, word: string): string {
	return count === 1 ? word : `${word}s`;
}
