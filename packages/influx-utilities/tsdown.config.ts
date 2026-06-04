import { readFileSync } from 'node:fs';
import Replace from 'unplugin-replace/rolldown';
import { createTsdownConfig } from '../../scripts/tsdown.config.js';

const pkg = JSON.parse(readFileSync(new URL('package.json', import.meta.url), 'utf8'));

export default createTsdownConfig({
	cjsOptions: { disabled: true },
	esmOptions: {
		plugins: [
			Replace({
				values: [{ find: /\[VI\]\{\{inject\}\}\[\/VI\]/g, replacement: pkg.version }]
			})
		]
	}
});
