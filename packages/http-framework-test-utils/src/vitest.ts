import type { ExpectStatic } from 'vitest';
import type { InteractionResult } from './types.js';

export interface HttpFrameworkMatchers<R = unknown> {
	toHaveStatus(expected: number): R;
	toHaveBody(expected: string): R;
	toHaveJsonBody(expected: unknown): R;
}

declare module 'vitest' {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	interface Assertion<T = any> extends HttpFrameworkMatchers<T> {}
	interface AsymmetricMatchersContaining extends HttpFrameworkMatchers {}
}

export const httpFrameworkMatchers = {
	toHaveStatus(received: InteractionResult, expected: number) {
		const pass = received.statusCode === expected;
		return {
			pass,
			message: () => `expected status ${received.statusCode} to${pass ? ' not' : ''} be ${expected}`
		};
	},
	toHaveBody(received: InteractionResult, expected: string) {
		const pass = received.body === expected;
		return {
			pass,
			message: () => `expected body "${received.body}" to${pass ? ' not' : ''} equal "${expected}"`
		};
	},
	toHaveJsonBody(received: InteractionResult, expected: unknown) {
		const actual = received.json();
		const pass = JSON.stringify(actual) === JSON.stringify(expected);
		return {
			pass,
			message: () => `expected JSON body ${JSON.stringify(actual)} to${pass ? ' not' : ''} equal ${JSON.stringify(expected)}`
		};
	}
} satisfies Parameters<ExpectStatic['extend']>[0];
