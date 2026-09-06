import { Box, useInput, useWindowSize } from 'ink';
import { useState } from 'react';
import type { DevService } from '../../lib/dev-service.js';
import { HelpOverlay } from './components/HelpOverlay.js';
import { LogBrowser } from './components/LogBrowser.js';
import { InfoOverlay } from './components/InfoOverlay.js';
import { Panel } from './components/Panel.js';
import { useDevStatus } from './hooks/useDevStatus.js';
import { useLogCounters } from './hooks/useLogCounters.js';
import { useBuildClock } from './hooks/useBuildClock.js';
import { describeBadge } from '../panel-logic.js';
import { openDevUrl } from '../../lib/open-url.js';
import { ColorProvider } from './theme.js';

export interface DevAppProps {
	service: DevService;
	color: boolean;
	reducedMotion: boolean;
	/** Called when the user asks to quit, so the CLI can stop the bot and exit. */
	onQuit: () => void;
	onViewChange: (overlay: boolean) => void;
	onCopy: (text: string) => void;
}

type View = 'panel' | 'logs' | 'errors' | 'help' | 'info';

/**
 * A bottom-aligned panel in the normal buffer, with logs folded away. Only the browsable overlays use the
 * alternate screen, preserving the terminal's history and the panel when they close.
 */
export function DevApp({ service, color, reducedMotion, onQuit, onViewChange, onCopy }: DevAppProps) {
	const { columns, rows } = useWindowSize();
	const [view, setView] = useState<View>('panel');
	const [confirmQuit, setConfirmQuit] = useState(false);

	const status = useDevStatus(service);
	const counters = useLogCounters(service);
	const badge = describeBadge(status).badge;
	const busy = badge !== 'ready' && badge !== 'error';
	const clock = useBuildClock(status.progress.startedAt, busy && view === 'panel', reducedMotion);

	const width = Math.max(1, columns);
	const height = Math.max(2, rows - 1);

	const changeView = (next: View) => {
		onViewChange(next !== 'panel');
		setView(next);
	};

	useInput((input, key) => {
		if (key.ctrl && input === 'c') return onQuit();
		if (key.ctrl && input === 'l') return service.clearLogs();
		if (view !== 'panel') return;
		if (confirmQuit) {
			if (input === 'y') return onQuit();
			return setConfirmQuit(false);
		}
		if (key.ctrl && input === 'r') return void service.restart('manual');
		if (key.ctrl && input === 'd') return busy ? setConfirmQuit(true) : onQuit();

		switch (input) {
			case 'q':
				return busy ? setConfirmQuit(true) : onQuit();
			case 'r':
				return void service.restart('manual');
			case 'l':
				return changeView('logs');
			case 'e':
				return changeView('errors');
			case 'c':
				return service.clearLogs();
			case 'o':
				return void openDevUrl(status.url).catch((error: Error) => service.log('stars', 'warn', error.message));
			case 'i':
				return changeView('info');
			case 'h':
			case '?':
				return changeView('help');
			default:
				break;
		}
	});

	return (
		<ColorProvider color={color}>
			<Box width={width} height={height} flexDirection="column" justifyContent={view === 'panel' ? 'flex-end' : 'flex-start'}>
				{(view === 'logs' || view === 'errors') && (
					<LogBrowser
						service={service}
						height={height}
						width={width}
						lastError={view === 'errors'}
						onCopy={onCopy}
						onClose={() => changeView('panel')}
					/>
				)}
				{view === 'help' && <HelpOverlay height={height} width={width} onClose={() => changeView('panel')} />}
				{view === 'info' && <InfoOverlay service={service} height={height} width={width} onClose={() => changeView('panel')} />}
				{view === 'panel' && (
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
		</ColorProvider>
	);
}
