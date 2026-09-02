import { Box, Text } from 'ink';
import type { LogLevel, LogSource } from '../../../lib/log-buffer.js';

export interface FooterProps {
	width: number;
	source: LogSource | null;
	level: LogLevel | null;
	scroll: number;
}

/**
 * The hotkey line, collapsed on narrow terminals so it never wraps into the log view.
 */
export function Footer({ width, source, level, scroll }: FooterProps) {
	if (width < 40) {
		return (
			<Text>
				<Key name="h" /> help <Key name="q" /> quit
			</Text>
		);
	}

	if (width < 60) {
		return (
			<Text>
				<Key name="r" /> restart <Key name="c" /> clear <Key name="h" /> help <Key name="q" /> quit
			</Text>
		);
	}

	const filters = [`filter ${source ?? 'all'}`, level ? `level ≥ ${level}` : null, scroll > 0 ? `↑ ${scroll} (End to follow)` : null]
		.filter((part): part is string => part !== null)
		.join(' · ');

	return (
		<Box flexDirection="column">
			<Text>
				<Key name="r" /> restart <Key name="c" /> clear <Key name="f" /> source <Key name="e" /> errors <Key name="↑↓" /> scroll{' '}
				<Key name="h" /> help <Key name="q" /> quit
			</Text>
			<Text dimColor>{filters}</Text>
		</Box>
	);
}

function Key({ name }: { name: string }) {
	return <Text bold>{name}</Text>;
}
