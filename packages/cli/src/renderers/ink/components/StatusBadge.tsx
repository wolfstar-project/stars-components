import { Text } from 'ink';
import { useColor } from '../theme.js';

export interface StatusBadgeProps {
	/** A dot, a spinner frame, or nothing. */
	icon?: string;
	label: string;
	color?: string;
	dim?: boolean;
}

/**
 * One `icon label` pair of the header or the status bar, e.g. `● running` or `✔ types ok`.
 */
export function StatusBadge({ icon, label, color, dim }: StatusBadgeProps) {
	const paint = useColor();
	return (
		<Text color={color ? paint(color) : undefined} dimColor={dim}>
			{icon ? `${icon} ` : ''}
			{label}
		</Text>
	);
}
