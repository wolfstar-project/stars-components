// Workspace packages the sources import by name: resolved to their sources so that no build is needed first.
const SOURCES = new Map([
	['@wolfstar/schema', new URL('../packages/schema/src/index.ts', import.meta.url).href],
	['@wolfstar/http-framework', new URL('../packages/http-framework/src/index.ts', import.meta.url).href]
]);

export async function resolve(specifier, context, nextResolve) {
	const source = SOURCES.get(specifier);
	if (source) return nextResolve(source, context);

	try {
		return await nextResolve(specifier, context);
	} catch (error) {
		if (error?.code !== 'ERR_MODULE_NOT_FOUND' || !specifier.startsWith('.')) throw error;

		// `./x.js` stands for `./x.ts`, and a few sources import `./x` with no extension at all.
		const candidates = specifier.endsWith('.js') ? [`${specifier.slice(0, -3)}.ts`] : [`${specifier}.ts`, `${specifier}/index.ts`];
		for (const candidate of candidates) {
			try {
				return await nextResolve(candidate, context);
			} catch {
				// Try the next candidate.
			}
		}

		throw error;
	}
}
