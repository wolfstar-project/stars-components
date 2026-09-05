import type { Rule } from 'eslint';

const deprecated = '@wolfstar/http-framework-i18n';
const replacement = '@wolfstar/plugin-i18next';

/**
 * Bans imports of the deprecated `@wolfstar/http-framework-i18n` package.
 *
 * `@wolfstar/plugin-i18next` is the supported i18n integration; the legacy package no longer receives snapshots and its
 * helper set has drifted from the plugin's.
 */
const rule: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'ban imports of the deprecated `@wolfstar/http-framework-i18n` package',
			recommended: true
		},
		messages: {
			deprecatedPackage: '`{{deprecated}}` is deprecated; use `{{replacement}}` instead.'
		},
		schema: []
	},
	create(context) {
		function report(node: Rule.Node, source: unknown) {
			if (typeof source !== 'string') return;
			if (source !== deprecated && !source.startsWith(`${deprecated}/`)) return;

			context.report({ node, messageId: 'deprecatedPackage', data: { deprecated, replacement } });
		}

		return {
			ImportDeclaration(node) {
				report(node as never, (node.source as { value?: unknown }).value);
			},
			ImportExpression(node) {
				report(node as never, (node.source as { value?: unknown }).value);
			}
		};
	}
};

export default rule;
