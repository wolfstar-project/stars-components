import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

/** Every theme a user can pick, in the order the picker lists them. `auto` follows the terminal background. */
export const THEME_SETTINGS = ['auto', 'dark', 'light', 'dark-daltonized', 'light-daltonized', 'dark-ansi', 'light-ansi'] as const;
export type ThemeSetting = (typeof THEME_SETTINGS)[number];
export type ThemeName = Exclude<ThemeSetting, 'auto'>;

/**
 * Semantic colour roles the TUI paints with, instead of hardcoded colour names. `undefined` leaves the terminal's own
 * foreground colour, which is the only legible choice for body text on both dark and light backgrounds.
 */
export interface Theme {
	/** The wordmark, progress bar and selection marker. */
	brand: string;
	url: string;
	tunnel: string;
	/** Something is still building or starting. */
	busy: string;
	success: string;
	warning: string;
	error: string;
	text: string | undefined;
	/** Foreground of a badge painted on `success`, `warning` or `busy`. */
	onBright: string;
	/** Foreground of a badge painted on `error`. */
	onError: string;
}

export type ThemeToken = keyof Theme;

export const THEMES: Readonly<Record<ThemeName, Theme>> = {
	dark: {
		brand: '#4ade80',
		url: '#22d3ee',
		tunnel: '#e879f9',
		busy: '#facc15',
		success: '#4ade80',
		warning: '#facc15',
		error: '#f87171',
		text: undefined,
		onBright: '#000000',
		onError: '#000000'
	},
	light: {
		brand: '#15803d',
		url: '#0e7490',
		tunnel: '#a21caf',
		busy: '#a16207',
		success: '#15803d',
		warning: '#a16207',
		error: '#b91c1c',
		text: undefined,
		onBright: '#ffffff',
		onError: '#ffffff'
	},
	// Okabe-Ito palette: blue/orange carry the good/bad distinction instead of green/red.
	'dark-daltonized': {
		brand: '#56b4e9',
		url: '#56b4e9',
		tunnel: '#cc79a7',
		busy: '#f0e442',
		success: '#56b4e9',
		warning: '#e69f00',
		error: '#ff8a3d',
		text: undefined,
		onBright: '#000000',
		onError: '#000000'
	},
	'light-daltonized': {
		brand: '#0072b2',
		url: '#0072b2',
		tunnel: '#8e3b76',
		busy: '#8a6500',
		success: '#0072b2',
		warning: '#8a6500',
		error: '#b84a00',
		text: undefined,
		onBright: '#ffffff',
		onError: '#ffffff'
	},
	// The 16 ANSI colours only, so the terminal's own palette decides what they look like.
	'dark-ansi': {
		brand: 'greenBright',
		url: 'cyanBright',
		tunnel: 'magentaBright',
		busy: 'yellowBright',
		success: 'greenBright',
		warning: 'yellowBright',
		error: 'redBright',
		text: undefined,
		onBright: 'black',
		onError: 'black'
	},
	'light-ansi': {
		brand: 'green',
		url: 'cyan',
		tunnel: 'magenta',
		busy: 'yellow',
		success: 'green',
		warning: 'yellow',
		error: 'red',
		text: undefined,
		onBright: 'white',
		onError: 'white'
	}
};

export function isThemeSetting(value: unknown): value is ThemeSetting {
	return typeof value === 'string' && (THEME_SETTINGS as readonly string[]).includes(value);
}

/**
 * Guesses whether the terminal background is light from `COLORFGBG` (`foreground;background`, set by rxvt, Konsole and
 * others). Without it the terminal is assumed dark, which matches most developer setups.
 */
export function detectTerminalBackground(env: NodeJS.ProcessEnv = process.env): 'dark' | 'light' {
	const background = env.COLORFGBG?.split(';').at(-1);
	if (background === undefined || !/^\d+$/.test(background)) return 'dark';
	const index = Number(background);
	return index === 7 || index === 15 ? 'light' : 'dark';
}

export function resolveTheme(setting: ThemeSetting, env: NodeJS.ProcessEnv = process.env): ThemeName {
	return setting === 'auto' ? detectTerminalBackground(env) : setting;
}

export interface ThemeSettingSources {
	/** `--theme`. */
	flag?: string;
	env?: NodeJS.ProcessEnv;
	/** The theme saved by the picker. */
	saved?: ThemeSetting;
}

/**
 * Precedence: `--theme` › `STARS_THEME` › the saved preference › `auto`. An unknown `STARS_THEME` is ignored, since an
 * environment variable should not stop the dev server; an unknown `--theme` is the caller's to reject.
 */
export function resolveThemeSetting({ flag, env = process.env, saved }: ThemeSettingSources): ThemeSetting {
	if (isThemeSetting(flag)) return flag;
	const fromEnv = env.STARS_THEME?.trim().toLowerCase();
	if (isThemeSetting(fromEnv)) return fromEnv;
	return saved ?? 'auto';
}

/** Where preferences live: `$STARS_CONFIG_DIR`, else `$XDG_CONFIG_HOME/stars`, `%APPDATA%\stars` or `~/.config/stars`. */
export function preferencesPath(env: NodeJS.ProcessEnv = process.env): string {
	const directory =
		env.STARS_CONFIG_DIR ??
		join((env.XDG_CONFIG_HOME || (process.platform === 'win32' ? env.APPDATA : undefined)) ?? join(homedir(), '.config'), 'stars');
	return join(directory, 'preferences.json');
}

export function readSavedTheme(env: NodeJS.ProcessEnv = process.env): ThemeSetting | undefined {
	try {
		const { theme } = JSON.parse(readFileSync(preferencesPath(env), 'utf8')) as { theme?: unknown };
		return isThemeSetting(theme) ? theme : undefined;
	} catch {
		return undefined;
	}
}

/** Persists the theme, keeping any other preference in the file. Returns whether it could be written. */
export function saveTheme(setting: ThemeSetting, env: NodeJS.ProcessEnv = process.env): boolean {
	const path = preferencesPath(env);
	try {
		let existing: Record<string, unknown> = {};
		try {
			const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
			if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) existing = parsed as Record<string, unknown>;
		} catch {
			// No file yet, or a corrupt one: start over.
		}
		mkdirSync(dirname(path), { recursive: true });
		writeFileSync(path, `${JSON.stringify({ ...existing, theme: setting }, null, '\t')}\n`);
		return true;
	} catch {
		return false;
	}
}
