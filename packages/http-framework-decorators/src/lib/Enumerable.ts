/**
 * Decorator that sets the `enumerable` property of a class field to the given value.
 *
 * @remarks The decorator installs a setter on the prototype, which is bypassed by the `Object.defineProperty` call
 * that `useDefineForClassFields` (enabled by `@sapphire/ts-config`, and the default from `ES2022` onwards) emits for
 * class fields. Mark the field as `declare` so no field definition is emitted, and assign it in the constructor.
 * @param value Whether the property should be enumerable or not.
 * @returns A property decorator.
 * @example
 * ```typescript
 * import { Command } from '@wolfstar/http-framework';
 * import { Enumerable } from '@wolfstar/http-framework-decorators';
 *
 * export class UserCommand extends Command {
 * 	(at)Enumerable(false)
 * 	declare public cache: Map<string, string>;
 *
 * 	public constructor(context: Command.LoaderContext, options: Command.Options) {
 * 		super(context, options);
 * 		this.cache = new Map();
 * 	}
 * }
 * ```
 */
export function Enumerable(value: boolean) {
	return (target: unknown, key: string) => {
		Reflect.defineProperty(target as object, key, {
			enumerable: value,
			set(this: unknown, val: unknown) {
				Reflect.defineProperty(this as object, key, {
					configurable: true,
					enumerable: value,
					value: val,
					writable: true
				});
			}
		});
	};
}

/**
 * Decorator that sets the `enumerable` property of a class method to the given value.
 *
 * @param value Whether the method should be enumerable or not.
 * @returns A method decorator.
 * @example
 * ```typescript
 * import { Command } from '@wolfstar/http-framework';
 * import { EnumerableMethod } from '@wolfstar/http-framework-decorators';
 *
 * export class UserCommand extends Command {
 * 	(at)EnumerableMethod(true)
 * 	public getCacheKey(id: string) {
 * 		return `user:${id}`;
 * 	}
 * }
 * ```
 */
export function EnumerableMethod(value: boolean) {
	return (_target: unknown, _key: string, descriptor: PropertyDescriptor) => {
		descriptor.enumerable = value;
	};
}
