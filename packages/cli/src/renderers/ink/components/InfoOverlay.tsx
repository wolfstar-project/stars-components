import { Box, Text, useInput } from 'ink';
import type { DevService } from '../../../lib/dev-service.js';
import { useDevStatus } from '../hooks/useDevStatus.js';
import { useUptime } from '../hooks/useUptime.js';
import { formatDuration } from '../../panel-logic.js';

export function InfoOverlay({ service, height, width, onClose }: { service: DevService; height: number; width: number; onClose: () => void }) {
	const status = useDevStatus(service);
	const uptime = useUptime(status.startedAt);
	useInput((input, key) => {
		if (!key.ctrl && (key.escape || ['q', 'i'].includes(input))) onClose();
	});
	const lines = [
		['Project', service.config.packageJson?.name ?? 'stars project'],
		['Root', service.config.root],
		['Node', process.version],
		['Builder', service.builder.tool],
		['Local', status.url ?? '—'],
		['Tunnel', status.tunnelUrl ?? status.tunnel],
		['Process', `${status.process}${status.pid ? ` (${status.pid})` : ''}`],
		['Uptime', uptime === null ? '—' : formatDuration(uptime)],
		['Restarts', String(status.restarts)],
		['Health', service.config.dev.health ? status.health : 'not configured (READY reports process state)'],
		['Types', `${status.typecheck}${status.typeErrors ? ` (${status.typeErrors} errors)` : ''}`],
		['Log file', service.config.dev.logFile ?? 'disabled']
	];
	return (
		<Box flexDirection="column" height={height}>
			<Text bold wrap="truncate-end">
				{' '}
				session info
			</Text>
			<Text dimColor>{'─'.repeat(width)}</Text>
			{lines.slice(0, Math.max(0, height - 3)).map(([label, value]) => (
				<Text key={label} wrap="truncate-end">
					{'  '}
					<Text bold>{label!.padEnd(10)}</Text>
					<Text dimColor>{value}</Text>
				</Text>
			))}
			<Box flexGrow={1} />
			<Text dimColor> q close</Text>
		</Box>
	);
}
