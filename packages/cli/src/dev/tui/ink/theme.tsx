import { createContext, useContext, type ReactNode } from 'react';
import { THEMES, type ThemeName, type ThemeToken } from '../../../utils/theme.js';

interface ThemeState {
	/** Whether the UI may use colour. */
	color: boolean;
	theme: ThemeName;
}

/**
 * `stars dev` decides once whether the UI may use colour (`NO_COLOR`, `FORCE_COLOR`, TTY detection) and which theme
 * to paint with; every component reads both from here instead of re-deriving them.
 */
const ThemeContext = createContext<ThemeState>({ color: true, theme: 'dark' });

export function ThemeProvider({ color, theme, children }: ThemeState & { children: ReactNode }) {
	return <ThemeContext value={{ color, theme }}>{children}</ThemeContext>;
}

/**
 * Returns a theme colour only when colour is enabled, so `<Text color={usePaint()('success')}>` degrades to plain text.
 */
export function usePaint(): (token: ThemeToken) => string | undefined {
	const { color, theme } = useContext(ThemeContext);
	return (token) => (color ? THEMES[theme][token] : undefined);
}

export function useColorEnabled(): boolean {
	return useContext(ThemeContext).color;
}
