import type { LoaderPieceContext, PieceOptions } from '@wolfstar/http-framework';
import { createClassDecorator, createProxy } from './utils/decorators.js';

/**
 * The constructor signature shared by every `Piece` of `@wolfstar/http-framework`, such as `Command`, `Listener`, and
 * `InteractionHandler`.
 */
export type PieceConstructor<Options extends PieceOptions = PieceOptions> = new (context: LoaderPieceContext, options?: Options) => unknown;

/**
 * Decorator that sets the options of a `Piece`, such as a `Command`, a `Listener`, or an `InteractionHandler`.
 *
 * @remarks The options are merged on top of the ones the piece was constructed with, so a piece that also passes
 * options through `super(context, options)` will have the decorator's values win on conflicting keys.
 * @param optionsOrFn The options to pass to the piece's constructor, or a function that builds them from the loader
 * context.
 * @returns A class decorator.
 * @example
 * ```typescript
 * import { Command, RegisterCommand } from '@wolfstar/http-framework';
 * import { ApplyOptions } from '@wolfstar/http-framework-decorators';
 *
 * (at)ApplyOptions<Command.Options>({ name: 'ping', enabled: true })
 * (at)RegisterCommand({ name: 'ping', description: 'A simple ping pong command' })
 * export class UserCommand extends Command {
 * 	public override chatInputRun(interaction: Command.ChatInputInteraction) {
 * 		return interaction.reply({ content: 'Pong!' });
 * 	}
 * }
 * ```
 * @example
 * ```typescript
 * (at)ApplyOptions<Command.Options>(({ name }) => ({ name: name.toLowerCase() }))
 * export class UserCommand extends Command {}
 * ```
 */
export function ApplyOptions<Options extends PieceOptions = PieceOptions>(
	optionsOrFn: Options | ((context: LoaderPieceContext) => Options)
): ClassDecorator {
	return createClassDecorator((target: PieceConstructor<Options>) =>
		createProxy(target, {
			construct: (ctor, [context, baseOptions]: [LoaderPieceContext, Options | undefined]) =>
				new ctor(context, {
					...baseOptions,
					...(typeof optionsOrFn === 'function' ? optionsOrFn(context) : optionsOrFn)
				}) as object
		})
	);
}
