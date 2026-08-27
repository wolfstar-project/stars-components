/**
 * Utility to make a method decorator from a function.
 *
 * @param fn The method to decorate.
 * @returns The decorator.
 * @example
 * ```typescript
 * // Enumerable function that will not append the property to the prototype:
 * function enumerableMethod(value: boolean) {
 * 	return createMethodDecorator((_target, _propertyKey, descriptor) => {
 * 		descriptor.enumerable = value;
 * 	});
 * }
 * ```
 */
export function createMethodDecorator(fn: MethodDecorator): MethodDecorator {
	return fn;
}

/**
 * Utility to make a class decorator from a function.
 *
 * @param fn The class to decorate.
 * @returns The decorator.
 * @see {@linkcode ApplyOptions}
 */
export function createClassDecorator<TFunction extends (...args: any[]) => void>(fn: TFunction): ClassDecorator {
	return fn;
}

/**
 * Creates a new proxy to efficiently add properties to a class without creating subclasses.
 *
 * @param target The constructor of the class to modify.
 * @param handler The handler function to modify the constructor behavior for the target.
 * @returns The proxy.
 */
export function createProxy<T extends object>(target: T, handler: Omit<ProxyHandler<T>, 'get'>): T {
	return new Proxy(target, {
		...handler,
		get: (proxyTarget, property) => {
			const value = Reflect.get(proxyTarget, property);
			return typeof value === 'function' ? (...args: readonly unknown[]) => value.apply(proxyTarget, args) : value;
		}
	});
}

/**
 * Utility to make a method decorator with lighter syntax and inferred types.
 *
 * @remarks The decorated method is replaced by an `async` one, so it always returns a `Promise`, even when both the
 * precondition and the original method are synchronous.
 * @param precondition The predicate to run before the decorated method. It receives the same arguments as the method
 * and is called with the same `this`.
 * @param fallback The fallback to run when the precondition is not met. Defaults to a no-op returning `undefined`.
 * @returns The decorator.
 * @example
 * ```typescript
 * import { Command, RegisterCommand } from '@wolfstar/http-framework';
 * import { createFunctionPrecondition } from '@wolfstar/http-framework-decorators';
 *
 * const RequiresOwner = createFunctionPrecondition(
 * 	(interaction: Command.ChatInputInteraction) => interaction.user.id === process.env.OWNER_ID,
 * 	(interaction: Command.ChatInputInteraction) => interaction.reply({ content: 'Owner only.' })
 * );
 * ```
 */
export function createFunctionPrecondition(
	precondition: (...args: any[]) => boolean | Promise<boolean>,
	fallback: (...args: any[]) => unknown = () => undefined
): MethodDecorator {
	return createMethodDecorator((_target, _propertyKey, descriptor) => {
		const method = descriptor.value;
		if (!method) throw new Error('Function preconditions require a [[value]].');
		if (typeof method !== 'function') throw new Error('Function preconditions can only be applied to functions.');

		descriptor.value = async function value(this: unknown, ...args: any[]) {
			return (await precondition.apply(this, args)) ? method.apply(this, args) : fallback.apply(this, args);
		} as unknown as undefined;
	});
}
