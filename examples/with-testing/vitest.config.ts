import { defineProject, mergeConfig } from 'vitest/config';
import configShared from '../../vitest.shared.js';

export default mergeConfig(
	configShared,
	defineProject({
		test: {
			name: 'with-testing',
			include: ['tests/**/*.test.ts'],
			setupFiles: ['./vitest.setup.ts']
		}
	})
);
