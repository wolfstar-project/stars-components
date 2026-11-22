export type AssertionKind = 'text-start' | 'text-end' | 'line-start' | 'line-end' | 'word-boundary' | 'not-word-boundary';

export type ClassOp = '&&' | '--' | '~~';

export type PerlClass = 'd' | 's' | 'w';

export type ClassItem =
	| { readonly kind: 'char'; readonly cp: number }
	| { readonly kind: 'range'; readonly lo: number; readonly hi: number }
	| { readonly kind: 'perl'; readonly cls: PerlClass; readonly negated: boolean }
	/** `expr` is what goes inside `\p{...}`, for example `Lu` or `Script=Greek`. */
	| { readonly kind: 'property'; readonly expr: string; readonly negated: boolean }
	| { readonly kind: 'class'; readonly set: ClassSet };

export type ClassExpr =
	| { readonly kind: 'union'; readonly items: readonly ClassItem[] }
	| { readonly kind: 'binary'; readonly op: ClassOp; readonly left: ClassExpr; readonly right: ClassExpr };

export interface ClassSet {
	readonly negated: boolean;
	readonly expr: ClassExpr;
}

export type Node =
	| { readonly type: 'literal'; readonly cp: number }
	| { readonly type: 'dot'; readonly dotAll: boolean }
	| { readonly type: 'assertion'; readonly kind: AssertionKind }
	| { readonly type: 'class'; readonly set: ClassSet }
	| {
			readonly type: 'group';
			readonly capture: boolean;
			readonly name: string | undefined;
			/** Whether case-insensitive matching is on at the start of the group's body. */
			readonly iStart: boolean;
			readonly alt: Node[][];
	  }
	| {
			readonly type: 'repeat';
			readonly min: number;
			/** `null` means unbounded. */
			readonly max: number | null;
			readonly lazy: boolean;
			readonly node: Node;
	  }
	/** `(?i)` or `(?-i)`: `i` is the case-insensitive state from here to the end of the enclosing group. */
	| { readonly type: 'flags'; readonly i: boolean };
