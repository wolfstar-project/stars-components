import { createContext, useContext, type ReactNode } from 'react';

/**
 * Whether the UI may use colour. `stars dev` decides this once (`NO_COLOR`, `FORCE_COLOR`, TTY detection) and every
 * component reads it from here instead of re-deriving it.
 */
const ColorContext = createContext(true);

export function ColorProvider({ color, children }: { color: boolean; children: ReactNode }) {
	return <ColorContext value={color}>{children}</ColorContext>;
}

/**
 * Returns a colour name only when colour is enabled, so `<Text color={useColor('green')}>` degrades to plain text.
 */
export function useColor(): (name: string) => string | undefined {
	const enabled = useContext(ColorContext);
	return (name) => (enabled ? name : undefined);
}
