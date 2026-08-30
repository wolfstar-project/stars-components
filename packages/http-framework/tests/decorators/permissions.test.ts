import { PermissionFlagsBits } from 'discord-api-types/v10';
import { getMissingPermissions, resolvePermissions, toPermissionNames } from '../../src/index.js';

describe('resolvePermissions', () => {
	test('GIVEN bigint THEN returns it unchanged', () => {
		expect(resolvePermissions(PermissionFlagsBits.BanMembers)).toBe(PermissionFlagsBits.BanMembers);
	});

	test('GIVEN permission name THEN returns its bit', () => {
		expect(resolvePermissions('BanMembers')).toBe(PermissionFlagsBits.BanMembers);
	});

	test('GIVEN nested array THEN returns the combined bitfield', () => {
		expect(resolvePermissions(['BanMembers', [PermissionFlagsBits.KickMembers, ['ManageMessages']]])).toBe(
			PermissionFlagsBits.BanMembers | PermissionFlagsBits.KickMembers | PermissionFlagsBits.ManageMessages
		);
	});

	test('GIVEN empty array THEN returns 0n', () => {
		expect(resolvePermissions([])).toBe(0n);
	});

	test('GIVEN unknown permission name THEN throws TypeError', () => {
		// @ts-expect-error: testing the runtime guard against invalid input
		expect(() => resolvePermissions('NotAPermission')).toThrowError(new TypeError('Unknown permission flag: NotAPermission'));
	});
});

describe('getMissingPermissions', () => {
	test('GIVEN all required permissions THEN returns 0n', () => {
		expect(getMissingPermissions(PermissionFlagsBits.BanMembers | PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers)).toBe(0n);
	});

	test('GIVEN missing permissions THEN returns only the missing bits', () => {
		expect(getMissingPermissions(PermissionFlagsBits.BanMembers, PermissionFlagsBits.BanMembers | PermissionFlagsBits.KickMembers)).toBe(
			PermissionFlagsBits.KickMembers
		);
	});

	test('GIVEN Administrator THEN returns 0n', () => {
		expect(getMissingPermissions(PermissionFlagsBits.Administrator, PermissionFlagsBits.BanMembers)).toBe(0n);
	});
});

describe('toPermissionNames', () => {
	test('GIVEN bitfield THEN returns the contained names', () => {
		expect(toPermissionNames(PermissionFlagsBits.BanMembers | PermissionFlagsBits.KickMembers).toSorted()).toEqual(['BanMembers', 'KickMembers']);
	});

	test('GIVEN 0n THEN returns an empty array', () => {
		expect(toPermissionNames(0n)).toEqual([]);
	});
});
