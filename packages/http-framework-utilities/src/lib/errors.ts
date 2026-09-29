export interface RestErrorDescription {
	name: string;
	status?: number;
	code?: number | string;
	method?: string;
}

/**
 * Copies only the safe-to-log fields off a thrown value — `name`, and (when present) `status`, `code`, `method`.
 * Never copies `url` (a `@discordjs/rest` error's `url` for an interaction followup is
 * `Routes.webhook(applicationId, token)`, which embeds the interaction token), `requestBody`, `rawError`, or the
 * `message` of anything that is not a recognized REST error shape.
 * @internal
 */
export function describeRestError(error: unknown): RestErrorDescription {
	if (!(error instanceof Error)) return { name: 'UnknownError' };

	const description: RestErrorDescription = { name: error.name };
	if ('status' in error && typeof error.status === 'number') description.status = error.status;
	if ('code' in error && (typeof error.code === 'number' || typeof error.code === 'string')) description.code = error.code;
	if ('method' in error && typeof error.method === 'string') description.method = error.method;
	return description;
}
