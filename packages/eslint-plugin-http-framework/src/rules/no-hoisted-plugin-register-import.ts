import type { Rule } from 'eslint';

const registerSuffix = '/register';
const pluginScope = '@wolfstar/plugin-';
const hookMethods = [
	'registerPreGenericsInitializationHook',
	'registerPreInitializationHook',
	'registerPostInitializationHook',
	'registerPreLoadHook',
	'registerPostListenHook'
];

/**
 * Bans statically importing a `@wolfstar/plugin-*` register entrypoint from a module that also registers its own plugin
 * hooks.
 *
 * Static imports are hoisted above the hook registrations in the same module, so the plugin's own hook registers — and
 * runs — before the module's, which silently loses whatever the module wanted to contribute (locale paths, options).
 * Use a dynamic `await import(...)` of the plugin's register entrypoint after the hook registration instead.
 */
const rule: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'ban hoisted `@wolfstar/plugin-*/register` imports in modules that register plugin hooks',
			recommended: true
		},
		messages: {
			hoistedRegister:
				"`import '{{source}}'` is hoisted above the hook registration in this module, so the plugin hook runs first and this module's contribution is lost. Use `await import('{{source}}')` after registering the hook."
		},
		schema: []
	},
	create(context) {
		const staticRegisterImports: { node: Rule.Node; source: string }[] = [];
		let registersHook = false;

		return {
			ImportDeclaration(node) {
				const source = (node.source as { value?: unknown }).value;
				if (typeof source !== 'string') return;
				if (!source.startsWith(pluginScope) || !source.endsWith(registerSuffix)) return;

				staticRegisterImports.push({ node: node as never, source });
			},
			CallExpression(node) {
				const callee = node.callee as { type: string; property?: { type: string; name?: string } };
				if (callee.type !== 'MemberExpression' || callee.property?.type !== 'Identifier') return;

				const name = callee.property.name;
				if (name !== undefined && hookMethods.includes(name)) registersHook = true;
			},
			'Program:exit'() {
				if (!registersHook) return;

				for (const { node, source } of staticRegisterImports) {
					context.report({ node, messageId: 'hoistedRegister', data: { source } });
				}
			}
		};
	}
};

export default rule;
