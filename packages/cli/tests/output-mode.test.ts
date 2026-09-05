import { isCIEnvironment, prefersReducedMotion, resolveOutputMode, shouldUseColor } from '../src/lib/output-mode.js';

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
