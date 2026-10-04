import type { BooleanString, Env, EnvFromVarlock, IntegerString, NumberString } from '../src/index.js';
import { envParseBoolean, envParseInteger, envParseNumber, envParseString } from '../src/index.js';

/** The shape of the `CoercedEnvSchema` varlock generates with `@generateTsTypes`. */
interface CoercedEnvSchema {
	// Narrower than the `NODE_ENV` of `Env`: the augmentation below must still compile.
	NODE_ENV: 'development' | 'production';
	REDIS_HOST: string;
	REDIS_PORT: number;
	API_ENABLED: boolean;
	MODE: 'fast' | 'safe';
	OPTIONAL_TOKEN?: string;
	OPTIONAL_LIMIT?: number;
	OPTIONAL_FLAG?: boolean;
	LEVEL: '1' | '2';
	TAGS: string[];
}

declare module '../src/index.js' {
	interface Env extends EnvFromVarlock<CoercedEnvSchema> {}
}

describe('EnvFromVarlock', () => {
	test('maps varlock types to their string form', () => {
		type Mapped = EnvFromVarlock<CoercedEnvSchema>;

		expectTypeOf<Mapped['REDIS_HOST']>().toEqualTypeOf<string>();
		expectTypeOf<Mapped['MODE']>().toEqualTypeOf<'fast' | 'safe'>();
		expectTypeOf<Mapped['API_ENABLED']>().toEqualTypeOf<BooleanString>();
		expectTypeOf<Mapped['REDIS_PORT']>().toEqualTypeOf<IntegerString & NumberString>();
	});

	test('leaves `NODE_ENV` to `Env`', () => {
		expectTypeOf<keyof EnvFromVarlock<CoercedEnvSchema>>().not.toExtend<'NODE_ENV'>();
		expectTypeOf<Env['NODE_ENV']>().toEqualTypeOf<'test' | 'development' | 'production'>();
	});

	test('widens an enum of numeric-looking values so it stays a string key', () => {
		expectTypeOf(envParseString).toBeCallableWith('LEVEL');
		// @ts-expect-error `LEVEL` is a string key, not a number key
		envParseInteger('LEVEL');
		// @ts-expect-error `LEVEL` is a string key, not a number key
		envParseNumber('LEVEL');
	});

	test('maps anything else, like an array, to a plain string', () => {
		expectTypeOf<EnvFromVarlock<CoercedEnvSchema>['TAGS']>().toEqualTypeOf<string>();
	});

	test('keeps optional keys optional', () => {
		type Mapped = EnvFromVarlock<CoercedEnvSchema>;

		expectTypeOf<Mapped['OPTIONAL_TOKEN']>().toEqualTypeOf<string | undefined>();
		expectTypeOf<Mapped['OPTIONAL_LIMIT']>().toEqualTypeOf<(IntegerString & NumberString) | undefined>();
		expectTypeOf<{} extends Pick<Mapped, 'OPTIONAL_TOKEN'> ? true : false>().toEqualTypeOf<true>();
		expectTypeOf<{} extends Pick<Mapped, 'REDIS_HOST'> ? true : false>().toEqualTypeOf<false>();
	});

	test('type-checks the envParse* functions through the `Env` augmentation', () => {
		expectTypeOf(envParseString).toBeCallableWith('REDIS_HOST');
		expectTypeOf(envParseString).toBeCallableWith('OPTIONAL_TOKEN');
		expectTypeOf(envParseBoolean).toBeCallableWith('API_ENABLED', true);
		expectTypeOf(envParseInteger).toBeCallableWith('REDIS_PORT');
		expectTypeOf(envParseNumber).toBeCallableWith('REDIS_PORT');
		expectTypeOf(envParseInteger).toBeCallableWith('OPTIONAL_LIMIT');
	});

	test('rejects keys of the wrong kind or missing from the schema', () => {
		// @ts-expect-error a number key is not a string key
		envParseString('REDIS_PORT');
		// @ts-expect-error a boolean key is not a string key
		envParseString('API_ENABLED');
		// @ts-expect-error a string key is not a boolean key
		envParseBoolean('REDIS_HOST');
		// @ts-expect-error a string key is not an integer key
		envParseInteger('REDIS_HOST');
		// @ts-expect-error an optional number key is not a string key either
		envParseString('OPTIONAL_LIMIT');
		// @ts-expect-error an optional boolean key is not a string key either
		envParseString('OPTIONAL_FLAG');
		// @ts-expect-error unknown keys stay rejected
		envParseString('NOT_IN_THE_SCHEMA');
	});
});
