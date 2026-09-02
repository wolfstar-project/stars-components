import { Box, Text } from 'ink';
import type { DevStatus } from '../../../lib/dev-service.js';
import { describeReason } from '../../../lib/dev-service.js';
import { formatDuration } from '../../format.js';
import { useColor } from '../theme.js';
import { StatusBadge } from './StatusBadge.js';

export interface HeaderProps {
	name: string;
	status: DevStatus;
	uptime: number | null;
	spinner: string;
	narrow: boolean;
}

export function Header({ name, status, uptime, spinner, narrow }: HeaderProps) {
	const paint = useColor();
	const process = describeProcess(status, spinner);

	return (
		<Box gap={narrow ? 1 : 2}>
			<Text bold color={paint('yellow')}>
				★ stars dev
			</Text>
			<Text dimColor>{name}</Text>
			<StatusBadge icon={process.icon} label={process.label} color={process.color} />
			{!narrow && status.pid !== null && <Text dimColor>{`pid ${status.pid}`}</Text>}
			{!narrow && uptime !== null && <Text dimColor>{`up ${formatDuration(uptime)}`}</Text>}
			{!narrow && status.restarts > 0 && (
				<Text dimColor>
					{`restarts ${status.restarts}`}
					{status.lastRestartReason ? ` (${describeReason(status.lastRestartReason)})` : ''}
				</Text>
			)}
		</Box>
	);
}

function describeProcess(status: DevStatus, spinner: string): { icon: string; label: string; color: string } {
	switch (status.process) {
		case 'running':
			return { icon: '●', label: 'running', color: 'green' };
		case 'starting':
			return { icon: spinner, label: 'starting', color: 'yellow' };
		case 'stopping':
			return { icon: spinner, label: 'stopping', color: 'yellow' };
		case 'crashed':
			return { icon: '✖', label: 'crashed', color: 'red' };
		default:
			return { icon: '○', label: 'idle', color: 'gray' };
	}
}
