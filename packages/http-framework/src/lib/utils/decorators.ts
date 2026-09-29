/**
 * Utility to make a method decorator from a function.
 *
 * @remarks The decorator is returned with the signature it was given, rather than widened to `MethodDecorator`, so a
 * decorator built on top of this keeps whatever constraint it declares on its target.
 * @remarks Internal to the `Register*` decorators; the public counterpart lives in `@wolfstar/decorators`.
 * @param fn The method to decorate.
 * @returns The decorator.
 * @internal
 */
export function createMethodDecorator<TFunction extends (...args: any[]) => unknown>(fn: TFunction): TFunction {
	return fn;
}

/**
 * Utility to make a class decorator from a function.
 *
 * @remarks The decorator is returned with the signature it was given, rather than widened to `ClassDecorator`, so a
 * decorator built on top of this keeps whatever constraint it declares on its target. This is what lets
 * {@linkcode RegisterCommand} and its siblings reject a target that is not a `Command`.
 * @remarks Internal to the `Register*` decorators; the public counterpart lives in `@wolfstar/decorators`.
 * @param fn The class to decorate.
 * @returns The decorator.
 * @internal
 */
export function createClassDecorator<TFunction extends (...args: any[]) => unknown>(fn: TFunction): TFunction {
	return fn;
}
