/**
 * The identifiers of the errors the framework may throw, useful to localize them.
 * @since 3.2.0
 */
export enum Identifiers {
	// #region Arguments (interaction options)
	ArgumentMissing = 'argumentMissing',
	ArgumentUnavailable = 'argumentUnavailable',

	ArgumentAttachmentError = 'attachmentError',
	ArgumentBooleanError = 'booleanError',
	ArgumentChannelError = 'channelError',
	ArgumentEnumEmptyError = 'enumEmptyError',
	ArgumentEnumError = 'enumError',
	ArgumentIntegerError = 'integerError',
	ArgumentIntegerTooLarge = 'integerTooLarge',
	ArgumentIntegerTooSmall = 'integerTooSmall',
	ArgumentMemberError = 'memberError',
	ArgumentMentionableError = 'mentionableError',
	ArgumentMessageError = 'messageError',
	ArgumentNumberError = 'numberError',
	ArgumentNumberTooLarge = 'numberTooLarge',
	ArgumentNumberTooSmall = 'numberTooSmall',
	ArgumentRoleError = 'roleError',
	ArgumentStringTooLong = 'stringTooLong',
	ArgumentStringTooShort = 'stringTooShort',
	ArgumentUserError = 'userError',
	// #endregion

	// #region Commands
	CommandDisabled = 'commandDisabled',
	CommandNameMissing = 'commandNameMissing',
	CommandNameUnknown = 'commandNameUnknown',
	CommandMethodUnknown = 'commandMethodUnknown',
	// #endregion

	// #region Interaction handlers
	InteractionHandlerNameInvalid = 'interactionHandlerNameInvalid',
	InteractionHandlerNameUnknown = 'interactionHandlerNameUnknown',
	// #endregion

	// #region Preconditions
	PreconditionClientPermissions = 'preconditionClientPermissions',
	PreconditionClientPermissionsNoPermissions = 'preconditionClientPermissionsNoPermissions',
	PreconditionCooldown = 'preconditionCooldown',
	PreconditionGuildIds = 'preconditionGuildIds',
	PreconditionNSFW = 'preconditionNsfw',
	PreconditionRunIn = 'preconditionRunIn',
	PreconditionUnavailable = 'preconditionUnavailable',
	PreconditionUserPermissions = 'preconditionUserPermissions',
	PreconditionUserPermissionsNoPermissions = 'preconditionUserPermissionsNoPermissions',
	// #endregion

	// #region Router
	ChatInputRouterDuplicatedSubcommand = 'chatInputRouterDuplicatedSubcommand',
	ChatInputRouterDuplicatedSubcommandGroup = 'chatInputRouterDuplicatedSubcommandGroup',
	ChatInputRouterSubcommandGroupLinkInvalid = 'chatInputRouterSubcommandGroupLinkInvalid',
	ChatInputRouterSubcommandLinkInvalid = 'chatInputRouterSubcommandLinkInvalid'
	// #endregion
}
