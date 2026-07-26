import { defineConfig } from 'tsdown';
import { createTsdownOptions } from '../../scripts/tsdown.config';

export default defineConfig(
	createTsdownOptions({
		cjsOptions: { disabled: true },
		entry: ['src/index.ts', 'src/adapters/fetch/index.ts', 'src/adapters/bun/index.ts', 'src/adapters/cloudflare/index.ts']
	})
);
