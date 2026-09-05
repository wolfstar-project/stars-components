import type { Rule } from 'eslint';

/**
 * Minimal shape of a decorator node, matching the ESTree extension emitted by both `typescript-eslint` and `oxc`.
 *
 * @internal
 */
export interface DecoratorNode {
	type: 'Decorator';
	expression: { type: string; callee?: { type: string; name?: string }; name?: string };
	range?: [number, number];
	loc?: Rule.Node['loc'];
}

/**
 * Reads the decorator list of a class-like node, tolerating parsers that omit the property entirely.
 *
 * @param node - The class node to read the decorators from.
 * @returns The decorators attached to the class, or an empty array when there are none.
 *
 * @internal
 */
export function getDecorators(node: unknown): DecoratorNode[] {
	const decorators = (node as { decorators?: unknown }).decorators;
	return Array.isArray(decorators) ? (decorators as DecoratorNode[]) : [];
}

/**
 * Resolves the name of the function a decorator refers to, whether it is called (`@Foo()`) or bare (`@Foo`).
 *
 * @param decorator - The decorator node to read.
 * @returns The decorator name, or `null` when it cannot be determined statically.
 *
 * @internal
 */
export function getDecoratorName(decorator: DecoratorNode): string | null {
	const { expression } = decorator;
	if (expression.type === 'CallExpression') {
		return expression.callee?.type === 'Identifier' ? (expression.callee.name ?? null) : null;
	}

	return expression.type === 'Identifier' ? (expression.name ?? null) : null;
}

/**
 * Finds the index of the first decorator whose name is part of {@link names}.
 *
 * @param decorators - The decorator list to search.
 * @param names - The decorator names to look for.
 * @returns The index of the matching decorator, or `-1` when none matches.
 *
 * @internal
 */
export function findDecoratorIndex(decorators: DecoratorNode[], names: readonly string[]): number {
	return decorators.findIndex((decorator) => {
		const name = getDecoratorName(decorator);
		return name !== null && names.includes(name);
	});
}
