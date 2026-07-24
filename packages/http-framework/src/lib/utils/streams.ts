import { container } from '@sapphire/pieces';
import { err, ok, type Result } from '@sapphire/result';
import { isNullishOrEmpty } from '@sapphire/utilities';
import type { IncomingMessage } from 'node:http';
import { TextDecoder } from 'node:util';
import { ErrorMessages } from './constants.js';

/**
 * Validates that a raw body string is within the configured size limit.
 */
export function validateBodySize(body: string, contentLength: string | null | undefined): Result.Err<string> | Result.Ok<string> {
	let limit = container.client.bodySizeLimit;

	if (!isNullishOrEmpty(contentLength)) {
		const parsed = Number(contentLength);
		if (!Number.isSafeInteger(parsed)) return err(ErrorMessages.InvalidContentLengthInteger);
		if (parsed <= 0) return err(ErrorMessages.InvalidContentLengthNegative);
		if (parsed > limit) return err(ErrorMessages.InvalidContentLengthTooBig);
		limit = parsed;
	}

	if (body.length > limit) return err(ErrorMessages.InvalidBodySize);
	return ok(body);
}

/**
 * Safely reads the {@link IncomingMessage incoming message}'s body as a string.
 * @param request The incoming message to get the data from.
 * @returns The string, if it's within the body size limit.
 */
export async function getSafeTextBody(request: IncomingMessage): Promise<Result.Err<string> | Result.Ok<string>> {
	let limit = container.client.bodySizeLimit;

	// Validate the Content-Length header:
	if (!isNullishOrEmpty(request.headers['content-length'])) {
		const parsed = Number(request.headers['content-length']);
		if (!Number.isSafeInteger(parsed)) return err(ErrorMessages.InvalidContentLengthInteger);
		if (parsed <= 0) return err(ErrorMessages.InvalidContentLengthNegative);
		if (parsed > limit) return err(ErrorMessages.InvalidContentLengthTooBig);

		// If it's a valid length, set the limit to it.
		limit = parsed;
	}

	const decoder = new TextDecoder();

	let output = '';
	for await (const chunk of request) {
		const part = typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
		if (part.length + output.length > limit) return err(ErrorMessages.InvalidBodySize);

		output += part;
	}

	// Flush the streaming TextDecoder so that any pending
	// incomplete multibyte characters are handled.
	const part = decoder.decode(undefined, { stream: false });
	if (part.length + output.length > limit) return err(ErrorMessages.InvalidBodySize);

	output += part;
	return ok(output);
}

/**
 * Safely reads a Web {@link Request}'s body as a string within the body size limit.
 */
export async function getSafeTextBodyFromWebRequest(request: Request): Promise<Result.Err<string> | Result.Ok<string>> {
	const contentLength = request.headers.get('content-length');
	let limit = container.client.bodySizeLimit;

	if (!isNullishOrEmpty(contentLength)) {
		const parsed = Number(contentLength);
		if (!Number.isSafeInteger(parsed)) return err(ErrorMessages.InvalidContentLengthInteger);
		if (parsed <= 0) return err(ErrorMessages.InvalidContentLengthNegative);
		if (parsed > limit) return err(ErrorMessages.InvalidContentLengthTooBig);
		limit = parsed;
	}

	if (!request.body) {
		return validateBodySize('', contentLength);
	}

	const decoder = new TextDecoder();
	const reader = request.body.getReader();
	let output = '';

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			const part = decoder.decode(value, { stream: true });
			if (part.length + output.length > limit) return err(ErrorMessages.InvalidBodySize);
			output += part;
		}
	} finally {
		reader.releaseLock();
	}

	const part = decoder.decode(undefined, { stream: false });
	if (part.length + output.length > limit) return err(ErrorMessages.InvalidBodySize);
	output += part;

	return ok(output);
}
