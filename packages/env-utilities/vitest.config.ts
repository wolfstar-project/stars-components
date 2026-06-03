import { readFileSync } from 'node:fs';
import Replace from 'unplugin-replace/vite';
import { defineProject, mergeConfig } from 'vitest/config';
import configShared from '../../vitest.shared.js';

const pkg = JSON.parse(readFileSync(new URL('package.json', import.meta.url), 'utf8'));

export default mergeConfig(
	configShared,
	defineProject({
		plugins: [
			Replace({
				values: [{ find: /\[VI\]\{\{inject\}\}\[\/VI\]/g, replacement: pkg.version }]
			})
		]
	})
);
