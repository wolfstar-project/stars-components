/**
 * Rust's `\p{...}` accepts names the way UTS #18 loose matching does (case, spaces, `_` and `-` are ignored) and lets
 * a bare name stand for a binary property, a general category or a script. JavaScript is strict about spelling and
 * needs `Script=` for scripts, so every name is resolved here to the form JavaScript understands.
 */

export type PropertyResolution =
	| { readonly expr: string; readonly negated: boolean }
	| { readonly error: 'invalid' | 'unsupported'; readonly message: string };

function normalize(name: string): string {
	return name.toLowerCase().replace(/[\s_-]/g, '');
}

function buildMap(entries: ReadonlyArray<readonly string[]>): ReadonlyMap<string, string> {
	const map = new Map<string, string>();
	for (const [canonical, ...aliases] of entries) {
		if (canonical === undefined) continue;
		map.set(normalize(canonical), canonical);
		for (const alias of aliases) map.set(normalize(alias), canonical);
	}

	return map;
}

/** The first entry is what is emitted, the rest are spellings Rust accepts. */
const GENERAL_CATEGORIES = buildMap([
	['L', 'Letter'],
	['Lu', 'Uppercase_Letter'],
	['Ll', 'Lowercase_Letter'],
	['Lt', 'Titlecase_Letter'],
	['LC', 'Cased_Letter'],
	['Lm', 'Modifier_Letter'],
	['Lo', 'Other_Letter'],
	['M', 'Mark', 'Combining_Mark'],
	['Mn', 'Nonspacing_Mark'],
	['Mc', 'Spacing_Mark'],
	['Me', 'Enclosing_Mark'],
	['N', 'Number'],
	['Nd', 'Decimal_Number', 'digit'],
	['Nl', 'Letter_Number'],
	['No', 'Other_Number'],
	['P', 'Punctuation', 'punct'],
	['Pc', 'Connector_Punctuation'],
	['Pd', 'Dash_Punctuation'],
	['Ps', 'Open_Punctuation'],
	['Pe', 'Close_Punctuation'],
	['Pi', 'Initial_Punctuation'],
	['Pf', 'Final_Punctuation'],
	['Po', 'Other_Punctuation'],
	['S', 'Symbol'],
	['Sm', 'Math_Symbol'],
	['Sc', 'Currency_Symbol'],
	['Sk', 'Modifier_Symbol'],
	['So', 'Other_Symbol'],
	['Z', 'Separator'],
	['Zs', 'Space_Separator'],
	['Zl', 'Line_Separator'],
	['Zp', 'Paragraph_Separator'],
	['C', 'Other'],
	['Cc', 'Control', 'cntrl'],
	['Cf', 'Format'],
	['Cs', 'Surrogate'],
	['Co', 'Private_Use'],
	['Cn', 'Unassigned']
]);

const BINARY_PROPERTIES = buildMap([
	['ASCII'],
	['ASCII_Hex_Digit', 'AHex'],
	['Alphabetic', 'Alpha'],
	['Any'],
	['Assigned'],
	['Bidi_Control', 'Bidi_C'],
	['Bidi_Mirrored', 'Bidi_M'],
	['Case_Ignorable', 'CI'],
	['Cased'],
	['Changes_When_Casefolded', 'CWCF'],
	['Changes_When_Casemapped', 'CWCM'],
	['Changes_When_Lowercased', 'CWL'],
	['Changes_When_NFKC_Casefolded', 'CWKCF'],
	['Changes_When_Titlecased', 'CWT'],
	['Changes_When_Uppercased', 'CWU'],
	['Dash'],
	['Default_Ignorable_Code_Point', 'DI'],
	['Deprecated', 'Dep'],
	['Diacritic', 'Dia'],
	['Emoji'],
	['Emoji_Component', 'EComp'],
	['Emoji_Modifier', 'EMod'],
	['Emoji_Modifier_Base', 'EBase'],
	['Emoji_Presentation', 'EPres'],
	['Extended_Pictographic', 'ExtPict'],
	['Extender', 'Ext'],
	['Grapheme_Base', 'Gr_Base'],
	['Grapheme_Extend', 'Gr_Ext'],
	['Hex_Digit', 'Hex'],
	['IDS_Binary_Operator', 'IDSB'],
	['IDS_Trinary_Operator', 'IDST'],
	['ID_Continue', 'IDC'],
	['ID_Start', 'IDS'],
	['Ideographic', 'Ideo'],
	['Join_Control', 'Join_C'],
	['Logical_Order_Exception', 'LOE'],
	['Lowercase', 'Lower'],
	['Math'],
	['Noncharacter_Code_Point', 'NChar'],
	['Pattern_Syntax', 'Pat_Syn'],
	['Pattern_White_Space', 'Pat_WS'],
	['Quotation_Mark', 'QMark'],
	['Radical'],
	['Regional_Indicator', 'RI'],
	['Sentence_Terminal', 'STerm'],
	['Soft_Dotted', 'SD'],
	['Terminal_Punctuation', 'Term'],
	['Unified_Ideograph', 'UIdeo'],
	['Uppercase', 'Upper'],
	['Variation_Selector', 'VS'],
	['White_Space', 'space'],
	['XID_Continue', 'XIDC'],
	['XID_Start', 'XIDS']
]);

/**
 * JavaScript wants `Old_Italic`, Rust also takes `olditalic`. Without the full script table the best that can be done
 * is to title-case every word, which is right for every script name except the ones listed here. A name that is still
 * wrong is rejected by the JavaScript engine, which `transpile` reports as an `invalid_output` error.
 */
const SCRIPT_EXCEPTIONS: ReadonlyMap<string, string> = new Map([['signwriting', 'SignWriting']]);

function scriptName(value: string): string {
	const exception = SCRIPT_EXCEPTIONS.get(normalize(value));
	if (exception !== undefined) return exception;

	return value
		.trim()
		.split(/[\s_-]+/)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
		.join('_');
}

const SINGLE_LETTER_CATEGORIES = new Set(['L', 'M', 'N', 'P', 'S', 'Z', 'C']);

const KEY_VALUE = /^\s*([A-Za-z_ -]+?)\s*(!=|=|:)\s*(.+?)\s*$/;

/**
 * @param spec What is between the braces of `\p{...}`, without a leading `^`, or the letter of `\pL`.
 * @param singleLetter Whether `spec` came from the `\pL` form, which only accepts the one-letter categories.
 */
export function resolveProperty(spec: string, singleLetter: boolean): PropertyResolution {
	if (singleLetter) {
		return SINGLE_LETTER_CATEGORIES.has(spec)
			? { expr: spec, negated: false }
			: { error: 'invalid', message: `unknown Unicode class \\p${spec}` };
	}

	const keyValue = KEY_VALUE.exec(spec);
	if (keyValue !== null) {
		const [, key = '', operator = '=', value = ''] = keyValue;
		const negated = operator === '!=';

		switch (normalize(key)) {
			case 'gc':
			case 'generalcategory':
			case 'category': {
				const category = GENERAL_CATEGORIES.get(normalize(value));
				return category === undefined ? { error: 'invalid', message: `unknown general category "${value}"` } : { expr: category, negated };
			}
			case 'sc':
			case 'script':
				return { expr: `Script=${scriptName(value)}`, negated };
			case 'scx':
			case 'scriptextensions':
				return { expr: `Script_Extensions=${scriptName(value)}`, negated };
			default:
				return { error: 'unsupported', message: `the Unicode property "${key}" cannot be expressed in JavaScript` };
		}
	}

	const name = normalize(spec);
	const binary = BINARY_PROPERTIES.get(name);
	if (binary !== undefined) return { expr: binary, negated: false };

	const category = GENERAL_CATEGORIES.get(name);
	if (category !== undefined) return { expr: category, negated: false };

	if (!/^[A-Za-z][A-Za-z _-]*$/.test(spec)) return { error: 'invalid', message: `unknown Unicode class "${spec}"` };

	return { expr: `Script=${scriptName(spec)}`, negated: false };
}
