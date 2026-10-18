import { isCIEnvironment, prefersReducedMotion, resolveDevPresentation, resolveOutputMode, shouldUseColor } from '../src/utils/output-mode.js';

describe('resolveOutputMode', () => {
	test('uses the TUI on an interactive terminal', () => {
		expect(resolveOutputMode({ env: {}, isTTY: true, isCI: false })).toBe('tui');
	});

	test('--no-tui wins over everything', () => {
		expect(resolveOutputMode({ tui: false, env: { STARS_TUI: 'tui' }, isTTY: true, isCI: false })).toBe('plain');
	});

	test('STARS_TUI=plain forces plain output', () => {
		expect(resolveOutputMode({ env: { STARS_TUI: 'plain' }, isTTY: true, isCI: false })).toBe('plain');
		expect(resolveOutputMode({ env: { STARS_TUI: '0' }, isTTY: true, isCI: false })).toBe('plain');
	});

	test('STARS_TUI=tui overrides CI but never a non-interactive stdout', () => {
		expect(resolveOutputMode({ env: { STARS_TUI: 'tui' }, isTTY: true, isCI: true })).toBe('tui');
		expect(resolveOutputMode({ env: { STARS_TUI: 'tui' }, isTTY: false, isCI: false })).toBe('plain');
	});

	test('falls back to plain when redirected, in CI, or with a dumb terminal', () => {
		expect(resolveOutputMode({ env: {}, isTTY: false, isCI: false })).toBe('plain');
		expect(resolveOutputMode({ env: {}, isTTY: true, isCI: true })).toBe('plain');
		expect(resolveOutputMode({ env: { TERM: 'dumb' }, isTTY: true, isCI: false })).toBe('plain');
	});

	test('detects CI from common variables', () => {
		expect(isCIEnvironment({})).toBe(false);
		expect(isCIEnvironment({ CI: 'true' })).toBe(true);
		expect(isCIEnvironment({ CI: 'false' })).toBe(false);
		expect(isCIEnvironment({ GITHUB_ACTIONS: 'true' })).toBe(true);
	});

	test('never uses raw keys on redirected stdin or a dumb terminal, even when forced', () => {
		expect(resolveOutputMode({ env: { STARS_TUI: '1' }, isTTY: true, isInputTTY: false })).toBe('plain');
		expect(resolveOutputMode({ env: { STARS_TUI: '1', TERM: 'dumb' }, isTTY: true })).toBe('plain');
	});
	test('falls back in small panes unless explicitly forced', () => {
		expect(resolveOutputMode({ env: {}, isTTY: true, columns: 35, rows: 8 })).toBe('plain');
		expect(resolveOutputMode({ env: { STARS_TUI: '1' }, isTTY: true, columns: 35, rows: 8 })).toBe('tui');
	});
});

describe('colours and motion', () => {
	test('NO_COLOR disables colours, FORCE_COLOR enables them', () => {
		expect(shouldUseColor({ NO_COLOR: '1' }, true)).toBe(false);
		expect(shouldUseColor({ FORCE_COLOR: '1' }, false)).toBe(true);
		expect(shouldUseColor({ FORCE_COLOR: '0' }, true)).toBe(false);
		expect(shouldUseColor({}, true)).toBe(true);
		expect(shouldUseColor({}, false)).toBe(false);
		expect(shouldUseColor({ TERM: 'dumb' }, true)).toBe(false);
	});

	test('reduced motion honours STARS_REDUCED_MOTION', () => {
		expect(prefersReducedMotion({})).toBe(false);
		expect(prefersReducedMotion({ STARS_REDUCED_MOTION: '1' })).toBe(true);
		expect(prefersReducedMotion({ STARS_REDUCED_MOTION: 'false' })).toBe(false);
	});
});

describe('development presentation', () => {
	const terminal = { env: {}, isTTY: true, isCI: false, columns: 100, rows: 24 };
	test('keeps automatic sizing when no style is configured', () => {
		expect(resolveDevPresentation(terminal)).toEqual({ mode: 'tui', layout: 'auto' });
	});
	test.each([
		[{ configuredStyle: 'nuxt-style' }, 'panel'],
		[{ configuredStyle: 'dashboard' }, 'dashboard'],
		[{ configuredStyle: 'nuxt-style', layout: 'dashboard' }, 'dashboard'],
		[{ configuredStyle: 'dashboard', layout: 'panel', style: 'nuxt-style' }, 'panel'],
		[{ configuredLayout: 'panel' }, 'panel']
	] as const)('resolves the explicit and configured style precedence %j', (options, layout) => {
		expect(resolveDevPresentation({ ...terminal, ...options })).toEqual({ mode: 'tui', layout });
	});
	test('uses plain logs for none and lets an explicit --tui override the configured none', () => {
		expect(resolveDevPresentation({ ...terminal, configuredStyle: 'none' }).mode).toBe('plain');
		expect(resolveDevPresentation({ ...terminal, configuredStyle: 'none', tui: true }).mode).toBe('tui');
		expect(resolveDevPresentation({ ...terminal, style: 'none', tui: true }).mode).toBe('plain');
	});
	test('respects --no-tui, environment plain output and redirected input with every style', () => {
		for (const style of ['nuxt-style', 'dashboard'] as const) {
			expect(resolveDevPresentation({ ...terminal, style, tui: false }).mode).toBe('plain');
			expect(resolveDevPresentation({ ...terminal, style, env: { STARS_TUI: 'plain' } }).mode).toBe('plain');
			expect(resolveDevPresentation({ ...terminal, style, isInputTTY: false }).mode).toBe('plain');
		}
	});
});
