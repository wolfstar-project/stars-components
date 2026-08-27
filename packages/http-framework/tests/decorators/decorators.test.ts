import { createFunctionPrecondition, createProxy } from '../../src/index.js';

describe('createProxy', () => {
	test('GIVEN a construct trap THEN it intercepts instantiation', () => {
		class Base {
			public constructor(public readonly value: number) {}
		}

		const Proxied = createProxy(Base, {
			construct: (ctor, [value]: [number]) => new ctor(value * 2)
		});

		expect(new Proxied(21).value).toBe(42);
	});

	test('GIVEN a static method THEN it is bound to the original target', () => {
		class Base {
			public static readonly value = 'foo';

			public static getValue() {
				return this.value;
			}
		}

		const Proxied = createProxy(Base, {});
		const { getValue } = Proxied;
		expect(getValue()).toBe('foo');
	});
});

describe('createFunctionPrecondition', () => {
	test('GIVEN a met precondition THEN it runs the method', async () => {
		const fallback = vi.fn();

		class Container {
			@createFunctionPrecondition(() => true, fallback)
			public run(value: number) {
				return value + 1;
			}
		}

		await expect(new Container().run(1)).resolves.toBe(2);
		expect(fallback).not.toHaveBeenCalled();
	});

	test('GIVEN an unmet precondition THEN it runs the fallback with the same arguments', async () => {
		const method = vi.fn();
		const fallback = vi.fn((value: number) => value - 1);

		class Container {
			@createFunctionPrecondition(() => false, fallback)
			public run(value: number) {
				return method(value);
			}
		}

		await expect(new Container().run(1)).resolves.toBe(0);
		expect(method).not.toHaveBeenCalled();
		expect(fallback).toHaveBeenCalledExactlyOnceWith(1);
	});

	test('GIVEN an asynchronous precondition THEN it is awaited', async () => {
		class Container {
			@createFunctionPrecondition(() => Promise.resolve(false), () => 'fallback')
			public run() {
				return 'method';
			}
		}

		await expect(new Container().run()).resolves.toBe('fallback');
	});

	test('GIVEN a precondition THEN it receives the instance as this', async () => {
		class Container {
			public readonly allowed: boolean = true;

			@createFunctionPrecondition(function (this: Container) {
				return this.allowed;
			})
			public run() {
				return 'method';
			}
		}

		await expect(new Container().run()).resolves.toBe('method');
	});

	test('GIVEN a non-function member THEN it throws', () => {
		expect(() => createFunctionPrecondition(() => true)({}, 'foo', { value: 'not-a-function' } as PropertyDescriptor)).toThrowError(
			'Function preconditions can only be applied to functions.'
		);
	});

	test('GIVEN a descriptor without a value THEN it throws', () => {
		expect(() => createFunctionPrecondition(() => true)({}, 'foo', {} as PropertyDescriptor)).toThrowError(
			'Function preconditions require a [[value]].'
		);
	});
});
