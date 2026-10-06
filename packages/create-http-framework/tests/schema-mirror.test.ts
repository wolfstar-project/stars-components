import { LATEST_COMPATIBILITY_VERSION, SPLIT_TSCONFIG_VERSION as SCHEMA_SPLIT_TSCONFIG_VERSION } from '../../schema/src/config/compatibility.js';
import { GENERATED_COMPATIBILITY_VERSION, SPLIT_TSCONFIG_VERSION } from '../src/tools/projectFiles.js';

// The scaffold does not depend on `@wolfstar/schema`, so it keeps its own copies of two of its constants.
describe('@wolfstar/schema mirror', () => {
	test('generates for the latest compatibility version', () => {
		expect(GENERATED_COMPATIBILITY_VERSION).toBe(LATEST_COMPATIBILITY_VERSION);
	});

	test('splits the tsconfig from the version the CLI does', () => {
		expect(SPLIT_TSCONFIG_VERSION).toBe(SCHEMA_SPLIT_TSCONFIG_VERSION);
	});
});
