export interface InteractionResult {
	statusCode: number;
	body: string;
	json<T = unknown>(): T;
}
