import { Box, Static, useApp, useInput, useWindowSize } from 'ink';
import { useState } from 'react';
import type { DevService } from '../../lib/dev-service.js';
import { HelpOverlay } from './components/HelpOverlay.js';
import { LogBrowser } from './components/LogBrowser.js';
import { LogLine } from './components/LogLine.js';
import { Panel } from './components/Panel.js';
import { useDevStatus } from './hooks/useDevStatus.js';
import { useLogCounters } from './hooks/useLogCounters.js';
import { useSpinner } from './hooks/useSpinner.js';
import { useStaticLog } from './hooks/useStaticLog.js';
import { useUptime } from './hooks/useUptime.js';
import { ColorProvider } from './theme.js';

export interface DevAppProps {
	service: DevService;
	color: boolean;
	reducedMotion: boolean;
	/** Called when the user asks to quit, so the CLI can stop the bot and exit. */
	onQuit: () => void;
}

type View = 'panel' | 'logs' | 'help';

/**
 * The interactive `stars dev` UI, in the style of Nuxt CLI v4's own dev server: log output streams into the
 * terminal's real scrollback through `<Static>` (never re-rendered, never reformatted), and a compact panel below
 * it — a handful of lines, redrawn as state changes — carries the status Nuxt's own summary/hints blocks show.
 * `l` opens the full, filterable log history and `?` the key reference, both replacing the panel until closed.
 */
export function DevApp({ service, color, reducedMotion, onQuit }: DevAppProps) {
	const { exit } = useApp();
	const { columns, rows } = useWindowSize();
	const [view, setView] = useState<View>('panel');

	const status = useDevStatus(service);
	const uptime = useUptime(status.startedAt);
	const counters = useLogCounters(service);
	const entries = useStaticLog(service);
	const spinning = status.build === 'building' || status.process === 'starting' || status.tunnel === 'starting' || status.typecheck === 'checking';
	const spinner = useSpinner(spinning, reducedMotion);

	const width = Math.max(20, columns);
	const height = Math.max(6, rows);
	const narrow = width < 60;

	const quit = () => {
		onQuit();
		exit();
	};

	useInput((input, key) => {
		if (view !== 'panel') return;
		if (key.ctrl && input === 'c') return quit();

		switch (input) {
			case 'q':
				return quit();
			case 'r':
				return void service.restart('manual');
			case 'l':
				return setView('logs');
			case '?':
				return setView('help');
			default:
				break;
		}
	});

	return (
		<ColorProvider color={color}>
			<Static items={entries}>{(entry) => <LogLine key={entry.id} entry={entry} />}</Static>
			<Box width={width} flexDirection="column">
				{view === 'logs' && <LogBrowser service={service} height={height} onClose={() => setView('panel')} />}
				{view === 'help' && <HelpOverlay height={height} onClose={() => setView('panel')} />}
				{view === 'panel' && (
					<Panel
						name={service.config.packageJson?.name ?? 'stars project'}
						status={status}
						config={service.config}
						uptimeMs={uptime}
						counters={counters}
						spinner={spinner}
						narrow={narrow}
					/>
				)}
			</Box>
		</ColorProvider>
	);
}
