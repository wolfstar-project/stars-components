import { ButtonStyle, ComponentType } from 'discord-api-types/v10';
import { applyBuiltinAction, selectWindow } from '../src/lib/PaginatedMessage/state.js';
import { renderComponents } from '../src/lib/PaginatedMessage/render.js';
import type { PaginatedMessageActionData } from '../src/lib/PaginatedMessage/types.js';

const pages = (count: number) => Array.from({ length: count }, (_, i) => ({ content: `page ${i}` }));

describe('applyBuiltinAction', () => {
	const session = { index: 1, pages: pages(3) };

	test.each([
		['first', 0],
		['previous', 0],
		['next', 2],
		['last', 2]
	])('GIVEN %s THEN moves to %i', (action, index) => {
		expect(applyBuiltinAction(session, action, [])).toEqual({ index, stopped: false });
	});

	test('previous and next wrap around', () => {
		expect(applyBuiltinAction({ index: 0, pages: pages(3) }, 'previous', [])).toEqual({ index: 2, stopped: false });
		expect(applyBuiltinAction({ index: 2, pages: pages(3) }, 'next', [])).toEqual({ index: 0, stopped: false });
	});

	test('stop keeps the index and stops', () => {
		expect(applyBuiltinAction(session, 'stop', [])).toEqual({ index: 1, stopped: true });
	});

	test('select reads the selected value and ignores invalid ones', () => {
		expect(applyBuiltinAction(session, 'select', ['2'])).toEqual({ index: 2, stopped: false });
		expect(applyBuiltinAction(session, 'select', ['9'])).toEqual({ index: 1, stopped: false });
		expect(applyBuiltinAction(session, 'select', ['x'])).toEqual({ index: 1, stopped: false });
	});

	test('unknown actions return null', () => {
		expect(applyBuiltinAction(session, 'custom', [])).toBeNull();
	});
});

describe('selectWindow', () => {
	test('GIVEN fewer pages than the window THEN returns all', () => {
		expect(selectWindow(3, 1)).toEqual([0, 1, 2]);
	});

	test('GIVEN many pages THEN centres the window on the index, clamped', () => {
		expect(selectWindow(100, 50)).toEqual(Array.from({ length: 25 }, (_, i) => 38 + i));
		expect(selectWindow(100, 0)).toEqual(Array.from({ length: 25 }, (_, i) => i));
		expect(selectWindow(100, 99)).toEqual(Array.from({ length: 25 }, (_, i) => 75 + i));
	});
});

describe('renderComponents', () => {
	const actions: PaginatedMessageActionData[] = [
		{ id: 'previous', type: 'button', emoji: { name: '◀️' } },
		{ id: 'next', type: 'button', emoji: { name: '▶️' } },
		{ id: 'stop', type: 'button', style: ButtonStyle.Danger, emoji: { name: '⏹️' } },
		{ id: 'select', type: 'select' }
	];

	test('GIVEN several pages THEN renders a button row and a page select', () => {
		const rows = renderComponents('abcDEF123456', { index: 1, pages: pages(3), actions });
		expect(rows).toHaveLength(2);
		expect(rows[0]!.components.map((component) => (component as { custom_id: string }).custom_id)).toEqual([
			'wolfstar-pm.abcDEF123456.previous',
			'wolfstar-pm.abcDEF123456.next',
			'wolfstar-pm.abcDEF123456.stop'
		]);
		expect(rows[0]!.components[0]).toMatchObject({ type: ComponentType.Button, style: ButtonStyle.Primary });
		expect(rows[1]!.components[0]).toMatchObject({
			type: ComponentType.StringSelect,
			custom_id: 'wolfstar-pm.abcDEF123456.select',
			options: [
				{ label: 'Page 1', value: '0', default: false },
				{ label: 'Page 2', value: '1', default: true },
				{ label: 'Page 3', value: '2', default: false }
			]
		});
	});

	test('GIVEN a single page THEN renders no select', () => {
		expect(renderComponents('abcDEF123456', { index: 0, pages: pages(1), actions })).toHaveLength(1);
	});

	test('GIVEN disabled THEN every component is disabled', () => {
		const rows = renderComponents('abcDEF123456', { index: 0, pages: pages(3), actions }, { disabled: true });
		expect(rows.flatMap((row) => row.components).every((component) => (component as { disabled?: boolean }).disabled)).toBe(true);
	});

	test('GIVEN more than five buttons THEN wraps into rows of five, at most four rows', () => {
		const many = Array.from({ length: 12 }, (_, i): PaginatedMessageActionData => ({ id: `a${i}`, type: 'button', label: `${i}` }));
		expect(renderComponents('abcDEF123456', { index: 0, pages: pages(1), actions: many }).map((row) => row.components.length)).toEqual([5, 5, 2]);
		const tooMany = Array.from({ length: 21 }, (_, i): PaginatedMessageActionData => ({ id: `a${i}`, type: 'button', label: `${i}` }));
		expect(() => renderComponents('abcDEF123456', { index: 0, pages: pages(1), actions: tooMany })).toThrow(RangeError);
	});
});
