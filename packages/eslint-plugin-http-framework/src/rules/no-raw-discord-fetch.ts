import type { Rule } from 'eslint';

const discordHosts = ['discord.com/api', 'discordapp.com/api', 'ptb.discord.com/api', 'canary.discord.com/api'];

/**
 * Reads a static string out of a node, supporting plain literals and template literals without expressions.
 *
 * @param node - The AST node to read.
 * @returns The static string value, or `null` when the node is not statically known.
 */
function getStaticString(node: {
	type: string;
	value?: unknown;
	quasis?: { value: { cooked?: string | null } }[];
	expressions?: unknown[];
}): string | null {
	if (node.type === 'Literal') return typeof node.value === 'string' ? node.value : null;

	if (node.type === 'TemplateLiteral') {
		return (node.quasis ?? []).map((quasi) => quasi.value.cooked ?? '').join('');
	}

	return null;
}

/**
 * Bans calling the Discord HTTP API directly instead of going through the framework's shared REST client.
 *
 * `@wolfstar/http-framework` routes every Discord request through `container.rest`, which carries the bot token,
 * rate-limit handling and instrumentation. A hand-rolled `fetch` bypasses all of it.
 */
const rule: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'ban direct calls to the Discord HTTP API, use `container.rest` instead',
			recommended: true
		},
		messages: {
			rawFetch:
				'Do not call the Discord API directly; use `container.rest` so the request keeps the bot token, rate limiting and instrumentation.',
			rawUrl: 'Do not hardcode Discord API URLs; use `container.rest` with `Routes` from `discord-api-types/v10`.'
		},
		schema: []
	},
	create(context) {
		function isDiscordUrl(value: string): boolean {
			return discordHosts.some((host) => value.includes(host));
		}

		return {
			CallExpression(node) {
				const callee = node.callee as { type: string; name?: string };
				if (callee.type !== 'Identifier' || callee.name !== 'fetch') return;

				const [first] = node.arguments;
				if (!first) return;

				const value = getStaticString(first as never);
				if (value !== null && isDiscordUrl(value)) {
					context.report({ node, messageId: 'rawFetch' });
				}
			},
			Literal(node) {
				const { value } = node as { value?: unknown };
				if (typeof value === 'string' && isDiscordUrl(value)) {
					context.report({ node, messageId: 'rawUrl' });
				}
			}
		};
	}
};

export default rule;
