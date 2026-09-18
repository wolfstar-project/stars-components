import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
	THEMES,
	THEME_SETTINGS,
	detectTerminalBackground,
	isThemeSetting,
	preferencesPath,
	readSavedTheme,
	resolveTheme,
	resolveThemeSetting,
	saveTheme
} from '../src/lib/theme.js';

describe('theme', () => {
	test('defines a complete palette for every named theme', () => {
		for (const setting of THEME_SETTINGS.filter((name) => name !== 'auto')) {
			const theme = THEMES[setting as keyof typeof THEMES];
			expect(Object.keys(theme).sort(), setting).toEqual(Object.keys(THEMES.dark).sort());
		}
	});

	test('colour-blind themes do not tell success and error apart by red and green', () => {
		for (const name of ['dark-daltonized', 'light-daltonized'] as const) {
			expect(THEMES[name].success).not.toBe(THEMES[name].error);
			expect(THEMES[name].success).toMatch(/^#[0-9a-f]{2}[0-9a-f]{2}[bcdef][0-9a-f]$/);
		}
	});

	test('validates theme names', () => {
		expect(isThemeSetting('dark-ansi')).toBe(true);
		expect(isThemeSetting('auto')).toBe(true);
		expect(isThemeSetting('solarized')).toBe(false);
		expect(isThemeSetting(undefined)).toBe(false);
	});

	test('detects a light terminal from COLORFGBG and defaults to dark', () => {
		expect(detectTerminalBackground({})).toBe('dark');
		expect(detectTerminalBackground({ COLORFGBG: '0;15' })).toBe('light');
		expect(detectTerminalBackground({ COLORFGBG: '0;default;7' })).toBe('light');
		expect(detectTerminalBackground({ COLORFGBG: '15;0' })).toBe('dark');
		expect(detectTerminalBackground({ COLORFGBG: 'nonsense' })).toBe('dark');
		expect(resolveTheme('auto', { COLORFGBG: '0;15' })).toBe('light');
		expect(resolveTheme('light-ansi', { COLORFGBG: '15;0' })).toBe('light-ansi');
	});

	test('resolves the setting as --theme, then STARS_THEME, then the saved theme, then auto', () => {
		expect(resolveThemeSetting({ flag: 'light', env: { STARS_THEME: 'dark' }, saved: 'dark-ansi' })).toBe('light');
		expect(resolveThemeSetting({ env: { STARS_THEME: ' Dark-Daltonized ' }, saved: 'dark-ansi' })).toBe('dark-daltonized');
		expect(resolveThemeSetting({ env: { STARS_THEME: 'solarized' }, saved: 'dark-ansi' })).toBe('dark-ansi');
		expect(resolveThemeSetting({ env: {} })).toBe('auto');
	});

	describe('preferences', () => {
		let directory: string;
		let env: NodeJS.ProcessEnv;
		beforeEach(() => {
			directory = mkdtempSync(join(tmpdir(), 'stars-theme-'));
			env = { STARS_CONFIG_DIR: join(directory, 'nested', 'stars') };
		});
		afterEach(() => rmSync(directory, { recursive: true, force: true }));

		test('honours STARS_CONFIG_DIR and XDG_CONFIG_HOME', () => {
			expect(preferencesPath(env)).toBe(join(directory, 'nested', 'stars', 'preferences.json'));
			expect(preferencesPath({ XDG_CONFIG_HOME: '/xdg' })).toBe(join('/xdg', 'stars', 'preferences.json'));
		});

		test('saves and reads back the theme, creating the directory', () => {
			expect(readSavedTheme(env)).toBeUndefined();
			expect(saveTheme('light-daltonized', env)).toBe(true);
			expect(readSavedTheme(env)).toBe('light-daltonized');
		});

		test('keeps other preferences and ignores an unknown or corrupt saved theme', () => {
			expect(saveTheme('dark', env)).toBe(true);
			const path = preferencesPath(env);
			writeFileSync(path, JSON.stringify({ other: 1, theme: 'dark' }));
			expect(saveTheme('light', env)).toBe(true);
			expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual({ other: 1, theme: 'light' });
			writeFileSync(path, JSON.stringify({ theme: 'solarized' }));
			expect(readSavedTheme(env)).toBeUndefined();
			writeFileSync(path, '{ not json');
			expect(readSavedTheme(env)).toBeUndefined();
			expect(saveTheme('dark', env)).toBe(true);
			expect(readSavedTheme(env)).toBe('dark');
		});

		test('reports failure instead of throwing when the directory is not writable', () => {
			writeFileSync(join(directory, 'file'), '');
			expect(saveTheme('dark', { STARS_CONFIG_DIR: join(directory, 'file', 'stars') })).toBe(false);
		});
	});
});
