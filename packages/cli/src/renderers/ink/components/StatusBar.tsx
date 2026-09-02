import { Box, Text } from 'ink';
import type { ResolvedStarsConfig } from '@wolfstar/http-framework/config';
import type { DevStatus } from '../../../lib/dev-service.js';
import { useColor } from '../theme.js';
import { StatusBadge } from './StatusBadge.js';

export interface StatusBarProps {
	config: ResolvedStarsConfig;
	status: DevStatus;
	spinner: string;
	narrow: boolean;
}

/**
 * The line under the header: build, URL, and the optional checks (health, types, tunnel) that only appear when the
 * project turned them on.
 */
export function StatusBar({ config, status, spinner, narrow }: StatusBarProps) {
	const paint = useColor();
	const build = describeBuild(status, spinner);

	return (
		<Box gap={narrow ? 1 : 2}>
			<StatusBadge icon={build.icon} label={build.label} color={build.color} />
			{status.url ? <Text color={paint('cyan')}>{status.url}</Text> : <Text dimColor>url unknown</Text>}
			{!narrow && config.dev.health !== null && <Health status={status} />}
			{!narrow && config.dev.typecheck.enabled && <Typecheck status={status} spinner={spinner} />}
			{!narrow && <Tunnel status={status} spinner={spinner} />}
		</Box>
	);
}

function Health({ status }: { status: DevStatus }) {
	switch (status.health) {
		case 'ok':
			return <StatusBadge icon="✔" label="health ok" color="green" />;
		case 'down':
			return <StatusBadge icon="✖" label="health down" color="red" />;
		default:
			return <StatusBadge label="health unknown" dim />;
	}
}

function Typecheck({ status, spinner }: { status: DevStatus; spinner: string }) {
	switch (status.typecheck) {
		case 'checking':
			return <StatusBadge icon={spinner} label="types…" dim />;
		case 'ok':
			return <StatusBadge icon="✔" label="types ok" color="green" />;
		case 'failed':
			return <StatusBadge icon="✖" label={`types ${status.typeErrors}`} color="red" />;
		default:
			return <StatusBadge label="types idle" dim />;
	}
}

function Tunnel({ status, spinner }: { status: DevStatus; spinner: string }) {
	switch (status.tunnel) {
		case 'starting':
			return <StatusBadge icon={spinner} label="tunnel…" dim />;
		case 'up':
			return <StatusBadge icon="⇄" label={status.tunnelUrl ?? 'tunnel up'} color="green" />;
		case 'failed':
			return <StatusBadge icon="✖" label="tunnel failed" color="red" />;
		default:
			return null;
	}
}

function describeBuild(status: DevStatus, spinner: string): { icon: string; label: string; color: string } {
	switch (status.build) {
		case 'building':
			return { icon: spinner, label: 'building', color: 'yellow' };
		case 'ok':
			return { icon: '✔', label: status.lastBuild ? `built in ${status.lastBuild.durationMs}ms` : 'built', color: 'green' };
		case 'failed':
			return { icon: '✖', label: 'build failed', color: 'red' };
		default:
			return { icon: '○', label: 'build idle', color: 'gray' };
	}
}
