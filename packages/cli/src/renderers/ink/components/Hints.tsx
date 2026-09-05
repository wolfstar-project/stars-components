import { Text } from 'ink';

export interface Hint {
	key: string;
	label: string;
	priority: number;
}

export const PANEL_HINTS: Hint[] = [
	{ key: 'r', label: 'restart', priority: 80 },
	{ key: 'o', label: 'open', priority: 40 },
	{ key: 'i', label: 'info', priority: 50 },
	{ key: 'l', label: 'logs', priority: 70 },
	{ key: '?', label: 'help', priority: 100 },
	{ key: 'q', label: 'quit', priority: 90 }
];

/** Drop the lowest-priority shortcuts first; help and the last error survive narrow panes. */
export function Hints({ hints, width }: { hints: readonly Hint[]; width: number }) {
	const shown = [...hints];
	const length = () => shown.reduce((size, hint) => size + hint.key.length + hint.label.length + 4, -2);
	while (shown.length > 1 && length() > width) {
		const weakest = shown.reduce((a, b) => (a.priority <= b.priority ? a : b));
		shown.splice(shown.indexOf(weakest), 1);
	}
	return (
		<Text wrap="truncate-end">
			{' '}
			{shown.map(({ key, label }, i) => (
				<Text key={key}>
					{i > 0 && <Text dimColor> · </Text>}
					<Text bold>{key}</Text>
					<Text dimColor>{` ${label}`}</Text>
				</Text>
			))}
		</Text>
	);
}
