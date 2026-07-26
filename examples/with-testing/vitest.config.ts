import { defineProject } from 'vitest/config';

export default defineProject({
	test: {
		name: 'with-testing',
		include: ['tests/**/*.test.ts'],
		setupFiles: ['./vitest.setup.ts']
	}
});
