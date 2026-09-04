import type { Rule } from 'eslint';
import { findDecoratorIndex, getDecoratorName, getDecorators } from '../utils.js';

/**
 * Decorators that key their bookkeeping on the class identity, and therefore must run on the real class rather than on
 * the `Proxy` returned by `ApplyOptions`.
 */
const identityKeyedDecorators = [
	'RegisterCommand',
	'RegisterSubcommand',
	'RegisterSubcommandGroup',
	'RegisterUserCommand',
	'RegisterMessageCommand',
	'RestrictGuildIds'
] as const;

/**
 * Requires `@ApplyOptions` to be the outermost decorator of a piece class.
 *
 * `ApplyOptions` wraps the class in a `Proxy`; a decorator applied above it (and therefore evaluated after it) receives
 * that proxy instead of the class the framework constructs instances from, so the registration silently never resolves.
 */
const rule: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'require `@ApplyOptions` to be the outermost decorator, above registration decorators',
			recommended: true
		},
		messages: {
			wrongOrder:
				'`@ApplyOptions` must be the outermost decorator, above `@{{decorator}}`. `ApplyOptions` wraps the class in a Proxy, so `@{{decorator}}` would register the proxy instead of the class and the piece would never resolve at runtime.'
		},
		schema: []
	},
	create(context) {
		function check(node: Rule.Node) {
			const decorators = getDecorators(node);
			if (decorators.length < 2) return;

			const applyOptionsIndex = findDecoratorIndex(decorators, ['ApplyOptions']);
			if (applyOptionsIndex <= 0) return;

			const registrationIndex = findDecoratorIndex(decorators, identityKeyedDecorators);
			if (registrationIndex === -1 || registrationIndex > applyOptionsIndex) return;

			const registration = decorators[registrationIndex]!;
			context.report({
				node: registration as unknown as Rule.Node,
				messageId: 'wrongOrder',
				data: { decorator: getDecoratorName(registration) ?? 'RegisterCommand' }
			});
		}

		return {
			ClassDeclaration: check,
			ClassExpression: check
		};
	}
};

export default rule;
