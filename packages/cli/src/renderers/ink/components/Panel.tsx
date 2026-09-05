import { Box, Text } from 'ink';
import type { ResolvedStarsConfig } from '@wolfstar/http-framework/config';
import type { DevStatus } from '../../../lib/dev-service.js';
import type { LogCounters } from '../hooks/useLogCounters.js';
import { describeBadge, formatDuration, type Badge } from '../../panel-logic.js';
import { useColor } from '../theme.js';

const BADGE_COLOR: Record<Badge, string> = { starting: 'yellow', building: 'yellow', restarting: 'yellow', ready: 'green', error: 'red' };

export interface PanelHint {
	key: string;
	label: string;
}

export const DEFAULT_HINTS: PanelHint[] = [
	{ key: 'r', label: 'restart' },
	{ key: 'l', label: 'logs' },
	{ key: '?', label: 'help' },
	{ key: 'q', label: 'quit' }
];

export interface PanelProps {
	name: string;
	status: DevStatus;
	config: ResolvedStarsConfig;
	uptimeMs: number | null;
	counters: LogCounters;
	spinner: string;
	narrow: boolean;
}

/**
 * The pinned dev panel: a handful of lines below the log stream, redrawn as state changes. Mirrors the blocks
 * Nuxt CLI v4's own dev panel shows — a wordmark, the URL with its live checks, a warning/error summary, a status
 * badge and the shortcut hints — kept to a fixed, small height instead of growing with the session.
 */
export function Panel({ name, status, config, uptimeMs, counters, spinner, narrow }: PanelProps) {
	const { badge, note } = describeBadge(status);

	return (
		<Box flexDirection="column">
			<Wordmark name={name} status={status} uptimeMs={uptimeMs} narrow={narrow} />
			{status.url && <UrlRow status={status} config={config} spinner={spinner} narrow={narrow} />}
			<Summary counters={counters} />
			<StatusRow badge={badge} note={note} />
			<Hints errors={counters.errors} narrow={narrow} />
		</Box>
	);
}

function Wordmark({ name, status, uptimeMs, narrow }: { name: string; status: DevStatus; uptimeMs: number | null; narrow: boolean }) {
	const paint = useColor();
	return (
		<Box gap={narrow ? 1 : 2}>
			<Text bold color={paint('yellow')}>
				★ stars dev
			</Text>
			<Text dimColor>{name}</Text>
			{!narrow && uptimeMs !== null && <Text dimColor>{`up ${formatDuration(uptimeMs)}`}</Text>}
			{!narrow && status.restarts > 0 && <Text dimColor>{`restarts ${status.restarts}`}</Text>}
		</Box>
	);
}

function UrlRow({ status, config, spinner, narrow }: { status: DevStatus; config: ResolvedStarsConfig; spinner: string; narrow: boolean }) {
	const paint = useColor();
	return (
		<Box gap={narrow ? 1 : 2}>
			<Text color={paint('cyan')}>{status.url}</Text>
			{!narrow && config.dev.health !== null && <Health status={status} />}
			{!narrow && config.dev.typecheck.enabled && <Typecheck status={status} spinner={spinner} />}
			{!narrow && status.tunnel !== 'off' && <Tunnel status={status} spinner={spinner} />}
		</Box>
	);
}

function Health({ status }: { status: DevStatus }) {
	const paint = useColor();
	switch (status.health) {
		case 'ok':
			return <Text color={paint('green')}>health ok</Text>;
		case 'down':
			return <Text color={paint('red')}>health down</Text>;
		default:
			return <Text dimColor>health unknown</Text>;
	}
}

function Typecheck({ status, spinner }: { status: DevStatus; spinner: string }) {
	const paint = useColor();
	switch (status.typecheck) {
		case 'checking':
			return <Text dimColor>{`${spinner} types`}</Text>;
		case 'ok':
			return <Text color={paint('green')}>types ok</Text>;
		case 'failed':
			return <Text color={paint('red')}>{`types ${status.typeErrors}`}</Text>;
		default:
			return <Text dimColor>types idle</Text>;
	}
}

function Tunnel({ status, spinner }: { status: DevStatus; spinner: string }) {
	const paint = useColor();
	switch (status.tunnel) {
		case 'starting':
			return <Text dimColor>{`${spinner} tunnel`}</Text>;
		case 'up':
			return <Text color={paint('green')}>{status.tunnelUrl ?? 'tunnel up'}</Text>;
		case 'failed':
			return <Text color={paint('red')}>tunnel failed</Text>;
		default:
			return null;
	}
}

function Summary({ counters }: { counters: LogCounters }) {
	const paint = useColor();
	if (counters.warnings === 0 && counters.errors === 0) return null;

	return (
		<Box gap={2}>
			{counters.warnings > 0 && <Text color={paint('yellow')}>{`⚠ ${counters.warnings} ${plural(counters.warnings, 'warning')}`}</Text>}
			{counters.errors > 0 && <Text bold color={paint('red')}>{`✖ ${counters.errors} ${plural(counters.errors, 'error')}`}</Text>}
		</Box>
	);
}

function StatusRow({ badge, note }: { badge: Badge; note: string }) {
	const paint = useColor();
	return (
		<Box gap={1}>
			<Text backgroundColor={paint(BADGE_COLOR[badge])} color={paint('black')} bold>
				{` ${badge.toUpperCase()} `}
			</Text>
			<Text dimColor>{note}</Text>
		</Box>
	);
}

function Hints({ errors, narrow }: { errors: number; narrow: boolean }) {
	const paint = useColor();
	const hints = [...(errors > 0 ? [{ key: 'e', label: 'last error' }] : []), ...DEFAULT_HINTS];
	const shown = narrow ? hints.slice(0, 2) : hints;

	return (
		<Box gap={narrow ? 1 : 2}>
			{shown.map(({ key, label }) => (
				<Text key={key}>
					<Text bold color={paint('white')}>
						{key}
					</Text>{' '}
					<Text dimColor>{label}</Text>
				</Text>
			))}
		</Box>
	);
}

function plural(count: number, word: string): string {
	return count === 1 ? word : `${word}s`;
}
