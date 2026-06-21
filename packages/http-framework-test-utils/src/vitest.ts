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

function deepEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (a === null || b === null || a === undefined || b === undefined) return a === b;
	if (typeof a !== typeof b) return false;
	if (typeof a !== 'object') return false;

	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		return a.every((item, index) => deepEqual(item, b[index]));
	}

	if (Array.isArray(a) !== Array.isArray(b)) return false;

	const keysA = Object.keys(a as object);
	const keysB = Object.keys(b as object);
	if (keysA.length !== keysB.length) return false;

	return keysA.every((key) => deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
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
		const pass = deepEqual(actual, expected);
		return {
			pass,
			message: () => `expected JSON body ${JSON.stringify(actual)} to${pass ? ' not' : ''} equal ${JSON.stringify(expected)}`
		};
	}
} satisfies Parameters<ExpectStatic['extend']>[0];
