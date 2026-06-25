import type { ClientOptions } from '@wolfstar/http-framework';
import { InteractionTestRunner } from './InteractionTestRunner.js';
import { TestableClient } from './TestableClient.js';

export function createTestHarness(options: Partial<ClientOptions> = {}) {
	const client = new TestableClient(options);
	const runner = new InteractionTestRunner(client);
	return { client, runner };
}

export type TestHarness = ReturnType<typeof createTestHarness>;
