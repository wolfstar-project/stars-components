import { SelectMenuLimits } from '@wolfstar/discord-utilities';
import type { PaginatedMessageSession } from './types.js';

export interface BuiltinActionResult {
	index: number;
	stopped: boolean;
}

/**
 * Computes the effect of a built-in action. `previous` and `next` wrap around.
 * @returns The new state, or `null` when `actionId` is not a built-in action.
 */
export function applyBuiltinAction(
	session: Pick<PaginatedMessageSession, 'index' | 'pages'>,
	actionId: string,
	values: readonly string[]
): BuiltinActionResult | null {
	const { index } = session;
	const count = session.pages.length;

	switch (actionId) {
		case 'first':
			return { index: 0, stopped: false };
		case 'previous':
			return { index: index === 0 ? count - 1 : index - 1, stopped: false };
		case 'next':
			return { index: index === count - 1 ? 0 : index + 1, stopped: false };
		case 'last':
			return { index: count - 1, stopped: false };
		case 'stop':
			return { index, stopped: true };
		case 'select': {
			const selected = Number(values[0]);
			const valid = Number.isInteger(selected) && selected >= 0 && selected < count;
			return { index: valid ? selected : index, stopped: false };
		}
		default:
			return null;
	}
}

/**
 * The page indexes shown in the page select: a window of `size` pages centred on `index`.
 */
export function selectWindow(count: number, index: number, size: number = SelectMenuLimits.MaximumOptionsLength): number[] {
	const start = Math.min(Math.max(index - Math.floor(size / 2), 0), Math.max(count - size, 0));
	const end = Math.min(count, start + size);
	return Array.from({ length: end - start }, (_, offset) => start + offset);
}
