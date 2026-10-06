import { Box, useInput, useWindowSize } from 'ink';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DevService } from '../../dev-service.js';
import { Dashboard } from './components/Dashboard.js';
import { HelpOverlay } from './components/HelpOverlay.js';
import { LogBrowser } from './components/LogBrowser.js';
import { InfoOverlay } from './components/InfoOverlay.js';
import { Panel } from './components/Panel.js';
import { useDevStatus } from './hooks/useDevStatus.js';
import { useLogCounters } from './hooks/useLogCounters.js';
import { useBuildClock } from './hooks/useBuildClock.js';
import { describeBadge, isBusy } from '../panel-logic.js';
import { initialLogView, type LogViewFilter } from '../log-view.js';
import type { MouseInput } from '../mouse.js';
import { openDevUrl } from '../../open-url.js';
import { ThemeProvider } from './theme.js';
import { ThemeOverlay } from './components/ThemeOverlay.js';
import { resolveTheme, type ThemeSetting } from '../../../utils/theme.js';

export type DevLayout = 'dashboard' | 'panel';

export interface DevAppProps {
	service: DevService;
	color: boolean;
	/** The theme setting to start with; `auto` follows the terminal background. */
	theme: ThemeSetting;
	reducedMotion: boolean;
	/** `dev.layout` (or `--layout`); `auto` follows the terminal size. */
	layout?: DevLayout | 'auto';
	/** The log filter the dashboard starts with; defaults to `dev.logs`. */
	filter?: LogViewFilter;
	/** Called when the user asks to quit, so the CLI can stop the bot and exit. */
	onQuit: () => void;
	/** Called with whether the view about to be painted takes the whole screen (the alternate buffer). */
	onViewChange: (fullScreen: boolean) => void;
	onCopy: (text: string) => void;
	/** Called when the user keeps a theme in the picker, so the CLI can remember it. */
	onThemeSave: (setting: ThemeSetting) => void;
	/** The mouse of the terminal, when `dev.mouse` is on: the dashboard listens to it. */
	mouse?: Pick<MouseInput, 'subscribe'>;
}

type Overlay = 'logs' | 'errors' | 'help' | 'info' | 'theme';

/** The dashboard needs room for its sidebar next to a readable log line, and for more than a handful of entries. */
export const DASHBOARD_MIN_COLUMNS = 90;
export const DASHBOARD_MIN_ROWS = 20;
/** Below this even an explicit `dashboard` falls back to the panel: the sidebar alone would fill the terminal. */
const DASHBOARD_HARD_MIN_COLUMNS = 60;
const DASHBOARD_HARD_MIN_ROWS = 10;

/** The layout to paint for a terminal size: what was asked for when it fits, the panel otherwise. */
export function resolveLayout(layout: DevLayout | 'auto', columns: number, rows: number): DevLayout {
	if (layout === 'panel') return 'panel';
	if (columns < DASHBOARD_HARD_MIN_COLUMNS || rows < DASHBOARD_HARD_MIN_ROWS) return 'panel';
	if (layout === 'dashboard') return 'dashboard';
	return columns >= DASHBOARD_MIN_COLUMNS && rows >= DASHBOARD_MIN_ROWS ? 'dashboard' : 'panel';
}

/**
 * Two layouts over one service. The dashboard is a full-screen view in the alternate buffer; the panel is pinned to
 * the bottom of the normal buffer with the logs folded away, and is what a small terminal gets. The browsable
 * overlays use the alternate buffer from either, preserving the terminal's history and the panel when they close.
 */
export function DevApp(props: DevAppProps) {
	const { service, color, theme, reducedMotion, layout = 'auto', filter, onQuit, onViewChange, onCopy, onThemeSave, mouse } = props;
	const { columns, rows } = useWindowSize();
	const [overlay, setOverlay] = useState<Overlay | null>(null);
	const [chosen, setChosen] = useState(layout);
	const [confirmQuit, setConfirmQuit] = useState(false);
	const [captured, setCaptured] = useState(false);
	const [, repaint] = useState(0);
	// `saved` is what Esc restores after previewing other themes in the picker.
	const [saved, setSaved] = useState(theme);
	const [preview, setPreview] = useState(theme);
	const [initialFilter] = useState(() => filter ?? initialLogView(service.config));

	const status = useDevStatus(service);
	const counters = useLogCounters(service);
	const badge = describeBadge(status).badge;
	const busy = isBusy(badge);
	const base = resolveLayout(chosen, columns, rows);
	const clock = useBuildClock(status.progress.startedAt, busy && overlay === null, reducedMotion);

	const width = Math.max(1, columns);
	const height = Math.max(2, rows - 1);

	// The buffer is switched before the view that needs it is painted. A resize that moves `auto` across the
	// dashboard's threshold is only seen after the fact, so it switches from the effect and paints once more.
	const fullScreen = overlay !== null || base === 'dashboard';
	const shown = useRef(fullScreen);
	const show = (nextOverlay: Overlay | null, nextChosen: DevLayout | 'auto' = chosen) => {
		const next = nextOverlay !== null || resolveLayout(nextChosen, columns, rows) === 'dashboard';
		shown.current = next;
		onViewChange(next);
		setOverlay(nextOverlay);
		setChosen(nextChosen);
	};
	useEffect(() => {
		if (shown.current === fullScreen) return;
		shown.current = fullScreen;
		onViewChange(fullScreen);
		repaint((count) => count + 1);
	}, [fullScreen, onViewChange]);

	const onCapture = useCallback((capturing: boolean) => setCaptured(capturing), []);

	/** The keys that act on the session or change the view; also what a click on their hint in the sidebar runs. */
	const runKey = (input: string) => {
		switch (input) {
			case 'q':
				return busy ? setConfirmQuit(true) : onQuit();
			case 'r':
				return void service.restart('manual');
			case 'd':
				return void service.disconnect();
			case 'l':
				return show('logs');
			case 'e':
				// The dashboard jumps to the error in its own log pane.
				return base === 'panel' ? show('errors') : undefined;
			case 'c':
				return service.clearLogs();
			case 'o':
				return void openDevUrl(status.url).catch((error: Error) => service.log('stars', 'warn', error.message));
			case 't':
				return void service.toggleTunnel();
			case 'i':
				return show('info');
			case 'T':
				return show('theme');
			case 'v':
				return show(null, base === 'dashboard' ? 'panel' : 'dashboard');
			case 'h':
			case '?':
				return show('help');
			default:
				break;
		}
	};

	useInput((input, key) => {
		if (key.ctrl && input === 'c') return onQuit();
		if (key.ctrl && input === 'l') return service.clearLogs();
		if (overlay !== null || captured) return;
		if (confirmQuit) {
			if (input === 'y') return onQuit();
			return setConfirmQuit(false);
		}
		if (key.ctrl && input === 'r') return void service.restart('manual');
		if (key.ctrl && input === 'd') return busy ? setConfirmQuit(true) : onQuit();
		if (status.prompt && (input === 'y' || input === 'n')) return service.answerPrompt(input === 'y');

		runKey(input);
	});

	return (
		<ThemeProvider color={color} theme={resolveTheme(preview)}>
			<Box width={width} height={height} flexDirection="column" justifyContent={fullScreen ? 'flex-start' : 'flex-end'}>
				{(overlay === 'logs' || overlay === 'errors') && (
					<LogBrowser
						service={service}
						height={height}
						width={width}
						lastError={overlay === 'errors'}
						onCopy={onCopy}
						onClose={() => show(null)}
					/>
				)}
				{overlay === 'help' && <HelpOverlay height={height} width={width} onClose={() => show(null)} />}
				{overlay === 'info' && <InfoOverlay service={service} height={height} width={width} onClose={() => show(null)} />}
				{overlay === 'theme' && (
					<ThemeOverlay
						current={saved}
						height={height}
						width={width}
						onPreview={setPreview}
						onSelect={(setting) => {
							setSaved(setting);
							setPreview(setting);
							onThemeSave(setting);
							show(null);
						}}
						onClose={() => {
							setPreview(saved);
							show(null);
						}}
					/>
				)}
				{base === 'dashboard' && (
					// Kept mounted under an overlay, so the filters and the scroll position survive it.
					<Box display={overlay === null ? 'flex' : 'none'}>
						<Dashboard
							service={service}
							status={status}
							counters={counters}
							{...clock}
							width={width}
							height={height}
							confirmQuit={confirmQuit}
							initialFilter={initialFilter}
							active={overlay === null}
							onCapture={onCapture}
							mouse={mouse}
							onKey={runKey}
						/>
					</Box>
				)}
				{base === 'panel' && overlay === null && (
					<Panel
						status={status}
						config={service.config}
						counters={counters}
						{...clock}
						width={width}
						height={height}
						confirmQuit={confirmQuit}
					/>
				)}
			</Box>
		</ThemeProvider>
	);
}
