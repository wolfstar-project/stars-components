import type { BaseInteraction } from '../../src/index.js';
import { RequiresDMContext, RequiresGuildContext } from '../../src/index.js';
import { makeFakeInteraction } from './fixtures.js';

const guildInteraction = makeFakeInteraction({ guildId: '737141877803057244' });
const dmInteraction = makeFakeInteraction();

describe('RequiresGuildContext', () => {
	test('GIVEN a guild interaction THEN it runs the method', async () => {
		const fallback = vi.fn();

		class UserCommand {
			@RequiresGuildContext(fallback)
			public chatInputRun(_interaction: BaseInteraction) {
				return 'ran';
			}
		}

		await expect(new UserCommand().chatInputRun(guildInteraction)).resolves.toBe('ran');
		expect(fallback).not.toHaveBeenCalled();
	});

	test('GIVEN a non-guild interaction THEN it runs the fallback with the interaction', async () => {
		const fallback = vi.fn(() => 'fallback');

		class UserCommand {
			@RequiresGuildContext(fallback)
			public chatInputRun(_interaction: BaseInteraction) {
				return 'ran';
			}
		}

		await expect(new UserCommand().chatInputRun(dmInteraction)).resolves.toBe('fallback');
		expect(fallback).toHaveBeenCalledExactlyOnceWith(dmInteraction);
	});

	test('GIVEN no fallback THEN it resolves to undefined', async () => {
		class UserCommand {
			@RequiresGuildContext()
			public chatInputRun(_interaction: BaseInteraction) {
				return 'ran';
			}
		}

		await expect(new UserCommand().chatInputRun(dmInteraction)).resolves.toBeUndefined();
	});
});

describe('RequiresDMContext', () => {
	test('GIVEN a non-guild interaction THEN it runs the method', async () => {
		class UserCommand {
			@RequiresDMContext()
			public chatInputRun(_interaction: BaseInteraction) {
				return 'ran';
			}
		}

		await expect(new UserCommand().chatInputRun(dmInteraction)).resolves.toBe('ran');
	});

	test('GIVEN a guild interaction THEN it runs the fallback', async () => {
		const fallback = vi.fn(() => 'fallback');

		class UserCommand {
			@RequiresDMContext(fallback)
			public chatInputRun(_interaction: BaseInteraction) {
				return 'ran';
			}
		}

		await expect(new UserCommand().chatInputRun(guildInteraction)).resolves.toBe('fallback');
		expect(fallback).toHaveBeenCalledExactlyOnceWith(guildInteraction);
	});
});
