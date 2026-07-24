/**
 * Universal HTTP reply abstraction used by both the native `node:http` path
 * (`Client.listen`) and the Fetch adapter (`createHandler`).
 */
export interface HttpReply {
	/**
	 * Whether {@link HttpReply.end} has already been called.
	 */
	readonly replied: boolean;

	/**
	 * Whether the underlying connection/response is closed or finished.
	 * Used to skip writing error replies when the client has already disconnected.
	 */
	readonly closed: boolean;

	/**
	 * Sets the HTTP status code for the reply.
	 */
	status(code: number): this;

	/**
	 * Sets a response header.
	 */
	header(name: string, value: string): this;

	/**
	 * Writes the body (if any) and finishes the reply.
	 */
	end(body?: string): this;

	/**
	 * Resolves when the reply has been fully flushed to the client.
	 * For Fetch-backed replies this resolves as soon as {@link HttpReply.end} has run.
	 */
	flushed(): Promise<void>;
}
