import * as config from '../config.js';
import * as schema from '../schema.js';
import * as shared from '@wolfstar/schema';

describe('configuration facades', () => {
	test('preserve every shared schema export and its identity', () => {
		expect(Object.keys(config).sort()).toEqual(Object.keys(shared).sort());
		expect(Object.keys(schema).sort()).toEqual(Object.keys(shared).sort());
		for (const key of Object.keys(shared) as (keyof typeof shared)[]) {
			expect(config[key]).toBe(shared[key]);
			expect(schema[key]).toBe(shared[key]);
		}
	});
});
