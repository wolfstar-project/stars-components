/**
 * Variable expansion for the `node` loader. It behaves like `dotenv-expand`'s `expand()` (`$VAR`, `${VAR}`,
 * `${VAR:-default}`, `${VAR-default}`, `${VAR:+alternate}`, `${VAR+alternate}` and the `\$` escape), so switching
 * between the `node` and `dotenv` loaders does not change how a file resolves.
 */

function resolveEscapeSequences(value: string): string {
	return value.replace(/\\\$/g, '$');
}

function expandValue(value: string, processEnv: NodeJS.ProcessEnv, runningParsed: Record<string, string>): string {
	// `process.env` wins over what the files resolved so far.
	const env = { ...runningParsed, ...processEnv };
	const regex = /(?<!\\)\${([^{}]+)}|(?<!\\)\$([A-Za-z_][A-Za-z0-9_]*)/g;

	let result = value;
	let match: RegExpExecArray | null;
	// Guards against a value that expands to something already seen (a self-reference).
	const seen = new Set<string>();

	while ((match = regex.exec(result)) !== null) {
		seen.add(result);

		const [template, bracedExpression, unbracedExpression] = match;
		const expression = (bracedExpression || unbracedExpression)!;

		// The first of the operators `:+`, `+`, `:-` and `-`.
		const splitter = expression.match(/(:\+|\+|:-|-)/)?.[0] ?? null;
		const parts = splitter === null ? [expression] : expression.split(splitter);
		const key = parts.shift()!;

		let defaultValue: string;
		let resolved: string | null | undefined;
		if (splitter === ':+' || splitter === '+') {
			defaultValue = env[key] ? parts.join(splitter) : '';
			resolved = null;
		} else {
			defaultValue = parts.join(splitter ?? '');
			resolved = env[key];
		}

		// A function replacer keeps `$` sequences of the value literal (a string replacement would interpret them).
		result = resolved && !seen.has(resolved) ? result.replace(template, () => resolved) : result.replace(template, () => defaultValue);

		// Stop once the result is what a previous file already resolved the variable to.
		if (result === runningParsed[key]) break;

		regex.lastIndex = 0;
	}

	return result;
}

/**
 * Expands the references of `parsed` in place, in order, and writes every result to `processEnv`. A variable already
 * set to another value in `processEnv` keeps that value.
 */
export function expand(parsed: Record<string, string>, processEnv: NodeJS.ProcessEnv = process.env): Record<string, string> {
	const runningParsed: Record<string, string> = {};

	for (const key of Object.keys(parsed)) {
		let value = parsed[key]!;

		// The variable was already set before the file value: keep it.
		if (processEnv[key] && processEnv[key] !== value) value = processEnv[key]!;
		else value = expandValue(value, processEnv, runningParsed);

		parsed[key] = resolveEscapeSequences(value);
		runningParsed[key] = parsed[key];
	}

	for (const key of Object.keys(parsed)) processEnv[key] = parsed[key];

	return parsed;
}
