import { ViteBuilder as ServerBuilder } from '@wolfstar/vite-server';
import type { ResolvedStarsConfig } from '@wolfstar/schema';
import { pluginRegistrations } from '../utils/plugin-registrations.js';
import { importFromProject } from '../utils/project.js';

/** Connect the server integration to the CLI's diagnostics and plugin discovery. */
export class ViteBuilder extends ServerBuilder {
	public constructor(config: ResolvedStarsConfig) {
		super(config, { importFromProject, pluginRegistrations });
	}
}
