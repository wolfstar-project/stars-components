import { Enumerable, EnumerableMethod } from '../../src/index.js';

describe('Enumerable', () => {
	class Container {
		@Enumerable(false)
		declare public hidden: string;

		@Enumerable(true)
		declare public shown: string;

		public constructor() {
			this.hidden = 'hidden';
			this.shown = 'shown';
		}
	}

	test('GIVEN false THEN the property is not enumerable', () => {
		const container = new Container();
		expect(Object.keys(container)).toEqual(['shown']);
		expect(container.hidden).toBe('hidden');
	});

	test('GIVEN true THEN the property is enumerable', () => {
		const container = new Container();
		expect(Object.getOwnPropertyDescriptor(container, 'shown')).toMatchObject({ enumerable: true, writable: true, value: 'shown' });
	});
});

describe('EnumerableMethod', () => {
	class Container {
		@EnumerableMethod(true)
		public shown() {
			return 'shown';
		}

		@EnumerableMethod(false)
		public hidden() {
			return 'hidden';
		}
	}

	test('GIVEN true THEN the method is enumerable on the prototype', () => {
		expect(Object.getOwnPropertyDescriptor(Container.prototype, 'shown')).toMatchObject({ enumerable: true });
	});

	test('GIVEN false THEN the method is not enumerable on the prototype', () => {
		expect(Object.getOwnPropertyDescriptor(Container.prototype, 'hidden')).toMatchObject({ enumerable: false });
	});
});
