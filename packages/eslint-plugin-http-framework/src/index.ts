import type { Rule } from 'eslint';
import applyOptionsDecoratorOrder from './rules/apply-options-decorator-order.js';
import noDeprecatedI18nPackage from './rules/no-deprecated-i18n-package.js';
import noDynamicTranslationKey from './rules/no-dynamic-translation-key.js';
import noHoistedPluginRegisterImport from './rules/no-hoisted-plugin-register-import.js';
import noRawDiscordFetch from './rules/no-raw-discord-fetch.js';
import preferApplyLocalizedBuilder from './rules/prefer-apply-localized-builder.js';
import requireSubcommandParent from './rules/require-subcommand-parent.js';

export interface WolfstarPlugin {
	meta: { name: string };
	rules: Record<string, Rule.RuleModule>;
}

/**
 * The `wolfstar` lint plugin: custom rules for `@wolfstar/http-framework` and the `@wolfstar/plugin-*` ecosystem.
 *
 * The shape is the ESLint plugin shape, which oxlint's JS plugin API is compatible with, so the same object works as an
 * ESLint flat-config plugin and as an entry in oxlint's `jsPlugins`.
 */
const plugin: WolfstarPlugin = {
	meta: { name: 'wolfstar' },
	rules: {
		'apply-options-decorator-order': applyOptionsDecoratorOrder,
		'require-subcommand-parent': requireSubcommandParent,
		'no-raw-discord-fetch': noRawDiscordFetch,
		'no-dynamic-translation-key': noDynamicTranslationKey,
		'prefer-apply-localized-builder': preferApplyLocalizedBuilder,
		'no-hoisted-plugin-register-import': noHoistedPluginRegisterImport,
		'no-deprecated-i18n-package': noDeprecatedI18nPackage
	}
};

/**
 * Every rule of the plugin set to `'error'`, ready to be spread into an ESLint or oxlint `rules` block.
 */
export const recommendedRules: Record<string, 'error'> = Object.fromEntries(
	Object.keys(plugin.rules).map((name) => [`wolfstar/${name}`, 'error'] as const)
);

export {
	applyOptionsDecoratorOrder,
	noDeprecatedI18nPackage,
	noDynamicTranslationKey,
	noHoistedPluginRegisterImport,
	noRawDiscordFetch,
	preferApplyLocalizedBuilder,
	requireSubcommandParent
};

export default plugin;
