import { Box, Text, useInput } from 'ink';
import { useState } from 'react';
import { THEME_SETTINGS, THEMES, detectTerminalBackground, type ThemeSetting } from '../../../../utils/theme.js';
import { useColorEnabled } from '../theme.js';

const DESCRIPTIONS: Record<ThemeSetting, string> = {
	auto: 'match the terminal background',
	dark: 'for dark terminals',
	light: 'for light terminals',
	'dark-daltonized': 'dark, colour-blind friendly (blue/orange)',
	'light-daltonized': 'light, colour-blind friendly (blue/orange)',
	'dark-ansi': 'dark, only your terminal palette',
	'light-ansi': 'light, only your terminal palette'
};

export interface ThemeOverlayProps {
	/** The theme setting in effect when the picker opened. */
	current: ThemeSetting;
	height: number;
	width: number;
	/** Called while moving through the list, so the whole UI previews the highlighted theme. */
	onPreview: (setting: ThemeSetting) => void;
	onSelect: (setting: ThemeSetting) => void;
	/** Closes without saving; the caller restores the theme that was in effect. */
	onClose: () => void;
}

/** Like Claude Code's `/theme`: arrows preview live, `Enter` keeps the choice and saves it, `Esc` restores. */
export function ThemeOverlay({ current, height, width, onPreview, onSelect, onClose }: ThemeOverlayProps) {
	const color = useColorEnabled();
	const [index, setIndex] = useState(Math.max(0, THEME_SETTINGS.indexOf(current)));

	const move = (delta: number) => {
		const next = (index + delta + THEME_SETTINGS.length) % THEME_SETTINGS.length;
		setIndex(next);
		onPreview(THEME_SETTINGS[next]!);
	};

	useInput((input, key) => {
		if (key.ctrl) return;
		if (key.escape || input === 'q' || input === 'T') return onClose();
		if (key.return) return onSelect(THEME_SETTINGS[index]!);
		if (key.upArrow || input === 'k') return move(-1);
		if (key.downArrow || input === 'j') return move(1);
	});

	return (
		<Box flexDirection="column" height={height}>
			<Text bold> colour theme</Text>
			<Text dimColor>{'─'.repeat(width)}</Text>
			{THEME_SETTINGS.slice(0, Math.max(0, height - 3)).map((setting, i) => {
				const swatch = THEMES[setting === 'auto' ? detectTerminalBackground() : setting];
				return (
					<Text key={setting} wrap="truncate-end">
						{i === index ? ' ▎ ' : '   '}
						<Text bold={i === index}>{setting.padEnd(18)}</Text>
						{color && (
							<Text>
								<Text color={swatch.success}>● </Text>
								<Text color={swatch.warning}>● </Text>
								<Text color={swatch.error}>● </Text>
								<Text color={swatch.url}>● </Text>
							</Text>
						)}
						<Text dimColor>{` ${DESCRIPTIONS[setting]}${setting === current ? ' (current)' : ''}`}</Text>
					</Text>
				);
			})}
			<Box flexGrow={1} />
			<Text dimColor> ↑/↓ preview · enter save · esc cancel</Text>
		</Box>
	);
}
