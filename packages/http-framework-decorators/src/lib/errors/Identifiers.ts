/**
 * The identifiers attached to the errors thrown by this package's decorators.
 */
export const Identifiers = {
	RequiresClientPermissionsMissingPermissions: 'requiresClientPermissionsMissingPermissions',
	RequiresUserPermissionsMissingPermissions: 'requiresUserPermissionsMissingPermissions'
} as const;

/**
 * One of the values of {@linkcode Identifiers}.
 */
export type Identifier = (typeof Identifiers)[keyof typeof Identifiers];
