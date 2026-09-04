import type { Rule } from 'eslint';
import { findDecoratorIndex, getDecoratorName, getDecorators } from '../utils.js';

const subcommandDecorators = ['RegisterSubcommand', 'RegisterSubcommandGroup'] as const;
const parentDecorators = ['RegisterCommand'] as const;

/**
 * Requires classes using `@RegisterSubcommand` or `@RegisterSubcommandGroup` to also carry `@RegisterCommand`.
 *
 * Subcommand decorators attach to the chat input command resolver of their own class; without a parent
 * `@RegisterCommand` there is no command for them to attach to and the subcommands never get registered.
 */
const rule: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'require `@RegisterCommand` on classes that declare subcommands',
			recommended: true
		},
		messages: {
			missingParent:
				'`@{{decorator}}` requires the class to also be decorated with `@RegisterCommand`; without a parent command the subcommand is never registered.'
		},
		schema: []
	},
	create(context) {
		function check(node: Rule.Node) {
			const decorators = getDecorators(node);
			if (decorators.length === 0) return;

			const subcommandIndex = findDecoratorIndex(decorators, subcommandDecorators);
			if (subcommandIndex === -1) return;

			if (findDecoratorIndex(decorators, parentDecorators) !== -1) return;

			const subcommand = decorators[subcommandIndex]!;
			context.report({
				node: subcommand as unknown as Rule.Node,
				messageId: 'missingParent',
				data: { decorator: getDecoratorName(subcommand) ?? 'RegisterSubcommand' }
			});
		}

		return {
			ClassDeclaration: check,
			ClassExpression: check
		};
	}
};

export default rule;
