export interface PromptWaiter {
	ownerId: string;
	wrongUserReply: string;
	resolve(action: string): void;
}

const waiters = new Map<string, PromptWaiter>();

/**
 * The prompts waiting for an answer in this process, by session id.
 * @internal
 */
export function getPromptWaiters(): Map<string, PromptWaiter> {
	return waiters;
}
