import { Box, useApp, useInput, useWindowSize } from 'ink';
import { useMemo, useState } from 'react';
import type { DevService } from '../../lib/dev-service.js';
import type { LogLevel, LogSource } from '../../lib/log-buffer.js';
import { Footer } from './components/Footer.js';
import { Header } from './components/Header.js';
import { HelpCard } from './components/HelpCard.js';
import { LogView } from './components/LogView.js';
import { StatusBar } from './components/StatusBar.js';
import { useDevStatus } from './hooks/useDevStatus.js';
import { useLogs } from './hooks/useLogs.js';
import { useSpinner } from './hooks/useSpinner.js';
import { useUptime } from './hooks/useUptime.js';
import { ColorProvider } from './theme.js';

const SOURCE_FILTERS: (LogSource | null)[] = [null, 'app', 'build', 'tsc', 'tunnel', 'stars'];
const LEVEL_FILTERS: (LogLevel | null)[] = [null, 'warn', 'error'];

export interface DevAppProps {
	service: DevService;
	color: boolean;
	reducedMotion: boolean;
	/** Called when the user asks to quit, so the CLI can stop the bot and exit. */
	onQuit: () => void;
}

/**
 * The interactive `stars dev` UI. It owns nothing but the view state (filters, scrolling, help): the bot, the build
 * and the logs all live in {@link DevService}, which this only subscribes to.
 */
export function DevApp({ service, color, reducedMotion, onQuit }: DevAppProps) {
	const { exit } = useApp();
	const { columns, rows } = useWindowSize();
	const [sourceIndex, setSourceIndex] = useState(0);
	const [levelIndex, setLevelIndex] = useState(0);
	const [scroll, setScroll] = useState(0);
	const [help, setHelp] = useState(false);

	const status = useDevStatus(service);
	const uptime = useUptime(status.startedAt);
	const spinning = status.build === 'building' || status.process === 'starting' || status.tunnel === 'starting';
	const spinner = useSpinner(spinning, reducedMotion);

	const filter = useMemo(
		() => ({ source: SOURCE_FILTERS[sourceIndex] ?? null, level: LEVEL_FILTERS[levelIndex] ?? null }),
		[sourceIndex, levelIndex]
	);
	const entries = useLogs(service, filter);

	const width = Math.max(20, columns);
	const height = Math.max(6, rows);
	const narrow = width < 60;
	// Header, status bar and footer are fixed; the log view takes whatever is left.
	const bodyHeight = Math.max(1, height - (width < 40 ? 3 : 4));
	const maxScroll = Math.max(0, entries.length - bodyHeight);
	const clamped = Math.min(scroll, maxScroll);

	const quit = () => {
		onQuit();
		exit();
	};

	useInput((input, key) => {
		if (key.ctrl && input === 'c') return quit();
		if (key.escape) return help ? setHelp(false) : quit();

		switch (input) {
			case 'q':
				return quit();
			case 'r':
				return void service.restart('manual');
			case 'c':
				return service.clearLogs();
			case 'f':
				return setSourceIndex((current) => (current + 1) % SOURCE_FILTERS.length);
			case 'e':
				return setLevelIndex((current) => (current + 1) % LEVEL_FILTERS.length);
			case 'h':
			case '?':
				return setHelp((current) => !current);
			case 'j':
				return setScroll((current) => Math.max(0, current - 1));
			case 'k':
				return setScroll((current) => Math.min(maxScroll, current + 1));
			default:
				break;
		}

		if (key.downArrow) return setScroll((current) => Math.max(0, current - 1));
		if (key.upArrow) return setScroll((current) => Math.min(maxScroll, current + 1));
		if (key.pageDown) return setScroll((current) => Math.max(0, current - bodyHeight));
		if (key.pageUp) return setScroll((current) => Math.min(maxScroll, current + bodyHeight));
		if (key.end) return setScroll(0);
	});

	return (
		<ColorProvider color={color}>
			<Box flexDirection="column" width={width} height={height}>
				<Header name={projectName(service)} status={status} uptime={uptime} spinner={spinner} narrow={narrow} />
				<StatusBar config={service.config} status={status} spinner={spinner} narrow={narrow} />
				{help ? <HelpCard height={bodyHeight} /> : <LogView entries={entries} height={bodyHeight} scroll={clamped} showTime={!narrow} />}
				<Footer width={width} source={filter.source} level={filter.level} scroll={clamped} />
			</Box>
		</ColorProvider>
	);
}

function projectName(service: DevService): string {
	return service.config.packageJson?.name ?? 'stars project';
}
