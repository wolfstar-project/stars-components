import type { BuilderLogLevel } from '@wolfstar/schema';
import type { ViteModule } from './config.js';
export function createBuildLogger(vite: ViteModule, log: (level: BuilderLogLevel, text: string) => void) {
	const logger = vite.createLogger('warn', { allowClearScreen: false });
	const warned = new Set<string>();
	return {
		...logger,
		info: (text: string) => log('info', text),
		warn: (text: string) => log('warn', text),
		warnOnce(text: string) {
			if (!warned.has(text)) {
				warned.add(text);
				log('warn', text);
			}
		},
		error: (text: string) => log('error', text)
	};
}
