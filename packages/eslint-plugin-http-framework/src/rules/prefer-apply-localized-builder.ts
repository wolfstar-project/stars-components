import type { Rule } from 'eslint';
import { getDecoratorName, getDecorators } from '../utils.js';

const i18nextPackage = '@wolfstar/plugin-i18next';
const rawBuilderMethods = ['setName', 'setDescription', 'setNameLocalizations', 'setDescriptionLocalizations'];
const registrationDecorators = ['RegisterCommand', 'RegisterSubcommand', 'RegisterSubcommandGroup', 'RegisterUserCommand', 'RegisterMessageCommand'];

/**
 * Requires localized command builders in i18n-enabled modules to go through `applyLocalizedBuilder`.
 *
 * Calling `setName`/`setDescription` by hand inside a registration decorator hardcodes English strings and skips the
 * localization map the plugin would otherwise attach, so the command shows up untranslated for every locale.
 */
const rule: Rule.RuleModule = {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'require `applyLocalizedBuilder` instead of raw `setName`/`setDescription` in i18n modules',
			recommended: true
		},
		messages: {
			rawBuilder:
				'Use `applyLocalizedBuilder(builder, key)` instead of `{{method}}` inside `@{{decorator}}`; a raw call hardcodes one language and skips the localization map.'
		},
		schema: []
	},
	create(context) {
		let importsI18next = false;
		const decoratorRanges: { start: number; end: number; decorator: string }[] = [];

		function collectDecoratorRanges(node: Rule.Node) {
			for (const decorator of getDecorators(node)) {
				const name = getDecoratorName(decorator);
				if (name === null || !registrationDecorators.includes(name)) continue;

				const range = decorator.range;
				if (!range) continue;

				decoratorRanges.push({ start: range[0], end: range[1], decorator: name });
			}
		}

		return {
			ImportDeclaration(node) {
				if ((node.source as { value?: unknown }).value === i18nextPackage) importsI18next = true;
			},
			ClassDeclaration: collectDecoratorRanges,
			ClassExpression: collectDecoratorRanges,
			'CallExpression:exit'(node) {
				if (!importsI18next) return;

				const callee = node.callee as { type: string; property?: { type: string; name?: string } };
				if (callee.type !== 'MemberExpression' || callee.property?.type !== 'Identifier') return;

				const method = callee.property.name;
				if (method === undefined || !rawBuilderMethods.includes(method)) return;

				const range = (node as { range?: [number, number] }).range;
				if (!range) return;

				const enclosing = decoratorRanges.find((decorator) => decorator.start <= range[0] && decorator.end >= range[1]);
				if (!enclosing) return;

				context.report({ node, messageId: 'rawBuilder', data: { method, decorator: enclosing.decorator } });
			}
		};
	}
};

export default rule;
