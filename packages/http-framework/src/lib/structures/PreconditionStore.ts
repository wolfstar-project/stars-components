import { Store } from '@sapphire/pieces';
import { Result } from '@sapphire/result';
import type { UserError } from '../errors/UserError.js';
import { runPrecondition, type PreconditionContext, type PreconditionKind } from '../utils/preconditions.js';
import type { Command } from './Command.js';
import { Precondition } from './Precondition.js';

export class PreconditionStore extends Store<Precondition, 'preconditions'> {
	readonly #globalPreconditions: Precondition[] = [];

	public constructor() {
		super(Precondition, { name: 'preconditions' });
	}

	/**
	 * Runs the global preconditions, the ones with a `position`, in ascending order of it, stopping at the first one
	 * that denies the command.
	 *
	 * @since 6.3.0
	 * @param kind The kind of command being run.
	 * @param interaction The interaction of the command.
	 * @param command The command being run.
	 * @param context The context of the checks.
	 * @returns The first `Err`, or `Result.ok()` when every global precondition lets the command run.
	 */
	public async run(
		kind: PreconditionKind,
		interaction: Command.ApplicationCommandInteraction,
		command: Command,
		context: PreconditionContext = {}
	): Promise<Result<unknown, UserError>> {
		for (const precondition of this.#globalPreconditions) {
			const result = await runPrecondition(precondition, kind, interaction, command, context);
			if (result.isErr()) return result;
		}

		return Result.ok();
	}

	public override set(key: string, value: Precondition): this {
		// A reload replaces the piece under the same name, so the old one must not stay in the list.
		this.#removeGlobal(key);

		if (value.position !== null) {
			const index = this.#globalPreconditions.findIndex((precondition) => precondition.position! >= value.position!);

			// If a precondition with a higher position wasn't found, push to the end of the array
			if (index === -1) this.#globalPreconditions.push(value);
			else this.#globalPreconditions.splice(index, 0, value);
		}

		return super.set(key, value);
	}

	public override delete(key: string): boolean {
		this.#removeGlobal(key);
		return super.delete(key);
	}

	public override clear(): void {
		this.#globalPreconditions.length = 0;
		return super.clear();
	}

	#removeGlobal(key: string): void {
		const index = this.#globalPreconditions.findIndex((precondition) => precondition.name === key);
		if (index !== -1) this.#globalPreconditions.splice(index, 1);
	}
}
