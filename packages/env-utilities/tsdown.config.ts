import { readFileSync } from 'node:fs';
import Replace from 'unplugin-replace/rolldown';
import { createTsdownConfig } from '../../scripts/tsdown.config.js';

const pkg = JSON.parse(readFileSync(new URL('package.json', import.meta.url), 'utf8'));

const versionReplace = Replace({
	values: [{ find: /\[VI\]\{\{inject\}\}\[\/VI\]/g, replacement: pkg.version }]
});

export default createTsdownConfig({
	entry: ['src/index.ts', 'src/setup.ts'],
	cjsOptions: { plugins: [versionReplace] },
	esmOptions: { plugins: [versionReplace] }
});
