import { generateKeyPairSync, sign } from 'node:crypto';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import type { Bench } from 'tinybench';
import { StringIdParser } from '../packages/http-framework/src/lib/components/StringIdParser.js';
import {
	transformAutocompleteInteraction,
	transformInteraction
} from '../packages/http-framework/src/lib/interactions/resolvers/InteractionOptions.js';
import {
	getMissingPermissions,
	resolvePermissions,
	toPermissionNames,
	type PermissionResolvable
} from '../packages/http-framework/src/lib/utils/permissions.js';
import { makeKey, verifyBody } from '../packages/http-framework/src/lib/utils/security.js';
import { autocompleteOptions, flatOptions, nestedOptions, resolved } from './fixtures.js';

const customIds = [
	'ping',
	'role-menu.737141877803057245',
	'paginate.266624760782258186.3.next',
	'poll.vote.1.2.3.4.5.6.7.8',
	'modal..empty..segments.'
];

const permissionList: PermissionResolvable = [
	'BanMembers',
	'KickMembers',
	['ManageMessages', 'ManageChannels', [PermissionFlagsBits.ViewChannel, 'SendMessages']],
	'ModerateMembers',
	PermissionFlagsBits.EmbedLinks
];

// Build a signed payload, the same way Discord sends interactions to an HTTP-only bot.
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const rawPublicKey = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('hex');
const body = JSON.stringify({ type: 1, id: '1', application_id: '2', token: 't', version: 1 });
const timestamp = '1700000000';
const signature = sign(null, Buffer.from(`${timestamp}${body}`), privateKey).toString('hex');

export function register(bench: Bench) {
	const parser = new StringIdParser();

	bench
		.add('http-framework: StringIdParser#run', () => {
			for (const id of customIds) parser.run(id);
		})
		.add('http-framework: resolvePermissions (nested list)', () => {
			resolvePermissions(permissionList);
		})
		.add('http-framework: getMissingPermissions + toPermissionNames', () => {
			toPermissionNames(
				getMissingPermissions(PermissionFlagsBits.SendMessages | PermissionFlagsBits.ViewChannel, resolvePermissions(permissionList))
			);
		})
		.add('http-framework: transformInteraction (flat options)', () => {
			transformInteraction(resolved, flatOptions);
		})
		.add('http-framework: transformInteraction (subcommand group)', () => {
			transformInteraction(resolved, nestedOptions);
		})
		.add('http-framework: transformAutocompleteInteraction', () => {
			transformAutocompleteInteraction(resolved, autocompleteOptions);
		});
}

/**
 * Registers the benchmarks that exercise asynchronous code, they are run separately from the synchronous ones.
 */
export async function registerAsync(bench: Bench) {
	const key = await makeKey(rawPublicKey);

	bench.add('http-framework: verifyBody (Ed25519)', async () => {
		const valid = await verifyBody(body, signature, timestamp, key);
		if (!valid) throw new Error('Signature verification failed');
	});
}
