import { __commonJSMin, __esmMin, __exportAll, __toCommonJS, __toESM } from '../../_runtime.mjs';
//#region ../../node_modules/.pnpm/@discordjs+util@1.2.0/node_modules/@discordjs/util/dist/index.mjs
var __defProp$3 = Object.defineProperty;
var __name$3 = (target, value) =>
	__defProp$3(target, 'name', {
		value,
		configurable: true
	});
function lazy(cb) {
	let defaultValue;
	return () => (defaultValue ??= cb());
}
__name$3(lazy, 'lazy');
function* range(range2) {
	let rangeEnd;
	let start = 0;
	let step = 1;
	if (typeof range2 === 'number') rangeEnd = range2;
	else {
		start = range2.start;
		rangeEnd = range2.end;
		step = range2.step ?? 1;
	}
	for (let index = start; index < rangeEnd; index += step) yield index;
}
__name$3(range, 'range');
function calculateShardId(guildId, shardCount) {
	return Number(BigInt(guildId) >> 22n) % shardCount;
}
__name$3(calculateShardId, 'calculateShardId');
function shouldUseGlobalFetchAndWebSocket() {
	if (typeof globalThis.process === 'undefined') return 'fetch' in globalThis && 'WebSocket' in globalThis;
	if ('versions' in globalThis.process) return 'deno' in globalThis.process.versions || 'bun' in globalThis.process.versions;
	return false;
}
__name$3(shouldUseGlobalFetchAndWebSocket, 'shouldUseGlobalFetchAndWebSocket');
function getUserAgentAppendix() {
	if (typeof globalThis.EdgeRuntime !== 'undefined') return 'Vercel-Edge-Functions';
	if (typeof globalThis.R2 !== 'undefined' && typeof globalThis.WebSocketPair !== 'undefined') return 'Cloudflare-Workers';
	if (typeof globalThis.Netlify !== 'undefined') return 'Netlify-Edge-Functions';
	if (typeof globalThis.process !== 'object') {
		if (typeof globalThis.navigator === 'object') return globalThis.navigator.userAgent;
		return 'UnknownEnvironment';
	}
	if ('versions' in globalThis.process) {
		if ('deno' in globalThis.process.versions) return `Deno/${globalThis.process.versions.deno}`;
		if ('bun' in globalThis.process.versions) return `Bun/${globalThis.process.versions.bun}`;
		if ('node' in globalThis.process.versions) return `Node.js/${globalThis.process.versions.node}`;
	}
	return 'UnknownEnvironment';
}
__name$3(getUserAgentAppendix, 'getUserAgentAppendix');
function polyfillDispose() {
	Symbol.dispose ??= Symbol('Symbol.dispose');
	Symbol.asyncDispose ??= Symbol('Symbol.asyncDispose');
}
__name$3(polyfillDispose, 'polyfillDispose');
function isJSONEncodable(maybeEncodable) {
	return maybeEncodable !== null && typeof maybeEncodable === 'object' && 'toJSON' in maybeEncodable;
}
__name$3(isJSONEncodable, 'isJSONEncodable');
function isEquatable(maybeEquatable) {
	return maybeEquatable !== null && typeof maybeEquatable === 'object' && 'equals' in maybeEquatable;
}
__name$3(isEquatable, 'isEquatable');
(class _GatewayRateLimitError extends Error {
	constructor(data, payload) {
		super(`Request with opcode ${data.opcode} was rate limited. Retry after ${data.retry_after} seconds.`);
		this.data = data;
		this.payload = payload;
	}
	static {
		__name$3(this, 'GatewayRateLimitError');
	}
	name = _GatewayRateLimitError.name;
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/gateway/v10.js
var require_v10$5 = /* @__PURE__ */ __commonJSMin((exports) => {
	/**
	 * Types extracted from https://discord.com/developers/docs/topics/gateway
	 */
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.GatewayRequestChannelInfoField =
		exports.VoiceChannelEffectSendAnimationType =
		exports.GatewayDispatchEvents =
		exports.GatewayCapabilityBits =
		exports.GatewayIntentBits =
		exports.GatewayCloseCodes =
		exports.GatewayOpcodes =
		exports.GatewayVersion =
			void 0;
	exports.GatewayVersion = '10';
	/**
	 * @see {@link https://discord.com/developers/docs/topics/opcodes-and-status-codes#gateway-gateway-opcodes}
	 */
	var GatewayOpcodes;
	(function (GatewayOpcodes) {
		/**
		 * An event was dispatched
		 */
		GatewayOpcodes[(GatewayOpcodes['Dispatch'] = 0)] = 'Dispatch';
		/**
		 * A bidirectional opcode to maintain an active gateway connection.
		 * Fired periodically by the client, or fired by the gateway to request an immediate heartbeat from the client.
		 */
		GatewayOpcodes[(GatewayOpcodes['Heartbeat'] = 1)] = 'Heartbeat';
		/**
		 * Starts a new session during the initial handshake
		 */
		GatewayOpcodes[(GatewayOpcodes['Identify'] = 2)] = 'Identify';
		/**
		 * Update the client's presence
		 */
		GatewayOpcodes[(GatewayOpcodes['PresenceUpdate'] = 3)] = 'PresenceUpdate';
		/**
		 * Used to join/leave or move between voice channels
		 */
		GatewayOpcodes[(GatewayOpcodes['VoiceStateUpdate'] = 4)] = 'VoiceStateUpdate';
		/**
		 * Resume a previous session that was disconnected
		 */
		GatewayOpcodes[(GatewayOpcodes['Resume'] = 6)] = 'Resume';
		/**
		 * You should attempt to reconnect and resume immediately
		 */
		GatewayOpcodes[(GatewayOpcodes['Reconnect'] = 7)] = 'Reconnect';
		/**
		 * Request information about offline guild members in a large guild
		 */
		GatewayOpcodes[(GatewayOpcodes['RequestGuildMembers'] = 8)] = 'RequestGuildMembers';
		/**
		 * The session has been invalidated. You should reconnect and identify/resume accordingly
		 */
		GatewayOpcodes[(GatewayOpcodes['InvalidSession'] = 9)] = 'InvalidSession';
		/**
		 * Sent immediately after connecting, contains the `heartbeat_interval` to use
		 */
		GatewayOpcodes[(GatewayOpcodes['Hello'] = 10)] = 'Hello';
		/**
		 * Sent in response to receiving a heartbeat to acknowledge that it has been received
		 */
		GatewayOpcodes[(GatewayOpcodes['HeartbeatAck'] = 11)] = 'HeartbeatAck';
		/**
		 * Request information about soundboard sounds in a set of guilds
		 */
		GatewayOpcodes[(GatewayOpcodes['RequestSoundboardSounds'] = 31)] = 'RequestSoundboardSounds';
		/**
		 * Request ephemeral channel data for channels in a guild.
		 */
		GatewayOpcodes[(GatewayOpcodes['RequestChannelInfo'] = 43)] = 'RequestChannelInfo';
	})(GatewayOpcodes || (exports.GatewayOpcodes = GatewayOpcodes = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/topics/opcodes-and-status-codes#gateway-gateway-close-event-codes}
	 */
	var GatewayCloseCodes;
	(function (GatewayCloseCodes) {
		/**
		 * We're not sure what went wrong. Try reconnecting?
		 */
		GatewayCloseCodes[(GatewayCloseCodes['UnknownError'] = 4e3)] = 'UnknownError';
		/**
		 * You sent an invalid Gateway opcode or an invalid payload for an opcode. Don't do that!
		 *
		 * @see {@link https://discord.com/developers/docs/topics/gateway-events#payload-structure}
		 */
		GatewayCloseCodes[(GatewayCloseCodes['UnknownOpcode'] = 4001)] = 'UnknownOpcode';
		/**
		 * You sent an invalid payload to us. Don't do that!
		 *
		 * @see {@link https://discord.com/developers/docs/topics/gateway#sending-events}
		 */
		GatewayCloseCodes[(GatewayCloseCodes['DecodeError'] = 4002)] = 'DecodeError';
		/**
		 * You sent us a payload prior to identifying
		 *
		 * @see {@link https://discord.com/developers/docs/topics/gateway-events#identify}
		 */
		GatewayCloseCodes[(GatewayCloseCodes['NotAuthenticated'] = 4003)] = 'NotAuthenticated';
		/**
		 * The account token sent with your identify payload is incorrect
		 *
		 * @see {@link https://discord.com/developers/docs/topics/gateway-events#identify}
		 */
		GatewayCloseCodes[(GatewayCloseCodes['AuthenticationFailed'] = 4004)] = 'AuthenticationFailed';
		/**
		 * You sent more than one identify payload. Don't do that!
		 */
		GatewayCloseCodes[(GatewayCloseCodes['AlreadyAuthenticated'] = 4005)] = 'AlreadyAuthenticated';
		/**
		 * The sequence sent when resuming the session was invalid. Reconnect and start a new session
		 *
		 * @see {@link https://discord.com/developers/docs/topics/gateway-events#resume}
		 */
		GatewayCloseCodes[(GatewayCloseCodes['InvalidSeq'] = 4007)] = 'InvalidSeq';
		/**
		 * Woah nelly! You're sending payloads to us too quickly. Slow it down! You will be disconnected on receiving this
		 */
		GatewayCloseCodes[(GatewayCloseCodes['RateLimited'] = 4008)] = 'RateLimited';
		/**
		 * Your session timed out. Reconnect and start a new one
		 */
		GatewayCloseCodes[(GatewayCloseCodes['SessionTimedOut'] = 4009)] = 'SessionTimedOut';
		/**
		 * You sent us an invalid shard when identifying
		 *
		 * @see {@link https://discord.com/developers/docs/topics/gateway#sharding}
		 */
		GatewayCloseCodes[(GatewayCloseCodes['InvalidShard'] = 4010)] = 'InvalidShard';
		/**
		 * The session would have handled too many guilds - you are required to shard your connection in order to connect
		 *
		 * @see {@link https://discord.com/developers/docs/topics/gateway#sharding}
		 */
		GatewayCloseCodes[(GatewayCloseCodes['ShardingRequired'] = 4011)] = 'ShardingRequired';
		/**
		 * You sent an invalid version for the gateway
		 */
		GatewayCloseCodes[(GatewayCloseCodes['InvalidAPIVersion'] = 4012)] = 'InvalidAPIVersion';
		/**
		 * You sent an invalid intent for a Gateway Intent. You may have incorrectly calculated the bitwise value
		 *
		 * @see {@link https://discord.com/developers/docs/topics/gateway#gateway-intents}
		 */
		GatewayCloseCodes[(GatewayCloseCodes['InvalidIntents'] = 4013)] = 'InvalidIntents';
		/**
		 * You sent a disallowed intent for a Gateway Intent. You may have tried to specify an intent that you have not
		 * enabled or are not whitelisted for
		 *
		 * @see {@link https://discord.com/developers/docs/topics/gateway#gateway-intents}
		 * @see {@link https://discord.com/developers/docs/topics/gateway#privileged-intents}
		 */
		GatewayCloseCodes[(GatewayCloseCodes['DisallowedIntents'] = 4014)] = 'DisallowedIntents';
	})(GatewayCloseCodes || (exports.GatewayCloseCodes = GatewayCloseCodes = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/topics/gateway#list-of-intents}
	 */
	var GatewayIntentBits;
	(function (GatewayIntentBits) {
		GatewayIntentBits[(GatewayIntentBits['Guilds'] = 1)] = 'Guilds';
		GatewayIntentBits[(GatewayIntentBits['GuildMembers'] = 2)] = 'GuildMembers';
		GatewayIntentBits[(GatewayIntentBits['GuildModeration'] = 4)] = 'GuildModeration';
		/**
		 * @deprecated This is the old name for {@link GatewayIntentBits.GuildModeration}
		 */
		GatewayIntentBits[(GatewayIntentBits['GuildBans'] = 4)] = 'GuildBans';
		GatewayIntentBits[(GatewayIntentBits['GuildExpressions'] = 8)] = 'GuildExpressions';
		/**
		 * @deprecated This is the old name for {@link GatewayIntentBits.GuildExpressions}
		 */
		GatewayIntentBits[(GatewayIntentBits['GuildEmojisAndStickers'] = 8)] = 'GuildEmojisAndStickers';
		GatewayIntentBits[(GatewayIntentBits['GuildIntegrations'] = 16)] = 'GuildIntegrations';
		GatewayIntentBits[(GatewayIntentBits['GuildWebhooks'] = 32)] = 'GuildWebhooks';
		GatewayIntentBits[(GatewayIntentBits['GuildInvites'] = 64)] = 'GuildInvites';
		GatewayIntentBits[(GatewayIntentBits['GuildVoiceStates'] = 128)] = 'GuildVoiceStates';
		GatewayIntentBits[(GatewayIntentBits['GuildPresences'] = 256)] = 'GuildPresences';
		GatewayIntentBits[(GatewayIntentBits['GuildMessages'] = 512)] = 'GuildMessages';
		GatewayIntentBits[(GatewayIntentBits['GuildMessageReactions'] = 1024)] = 'GuildMessageReactions';
		GatewayIntentBits[(GatewayIntentBits['GuildMessageTyping'] = 2048)] = 'GuildMessageTyping';
		GatewayIntentBits[(GatewayIntentBits['DirectMessages'] = 4096)] = 'DirectMessages';
		GatewayIntentBits[(GatewayIntentBits['DirectMessageReactions'] = 8192)] = 'DirectMessageReactions';
		GatewayIntentBits[(GatewayIntentBits['DirectMessageTyping'] = 16384)] = 'DirectMessageTyping';
		GatewayIntentBits[(GatewayIntentBits['MessageContent'] = 32768)] = 'MessageContent';
		GatewayIntentBits[(GatewayIntentBits['GuildScheduledEvents'] = 65536)] = 'GuildScheduledEvents';
		GatewayIntentBits[(GatewayIntentBits['AutoModerationConfiguration'] = 1048576)] = 'AutoModerationConfiguration';
		GatewayIntentBits[(GatewayIntentBits['AutoModerationExecution'] = 2097152)] = 'AutoModerationExecution';
		GatewayIntentBits[(GatewayIntentBits['GuildMessagePolls'] = 16777216)] = 'GuildMessagePolls';
		GatewayIntentBits[(GatewayIntentBits['DirectMessagePolls'] = 33554432)] = 'DirectMessagePolls';
	})(GatewayIntentBits || (exports.GatewayIntentBits = GatewayIntentBits = {}));
	/**
	 * @see {@link https://docs.discord.com/developers/events/gateway-events#identify-gateway-capabilities}
	 */
	var GatewayCapabilityBits;
	(function (GatewayCapabilityBits) {
		/**
		 * Opts the client into receiving {@link https://docs.discord.com/developers/resources/channel#channel-object-obfuscated-channels | obfuscated channel metadata} over the Gateway for channels it can't view
		 *
		 * @unstable `CHANNEL_OBFUSCATION` is a temporary, testing-only opt-in for channel obfuscation. This opt-in mechanism
		 * will change before the feature reaches general availability. Obfuscation is then planned to apply to all bots
		 * automatically, even when they don't provide this capability.
		 */
		GatewayCapabilityBits[(GatewayCapabilityBits['ChannelObfuscation'] = 32768)] = 'ChannelObfuscation';
	})(GatewayCapabilityBits || (exports.GatewayCapabilityBits = GatewayCapabilityBits = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/topics/gateway-events#receive-events}
	 */
	var GatewayDispatchEvents;
	(function (GatewayDispatchEvents) {
		GatewayDispatchEvents['ApplicationCommandPermissionsUpdate'] = 'APPLICATION_COMMAND_PERMISSIONS_UPDATE';
		GatewayDispatchEvents['AutoModerationActionExecution'] = 'AUTO_MODERATION_ACTION_EXECUTION';
		GatewayDispatchEvents['AutoModerationRuleCreate'] = 'AUTO_MODERATION_RULE_CREATE';
		GatewayDispatchEvents['AutoModerationRuleDelete'] = 'AUTO_MODERATION_RULE_DELETE';
		GatewayDispatchEvents['AutoModerationRuleUpdate'] = 'AUTO_MODERATION_RULE_UPDATE';
		GatewayDispatchEvents['ChannelCreate'] = 'CHANNEL_CREATE';
		GatewayDispatchEvents['ChannelDelete'] = 'CHANNEL_DELETE';
		GatewayDispatchEvents['ChannelInfo'] = 'CHANNEL_INFO';
		GatewayDispatchEvents['ChannelPinsUpdate'] = 'CHANNEL_PINS_UPDATE';
		GatewayDispatchEvents['ChannelUpdate'] = 'CHANNEL_UPDATE';
		GatewayDispatchEvents['EntitlementCreate'] = 'ENTITLEMENT_CREATE';
		GatewayDispatchEvents['EntitlementDelete'] = 'ENTITLEMENT_DELETE';
		GatewayDispatchEvents['EntitlementUpdate'] = 'ENTITLEMENT_UPDATE';
		GatewayDispatchEvents['GuildAuditLogEntryCreate'] = 'GUILD_AUDIT_LOG_ENTRY_CREATE';
		GatewayDispatchEvents['GuildBanAdd'] = 'GUILD_BAN_ADD';
		GatewayDispatchEvents['GuildBanRemove'] = 'GUILD_BAN_REMOVE';
		GatewayDispatchEvents['GuildCreate'] = 'GUILD_CREATE';
		GatewayDispatchEvents['GuildDelete'] = 'GUILD_DELETE';
		GatewayDispatchEvents['GuildEmojisUpdate'] = 'GUILD_EMOJIS_UPDATE';
		GatewayDispatchEvents['GuildIntegrationsUpdate'] = 'GUILD_INTEGRATIONS_UPDATE';
		GatewayDispatchEvents['GuildMemberAdd'] = 'GUILD_MEMBER_ADD';
		GatewayDispatchEvents['GuildMemberRemove'] = 'GUILD_MEMBER_REMOVE';
		GatewayDispatchEvents['GuildMembersChunk'] = 'GUILD_MEMBERS_CHUNK';
		GatewayDispatchEvents['GuildMemberUpdate'] = 'GUILD_MEMBER_UPDATE';
		GatewayDispatchEvents['GuildRoleCreate'] = 'GUILD_ROLE_CREATE';
		GatewayDispatchEvents['GuildRoleDelete'] = 'GUILD_ROLE_DELETE';
		GatewayDispatchEvents['GuildRoleUpdate'] = 'GUILD_ROLE_UPDATE';
		GatewayDispatchEvents['GuildScheduledEventCreate'] = 'GUILD_SCHEDULED_EVENT_CREATE';
		GatewayDispatchEvents['GuildScheduledEventDelete'] = 'GUILD_SCHEDULED_EVENT_DELETE';
		GatewayDispatchEvents['GuildScheduledEventUpdate'] = 'GUILD_SCHEDULED_EVENT_UPDATE';
		GatewayDispatchEvents['GuildScheduledEventUserAdd'] = 'GUILD_SCHEDULED_EVENT_USER_ADD';
		GatewayDispatchEvents['GuildScheduledEventUserRemove'] = 'GUILD_SCHEDULED_EVENT_USER_REMOVE';
		GatewayDispatchEvents['GuildSoundboardSoundCreate'] = 'GUILD_SOUNDBOARD_SOUND_CREATE';
		GatewayDispatchEvents['GuildSoundboardSoundDelete'] = 'GUILD_SOUNDBOARD_SOUND_DELETE';
		GatewayDispatchEvents['GuildSoundboardSoundsUpdate'] = 'GUILD_SOUNDBOARD_SOUNDS_UPDATE';
		GatewayDispatchEvents['GuildSoundboardSoundUpdate'] = 'GUILD_SOUNDBOARD_SOUND_UPDATE';
		GatewayDispatchEvents['SoundboardSounds'] = 'SOUNDBOARD_SOUNDS';
		GatewayDispatchEvents['GuildStickersUpdate'] = 'GUILD_STICKERS_UPDATE';
		GatewayDispatchEvents['GuildUpdate'] = 'GUILD_UPDATE';
		GatewayDispatchEvents['IntegrationCreate'] = 'INTEGRATION_CREATE';
		GatewayDispatchEvents['IntegrationDelete'] = 'INTEGRATION_DELETE';
		GatewayDispatchEvents['IntegrationUpdate'] = 'INTEGRATION_UPDATE';
		GatewayDispatchEvents['InteractionCreate'] = 'INTERACTION_CREATE';
		GatewayDispatchEvents['InviteCreate'] = 'INVITE_CREATE';
		GatewayDispatchEvents['InviteDelete'] = 'INVITE_DELETE';
		GatewayDispatchEvents['MessageCreate'] = 'MESSAGE_CREATE';
		GatewayDispatchEvents['MessageDelete'] = 'MESSAGE_DELETE';
		GatewayDispatchEvents['MessageDeleteBulk'] = 'MESSAGE_DELETE_BULK';
		GatewayDispatchEvents['MessagePollVoteAdd'] = 'MESSAGE_POLL_VOTE_ADD';
		GatewayDispatchEvents['MessagePollVoteRemove'] = 'MESSAGE_POLL_VOTE_REMOVE';
		GatewayDispatchEvents['MessageReactionAdd'] = 'MESSAGE_REACTION_ADD';
		GatewayDispatchEvents['MessageReactionRemove'] = 'MESSAGE_REACTION_REMOVE';
		GatewayDispatchEvents['MessageReactionRemoveAll'] = 'MESSAGE_REACTION_REMOVE_ALL';
		GatewayDispatchEvents['MessageReactionRemoveEmoji'] = 'MESSAGE_REACTION_REMOVE_EMOJI';
		GatewayDispatchEvents['MessageUpdate'] = 'MESSAGE_UPDATE';
		GatewayDispatchEvents['PresenceUpdate'] = 'PRESENCE_UPDATE';
		GatewayDispatchEvents['RateLimited'] = 'RATE_LIMITED';
		GatewayDispatchEvents['Ready'] = 'READY';
		GatewayDispatchEvents['Resumed'] = 'RESUMED';
		GatewayDispatchEvents['StageInstanceCreate'] = 'STAGE_INSTANCE_CREATE';
		GatewayDispatchEvents['StageInstanceDelete'] = 'STAGE_INSTANCE_DELETE';
		GatewayDispatchEvents['StageInstanceUpdate'] = 'STAGE_INSTANCE_UPDATE';
		GatewayDispatchEvents['SubscriptionCreate'] = 'SUBSCRIPTION_CREATE';
		GatewayDispatchEvents['SubscriptionDelete'] = 'SUBSCRIPTION_DELETE';
		GatewayDispatchEvents['SubscriptionUpdate'] = 'SUBSCRIPTION_UPDATE';
		GatewayDispatchEvents['ThreadCreate'] = 'THREAD_CREATE';
		GatewayDispatchEvents['ThreadDelete'] = 'THREAD_DELETE';
		GatewayDispatchEvents['ThreadListSync'] = 'THREAD_LIST_SYNC';
		GatewayDispatchEvents['ThreadMembersUpdate'] = 'THREAD_MEMBERS_UPDATE';
		GatewayDispatchEvents['ThreadMemberUpdate'] = 'THREAD_MEMBER_UPDATE';
		GatewayDispatchEvents['ThreadUpdate'] = 'THREAD_UPDATE';
		GatewayDispatchEvents['TypingStart'] = 'TYPING_START';
		GatewayDispatchEvents['UserUpdate'] = 'USER_UPDATE';
		GatewayDispatchEvents['VoiceChannelEffectSend'] = 'VOICE_CHANNEL_EFFECT_SEND';
		GatewayDispatchEvents['VoiceChannelStartTimeUpdate'] = 'VOICE_CHANNEL_START_TIME_UPDATE';
		GatewayDispatchEvents['VoiceChannelStatusUpdate'] = 'VOICE_CHANNEL_STATUS_UPDATE';
		GatewayDispatchEvents['VoiceServerUpdate'] = 'VOICE_SERVER_UPDATE';
		GatewayDispatchEvents['VoiceStateUpdate'] = 'VOICE_STATE_UPDATE';
		GatewayDispatchEvents['WebhooksUpdate'] = 'WEBHOOKS_UPDATE';
	})(GatewayDispatchEvents || (exports.GatewayDispatchEvents = GatewayDispatchEvents = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/topics/gateway-events#voice-channel-effect-send-animation-types}
	 */
	var VoiceChannelEffectSendAnimationType;
	(function (VoiceChannelEffectSendAnimationType) {
		/**
		 * A fun animation, sent by a Nitro subscriber
		 */
		VoiceChannelEffectSendAnimationType[(VoiceChannelEffectSendAnimationType['Premium'] = 0)] = 'Premium';
		/**
		 * The standard animation
		 */
		VoiceChannelEffectSendAnimationType[(VoiceChannelEffectSendAnimationType['Basic'] = 1)] = 'Basic';
	})(VoiceChannelEffectSendAnimationType || (exports.VoiceChannelEffectSendAnimationType = VoiceChannelEffectSendAnimationType = {}));
	var GatewayRequestChannelInfoField;
	(function (GatewayRequestChannelInfoField) {
		GatewayRequestChannelInfoField['Status'] = 'status';
		GatewayRequestChannelInfoField['VoiceStartTime'] = 'voice_start_time';
	})(GatewayRequestChannelInfoField || (exports.GatewayRequestChannelInfoField = GatewayRequestChannelInfoField = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/gateway/v10.mjs
var v10_exports$4 = /* @__PURE__ */ __exportAll({
	GatewayCapabilityBits: () => GatewayCapabilityBits$1,
	GatewayCloseCodes: () => GatewayCloseCodes$1,
	GatewayDispatchEvents: () => GatewayDispatchEvents$1,
	GatewayIntentBits: () => GatewayIntentBits$1,
	GatewayOpcodes: () => GatewayOpcodes$1,
	GatewayRequestChannelInfoField: () => GatewayRequestChannelInfoField$1,
	GatewayVersion: () => GatewayVersion$1,
	VoiceChannelEffectSendAnimationType: () => VoiceChannelEffectSendAnimationType$1,
	default: () => v10_default$4
});
var import_v10$5,
	v10_default$4,
	GatewayCapabilityBits$1,
	GatewayCloseCodes$1,
	GatewayDispatchEvents$1,
	GatewayIntentBits$1,
	GatewayOpcodes$1,
	GatewayRequestChannelInfoField$1,
	GatewayVersion$1,
	VoiceChannelEffectSendAnimationType$1;
var init_v10$4 = __esmMin(() => {
	import_v10$5 = /* @__PURE__ */ __toESM(require_v10$5(), 1);
	v10_default$4 = import_v10$5.default;
	GatewayCapabilityBits$1 = import_v10$5.default.GatewayCapabilityBits;
	GatewayCloseCodes$1 = import_v10$5.default.GatewayCloseCodes;
	GatewayDispatchEvents$1 = import_v10$5.default.GatewayDispatchEvents;
	GatewayIntentBits$1 = import_v10$5.default.GatewayIntentBits;
	GatewayOpcodes$1 = import_v10$5.default.GatewayOpcodes;
	GatewayRequestChannelInfoField$1 = import_v10$5.default.GatewayRequestChannelInfoField;
	GatewayVersion$1 = import_v10$5.default.GatewayVersion;
	VoiceChannelEffectSendAnimationType$1 = import_v10$5.default.VoiceChannelEffectSendAnimationType;
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/globals.js
var require_globals = /* @__PURE__ */ __commonJSMin((exports) => {
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.FormattingPatterns = void 0;
	var timestampStyles = 'DFRSTdfst';
	var timestampLength = 13;
	/**
	 * @see {@link https://discord.com/developers/docs/reference#message-formatting-formats}
	 */
	exports.FormattingPatterns = {
		/**
		 * Regular expression for matching a user mention, strictly without a nickname
		 *
		 * The `id` group property is present on the `exec` result of this expression
		 */
		User: /<@(?<id>\d{17,20})>/,
		/**
		 * Regular expression for matching a user mention, strictly with a nickname
		 *
		 * The `id` group property is present on the `exec` result of this expression
		 *
		 * @deprecated Passing `!` in user mentions is no longer necessary / supported, and future message contents won't have it
		 */
		UserWithNickname: /<@!(?<id>\d{17,20})>/,
		/**
		 * Regular expression for matching a user mention, with or without a nickname
		 *
		 * The `id` group property is present on the `exec` result of this expression
		 *
		 * @deprecated Passing `!` in user mentions is no longer necessary / supported, and future message contents won't have it
		 */
		UserWithOptionalNickname: /<@!?(?<id>\d{17,20})>/,
		/**
		 * Regular expression for matching a channel mention
		 *
		 * The `id` group property is present on the `exec` result of this expression
		 */
		Channel: /<#(?<id>\d{17,20})>/,
		/**
		 * Regular expression for matching a role mention
		 *
		 * The `id` group property is present on the `exec` result of this expression
		 */
		Role: /<@&(?<id>\d{17,20})>/,
		/**
		 * Regular expression for matching a application command mention
		 *
		 * The `fullName` (possibly including `name`, `subcommandOrGroup` and `subcommand`) and `id` group properties are present on the `exec` result of this expression
		 */
		SlashCommand:
			/<\/(?<fullName>(?<name>[-_\p{Letter}\p{Number}\p{sc=Deva}\p{sc=Thai}]{1,32})(?: (?<subcommandOrGroup>[-_\p{Letter}\p{Number}\p{sc=Deva}\p{sc=Thai}]{1,32}))?(?: (?<subcommand>[-_\p{Letter}\p{Number}\p{sc=Deva}\p{sc=Thai}]{1,32}))?):(?<id>\d{17,20})>/u,
		/**
		 * Regular expression for matching a custom emoji, either static or animated
		 *
		 * The `animated`, `name` and `id` group properties are present on the `exec` result of this expression
		 */
		Emoji: /<(?<animated>a)?:(?<name>\w{2,32}):(?<id>\d{17,20})>/,
		/**
		 * Regular expression for matching strictly an animated custom emoji
		 *
		 * The `animated`, `name` and `id` group properties are present on the `exec` result of this expression
		 */
		AnimatedEmoji: /<(?<animated>a):(?<name>\w{2,32}):(?<id>\d{17,20})>/,
		/**
		 * Regular expression for matching strictly a static custom emoji
		 *
		 * The `name` and `id` group properties are present on the `exec` result of this expression
		 */
		StaticEmoji: /<:(?<name>\w{2,32}):(?<id>\d{17,20})>/,
		/**
		 * Regular expression for matching a timestamp, either default or custom styled
		 *
		 * The `timestamp` and `style` group properties are present on the `exec` result of this expression
		 */
		Timestamp: new RegExp(`<t:(?<timestamp>-?\\d{1,${timestampLength}})(:(?<style>[${timestampStyles}]))?>`),
		/**
		 * Regular expression for matching strictly default styled timestamps
		 *
		 * The `timestamp` group property is present on the `exec` result of this expression
		 */
		DefaultStyledTimestamp: new RegExp(`<t:(?<timestamp>-?\\d{1,${timestampLength}})>`),
		/**
		 * Regular expression for matching strictly custom styled timestamps
		 *
		 * The `timestamp` and `style` group properties are present on the `exec` result of this expression
		 */
		StyledTimestamp: new RegExp(`<t:(?<timestamp>-?\\d{1,${timestampLength}}):(?<style>[${timestampStyles}])>`),
		/**
		 * Regular expression for matching a guild navigation mention
		 *
		 * The `type` group property is present on the `exec` result of this expression
		 */
		GuildNavigation: /<id:(?<type>customize|browse|guide|linked-roles)>/,
		/**
		 * Regular expression for matching a linked role mention
		 *
		 * The `id` group property is present on the `exec` result of this expression
		 */
		LinkedRole: /<id:linked-roles:(?<id>\d{17,20})>/
	};
	/**
	 * Freezes the formatting patterns
	 *
	 * @internal
	 */
	Object.freeze(exports.FormattingPatterns);
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/globals.mjs
var globals_exports = /* @__PURE__ */ __exportAll({
	FormattingPatterns: () => FormattingPatterns$1,
	default: () => globals_default
});
var import_globals, globals_default, FormattingPatterns$1;
var init_globals = __esmMin(() => {
	import_globals = /* @__PURE__ */ __toESM(require_globals(), 1);
	globals_default = import_globals.default;
	FormattingPatterns$1 = import_globals.default.FormattingPatterns;
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/common.js
var require_common$2 = /* @__PURE__ */ __commonJSMin((exports) => {
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.PermissionFlagsBits = void 0;
	/**
	 * @see {@link https://discord.com/developers/docs/topics/permissions#permissions-bitwise-permission-flags}
	 *
	 * These flags are exported as `BigInt`s and NOT numbers. Wrapping them in `Number()`
	 * may cause issues, try to use BigInts as much as possible or modules that can
	 * replicate them in some way
	 */
	exports.PermissionFlagsBits = {
		/**
		 * Allows creation of instant invites
		 *
		 * Applies to channel types: Text, Voice, Stage
		 */
		CreateInstantInvite: 1n << 0n,
		/**
		 * Allows kicking members
		 */
		KickMembers: 1n << 1n,
		/**
		 * Allows banning members
		 */
		BanMembers: 1n << 2n,
		/**
		 * Allows all permissions and bypasses channel permission overwrites
		 */
		Administrator: 1n << 3n,
		/**
		 * Allows management and editing of channels
		 *
		 * Applies to channel types: Text, Voice, Stage
		 */
		ManageChannels: 1n << 4n,
		/**
		 * Allows management and editing of the guild
		 */
		ManageGuild: 1n << 5n,
		/**
		 * Allows for the addition of reactions to messages. This permission does not apply to reacting with an existing reaction on a message
		 *
		 * Applies to channel types: Text, Voice, Stage
		 */
		AddReactions: 1n << 6n,
		/**
		 * Allows for viewing of audit logs
		 */
		ViewAuditLog: 1n << 7n,
		/**
		 * Allows for using priority speaker in a voice channel
		 *
		 * Applies to channel types: Voice
		 */
		PrioritySpeaker: 1n << 8n,
		/**
		 * Allows the user to go live
		 *
		 * Applies to channel types: Voice, Stage
		 */
		Stream: 1n << 9n,
		/**
		 * Allows guild members to view a channel, which includes reading messages in text channels and joining voice channels
		 *
		 * Applies to channel types: Text, Voice, Stage
		 */
		ViewChannel: 1n << 10n,
		/**
		 * Allows for sending messages in a channel and creating threads in a forum
		 * (does not allow sending messages in threads)
		 *
		 * Applies to channel types: Text, Voice, Stage
		 */
		SendMessages: 1n << 11n,
		/**
		 * Allows for sending of `/tts` messages
		 *
		 * Applies to channel types: Text, Voice, Stage
		 */
		SendTTSMessages: 1n << 12n,
		/**
		 * Allows for deletion of other users messages
		 *
		 * Applies to channel types: Text, Voice, Stage
		 */
		ManageMessages: 1n << 13n,
		/**
		 * Links sent by users with this permission will be auto-embedded
		 *
		 * Applies to channel types: Text, Voice, Stage
		 */
		EmbedLinks: 1n << 14n,
		/**
		 * Allows for uploading images and files
		 *
		 * Applies to channel types: Text, Voice, Stage
		 */
		AttachFiles: 1n << 15n,
		/**
		 * Allows for reading of message history
		 *
		 * Applies to channel types: Text, Voice, Stage
		 */
		ReadMessageHistory: 1n << 16n,
		/**
		 * Allows for using the `@everyone` tag to notify all users in a channel,
		 * and the `@here` tag to notify all online users in a channel
		 *
		 * Applies to channel types: Text, Voice, Stage
		 */
		MentionEveryone: 1n << 17n,
		/**
		 * Allows the usage of custom emojis from other servers
		 *
		 * Applies to channel types: Text, Voice, Stage
		 */
		UseExternalEmojis: 1n << 18n,
		/**
		 * Allows for viewing guild insights
		 */
		ViewGuildInsights: 1n << 19n,
		/**
		 * Allows for joining of a voice channel
		 *
		 * Applies to channel types: Voice, Stage
		 */
		Connect: 1n << 20n,
		/**
		 * Allows for speaking in a voice channel
		 *
		 * Applies to channel types: Voice
		 */
		Speak: 1n << 21n,
		/**
		 * Allows for muting members in a voice channel
		 *
		 * Applies to channel types: Voice, Stage
		 */
		MuteMembers: 1n << 22n,
		/**
		 * Allows for deafening of members in a voice channel
		 *
		 * Applies to channel types: Voice
		 */
		DeafenMembers: 1n << 23n,
		/**
		 * Allows for moving of members between voice channels
		 *
		 * Applies to channel types: Voice, Stage
		 */
		MoveMembers: 1n << 24n,
		/**
		 * Allows for using voice-activity-detection in a voice channel
		 *
		 * Applies to channel types: Voice
		 */
		UseVAD: 1n << 25n,
		/**
		 * Allows for modification of own nickname
		 */
		ChangeNickname: 1n << 26n,
		/**
		 * Allows for modification of other users nicknames
		 */
		ManageNicknames: 1n << 27n,
		/**
		 * Allows management and editing of roles
		 *
		 * Applies to channel types: Text, Voice, Stage
		 */
		ManageRoles: 1n << 28n,
		/**
		 * Allows management and editing of webhooks
		 *
		 * Applies to channel types: Text, Voice, Stage
		 */
		ManageWebhooks: 1n << 29n,
		/**
		 * Allows management and editing of emojis, stickers, and soundboard sounds
		 *
		 * @deprecated This is the old name for {@link PermissionFlagsBits.ManageGuildExpressions}
		 */
		ManageEmojisAndStickers: 1n << 30n,
		/**
		 * Allows for editing and deleting emojis, stickers, and soundboard sounds created by all users
		 */
		ManageGuildExpressions: 1n << 30n,
		/**
		 * Allows members to use application commands, including slash commands and context menu commands
		 *
		 * Applies to channel types: Text, Voice, Stage
		 */
		UseApplicationCommands: 1n << 31n,
		/**
		 * Allows for requesting to speak in stage channels
		 *
		 * Applies to channel types: Stage
		 */
		RequestToSpeak: 1n << 32n,
		/**
		 * Allows for editing and deleting scheduled events created by all users
		 *
		 * Applies to channel types: Voice, Stage
		 */
		ManageEvents: 1n << 33n,
		/**
		 * Allows for deleting and archiving threads, and viewing all private threads
		 *
		 * Applies to channel types: Text
		 */
		ManageThreads: 1n << 34n,
		/**
		 * Allows for creating public and announcement threads
		 *
		 * Applies to channel types: Text
		 */
		CreatePublicThreads: 1n << 35n,
		/**
		 * Allows for creating private threads
		 *
		 * Applies to channel types: Text
		 */
		CreatePrivateThreads: 1n << 36n,
		/**
		 * Allows the usage of custom stickers from other servers
		 *
		 * Applies to channel types: Text, Voice, Stage
		 */
		UseExternalStickers: 1n << 37n,
		/**
		 * Allows for sending messages in threads
		 *
		 * Applies to channel types: Text
		 */
		SendMessagesInThreads: 1n << 38n,
		/**
		 * Allows for using Activities (applications with the {@link ApplicationFlags.Embedded} flag)
		 *
		 * Applies to channel types: Text, Voice
		 */
		UseEmbeddedActivities: 1n << 39n,
		/**
		 * Allows for timing out users to prevent them from sending or reacting to messages in chat and threads,
		 * and from speaking in voice and stage channels
		 */
		ModerateMembers: 1n << 40n,
		/**
		 * Allows for viewing role subscription insights
		 */
		ViewCreatorMonetizationAnalytics: 1n << 41n,
		/**
		 * Allows for using soundboard in a voice channel
		 *
		 * Applies to channel types: Voice
		 */
		UseSoundboard: 1n << 42n,
		/**
		 * Allows for creating emojis, stickers, and soundboard sounds, and editing and deleting those created by the current user
		 */
		CreateGuildExpressions: 1n << 43n,
		/**
		 * Allows for creating scheduled events, and editing and deleting those created by the current user
		 *
		 * Applies to channel types: Voice, Stage
		 */
		CreateEvents: 1n << 44n,
		/**
		 * Allows the usage of custom soundboard sounds from other servers
		 *
		 * Applies to channel types: Voice
		 */
		UseExternalSounds: 1n << 45n,
		/**
		 * Allows sending voice messages
		 *
		 * Applies to channel types: Text, Voice, Stage
		 */
		SendVoiceMessages: 1n << 46n,
		/**
		 * Allows setting voice channel status
		 *
		 * Applies to channel types: Voice
		 */
		SetVoiceChannelStatus: 1n << 48n,
		/**
		 * Allows sending polls
		 *
		 * Applies to channel types: Text, Voice, Stage
		 */
		SendPolls: 1n << 49n,
		/**
		 * Allows user-installed apps to send public responses. When disabled, users will still be allowed to use their apps but the responses will be ephemeral. This only applies to apps not also installed to the server
		 *
		 * Applies to channel types: Text, Voice, Stage
		 */
		UseExternalApps: 1n << 50n,
		/**
		 * Allows pinning and unpinning messages
		 *
		 * Applies to channel types: Text
		 */
		PinMessages: 1n << 51n,
		/**
		 * Allows bypassing slowmode restrictions
		 *
		 * Applies to channel types: Text, Voice, Stage
		 */
		BypassSlowmode: 1n << 52n
	};
	/**
	 * Freeze the object of bits, preventing any modifications to it
	 *
	 * @internal
	 */
	Object.freeze(exports.PermissionFlagsBits);
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/application.js
var require_application = /* @__PURE__ */ __commonJSMin((exports) => {
	/**
	 * Types extracted from https://discord.com/developers/docs/resources/application
	 */
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.ApplicationWebhookEventStatus =
		exports.ActivityLocationKind =
		exports.ApplicationRoleConnectionMetadataType =
		exports.ApplicationFlags =
			void 0;
	/**
	 * @see {@link https://docs.discord.com/developers/resources/application#application-object-application-flags}
	 */
	var ApplicationFlags;
	(function (ApplicationFlags) {
		/**
		 * @unstable This application flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 */
		ApplicationFlags[(ApplicationFlags['EmbeddedReleased'] = 2)] = 'EmbeddedReleased';
		/**
		 * @unstable This application flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 */
		ApplicationFlags[(ApplicationFlags['ManagedEmoji'] = 4)] = 'ManagedEmoji';
		/**
		 * @unstable This application flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 */
		ApplicationFlags[(ApplicationFlags['EmbeddedIAP'] = 8)] = 'EmbeddedIAP';
		/**
		 * @unstable This application flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 */
		ApplicationFlags[(ApplicationFlags['GroupDMCreate'] = 16)] = 'GroupDMCreate';
		/**
		 * Indicates if an app uses the Auto Moderation API
		 */
		ApplicationFlags[(ApplicationFlags['ApplicationAutoModerationRuleCreateBadge'] = 64)] = 'ApplicationAutoModerationRuleCreateBadge';
		/**
		 * @unstable This application flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 */
		ApplicationFlags[(ApplicationFlags['RPCHasConnected'] = 2048)] = 'RPCHasConnected';
		/**
		 * Intent required for bots in 100 or more servers to receive `presence_update` events
		 */
		ApplicationFlags[(ApplicationFlags['GatewayPresence'] = 4096)] = 'GatewayPresence';
		/**
		 * Intent required for bots in under 100 servers to receive `presence_update` events, found in Bot Settings
		 */
		ApplicationFlags[(ApplicationFlags['GatewayPresenceLimited'] = 8192)] = 'GatewayPresenceLimited';
		/**
		 * Intent required for bots in 100 or more servers to receive member-related events like `guild_member_add`.
		 *
		 * @see List of member-related events {@link https://discord.com/developers/docs/topics/gateway#list-of-intents | under `GUILD_MEMBERS`}
		 */
		ApplicationFlags[(ApplicationFlags['GatewayGuildMembers'] = 16384)] = 'GatewayGuildMembers';
		/**
		 * Intent required for bots in under 100 servers to receive member-related events like `guild_member_add`, found in Bot Settings.
		 *
		 * @see List of member-related events {@link https://discord.com/developers/docs/topics/gateway#list-of-intents | under `GUILD_MEMBERS`}
		 */
		ApplicationFlags[(ApplicationFlags['GatewayGuildMembersLimited'] = 32768)] = 'GatewayGuildMembersLimited';
		/**
		 * Indicates unusual growth of an app that prevents verification
		 */
		ApplicationFlags[(ApplicationFlags['VerificationPendingGuildLimit'] = 65536)] = 'VerificationPendingGuildLimit';
		/**
		 * Indicates if an app is embedded within the Discord client (currently unavailable publicly)
		 */
		ApplicationFlags[(ApplicationFlags['Embedded'] = 131072)] = 'Embedded';
		/**
		 * Intent required for bots in 100 or more servers to receive {@link https://support-dev.discord.com/hc/articles/6207308062871 | message content}
		 */
		ApplicationFlags[(ApplicationFlags['GatewayMessageContent'] = 262144)] = 'GatewayMessageContent';
		/**
		 * Intent required for bots in under 100 servers to receive {@link https://support-dev.discord.com/hc/articles/6207308062871 | message content},
		 * found in Bot Settings
		 */
		ApplicationFlags[(ApplicationFlags['GatewayMessageContentLimited'] = 524288)] = 'GatewayMessageContentLimited';
		/**
		 * @unstable This application flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 */
		ApplicationFlags[(ApplicationFlags['EmbeddedFirstParty'] = 1048576)] = 'EmbeddedFirstParty';
		/**
		 * Indicates if an app has registered global {@link https://discord.com/developers/docs/interactions/application-commands | application commands}
		 */
		ApplicationFlags[(ApplicationFlags['ApplicationCommandBadge'] = 8388608)] = 'ApplicationCommandBadge';
	})(ApplicationFlags || (exports.ApplicationFlags = ApplicationFlags = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/application-role-connection-metadata#application-role-connection-metadata-object-application-role-connection-metadata-type}
	 */
	var ApplicationRoleConnectionMetadataType;
	(function (ApplicationRoleConnectionMetadataType) {
		/**
		 * The metadata value (`integer`) is less than or equal to the guild's configured value (`integer`)
		 */
		ApplicationRoleConnectionMetadataType[(ApplicationRoleConnectionMetadataType['IntegerLessThanOrEqual'] = 1)] = 'IntegerLessThanOrEqual';
		/**
		 * The metadata value (`integer`) is greater than or equal to the guild's configured value (`integer`)
		 */
		ApplicationRoleConnectionMetadataType[(ApplicationRoleConnectionMetadataType['IntegerGreaterThanOrEqual'] = 2)] = 'IntegerGreaterThanOrEqual';
		/**
		 * The metadata value (`integer`) is equal to the guild's configured value (`integer`)
		 */
		ApplicationRoleConnectionMetadataType[(ApplicationRoleConnectionMetadataType['IntegerEqual'] = 3)] = 'IntegerEqual';
		/**
		 * The metadata value (`integer`) is not equal to the guild's configured value (`integer`)
		 */
		ApplicationRoleConnectionMetadataType[(ApplicationRoleConnectionMetadataType['IntegerNotEqual'] = 4)] = 'IntegerNotEqual';
		/**
		 * The metadata value (`ISO8601 string`) is less than or equal to the guild's configured value (`integer`; days before current date)
		 */
		ApplicationRoleConnectionMetadataType[(ApplicationRoleConnectionMetadataType['DatetimeLessThanOrEqual'] = 5)] = 'DatetimeLessThanOrEqual';
		/**
		 * The metadata value (`ISO8601 string`) is greater than or equal to the guild's configured value (`integer`; days before current date)
		 */
		ApplicationRoleConnectionMetadataType[(ApplicationRoleConnectionMetadataType['DatetimeGreaterThanOrEqual'] = 6)] =
			'DatetimeGreaterThanOrEqual';
		/**
		 * The metadata value (`integer`) is equal to the guild's configured value (`integer`; `1`)
		 */
		ApplicationRoleConnectionMetadataType[(ApplicationRoleConnectionMetadataType['BooleanEqual'] = 7)] = 'BooleanEqual';
		/**
		 * The metadata value (`integer`) is not equal to the guild's configured value (`integer`; `1`)
		 */
		ApplicationRoleConnectionMetadataType[(ApplicationRoleConnectionMetadataType['BooleanNotEqual'] = 8)] = 'BooleanNotEqual';
	})(ApplicationRoleConnectionMetadataType || (exports.ApplicationRoleConnectionMetadataType = ApplicationRoleConnectionMetadataType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/application#get-application-activity-instance-activity-location-kind-enum}
	 */
	var ActivityLocationKind;
	(function (ActivityLocationKind) {
		/**
		 * Location is a guild channel
		 */
		ActivityLocationKind['GuildChannel'] = 'gc';
		/**
		 * Location is a private channel, such as a DM or GDM
		 */
		ActivityLocationKind['PrivateChannel'] = 'pc';
	})(ActivityLocationKind || (exports.ActivityLocationKind = ActivityLocationKind = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/application#application-object-application-event-webhook-status}
	 */
	var ApplicationWebhookEventStatus;
	(function (ApplicationWebhookEventStatus) {
		/**
		 * Webhook events are disabled by developer
		 */
		ApplicationWebhookEventStatus[(ApplicationWebhookEventStatus['Disabled'] = 1)] = 'Disabled';
		/**
		 * Webhook events are enabled by developer
		 */
		ApplicationWebhookEventStatus[(ApplicationWebhookEventStatus['Enabled'] = 2)] = 'Enabled';
		/**
		 * Webhook events are disabled by Discord, usually due to inactivity
		 */
		ApplicationWebhookEventStatus[(ApplicationWebhookEventStatus['DisabledByDiscord'] = 3)] = 'DisabledByDiscord';
	})(ApplicationWebhookEventStatus || (exports.ApplicationWebhookEventStatus = ApplicationWebhookEventStatus = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/auditLog.js
var require_auditLog = /* @__PURE__ */ __commonJSMin((exports) => {
	/**
	 * Types extracted from https://discord.com/developers/docs/resources/audit-log
	 */
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.AuditLogOptionsType = exports.AuditLogEvent = void 0;
	/**
	 * @see {@link https://discord.com/developers/docs/resources/audit-log#audit-log-entry-object-audit-log-events}
	 */
	var AuditLogEvent;
	(function (AuditLogEvent) {
		AuditLogEvent[(AuditLogEvent['GuildUpdate'] = 1)] = 'GuildUpdate';
		AuditLogEvent[(AuditLogEvent['ChannelCreate'] = 10)] = 'ChannelCreate';
		AuditLogEvent[(AuditLogEvent['ChannelUpdate'] = 11)] = 'ChannelUpdate';
		AuditLogEvent[(AuditLogEvent['ChannelDelete'] = 12)] = 'ChannelDelete';
		AuditLogEvent[(AuditLogEvent['ChannelOverwriteCreate'] = 13)] = 'ChannelOverwriteCreate';
		AuditLogEvent[(AuditLogEvent['ChannelOverwriteUpdate'] = 14)] = 'ChannelOverwriteUpdate';
		AuditLogEvent[(AuditLogEvent['ChannelOverwriteDelete'] = 15)] = 'ChannelOverwriteDelete';
		AuditLogEvent[(AuditLogEvent['MemberKick'] = 20)] = 'MemberKick';
		AuditLogEvent[(AuditLogEvent['MemberPrune'] = 21)] = 'MemberPrune';
		AuditLogEvent[(AuditLogEvent['MemberBanAdd'] = 22)] = 'MemberBanAdd';
		AuditLogEvent[(AuditLogEvent['MemberBanRemove'] = 23)] = 'MemberBanRemove';
		AuditLogEvent[(AuditLogEvent['MemberUpdate'] = 24)] = 'MemberUpdate';
		AuditLogEvent[(AuditLogEvent['MemberRoleUpdate'] = 25)] = 'MemberRoleUpdate';
		AuditLogEvent[(AuditLogEvent['MemberMove'] = 26)] = 'MemberMove';
		AuditLogEvent[(AuditLogEvent['MemberDisconnect'] = 27)] = 'MemberDisconnect';
		AuditLogEvent[(AuditLogEvent['BotAdd'] = 28)] = 'BotAdd';
		AuditLogEvent[(AuditLogEvent['RoleCreate'] = 30)] = 'RoleCreate';
		AuditLogEvent[(AuditLogEvent['RoleUpdate'] = 31)] = 'RoleUpdate';
		AuditLogEvent[(AuditLogEvent['RoleDelete'] = 32)] = 'RoleDelete';
		AuditLogEvent[(AuditLogEvent['InviteCreate'] = 40)] = 'InviteCreate';
		AuditLogEvent[(AuditLogEvent['InviteUpdate'] = 41)] = 'InviteUpdate';
		AuditLogEvent[(AuditLogEvent['InviteDelete'] = 42)] = 'InviteDelete';
		AuditLogEvent[(AuditLogEvent['WebhookCreate'] = 50)] = 'WebhookCreate';
		AuditLogEvent[(AuditLogEvent['WebhookUpdate'] = 51)] = 'WebhookUpdate';
		AuditLogEvent[(AuditLogEvent['WebhookDelete'] = 52)] = 'WebhookDelete';
		AuditLogEvent[(AuditLogEvent['EmojiCreate'] = 60)] = 'EmojiCreate';
		AuditLogEvent[(AuditLogEvent['EmojiUpdate'] = 61)] = 'EmojiUpdate';
		AuditLogEvent[(AuditLogEvent['EmojiDelete'] = 62)] = 'EmojiDelete';
		AuditLogEvent[(AuditLogEvent['MessageDelete'] = 72)] = 'MessageDelete';
		AuditLogEvent[(AuditLogEvent['MessageBulkDelete'] = 73)] = 'MessageBulkDelete';
		AuditLogEvent[(AuditLogEvent['MessagePin'] = 74)] = 'MessagePin';
		AuditLogEvent[(AuditLogEvent['MessageUnpin'] = 75)] = 'MessageUnpin';
		AuditLogEvent[(AuditLogEvent['IntegrationCreate'] = 80)] = 'IntegrationCreate';
		AuditLogEvent[(AuditLogEvent['IntegrationUpdate'] = 81)] = 'IntegrationUpdate';
		AuditLogEvent[(AuditLogEvent['IntegrationDelete'] = 82)] = 'IntegrationDelete';
		AuditLogEvent[(AuditLogEvent['StageInstanceCreate'] = 83)] = 'StageInstanceCreate';
		AuditLogEvent[(AuditLogEvent['StageInstanceUpdate'] = 84)] = 'StageInstanceUpdate';
		AuditLogEvent[(AuditLogEvent['StageInstanceDelete'] = 85)] = 'StageInstanceDelete';
		AuditLogEvent[(AuditLogEvent['StickerCreate'] = 90)] = 'StickerCreate';
		AuditLogEvent[(AuditLogEvent['StickerUpdate'] = 91)] = 'StickerUpdate';
		AuditLogEvent[(AuditLogEvent['StickerDelete'] = 92)] = 'StickerDelete';
		AuditLogEvent[(AuditLogEvent['GuildScheduledEventCreate'] = 100)] = 'GuildScheduledEventCreate';
		AuditLogEvent[(AuditLogEvent['GuildScheduledEventUpdate'] = 101)] = 'GuildScheduledEventUpdate';
		AuditLogEvent[(AuditLogEvent['GuildScheduledEventDelete'] = 102)] = 'GuildScheduledEventDelete';
		AuditLogEvent[(AuditLogEvent['ThreadCreate'] = 110)] = 'ThreadCreate';
		AuditLogEvent[(AuditLogEvent['ThreadUpdate'] = 111)] = 'ThreadUpdate';
		AuditLogEvent[(AuditLogEvent['ThreadDelete'] = 112)] = 'ThreadDelete';
		AuditLogEvent[(AuditLogEvent['ApplicationCommandPermissionUpdate'] = 121)] = 'ApplicationCommandPermissionUpdate';
		AuditLogEvent[(AuditLogEvent['SoundboardSoundCreate'] = 130)] = 'SoundboardSoundCreate';
		AuditLogEvent[(AuditLogEvent['SoundboardSoundUpdate'] = 131)] = 'SoundboardSoundUpdate';
		AuditLogEvent[(AuditLogEvent['SoundboardSoundDelete'] = 132)] = 'SoundboardSoundDelete';
		AuditLogEvent[(AuditLogEvent['AutoModerationRuleCreate'] = 140)] = 'AutoModerationRuleCreate';
		AuditLogEvent[(AuditLogEvent['AutoModerationRuleUpdate'] = 141)] = 'AutoModerationRuleUpdate';
		AuditLogEvent[(AuditLogEvent['AutoModerationRuleDelete'] = 142)] = 'AutoModerationRuleDelete';
		AuditLogEvent[(AuditLogEvent['AutoModerationBlockMessage'] = 143)] = 'AutoModerationBlockMessage';
		AuditLogEvent[(AuditLogEvent['AutoModerationFlagToChannel'] = 144)] = 'AutoModerationFlagToChannel';
		AuditLogEvent[(AuditLogEvent['AutoModerationUserCommunicationDisabled'] = 145)] = 'AutoModerationUserCommunicationDisabled';
		AuditLogEvent[(AuditLogEvent['AutoModerationQuarantineUser'] = 146)] = 'AutoModerationQuarantineUser';
		AuditLogEvent[(AuditLogEvent['CreatorMonetizationRequestCreated'] = 150)] = 'CreatorMonetizationRequestCreated';
		AuditLogEvent[(AuditLogEvent['CreatorMonetizationTermsAccepted'] = 151)] = 'CreatorMonetizationTermsAccepted';
		AuditLogEvent[(AuditLogEvent['OnboardingPromptCreate'] = 163)] = 'OnboardingPromptCreate';
		AuditLogEvent[(AuditLogEvent['OnboardingPromptUpdate'] = 164)] = 'OnboardingPromptUpdate';
		AuditLogEvent[(AuditLogEvent['OnboardingPromptDelete'] = 165)] = 'OnboardingPromptDelete';
		AuditLogEvent[(AuditLogEvent['OnboardingCreate'] = 166)] = 'OnboardingCreate';
		AuditLogEvent[(AuditLogEvent['OnboardingUpdate'] = 167)] = 'OnboardingUpdate';
		AuditLogEvent[(AuditLogEvent['HomeSettingsCreate'] = 190)] = 'HomeSettingsCreate';
		AuditLogEvent[(AuditLogEvent['HomeSettingsUpdate'] = 191)] = 'HomeSettingsUpdate';
		AuditLogEvent[(AuditLogEvent['VoiceChannelStatusCreate'] = 192)] = 'VoiceChannelStatusCreate';
		AuditLogEvent[(AuditLogEvent['VoiceChannelStatusDelete'] = 193)] = 'VoiceChannelStatusDelete';
	})(AuditLogEvent || (exports.AuditLogEvent = AuditLogEvent = {}));
	var AuditLogOptionsType;
	(function (AuditLogOptionsType) {
		AuditLogOptionsType['Role'] = '0';
		AuditLogOptionsType['Member'] = '1';
	})(AuditLogOptionsType || (exports.AuditLogOptionsType = AuditLogOptionsType = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/autoModeration.js
var require_autoModeration = /* @__PURE__ */ __commonJSMin((exports) => {
	/**
	 * Types extracted from https://discord.com/developers/docs/resources/auto-moderation
	 */
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.AutoModerationActionType =
		exports.AutoModerationRuleEventType =
		exports.AutoModerationRuleKeywordPresetType =
		exports.AutoModerationRuleTriggerType =
			void 0;
	/**
	 * @see {@link https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-trigger-types}
	 */
	var AutoModerationRuleTriggerType;
	(function (AutoModerationRuleTriggerType) {
		/**
		 * Check if content contains words from a user defined list of keywords (Maximum of 6 per guild)
		 */
		AutoModerationRuleTriggerType[(AutoModerationRuleTriggerType['Keyword'] = 1)] = 'Keyword';
		/**
		 * Check if content represents generic spam (Maximum of 1 per guild)
		 */
		AutoModerationRuleTriggerType[(AutoModerationRuleTriggerType['Spam'] = 3)] = 'Spam';
		/**
		 * Check if content contains words from internal pre-defined wordsets (Maximum of 1 per guild)
		 */
		AutoModerationRuleTriggerType[(AutoModerationRuleTriggerType['KeywordPreset'] = 4)] = 'KeywordPreset';
		/**
		 * Check if content contains more mentions than allowed (Maximum of 1 per guild)
		 */
		AutoModerationRuleTriggerType[(AutoModerationRuleTriggerType['MentionSpam'] = 5)] = 'MentionSpam';
		/**
		 * Check if member profile contains words from a user defined list of keywords (Maximum of 1 per guild)
		 */
		AutoModerationRuleTriggerType[(AutoModerationRuleTriggerType['MemberProfile'] = 6)] = 'MemberProfile';
	})(AutoModerationRuleTriggerType || (exports.AutoModerationRuleTriggerType = AutoModerationRuleTriggerType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-keyword-preset-types}
	 */
	var AutoModerationRuleKeywordPresetType;
	(function (AutoModerationRuleKeywordPresetType) {
		/**
		 * Words that may be considered forms of swearing or cursing
		 */
		AutoModerationRuleKeywordPresetType[(AutoModerationRuleKeywordPresetType['Profanity'] = 1)] = 'Profanity';
		/**
		 * Words that refer to sexually explicit behavior or activity
		 */
		AutoModerationRuleKeywordPresetType[(AutoModerationRuleKeywordPresetType['SexualContent'] = 2)] = 'SexualContent';
		/**
		 * Personal insults or words that may be considered hate speech
		 */
		AutoModerationRuleKeywordPresetType[(AutoModerationRuleKeywordPresetType['Slurs'] = 3)] = 'Slurs';
	})(AutoModerationRuleKeywordPresetType || (exports.AutoModerationRuleKeywordPresetType = AutoModerationRuleKeywordPresetType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-event-types}
	 */
	var AutoModerationRuleEventType;
	(function (AutoModerationRuleEventType) {
		/**
		 * When a member sends or edits a message in the guild
		 */
		AutoModerationRuleEventType[(AutoModerationRuleEventType['MessageSend'] = 1)] = 'MessageSend';
		/**
		 * When a member edits their profile
		 */
		AutoModerationRuleEventType[(AutoModerationRuleEventType['MemberUpdate'] = 2)] = 'MemberUpdate';
	})(AutoModerationRuleEventType || (exports.AutoModerationRuleEventType = AutoModerationRuleEventType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-action-object-action-types}
	 */
	var AutoModerationActionType;
	(function (AutoModerationActionType) {
		/**
		 * Blocks a member's message and prevents it from being posted.
		 * A custom explanation can be specified and shown to members whenever their message is blocked
		 */
		AutoModerationActionType[(AutoModerationActionType['BlockMessage'] = 1)] = 'BlockMessage';
		/**
		 * Logs user content to a specified channel
		 */
		AutoModerationActionType[(AutoModerationActionType['SendAlertMessage'] = 2)] = 'SendAlertMessage';
		/**
		 * Timeout user for specified duration, this action type can be set if the bot has `MODERATE_MEMBERS` permission
		 */
		AutoModerationActionType[(AutoModerationActionType['Timeout'] = 3)] = 'Timeout';
		/**
		 * Prevents a member from using text, voice, or other interactions
		 */
		AutoModerationActionType[(AutoModerationActionType['BlockMemberInteraction'] = 4)] = 'BlockMemberInteraction';
	})(AutoModerationActionType || (exports.AutoModerationActionType = AutoModerationActionType = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/channel.js
var require_channel$1 = /* @__PURE__ */ __commonJSMin((exports) => {
	/**
	 * Types extracted from https://discord.com/developers/docs/resources/channel
	 */
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.ChannelFlags =
		exports.ThreadMemberFlags =
		exports.ThreadAutoArchiveDuration =
		exports.OverwriteType =
		exports.VideoQualityMode =
		exports.ChannelType =
		exports.ForumLayoutType =
		exports.SortOrderType =
			void 0;
	/**
	 * @see {@link https://discord.com/developers/docs/resources/channel/#channel-object-sort-order-types}
	 */
	var SortOrderType;
	(function (SortOrderType) {
		/**
		 * Sort forum posts by activity
		 */
		SortOrderType[(SortOrderType['LatestActivity'] = 0)] = 'LatestActivity';
		/**
		 * Sort forum posts by creation time (from most recent to oldest)
		 */
		SortOrderType[(SortOrderType['CreationDate'] = 1)] = 'CreationDate';
	})(SortOrderType || (exports.SortOrderType = SortOrderType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/channel/#channel-object-forum-layout-types}
	 */
	var ForumLayoutType;
	(function (ForumLayoutType) {
		/**
		 * No default has been set for forum channel
		 */
		ForumLayoutType[(ForumLayoutType['NotSet'] = 0)] = 'NotSet';
		/**
		 * Display posts as a list
		 */
		ForumLayoutType[(ForumLayoutType['ListView'] = 1)] = 'ListView';
		/**
		 * Display posts as a collection of tiles
		 */
		ForumLayoutType[(ForumLayoutType['GalleryView'] = 2)] = 'GalleryView';
	})(ForumLayoutType || (exports.ForumLayoutType = ForumLayoutType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/channel#channel-object-channel-types}
	 */
	var ChannelType;
	(function (ChannelType) {
		/**
		 * A text channel within a guild
		 */
		ChannelType[(ChannelType['GuildText'] = 0)] = 'GuildText';
		/**
		 * A direct message between users
		 */
		ChannelType[(ChannelType['DM'] = 1)] = 'DM';
		/**
		 * A voice channel within a guild
		 */
		ChannelType[(ChannelType['GuildVoice'] = 2)] = 'GuildVoice';
		/**
		 * A direct message between multiple users
		 */
		ChannelType[(ChannelType['GroupDM'] = 3)] = 'GroupDM';
		/**
		 * An organizational category that contains up to 50 channels
		 *
		 * @see {@link https://support.discord.com/hc/articles/115001580171}
		 */
		ChannelType[(ChannelType['GuildCategory'] = 4)] = 'GuildCategory';
		/**
		 * A channel that users can follow and crosspost into their own guild
		 *
		 * @see {@link https://support.discord.com/hc/articles/360032008192}
		 */
		ChannelType[(ChannelType['GuildAnnouncement'] = 5)] = 'GuildAnnouncement';
		/**
		 * A temporary sub-channel within a Guild Announcement channel
		 */
		ChannelType[(ChannelType['AnnouncementThread'] = 10)] = 'AnnouncementThread';
		/**
		 * A temporary sub-channel within a Guild Text or Guild Forum channel
		 */
		ChannelType[(ChannelType['PublicThread'] = 11)] = 'PublicThread';
		/**
		 * A temporary sub-channel within a Guild Text channel that is only viewable by those invited and those with the Manage Threads permission
		 */
		ChannelType[(ChannelType['PrivateThread'] = 12)] = 'PrivateThread';
		/**
		 * A voice channel for hosting events with an audience
		 *
		 * @see {@link https://support.discord.com/hc/articles/1500005513722}
		 */
		ChannelType[(ChannelType['GuildStageVoice'] = 13)] = 'GuildStageVoice';
		/**
		 * The channel in a Student Hub containing the listed servers
		 *
		 * @see {@link https://support.discord.com/hc/articles/4406046651927}
		 */
		ChannelType[(ChannelType['GuildDirectory'] = 14)] = 'GuildDirectory';
		/**
		 * A channel that can only contain threads
		 */
		ChannelType[(ChannelType['GuildForum'] = 15)] = 'GuildForum';
		/**
		 * A channel like forum channels but contains media for server subscriptions
		 *
		 * @see {@link https://creator-support.discord.com/hc/articles/14346342766743}
		 */
		ChannelType[(ChannelType['GuildMedia'] = 16)] = 'GuildMedia';
		/**
		 * A channel that users can follow and crosspost into their own guild
		 *
		 * @deprecated This is the old name for {@link ChannelType.GuildAnnouncement}
		 * @see {@link https://support.discord.com/hc/articles/360032008192}
		 */
		ChannelType[(ChannelType['GuildNews'] = 5)] = 'GuildNews';
		/**
		 * A temporary sub-channel within a Guild Announcement channel
		 *
		 * @deprecated This is the old name for {@link ChannelType.AnnouncementThread}
		 */
		ChannelType[(ChannelType['GuildNewsThread'] = 10)] = 'GuildNewsThread';
		/**
		 * A temporary sub-channel within a Guild Text channel
		 *
		 * @deprecated This is the old name for {@link ChannelType.PublicThread}
		 */
		ChannelType[(ChannelType['GuildPublicThread'] = 11)] = 'GuildPublicThread';
		/**
		 * A temporary sub-channel within a Guild Text channel that is only viewable by those invited and those with the Manage Threads permission
		 *
		 * @deprecated This is the old name for {@link ChannelType.PrivateThread}
		 */
		ChannelType[(ChannelType['GuildPrivateThread'] = 12)] = 'GuildPrivateThread';
	})(ChannelType || (exports.ChannelType = ChannelType = {}));
	var VideoQualityMode;
	(function (VideoQualityMode) {
		/**
		 * Discord chooses the quality for optimal performance
		 */
		VideoQualityMode[(VideoQualityMode['Auto'] = 1)] = 'Auto';
		/**
		 * 720p
		 */
		VideoQualityMode[(VideoQualityMode['Full'] = 2)] = 'Full';
	})(VideoQualityMode || (exports.VideoQualityMode = VideoQualityMode = {}));
	var OverwriteType;
	(function (OverwriteType) {
		OverwriteType[(OverwriteType['Role'] = 0)] = 'Role';
		OverwriteType[(OverwriteType['Member'] = 1)] = 'Member';
	})(OverwriteType || (exports.OverwriteType = OverwriteType = {}));
	var ThreadAutoArchiveDuration;
	(function (ThreadAutoArchiveDuration) {
		ThreadAutoArchiveDuration[(ThreadAutoArchiveDuration['OneHour'] = 60)] = 'OneHour';
		ThreadAutoArchiveDuration[(ThreadAutoArchiveDuration['OneDay'] = 1440)] = 'OneDay';
		ThreadAutoArchiveDuration[(ThreadAutoArchiveDuration['ThreeDays'] = 4320)] = 'ThreeDays';
		ThreadAutoArchiveDuration[(ThreadAutoArchiveDuration['OneWeek'] = 10080)] = 'OneWeek';
	})(ThreadAutoArchiveDuration || (exports.ThreadAutoArchiveDuration = ThreadAutoArchiveDuration = {}));
	var ThreadMemberFlags;
	(function (ThreadMemberFlags) {
		/**
		 * @unstable This thread member flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 */
		ThreadMemberFlags[(ThreadMemberFlags['HasInteracted'] = 1)] = 'HasInteracted';
		/**
		 * @unstable This thread member flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 */
		ThreadMemberFlags[(ThreadMemberFlags['AllMessages'] = 2)] = 'AllMessages';
		/**
		 * @unstable This thread member flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 */
		ThreadMemberFlags[(ThreadMemberFlags['OnlyMentions'] = 4)] = 'OnlyMentions';
		/**
		 * @unstable This thread member flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 */
		ThreadMemberFlags[(ThreadMemberFlags['NoMessages'] = 8)] = 'NoMessages';
	})(ThreadMemberFlags || (exports.ThreadMemberFlags = ThreadMemberFlags = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/channel#channel-object-channel-flags}
	 */
	var ChannelFlags;
	(function (ChannelFlags) {
		/**
		 * @unstable This channel flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 */
		ChannelFlags[(ChannelFlags['GuildFeedRemoved'] = 1)] = 'GuildFeedRemoved';
		/**
		 * This thread is pinned to the top of its parent forum channel
		 */
		ChannelFlags[(ChannelFlags['Pinned'] = 2)] = 'Pinned';
		/**
		 * @unstable This channel flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 */
		ChannelFlags[(ChannelFlags['ActiveChannelsRemoved'] = 4)] = 'ActiveChannelsRemoved';
		/**
		 * Whether a tag is required to be specified when creating a thread in a forum channel.
		 * Tags are specified in the `applied_tags` field
		 */
		ChannelFlags[(ChannelFlags['RequireTag'] = 16)] = 'RequireTag';
		/**
		 * @unstable This channel flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 */
		ChannelFlags[(ChannelFlags['IsSpam'] = 32)] = 'IsSpam';
		/**
		 * @unstable This channel flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 */
		ChannelFlags[(ChannelFlags['IsGuildResourceChannel'] = 128)] = 'IsGuildResourceChannel';
		/**
		 * @unstable This channel flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 */
		ChannelFlags[(ChannelFlags['ClydeAI'] = 256)] = 'ClydeAI';
		/**
		 * @unstable This channel flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 */
		ChannelFlags[(ChannelFlags['IsScheduledForDeletion'] = 512)] = 'IsScheduledForDeletion';
		/**
		 * Whether media download options are hidden.
		 */
		ChannelFlags[(ChannelFlags['HideMediaDownloadOptions'] = 32768)] = 'HideMediaDownloadOptions';
		/**
		 * This channel's metadata has been obfuscated because the current user cannot view it. Only ever set on channels
		 * received over the {@link https://docs.discord.com/developers/events/gateway | Gateway}; the HTTP API never sets this flag. See
		 * {@link https://docs.discord.com/developers/resources/channel#channel-object-obfuscated-channels | Obfuscated Channels}.
		 */
		ChannelFlags[(ChannelFlags['ChannelObfuscated'] = 131072)] = 'ChannelObfuscated';
		/**
		 * This channel is a Spoiler Channel i.e. users must opt in to view its contents.
		 */
		ChannelFlags[(ChannelFlags['IsSpoilerChannel'] = 2097152)] = 'IsSpoilerChannel';
	})(ChannelFlags || (exports.ChannelFlags = ChannelFlags = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/gateway.js
var require_gateway = /* @__PURE__ */ __commonJSMin((exports) => {
	/**
	 * Types extracted from
	 *  - https://discord.com/developers/docs/topics/gateway
	 *  - https://discord.com/developers/docs/topics/gateway-events
	 */
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.ActivityFlags = exports.StatusDisplayType = exports.ActivityType = exports.ActivityPlatform = exports.PresenceUpdateStatus = void 0;
	/**
	 * @see {@link https://discord.com/developers/docs/topics/gateway-events#update-presence-status-types}
	 */
	var PresenceUpdateStatus;
	(function (PresenceUpdateStatus) {
		PresenceUpdateStatus['Online'] = 'online';
		PresenceUpdateStatus['DoNotDisturb'] = 'dnd';
		PresenceUpdateStatus['Idle'] = 'idle';
		/**
		 * Invisible and shown as offline
		 */
		PresenceUpdateStatus['Invisible'] = 'invisible';
		PresenceUpdateStatus['Offline'] = 'offline';
	})(PresenceUpdateStatus || (exports.PresenceUpdateStatus = PresenceUpdateStatus = {}));
	/**
	 * @unstable This enum is currently not documented by Discord but has known values which we will try to keep up to date.
	 * Values might be added or removed without a major version bump.
	 */
	var ActivityPlatform;
	(function (ActivityPlatform) {
		ActivityPlatform['Desktop'] = 'desktop';
		ActivityPlatform['Xbox'] = 'xbox';
		ActivityPlatform['Samsung'] = 'samsung';
		ActivityPlatform['IOS'] = 'ios';
		ActivityPlatform['Android'] = 'android';
		ActivityPlatform['Embedded'] = 'embedded';
		ActivityPlatform['PS4'] = 'ps4';
		ActivityPlatform['PS5'] = 'ps5';
	})(ActivityPlatform || (exports.ActivityPlatform = ActivityPlatform = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/topics/gateway-events#activity-object-activity-types}
	 */
	var ActivityType;
	(function (ActivityType) {
		/**
		 * Playing \{game\}
		 */
		ActivityType[(ActivityType['Playing'] = 0)] = 'Playing';
		/**
		 * Streaming \{details\}
		 */
		ActivityType[(ActivityType['Streaming'] = 1)] = 'Streaming';
		/**
		 * Listening to \{name\}
		 */
		ActivityType[(ActivityType['Listening'] = 2)] = 'Listening';
		/**
		 * Watching \{details\}
		 */
		ActivityType[(ActivityType['Watching'] = 3)] = 'Watching';
		/**
		 * \{emoji\} \{state\}
		 */
		ActivityType[(ActivityType['Custom'] = 4)] = 'Custom';
		/**
		 * Competing in \{name\}
		 */
		ActivityType[(ActivityType['Competing'] = 5)] = 'Competing';
	})(ActivityType || (exports.ActivityType = ActivityType = {}));
	/**
	 * Controls which field is used in the user's status message
	 *
	 * @see {@link https://discord.com/developers/docs/events/gateway-events#activity-object-status-display-types}
	 */
	var StatusDisplayType;
	(function (StatusDisplayType) {
		/**
		 * Playing \{name\}
		 */
		StatusDisplayType[(StatusDisplayType['Name'] = 0)] = 'Name';
		/**
		 * Playing \{state\}
		 */
		StatusDisplayType[(StatusDisplayType['State'] = 1)] = 'State';
		/**
		 * Playing \{details\}
		 */
		StatusDisplayType[(StatusDisplayType['Details'] = 2)] = 'Details';
	})(StatusDisplayType || (exports.StatusDisplayType = StatusDisplayType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/topics/gateway-events#activity-object-activity-flags}
	 */
	var ActivityFlags;
	(function (ActivityFlags) {
		ActivityFlags[(ActivityFlags['Instance'] = 1)] = 'Instance';
		ActivityFlags[(ActivityFlags['Join'] = 2)] = 'Join';
		ActivityFlags[(ActivityFlags['Spectate'] = 4)] = 'Spectate';
		ActivityFlags[(ActivityFlags['JoinRequest'] = 8)] = 'JoinRequest';
		ActivityFlags[(ActivityFlags['Sync'] = 16)] = 'Sync';
		ActivityFlags[(ActivityFlags['Play'] = 32)] = 'Play';
		ActivityFlags[(ActivityFlags['PartyPrivacyFriends'] = 64)] = 'PartyPrivacyFriends';
		ActivityFlags[(ActivityFlags['PartyPrivacyVoiceChannel'] = 128)] = 'PartyPrivacyVoiceChannel';
		ActivityFlags[(ActivityFlags['Embedded'] = 256)] = 'Embedded';
	})(ActivityFlags || (exports.ActivityFlags = ActivityFlags = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/guild.js
var require_guild = /* @__PURE__ */ __commonJSMin((exports) => {
	/**
	 * Types extracted from https://discord.com/developers/docs/resources/guild
	 */
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.GuildOnboardingPromptType =
		exports.GuildOnboardingMode =
		exports.MembershipScreeningFieldType =
		exports.GuildWidgetStyle =
		exports.IntegrationExpireBehavior =
		exports.GuildMemberFlags =
		exports.GuildFeature =
		exports.GuildSystemChannelFlags =
		exports.GuildHubType =
		exports.GuildPremiumTier =
		exports.GuildVerificationLevel =
		exports.GuildNSFWLevel =
		exports.GuildMFALevel =
		exports.GuildExplicitContentFilter =
		exports.GuildDefaultMessageNotifications =
			void 0;
	/**
	 * @see {@link https://discord.com/developers/docs/resources/guild#guild-object-default-message-notification-level}
	 */
	var GuildDefaultMessageNotifications;
	(function (GuildDefaultMessageNotifications) {
		GuildDefaultMessageNotifications[(GuildDefaultMessageNotifications['AllMessages'] = 0)] = 'AllMessages';
		GuildDefaultMessageNotifications[(GuildDefaultMessageNotifications['OnlyMentions'] = 1)] = 'OnlyMentions';
	})(GuildDefaultMessageNotifications || (exports.GuildDefaultMessageNotifications = GuildDefaultMessageNotifications = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/guild#guild-object-explicit-content-filter-level}
	 */
	var GuildExplicitContentFilter;
	(function (GuildExplicitContentFilter) {
		GuildExplicitContentFilter[(GuildExplicitContentFilter['Disabled'] = 0)] = 'Disabled';
		GuildExplicitContentFilter[(GuildExplicitContentFilter['MembersWithoutRoles'] = 1)] = 'MembersWithoutRoles';
		GuildExplicitContentFilter[(GuildExplicitContentFilter['AllMembers'] = 2)] = 'AllMembers';
	})(GuildExplicitContentFilter || (exports.GuildExplicitContentFilter = GuildExplicitContentFilter = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/guild#guild-object-mfa-level}
	 */
	var GuildMFALevel;
	(function (GuildMFALevel) {
		GuildMFALevel[(GuildMFALevel['None'] = 0)] = 'None';
		GuildMFALevel[(GuildMFALevel['Elevated'] = 1)] = 'Elevated';
	})(GuildMFALevel || (exports.GuildMFALevel = GuildMFALevel = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/guild#guild-object-guild-nsfw-level}
	 */
	var GuildNSFWLevel;
	(function (GuildNSFWLevel) {
		GuildNSFWLevel[(GuildNSFWLevel['Default'] = 0)] = 'Default';
		GuildNSFWLevel[(GuildNSFWLevel['Explicit'] = 1)] = 'Explicit';
		GuildNSFWLevel[(GuildNSFWLevel['Safe'] = 2)] = 'Safe';
		GuildNSFWLevel[(GuildNSFWLevel['AgeRestricted'] = 3)] = 'AgeRestricted';
	})(GuildNSFWLevel || (exports.GuildNSFWLevel = GuildNSFWLevel = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/guild#guild-object-verification-level}
	 */
	var GuildVerificationLevel;
	(function (GuildVerificationLevel) {
		/**
		 * Unrestricted
		 */
		GuildVerificationLevel[(GuildVerificationLevel['None'] = 0)] = 'None';
		/**
		 * Must have verified email on account
		 */
		GuildVerificationLevel[(GuildVerificationLevel['Low'] = 1)] = 'Low';
		/**
		 * Must be registered on Discord for longer than 5 minutes
		 */
		GuildVerificationLevel[(GuildVerificationLevel['Medium'] = 2)] = 'Medium';
		/**
		 * Must be a member of the guild for longer than 10 minutes
		 */
		GuildVerificationLevel[(GuildVerificationLevel['High'] = 3)] = 'High';
		/**
		 * Must have a verified phone number
		 */
		GuildVerificationLevel[(GuildVerificationLevel['VeryHigh'] = 4)] = 'VeryHigh';
	})(GuildVerificationLevel || (exports.GuildVerificationLevel = GuildVerificationLevel = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/guild#guild-object-premium-tier}
	 */
	var GuildPremiumTier;
	(function (GuildPremiumTier) {
		GuildPremiumTier[(GuildPremiumTier['None'] = 0)] = 'None';
		GuildPremiumTier[(GuildPremiumTier['Tier1'] = 1)] = 'Tier1';
		GuildPremiumTier[(GuildPremiumTier['Tier2'] = 2)] = 'Tier2';
		GuildPremiumTier[(GuildPremiumTier['Tier3'] = 3)] = 'Tier3';
	})(GuildPremiumTier || (exports.GuildPremiumTier = GuildPremiumTier = {}));
	var GuildHubType;
	(function (GuildHubType) {
		GuildHubType[(GuildHubType['Default'] = 0)] = 'Default';
		GuildHubType[(GuildHubType['HighSchool'] = 1)] = 'HighSchool';
		GuildHubType[(GuildHubType['College'] = 2)] = 'College';
	})(GuildHubType || (exports.GuildHubType = GuildHubType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/guild#guild-object-system-channel-flags}
	 */
	var GuildSystemChannelFlags;
	(function (GuildSystemChannelFlags) {
		/**
		 * Suppress member join notifications
		 */
		GuildSystemChannelFlags[(GuildSystemChannelFlags['SuppressJoinNotifications'] = 1)] = 'SuppressJoinNotifications';
		/**
		 * Suppress server boost notifications
		 */
		GuildSystemChannelFlags[(GuildSystemChannelFlags['SuppressPremiumSubscriptions'] = 2)] = 'SuppressPremiumSubscriptions';
		/**
		 * Suppress server setup tips
		 */
		GuildSystemChannelFlags[(GuildSystemChannelFlags['SuppressGuildReminderNotifications'] = 4)] = 'SuppressGuildReminderNotifications';
		/**
		 * Hide member join sticker reply buttons
		 */
		GuildSystemChannelFlags[(GuildSystemChannelFlags['SuppressJoinNotificationReplies'] = 8)] = 'SuppressJoinNotificationReplies';
		/**
		 * Suppress role subscription purchase and renewal notifications
		 */
		GuildSystemChannelFlags[(GuildSystemChannelFlags['SuppressRoleSubscriptionPurchaseNotifications'] = 16)] =
			'SuppressRoleSubscriptionPurchaseNotifications';
		/**
		 * Hide role subscription sticker reply buttons
		 */
		GuildSystemChannelFlags[(GuildSystemChannelFlags['SuppressRoleSubscriptionPurchaseNotificationReplies'] = 32)] =
			'SuppressRoleSubscriptionPurchaseNotificationReplies';
	})(GuildSystemChannelFlags || (exports.GuildSystemChannelFlags = GuildSystemChannelFlags = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/guild#guild-object-guild-features}
	 */
	var GuildFeature;
	(function (GuildFeature) {
		/**
		 * Guild has access to set an animated guild banner image
		 */
		GuildFeature['AnimatedBanner'] = 'ANIMATED_BANNER';
		/**
		 * Guild has access to set an animated guild icon
		 */
		GuildFeature['AnimatedIcon'] = 'ANIMATED_ICON';
		/**
		 * Guild is using the old permissions configuration behavior
		 *
		 * @see {@link https://discord.com/developers/docs/change-log#upcoming-application-command-permission-changes}
		 */
		GuildFeature['ApplicationCommandPermissionsV2'] = 'APPLICATION_COMMAND_PERMISSIONS_V2';
		/**
		 * Guild has set up auto moderation rules
		 */
		GuildFeature['AutoModeration'] = 'AUTO_MODERATION';
		/**
		 * Guild has access to set a guild banner image
		 */
		GuildFeature['Banner'] = 'BANNER';
		/**
		 * Guild can enable welcome screen, Membership Screening and discovery, and receives community updates
		 */
		GuildFeature['Community'] = 'COMMUNITY';
		/**
		 * Guild has enabled monetization
		 */
		GuildFeature['CreatorMonetizableProvisional'] = 'CREATOR_MONETIZABLE_PROVISIONAL';
		/**
		 * Guild has enabled the role subscription promo page
		 */
		GuildFeature['CreatorStorePage'] = 'CREATOR_STORE_PAGE';
		/**
		 * Guild has been set as a support server on the App Directory
		 */
		GuildFeature['DeveloperSupportServer'] = 'DEVELOPER_SUPPORT_SERVER';
		/**
		 * Guild is able to be discovered in the directory
		 */
		GuildFeature['Discoverable'] = 'DISCOVERABLE';
		/**
		 * Guild is able to be featured in the directory
		 */
		GuildFeature['Featurable'] = 'FEATURABLE';
		/**
		 * Guild is listed in a directory channel
		 */
		GuildFeature['HasDirectoryEntry'] = 'HAS_DIRECTORY_ENTRY';
		/**
		 * Guild is a Student Hub
		 *
		 * @see {@link https://support.discord.com/hc/articles/4406046651927}
		 * @unstable This feature is currently not documented by Discord, but has known value
		 */
		GuildFeature['Hub'] = 'HUB';
		/**
		 * Guild has disabled invite usage, preventing users from joining
		 */
		GuildFeature['InvitesDisabled'] = 'INVITES_DISABLED';
		/**
		 * Guild has access to set an invite splash background
		 */
		GuildFeature['InviteSplash'] = 'INVITE_SPLASH';
		/**
		 * Guild is in a Student Hub
		 *
		 * @see {@link https://support.discord.com/hc/articles/4406046651927}
		 * @unstable This feature is currently not documented by Discord, but has known value
		 */
		GuildFeature['LinkedToHub'] = 'LINKED_TO_HUB';
		/**
		 * Guild has enabled Membership Screening
		 */
		GuildFeature['MemberVerificationGateEnabled'] = 'MEMBER_VERIFICATION_GATE_ENABLED';
		/**
		 * Guild has increased custom soundboard sound slots
		 */
		GuildFeature['MoreSoundboard'] = 'MORE_SOUNDBOARD';
		/**
		 * Guild has enabled monetization
		 *
		 * @unstable This feature is no longer documented by Discord
		 */
		GuildFeature['MonetizationEnabled'] = 'MONETIZATION_ENABLED';
		/**
		 * Guild has increased custom sticker slots
		 */
		GuildFeature['MoreStickers'] = 'MORE_STICKERS';
		/**
		 * Guild has access to create news channels
		 */
		GuildFeature['News'] = 'NEWS';
		/**
		 * Guild is partnered
		 */
		GuildFeature['Partnered'] = 'PARTNERED';
		/**
		 * Guild can be previewed before joining via Membership Screening or the directory
		 */
		GuildFeature['PreviewEnabled'] = 'PREVIEW_ENABLED';
		/**
		 * Guild has access to create private threads
		 */
		GuildFeature['PrivateThreads'] = 'PRIVATE_THREADS';
		/**
		 * Guild has disabled alerts for join raids in the configured safety alerts channel
		 */
		GuildFeature['RaidAlertsDisabled'] = 'RAID_ALERTS_DISABLED';
		GuildFeature['RelayEnabled'] = 'RELAY_ENABLED';
		/**
		 * Guild is able to set role icons
		 */
		GuildFeature['RoleIcons'] = 'ROLE_ICONS';
		/**
		 * Guild has role subscriptions that can be purchased
		 */
		GuildFeature['RoleSubscriptionsAvailableForPurchase'] = 'ROLE_SUBSCRIPTIONS_AVAILABLE_FOR_PURCHASE';
		/**
		 * Guild has enabled role subscriptions
		 */
		GuildFeature['RoleSubscriptionsEnabled'] = 'ROLE_SUBSCRIPTIONS_ENABLED';
		/**
		 * Guild has created soundboard sounds
		 */
		GuildFeature['Soundboard'] = 'SOUNDBOARD';
		/**
		 * Guild has enabled ticketed events
		 */
		GuildFeature['TicketedEventsEnabled'] = 'TICKETED_EVENTS_ENABLED';
		/**
		 * Guild has access to set a vanity URL
		 */
		GuildFeature['VanityURL'] = 'VANITY_URL';
		/**
		 * Guild is verified
		 */
		GuildFeature['Verified'] = 'VERIFIED';
		/**
		 * Guild has access to set 384kbps bitrate in voice (previously VIP voice servers)
		 */
		GuildFeature['VIPRegions'] = 'VIP_REGIONS';
		/**
		 * Guild has enabled the welcome screen
		 */
		GuildFeature['WelcomeScreenEnabled'] = 'WELCOME_SCREEN_ENABLED';
		/**
		 * Guild has access to set guild tags
		 */
		GuildFeature['GuildTags'] = 'GUILD_TAGS';
		/**
		 * Guild is able to set gradient colors to roles
		 */
		GuildFeature['EnhancedRoleColors'] = 'ENHANCED_ROLE_COLORS';
		/**
		 * Guild has access to guest invites
		 */
		GuildFeature['GuestsEnabled'] = 'GUESTS_ENABLED';
		/**
		 * Guild has migrated to the new pin messages permission
		 *
		 * @unstable This feature is currently not documented by Discord, but has known value
		 */
		GuildFeature['PinPermissionMigrationComplete'] = 'PIN_PERMISSION_MIGRATION_COMPLETE';
	})(GuildFeature || (exports.GuildFeature = GuildFeature = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/guild#guild-member-object-guild-member-flags}
	 */
	var GuildMemberFlags;
	(function (GuildMemberFlags) {
		/**
		 * Member has left and rejoined the guild
		 */
		GuildMemberFlags[(GuildMemberFlags['DidRejoin'] = 1)] = 'DidRejoin';
		/**
		 * Member has completed onboarding
		 */
		GuildMemberFlags[(GuildMemberFlags['CompletedOnboarding'] = 2)] = 'CompletedOnboarding';
		/**
		 * Member is exempt from guild verification requirements
		 */
		GuildMemberFlags[(GuildMemberFlags['BypassesVerification'] = 4)] = 'BypassesVerification';
		/**
		 * Member has started onboarding
		 */
		GuildMemberFlags[(GuildMemberFlags['StartedOnboarding'] = 8)] = 'StartedOnboarding';
		/**
		 * Member is a guest and can only access the voice channel they were invited to
		 */
		GuildMemberFlags[(GuildMemberFlags['IsGuest'] = 16)] = 'IsGuest';
		/**
		 * Member has started Server Guide new member actions
		 */
		GuildMemberFlags[(GuildMemberFlags['StartedHomeActions'] = 32)] = 'StartedHomeActions';
		/**
		 * Member has completed Server Guide new member actions
		 */
		GuildMemberFlags[(GuildMemberFlags['CompletedHomeActions'] = 64)] = 'CompletedHomeActions';
		/**
		 * Member's username, display name, or nickname is blocked by AutoMod
		 */
		GuildMemberFlags[(GuildMemberFlags['AutomodQuarantinedUsernameOrGuildNickname'] = 128)] = 'AutomodQuarantinedUsernameOrGuildNickname';
		/**
		 * @deprecated
		 * {@link https://github.com/discord/discord-api-docs/pull/7113 | discord-api-docs#7113}
		 */
		GuildMemberFlags[(GuildMemberFlags['AutomodQuarantinedBio'] = 256)] = 'AutomodQuarantinedBio';
		/**
		 * Member has dismissed the DM settings upsell
		 */
		GuildMemberFlags[(GuildMemberFlags['DmSettingsUpsellAcknowledged'] = 512)] = 'DmSettingsUpsellAcknowledged';
		/**
		 * Member's guild tag is blocked by AutoMod
		 */
		GuildMemberFlags[(GuildMemberFlags['AutoModQuarantinedGuildTag'] = 1024)] = 'AutoModQuarantinedGuildTag';
	})(GuildMemberFlags || (exports.GuildMemberFlags = GuildMemberFlags = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/guild#integration-object-integration-expire-behaviors}
	 */
	var IntegrationExpireBehavior;
	(function (IntegrationExpireBehavior) {
		IntegrationExpireBehavior[(IntegrationExpireBehavior['RemoveRole'] = 0)] = 'RemoveRole';
		IntegrationExpireBehavior[(IntegrationExpireBehavior['Kick'] = 1)] = 'Kick';
	})(IntegrationExpireBehavior || (exports.IntegrationExpireBehavior = IntegrationExpireBehavior = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/guild#get-guild-widget-image-widget-style-options}
	 */
	var GuildWidgetStyle;
	(function (GuildWidgetStyle) {
		/**
		 * Shield style widget with Discord icon and guild members online count
		 */
		GuildWidgetStyle['Shield'] = 'shield';
		/**
		 * Large image with guild icon, name and online count. "POWERED BY DISCORD" as the footer of the widget
		 */
		GuildWidgetStyle['Banner1'] = 'banner1';
		/**
		 * Smaller widget style with guild icon, name and online count. Split on the right with Discord logo
		 */
		GuildWidgetStyle['Banner2'] = 'banner2';
		/**
		 * Large image with guild icon, name and online count. In the footer, Discord logo on the left and "Chat Now" on the right
		 */
		GuildWidgetStyle['Banner3'] = 'banner3';
		/**
		 * Large Discord logo at the top of the widget. Guild icon, name and online count in the middle portion of the widget
		 * and a "JOIN MY SERVER" button at the bottom
		 */
		GuildWidgetStyle['Banner4'] = 'banner4';
	})(GuildWidgetStyle || (exports.GuildWidgetStyle = GuildWidgetStyle = {}));
	/**
	 * @unstable https://github.com/discord/discord-api-docs/pull/2547
	 */
	var MembershipScreeningFieldType;
	(function (MembershipScreeningFieldType) {
		/**
		 * Server Rules
		 */
		MembershipScreeningFieldType['Terms'] = 'TERMS';
	})(MembershipScreeningFieldType || (exports.MembershipScreeningFieldType = MembershipScreeningFieldType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/guild#guild-onboarding-object-onboarding-mode}
	 */
	var GuildOnboardingMode;
	(function (GuildOnboardingMode) {
		/**
		 * Counts only Default Channels towards constraints
		 */
		GuildOnboardingMode[(GuildOnboardingMode['OnboardingDefault'] = 0)] = 'OnboardingDefault';
		/**
		 * Counts Default Channels and Questions towards constraints
		 */
		GuildOnboardingMode[(GuildOnboardingMode['OnboardingAdvanced'] = 1)] = 'OnboardingAdvanced';
	})(GuildOnboardingMode || (exports.GuildOnboardingMode = GuildOnboardingMode = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/guild#guild-onboarding-object-prompt-types}
	 */
	var GuildOnboardingPromptType;
	(function (GuildOnboardingPromptType) {
		GuildOnboardingPromptType[(GuildOnboardingPromptType['MultipleChoice'] = 0)] = 'MultipleChoice';
		GuildOnboardingPromptType[(GuildOnboardingPromptType['Dropdown'] = 1)] = 'Dropdown';
	})(GuildOnboardingPromptType || (exports.GuildOnboardingPromptType = GuildOnboardingPromptType = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/guildScheduledEvent.js
var require_guildScheduledEvent = /* @__PURE__ */ __commonJSMin((exports) => {
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.GuildScheduledEventPrivacyLevel =
		exports.GuildScheduledEventStatus =
		exports.GuildScheduledEventEntityType =
		exports.GuildScheduledEventRecurrenceRuleMonth =
		exports.GuildScheduledEventRecurrenceRuleWeekday =
		exports.GuildScheduledEventRecurrenceRuleFrequency =
			void 0;
	/**
	 * @see {@link https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-recurrence-rule-object-guild-scheduled-event-recurrence-rule-frequency}
	 */
	var GuildScheduledEventRecurrenceRuleFrequency;
	(function (GuildScheduledEventRecurrenceRuleFrequency) {
		GuildScheduledEventRecurrenceRuleFrequency[(GuildScheduledEventRecurrenceRuleFrequency['Yearly'] = 0)] = 'Yearly';
		GuildScheduledEventRecurrenceRuleFrequency[(GuildScheduledEventRecurrenceRuleFrequency['Monthly'] = 1)] = 'Monthly';
		GuildScheduledEventRecurrenceRuleFrequency[(GuildScheduledEventRecurrenceRuleFrequency['Weekly'] = 2)] = 'Weekly';
		GuildScheduledEventRecurrenceRuleFrequency[(GuildScheduledEventRecurrenceRuleFrequency['Daily'] = 3)] = 'Daily';
	})(
		GuildScheduledEventRecurrenceRuleFrequency ||
			(exports.GuildScheduledEventRecurrenceRuleFrequency = GuildScheduledEventRecurrenceRuleFrequency = {})
	);
	/**
	 * @see {@link https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-recurrence-rule-object-guild-scheduled-event-recurrence-rule-weekday}
	 */
	var GuildScheduledEventRecurrenceRuleWeekday;
	(function (GuildScheduledEventRecurrenceRuleWeekday) {
		GuildScheduledEventRecurrenceRuleWeekday[(GuildScheduledEventRecurrenceRuleWeekday['Monday'] = 0)] = 'Monday';
		GuildScheduledEventRecurrenceRuleWeekday[(GuildScheduledEventRecurrenceRuleWeekday['Tuesday'] = 1)] = 'Tuesday';
		GuildScheduledEventRecurrenceRuleWeekday[(GuildScheduledEventRecurrenceRuleWeekday['Wednesday'] = 2)] = 'Wednesday';
		GuildScheduledEventRecurrenceRuleWeekday[(GuildScheduledEventRecurrenceRuleWeekday['Thursday'] = 3)] = 'Thursday';
		GuildScheduledEventRecurrenceRuleWeekday[(GuildScheduledEventRecurrenceRuleWeekday['Friday'] = 4)] = 'Friday';
		GuildScheduledEventRecurrenceRuleWeekday[(GuildScheduledEventRecurrenceRuleWeekday['Saturday'] = 5)] = 'Saturday';
		GuildScheduledEventRecurrenceRuleWeekday[(GuildScheduledEventRecurrenceRuleWeekday['Sunday'] = 6)] = 'Sunday';
	})(
		GuildScheduledEventRecurrenceRuleWeekday || (exports.GuildScheduledEventRecurrenceRuleWeekday = GuildScheduledEventRecurrenceRuleWeekday = {})
	);
	/**
	 * @see {@link https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-recurrence-rule-object-guild-scheduled-event-recurrence-rule-month}
	 */
	var GuildScheduledEventRecurrenceRuleMonth;
	(function (GuildScheduledEventRecurrenceRuleMonth) {
		GuildScheduledEventRecurrenceRuleMonth[(GuildScheduledEventRecurrenceRuleMonth['January'] = 1)] = 'January';
		GuildScheduledEventRecurrenceRuleMonth[(GuildScheduledEventRecurrenceRuleMonth['February'] = 2)] = 'February';
		GuildScheduledEventRecurrenceRuleMonth[(GuildScheduledEventRecurrenceRuleMonth['March'] = 3)] = 'March';
		GuildScheduledEventRecurrenceRuleMonth[(GuildScheduledEventRecurrenceRuleMonth['April'] = 4)] = 'April';
		GuildScheduledEventRecurrenceRuleMonth[(GuildScheduledEventRecurrenceRuleMonth['May'] = 5)] = 'May';
		GuildScheduledEventRecurrenceRuleMonth[(GuildScheduledEventRecurrenceRuleMonth['June'] = 6)] = 'June';
		GuildScheduledEventRecurrenceRuleMonth[(GuildScheduledEventRecurrenceRuleMonth['July'] = 7)] = 'July';
		GuildScheduledEventRecurrenceRuleMonth[(GuildScheduledEventRecurrenceRuleMonth['August'] = 8)] = 'August';
		GuildScheduledEventRecurrenceRuleMonth[(GuildScheduledEventRecurrenceRuleMonth['September'] = 9)] = 'September';
		GuildScheduledEventRecurrenceRuleMonth[(GuildScheduledEventRecurrenceRuleMonth['October'] = 10)] = 'October';
		GuildScheduledEventRecurrenceRuleMonth[(GuildScheduledEventRecurrenceRuleMonth['November'] = 11)] = 'November';
		GuildScheduledEventRecurrenceRuleMonth[(GuildScheduledEventRecurrenceRuleMonth['December'] = 12)] = 'December';
	})(GuildScheduledEventRecurrenceRuleMonth || (exports.GuildScheduledEventRecurrenceRuleMonth = GuildScheduledEventRecurrenceRuleMonth = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-object-guild-scheduled-event-entity-types}
	 */
	var GuildScheduledEventEntityType;
	(function (GuildScheduledEventEntityType) {
		GuildScheduledEventEntityType[(GuildScheduledEventEntityType['StageInstance'] = 1)] = 'StageInstance';
		GuildScheduledEventEntityType[(GuildScheduledEventEntityType['Voice'] = 2)] = 'Voice';
		GuildScheduledEventEntityType[(GuildScheduledEventEntityType['External'] = 3)] = 'External';
	})(GuildScheduledEventEntityType || (exports.GuildScheduledEventEntityType = GuildScheduledEventEntityType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-object-guild-scheduled-event-status}
	 */
	var GuildScheduledEventStatus;
	(function (GuildScheduledEventStatus) {
		GuildScheduledEventStatus[(GuildScheduledEventStatus['Scheduled'] = 1)] = 'Scheduled';
		GuildScheduledEventStatus[(GuildScheduledEventStatus['Active'] = 2)] = 'Active';
		GuildScheduledEventStatus[(GuildScheduledEventStatus['Completed'] = 3)] = 'Completed';
		GuildScheduledEventStatus[(GuildScheduledEventStatus['Canceled'] = 4)] = 'Canceled';
	})(GuildScheduledEventStatus || (exports.GuildScheduledEventStatus = GuildScheduledEventStatus = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-object-guild-scheduled-event-privacy-level}
	 */
	var GuildScheduledEventPrivacyLevel;
	(function (GuildScheduledEventPrivacyLevel) {
		/**
		 * The scheduled event is only accessible to guild members
		 */
		GuildScheduledEventPrivacyLevel[(GuildScheduledEventPrivacyLevel['GuildOnly'] = 2)] = 'GuildOnly';
	})(GuildScheduledEventPrivacyLevel || (exports.GuildScheduledEventPrivacyLevel = GuildScheduledEventPrivacyLevel = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/_interactions/_applicationCommands/_chatInput/shared.js
var require_shared = /* @__PURE__ */ __commonJSMin((exports) => {
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.ApplicationCommandOptionType = void 0;
	/**
	 * @see {@link https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-type}
	 */
	var ApplicationCommandOptionType;
	(function (ApplicationCommandOptionType) {
		ApplicationCommandOptionType[(ApplicationCommandOptionType['Subcommand'] = 1)] = 'Subcommand';
		ApplicationCommandOptionType[(ApplicationCommandOptionType['SubcommandGroup'] = 2)] = 'SubcommandGroup';
		ApplicationCommandOptionType[(ApplicationCommandOptionType['String'] = 3)] = 'String';
		ApplicationCommandOptionType[(ApplicationCommandOptionType['Integer'] = 4)] = 'Integer';
		ApplicationCommandOptionType[(ApplicationCommandOptionType['Boolean'] = 5)] = 'Boolean';
		ApplicationCommandOptionType[(ApplicationCommandOptionType['User'] = 6)] = 'User';
		ApplicationCommandOptionType[(ApplicationCommandOptionType['Channel'] = 7)] = 'Channel';
		ApplicationCommandOptionType[(ApplicationCommandOptionType['Role'] = 8)] = 'Role';
		ApplicationCommandOptionType[(ApplicationCommandOptionType['Mentionable'] = 9)] = 'Mentionable';
		ApplicationCommandOptionType[(ApplicationCommandOptionType['Number'] = 10)] = 'Number';
		ApplicationCommandOptionType[(ApplicationCommandOptionType['Attachment'] = 11)] = 'Attachment';
	})(ApplicationCommandOptionType || (exports.ApplicationCommandOptionType = ApplicationCommandOptionType = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/_interactions/_applicationCommands/chatInput.js
var require_chatInput = /* @__PURE__ */ __commonJSMin((exports) => {
	var __createBinding =
		(exports && exports.__createBinding) ||
		(Object.create
			? function (o, m, k, k2) {
					if (k2 === void 0) k2 = k;
					var desc = Object.getOwnPropertyDescriptor(m, k);
					if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable))
						desc = {
							enumerable: true,
							get: function () {
								return m[k];
							}
						};
					Object.defineProperty(o, k2, desc);
				}
			: function (o, m, k, k2) {
					if (k2 === void 0) k2 = k;
					o[k2] = m[k];
				});
	var __exportStar =
		(exports && exports.__exportStar) ||
		function (m, exports$7) {
			for (var p in m) if (p !== 'default' && !Object.prototype.hasOwnProperty.call(exports$7, p)) __createBinding(exports$7, m, p);
		};
	Object.defineProperty(exports, '__esModule', { value: true });
	__exportStar(require_shared(), exports);
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/_interactions/_applicationCommands/permissions.js
var require_permissions$1 = /* @__PURE__ */ __commonJSMin((exports) => {
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.APIApplicationCommandPermissionsConstant = exports.ApplicationCommandPermissionType = void 0;
	/**
	 * @see {@link https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-application-command-permission-type}
	 */
	var ApplicationCommandPermissionType;
	(function (ApplicationCommandPermissionType) {
		ApplicationCommandPermissionType[(ApplicationCommandPermissionType['Role'] = 1)] = 'Role';
		ApplicationCommandPermissionType[(ApplicationCommandPermissionType['User'] = 2)] = 'User';
		ApplicationCommandPermissionType[(ApplicationCommandPermissionType['Channel'] = 3)] = 'Channel';
	})(ApplicationCommandPermissionType || (exports.ApplicationCommandPermissionType = ApplicationCommandPermissionType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-application-command-permissions-constants}
	 */
	exports.APIApplicationCommandPermissionsConstant = {
		Everyone: (guildId) => String(guildId),
		AllChannels: (guildId) => String(BigInt(guildId) - 1n)
	};
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/_interactions/applicationCommands.js
var require_applicationCommands = /* @__PURE__ */ __commonJSMin((exports) => {
	var __createBinding =
		(exports && exports.__createBinding) ||
		(Object.create
			? function (o, m, k, k2) {
					if (k2 === void 0) k2 = k;
					var desc = Object.getOwnPropertyDescriptor(m, k);
					if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable))
						desc = {
							enumerable: true,
							get: function () {
								return m[k];
							}
						};
					Object.defineProperty(o, k2, desc);
				}
			: function (o, m, k, k2) {
					if (k2 === void 0) k2 = k;
					o[k2] = m[k];
				});
	var __exportStar =
		(exports && exports.__exportStar) ||
		function (m, exports$6) {
			for (var p in m) if (p !== 'default' && !Object.prototype.hasOwnProperty.call(exports$6, p)) __createBinding(exports$6, m, p);
		};
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.EntryPointCommandHandlerType =
		exports.InteractionContextType =
		exports.ApplicationIntegrationType =
		exports.ApplicationCommandType =
			void 0;
	__exportStar(require_chatInput(), exports);
	__exportStar(require_permissions$1(), exports);
	/**
	 * @see {@link https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-types}
	 */
	var ApplicationCommandType;
	(function (ApplicationCommandType) {
		/**
		 * Slash commands; a text-based command that shows up when a user types `/`
		 */
		ApplicationCommandType[(ApplicationCommandType['ChatInput'] = 1)] = 'ChatInput';
		/**
		 * A UI-based command that shows up when you right click or tap on a user
		 */
		ApplicationCommandType[(ApplicationCommandType['User'] = 2)] = 'User';
		/**
		 * A UI-based command that shows up when you right click or tap on a message
		 */
		ApplicationCommandType[(ApplicationCommandType['Message'] = 3)] = 'Message';
		/**
		 * A UI-based command that represents the primary way to invoke an app's Activity
		 */
		ApplicationCommandType[(ApplicationCommandType['PrimaryEntryPoint'] = 4)] = 'PrimaryEntryPoint';
	})(ApplicationCommandType || (exports.ApplicationCommandType = ApplicationCommandType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/application#application-object-application-integration-types}
	 */
	var ApplicationIntegrationType;
	(function (ApplicationIntegrationType) {
		/**
		 * App is installable to servers
		 */
		ApplicationIntegrationType[(ApplicationIntegrationType['GuildInstall'] = 0)] = 'GuildInstall';
		/**
		 * App is installable to users
		 */
		ApplicationIntegrationType[(ApplicationIntegrationType['UserInstall'] = 1)] = 'UserInstall';
	})(ApplicationIntegrationType || (exports.ApplicationIntegrationType = ApplicationIntegrationType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-interaction-context-types}
	 */
	var InteractionContextType;
	(function (InteractionContextType) {
		/**
		 * Interaction can be used within servers
		 */
		InteractionContextType[(InteractionContextType['Guild'] = 0)] = 'Guild';
		/**
		 * Interaction can be used within DMs with the app's bot user
		 */
		InteractionContextType[(InteractionContextType['BotDM'] = 1)] = 'BotDM';
		/**
		 * Interaction can be used within Group DMs and DMs other than the app's bot user
		 */
		InteractionContextType[(InteractionContextType['PrivateChannel'] = 2)] = 'PrivateChannel';
	})(InteractionContextType || (exports.InteractionContextType = InteractionContextType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/interactions/application-commands#application-command-object-entry-point-command-handler-types}
	 */
	var EntryPointCommandHandlerType;
	(function (EntryPointCommandHandlerType) {
		/**
		 * The app handles the interaction using an interaction token
		 */
		EntryPointCommandHandlerType[(EntryPointCommandHandlerType['AppHandler'] = 1)] = 'AppHandler';
		/**
		 * Discord handles the interaction by launching an Activity and sending a follow-up message without coordinating with
		 * the app
		 */
		EntryPointCommandHandlerType[(EntryPointCommandHandlerType['DiscordLaunchActivity'] = 2)] = 'DiscordLaunchActivity';
	})(EntryPointCommandHandlerType || (exports.EntryPointCommandHandlerType = EntryPointCommandHandlerType = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/_interactions/responses.js
var require_responses = /* @__PURE__ */ __commonJSMin((exports) => {
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.InteractionResponseType = exports.InteractionType = void 0;
	/**
	 * @see {@link https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-interaction-type}
	 */
	var InteractionType;
	(function (InteractionType) {
		InteractionType[(InteractionType['Ping'] = 1)] = 'Ping';
		InteractionType[(InteractionType['ApplicationCommand'] = 2)] = 'ApplicationCommand';
		InteractionType[(InteractionType['MessageComponent'] = 3)] = 'MessageComponent';
		InteractionType[(InteractionType['ApplicationCommandAutocomplete'] = 4)] = 'ApplicationCommandAutocomplete';
		InteractionType[(InteractionType['ModalSubmit'] = 5)] = 'ModalSubmit';
	})(InteractionType || (exports.InteractionType = InteractionType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-response-object-interaction-callback-type}
	 */
	var InteractionResponseType;
	(function (InteractionResponseType) {
		/**
		 * ACK a `Ping`
		 */
		InteractionResponseType[(InteractionResponseType['Pong'] = 1)] = 'Pong';
		/**
		 * Respond to an interaction with a message
		 */
		InteractionResponseType[(InteractionResponseType['ChannelMessageWithSource'] = 4)] = 'ChannelMessageWithSource';
		/**
		 * ACK an interaction and edit to a response later, the user sees a loading state
		 */
		InteractionResponseType[(InteractionResponseType['DeferredChannelMessageWithSource'] = 5)] = 'DeferredChannelMessageWithSource';
		/**
		 * ACK a button interaction and update it to a loading state
		 */
		InteractionResponseType[(InteractionResponseType['DeferredMessageUpdate'] = 6)] = 'DeferredMessageUpdate';
		/**
		 * ACK a button interaction and edit the message to which the button was attached
		 */
		InteractionResponseType[(InteractionResponseType['UpdateMessage'] = 7)] = 'UpdateMessage';
		/**
		 * For autocomplete interactions
		 */
		InteractionResponseType[(InteractionResponseType['ApplicationCommandAutocompleteResult'] = 8)] = 'ApplicationCommandAutocompleteResult';
		/**
		 * Respond to an interaction with an modal for a user to fill-out
		 */
		InteractionResponseType[(InteractionResponseType['Modal'] = 9)] = 'Modal';
		/**
		 * Respond to an interaction with an upgrade button, only available for apps with monetization enabled
		 *
		 * @deprecated Send a button with Premium type instead.
		 * {@link https://discord.com/developers/docs/change-log#premium-apps-new-premium-button-style-deep-linking-url-schemes | Learn more here}
		 */
		InteractionResponseType[(InteractionResponseType['PremiumRequired'] = 10)] = 'PremiumRequired';
		/**
		 * Launch the Activity associated with the app.
		 *
		 * @remarks
		 * Only available for apps with Activities enabled
		 */
		InteractionResponseType[(InteractionResponseType['LaunchActivity'] = 12)] = 'LaunchActivity';
	})(InteractionResponseType || (exports.InteractionResponseType = InteractionResponseType = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/interactions.js
var require_interactions = /* @__PURE__ */ __commonJSMin((exports) => {
	var __createBinding =
		(exports && exports.__createBinding) ||
		(Object.create
			? function (o, m, k, k2) {
					if (k2 === void 0) k2 = k;
					var desc = Object.getOwnPropertyDescriptor(m, k);
					if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable))
						desc = {
							enumerable: true,
							get: function () {
								return m[k];
							}
						};
					Object.defineProperty(o, k2, desc);
				}
			: function (o, m, k, k2) {
					if (k2 === void 0) k2 = k;
					o[k2] = m[k];
				});
	var __exportStar =
		(exports && exports.__exportStar) ||
		function (m, exports$5) {
			for (var p in m) if (p !== 'default' && !Object.prototype.hasOwnProperty.call(exports$5, p)) __createBinding(exports$5, m, p);
		};
	Object.defineProperty(exports, '__esModule', { value: true });
	__exportStar(require_applicationCommands(), exports);
	__exportStar(require_responses(), exports);
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/invite.js
var require_invite$1 = /* @__PURE__ */ __commonJSMin((exports) => {
	/**
	 * Types extracted from https://discord.com/developers/docs/resources/invite
	 */
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.InviteTargetType = exports.InviteType = exports.InviteFlags = void 0;
	/**
	 * @see {@link https://discord.com/developers/docs/resources/invite#invite-object-guild-invite-flags}
	 */
	var InviteFlags;
	(function (InviteFlags) {
		InviteFlags[(InviteFlags['IsGuestInvite'] = 1)] = 'IsGuestInvite';
	})(InviteFlags || (exports.InviteFlags = InviteFlags = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/invite#invite-object-invite-types}
	 */
	var InviteType;
	(function (InviteType) {
		InviteType[(InviteType['Guild'] = 0)] = 'Guild';
		InviteType[(InviteType['GroupDM'] = 1)] = 'GroupDM';
		InviteType[(InviteType['Friend'] = 2)] = 'Friend';
	})(InviteType || (exports.InviteType = InviteType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/invite#invite-object-invite-target-types}
	 */
	var InviteTargetType;
	(function (InviteTargetType) {
		InviteTargetType[(InviteTargetType['Stream'] = 1)] = 'Stream';
		InviteTargetType[(InviteTargetType['EmbeddedApplication'] = 2)] = 'EmbeddedApplication';
	})(InviteTargetType || (exports.InviteTargetType = InviteTargetType = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/message.js
var require_message = /* @__PURE__ */ __commonJSMin((exports) => {
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.MessageSearchSortMode =
		exports.MessageSearchEmbedType =
		exports.MessageSearchHasType =
		exports.MessageSearchAuthorType =
		exports.SeparatorSpacingSize =
		exports.UnfurledMediaItemFlags =
		exports.UnfurledMediaItemLoadingState =
		exports.SelectMenuDefaultValueType =
		exports.TextInputStyle =
		exports.ButtonStyle =
		exports.ComponentType =
		exports.AllowedMentionsTypes =
		exports.AttachmentFlags =
		exports.EmbedMediaFlags =
		exports.EmbedFlags =
		exports.EmbedType =
		exports.BaseThemeType =
		exports.MessageFlags =
		exports.MessageReferenceType =
		exports.MessageActivityType =
		exports.MessageType =
			void 0;
	/**
	 * @see {@link https://discord.com/developers/docs/resources/message#message-object-message-types}
	 */
	var MessageType;
	(function (MessageType) {
		MessageType[(MessageType['Default'] = 0)] = 'Default';
		MessageType[(MessageType['RecipientAdd'] = 1)] = 'RecipientAdd';
		MessageType[(MessageType['RecipientRemove'] = 2)] = 'RecipientRemove';
		MessageType[(MessageType['Call'] = 3)] = 'Call';
		MessageType[(MessageType['ChannelNameChange'] = 4)] = 'ChannelNameChange';
		MessageType[(MessageType['ChannelIconChange'] = 5)] = 'ChannelIconChange';
		MessageType[(MessageType['ChannelPinnedMessage'] = 6)] = 'ChannelPinnedMessage';
		MessageType[(MessageType['UserJoin'] = 7)] = 'UserJoin';
		MessageType[(MessageType['GuildBoost'] = 8)] = 'GuildBoost';
		MessageType[(MessageType['GuildBoostTier1'] = 9)] = 'GuildBoostTier1';
		MessageType[(MessageType['GuildBoostTier2'] = 10)] = 'GuildBoostTier2';
		MessageType[(MessageType['GuildBoostTier3'] = 11)] = 'GuildBoostTier3';
		MessageType[(MessageType['ChannelFollowAdd'] = 12)] = 'ChannelFollowAdd';
		MessageType[(MessageType['GuildDiscoveryDisqualified'] = 14)] = 'GuildDiscoveryDisqualified';
		MessageType[(MessageType['GuildDiscoveryRequalified'] = 15)] = 'GuildDiscoveryRequalified';
		MessageType[(MessageType['GuildDiscoveryGracePeriodInitialWarning'] = 16)] = 'GuildDiscoveryGracePeriodInitialWarning';
		MessageType[(MessageType['GuildDiscoveryGracePeriodFinalWarning'] = 17)] = 'GuildDiscoveryGracePeriodFinalWarning';
		MessageType[(MessageType['ThreadCreated'] = 18)] = 'ThreadCreated';
		MessageType[(MessageType['Reply'] = 19)] = 'Reply';
		MessageType[(MessageType['ChatInputCommand'] = 20)] = 'ChatInputCommand';
		MessageType[(MessageType['ThreadStarterMessage'] = 21)] = 'ThreadStarterMessage';
		MessageType[(MessageType['GuildInviteReminder'] = 22)] = 'GuildInviteReminder';
		MessageType[(MessageType['ContextMenuCommand'] = 23)] = 'ContextMenuCommand';
		MessageType[(MessageType['AutoModerationAction'] = 24)] = 'AutoModerationAction';
		MessageType[(MessageType['RoleSubscriptionPurchase'] = 25)] = 'RoleSubscriptionPurchase';
		MessageType[(MessageType['InteractionPremiumUpsell'] = 26)] = 'InteractionPremiumUpsell';
		MessageType[(MessageType['StageStart'] = 27)] = 'StageStart';
		MessageType[(MessageType['StageEnd'] = 28)] = 'StageEnd';
		MessageType[(MessageType['StageSpeaker'] = 29)] = 'StageSpeaker';
		/**
		 * @unstable https://github.com/discord/discord-api-docs/pull/5927#discussion_r1107678548
		 */
		MessageType[(MessageType['StageRaiseHand'] = 30)] = 'StageRaiseHand';
		MessageType[(MessageType['StageTopic'] = 31)] = 'StageTopic';
		MessageType[(MessageType['GuildApplicationPremiumSubscription'] = 32)] = 'GuildApplicationPremiumSubscription';
		MessageType[(MessageType['GuildIncidentAlertModeEnabled'] = 36)] = 'GuildIncidentAlertModeEnabled';
		MessageType[(MessageType['GuildIncidentAlertModeDisabled'] = 37)] = 'GuildIncidentAlertModeDisabled';
		MessageType[(MessageType['GuildIncidentReportRaid'] = 38)] = 'GuildIncidentReportRaid';
		MessageType[(MessageType['GuildIncidentReportFalseAlarm'] = 39)] = 'GuildIncidentReportFalseAlarm';
		MessageType[(MessageType['PurchaseNotification'] = 44)] = 'PurchaseNotification';
		MessageType[(MessageType['PollResult'] = 46)] = 'PollResult';
	})(MessageType || (exports.MessageType = MessageType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/message#message-object-message-activity-types}
	 */
	var MessageActivityType;
	(function (MessageActivityType) {
		MessageActivityType[(MessageActivityType['Join'] = 1)] = 'Join';
		MessageActivityType[(MessageActivityType['Spectate'] = 2)] = 'Spectate';
		MessageActivityType[(MessageActivityType['Listen'] = 3)] = 'Listen';
		MessageActivityType[(MessageActivityType['JoinRequest'] = 5)] = 'JoinRequest';
		MessageActivityType[(MessageActivityType['StreamRequest'] = 6)] = 'StreamRequest';
	})(MessageActivityType || (exports.MessageActivityType = MessageActivityType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/message#message-reference-types}
	 */
	var MessageReferenceType;
	(function (MessageReferenceType) {
		/**
		 * A standard reference used by replies
		 */
		MessageReferenceType[(MessageReferenceType['Default'] = 0)] = 'Default';
		/**
		 * Reference used to point to a message at a point in time
		 */
		MessageReferenceType[(MessageReferenceType['Forward'] = 1)] = 'Forward';
	})(MessageReferenceType || (exports.MessageReferenceType = MessageReferenceType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/message#message-object-message-flags}
	 */
	var MessageFlags;
	(function (MessageFlags) {
		/**
		 * This message has been published to subscribed channels (via Channel Following)
		 */
		MessageFlags[(MessageFlags['Crossposted'] = 1)] = 'Crossposted';
		/**
		 * This message originated from a message in another channel (via Channel Following)
		 */
		MessageFlags[(MessageFlags['IsCrosspost'] = 2)] = 'IsCrosspost';
		/**
		 * Do not include any embeds when serializing this message
		 */
		MessageFlags[(MessageFlags['SuppressEmbeds'] = 4)] = 'SuppressEmbeds';
		/**
		 * The source message for this crosspost has been deleted (via Channel Following)
		 */
		MessageFlags[(MessageFlags['SourceMessageDeleted'] = 8)] = 'SourceMessageDeleted';
		/**
		 * This message came from the urgent message system
		 */
		MessageFlags[(MessageFlags['Urgent'] = 16)] = 'Urgent';
		/**
		 * This message has an associated thread, which shares its id
		 */
		MessageFlags[(MessageFlags['HasThread'] = 32)] = 'HasThread';
		/**
		 * This message is only visible to the user who invoked the Interaction
		 */
		MessageFlags[(MessageFlags['Ephemeral'] = 64)] = 'Ephemeral';
		/**
		 * This message is an Interaction Response and the bot is "thinking"
		 */
		MessageFlags[(MessageFlags['Loading'] = 128)] = 'Loading';
		/**
		 * This message failed to mention some roles and add their members to the thread
		 */
		MessageFlags[(MessageFlags['FailedToMentionSomeRolesInThread'] = 256)] = 'FailedToMentionSomeRolesInThread';
		/**
		 * @unstable This message flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 */
		MessageFlags[(MessageFlags['ShouldShowLinkNotDiscordWarning'] = 1024)] = 'ShouldShowLinkNotDiscordWarning';
		/**
		 * This message will not trigger push and desktop notifications
		 */
		MessageFlags[(MessageFlags['SuppressNotifications'] = 4096)] = 'SuppressNotifications';
		/**
		 * This message is a voice message
		 */
		MessageFlags[(MessageFlags['IsVoiceMessage'] = 8192)] = 'IsVoiceMessage';
		/**
		 * This message has a snapshot (via Message Forwarding)
		 */
		MessageFlags[(MessageFlags['HasSnapshot'] = 16384)] = 'HasSnapshot';
		/**
		 * Allows you to create fully component-driven messages
		 *
		 * @see {@link https://discord.com/developers/docs/components/overview}
		 */
		MessageFlags[(MessageFlags['IsComponentsV2'] = 32768)] = 'IsComponentsV2';
	})(MessageFlags || (exports.MessageFlags = MessageFlags = {}));
	/**
	 * @see https://docs.discord.com/developers/resources/message#base-theme-types
	 */
	var BaseThemeType;
	(function (BaseThemeType) {
		BaseThemeType[(BaseThemeType['Unset'] = 0)] = 'Unset';
		BaseThemeType[(BaseThemeType['Dark'] = 1)] = 'Dark';
		BaseThemeType[(BaseThemeType['Light'] = 2)] = 'Light';
		BaseThemeType[(BaseThemeType['Darker'] = 3)] = 'Darker';
		BaseThemeType[(BaseThemeType['Midnight'] = 4)] = 'Midnight';
	})(BaseThemeType || (exports.BaseThemeType = BaseThemeType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/message#embed-object-embed-types}
	 */
	var EmbedType;
	(function (EmbedType) {
		/**
		 * Generic embed rendered from embed attributes
		 */
		EmbedType['Rich'] = 'rich';
		/**
		 * Image embed
		 */
		EmbedType['Image'] = 'image';
		/**
		 * Video embed
		 */
		EmbedType['Video'] = 'video';
		/**
		 * Animated gif image embed rendered as a video embed
		 */
		EmbedType['GIFV'] = 'gifv';
		/**
		 * Article embed
		 */
		EmbedType['Article'] = 'article';
		/**
		 * Link embed
		 */
		EmbedType['Link'] = 'link';
		/**
		 * Auto moderation alert embed
		 *
		 * @unstable This embed type is currently not documented by Discord, but it is returned in the auto moderation system messages.
		 */
		EmbedType['AutoModerationMessage'] = 'auto_moderation_message';
		/**
		 * Poll result embed
		 */
		EmbedType['PollResult'] = 'poll_result';
	})(EmbedType || (exports.EmbedType = EmbedType = {}));
	/**
	 * @see {@link https://docs.discord.com/developers/resources/message#embed-object-embed-flags}
	 */
	var EmbedFlags;
	(function (EmbedFlags) {
		/**
		 * This embed is a fallback for a reply to an activity card
		 */
		EmbedFlags[(EmbedFlags['IsContentInventoryEntry'] = 32)] = 'IsContentInventoryEntry';
	})(EmbedFlags || (exports.EmbedFlags = EmbedFlags = {}));
	/**
	 * @see {@link https://docs.discord.com/developers/resources/message#embed-object-embed-media-flags}
	 */
	var EmbedMediaFlags;
	(function (EmbedMediaFlags) {
		/**
		 * This image is animated
		 */
		EmbedMediaFlags[(EmbedMediaFlags['IsAnimated'] = 32)] = 'IsAnimated';
	})(EmbedMediaFlags || (exports.EmbedMediaFlags = EmbedMediaFlags = {}));
	/**
	 * @see {@link https://docs.discord.com/developers/resources/message#attachment-object-attachment-flags}
	 */
	var AttachmentFlags;
	(function (AttachmentFlags) {
		/**
		 * This attachment is a Clip from a stream
		 *
		 * @see {@link https://support.discord.com/hc/en-us/articles/16861982215703}
		 */
		AttachmentFlags[(AttachmentFlags['IsClip'] = 1)] = 'IsClip';
		/**
		 * This attachment is the thumbnail of a thread in a media channel, displayed in the grid but not on the message
		 */
		AttachmentFlags[(AttachmentFlags['IsThumbnail'] = 2)] = 'IsThumbnail';
		/**
		 * This attachment has been edited using the remix feature on mobile
		 *
		 * @deprecated
		 */
		AttachmentFlags[(AttachmentFlags['IsRemix'] = 4)] = 'IsRemix';
		/**
		 * This attachment was marked as a spoiler and is blurred until clicked
		 */
		AttachmentFlags[(AttachmentFlags['IsSpoiler'] = 8)] = 'IsSpoiler';
		/**
		 * This attachment is an animated image
		 */
		AttachmentFlags[(AttachmentFlags['IsAnimated'] = 32)] = 'IsAnimated';
	})(AttachmentFlags || (exports.AttachmentFlags = AttachmentFlags = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/message#allowed-mentions-object-allowed-mention-types}
	 */
	var AllowedMentionsTypes;
	(function (AllowedMentionsTypes) {
		/**
		 * Controls `@everyone` and `@here` mentions
		 */
		AllowedMentionsTypes['Everyone'] = 'everyone';
		/**
		 * Controls role mentions
		 */
		AllowedMentionsTypes['Role'] = 'roles';
		/**
		 * Controls user mentions
		 */
		AllowedMentionsTypes['User'] = 'users';
	})(AllowedMentionsTypes || (exports.AllowedMentionsTypes = AllowedMentionsTypes = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/components/reference#component-object-component-types}
	 */
	var ComponentType;
	(function (ComponentType) {
		/**
		 * Container to display a row of interactive components
		 */
		ComponentType[(ComponentType['ActionRow'] = 1)] = 'ActionRow';
		/**
		 * Button component
		 */
		ComponentType[(ComponentType['Button'] = 2)] = 'Button';
		/**
		 * Select menu for picking from defined text options
		 */
		ComponentType[(ComponentType['StringSelect'] = 3)] = 'StringSelect';
		/**
		 * Text Input component
		 */
		ComponentType[(ComponentType['TextInput'] = 4)] = 'TextInput';
		/**
		 * Select menu for users
		 */
		ComponentType[(ComponentType['UserSelect'] = 5)] = 'UserSelect';
		/**
		 * Select menu for roles
		 */
		ComponentType[(ComponentType['RoleSelect'] = 6)] = 'RoleSelect';
		/**
		 * Select menu for users and roles
		 */
		ComponentType[(ComponentType['MentionableSelect'] = 7)] = 'MentionableSelect';
		/**
		 * Select menu for channels
		 */
		ComponentType[(ComponentType['ChannelSelect'] = 8)] = 'ChannelSelect';
		/**
		 * Container to display text alongside an accessory component
		 */
		ComponentType[(ComponentType['Section'] = 9)] = 'Section';
		/**
		 * Markdown text
		 */
		ComponentType[(ComponentType['TextDisplay'] = 10)] = 'TextDisplay';
		/**
		 * Small image that can be used as an accessory
		 */
		ComponentType[(ComponentType['Thumbnail'] = 11)] = 'Thumbnail';
		/**
		 * Display images and other media
		 */
		ComponentType[(ComponentType['MediaGallery'] = 12)] = 'MediaGallery';
		/**
		 * Displays an attached file
		 */
		ComponentType[(ComponentType['File'] = 13)] = 'File';
		/**
		 * Component to add vertical padding between other components
		 */
		ComponentType[(ComponentType['Separator'] = 14)] = 'Separator';
		/**
		 * @unstable This component type is currently not documented by Discord but has a known value which we will try to keep up to date.
		 */
		ComponentType[(ComponentType['ContentInventoryEntry'] = 16)] = 'ContentInventoryEntry';
		/**
		 * Container that visually groups a set of components
		 */
		ComponentType[(ComponentType['Container'] = 17)] = 'Container';
		/**
		 * Container associating a label and description with a component
		 */
		ComponentType[(ComponentType['Label'] = 18)] = 'Label';
		/**
		 * Component for uploading files
		 */
		ComponentType[(ComponentType['FileUpload'] = 19)] = 'FileUpload';
		/**
		 * Single-choice set of radio group option
		 */
		ComponentType[(ComponentType['RadioGroup'] = 21)] = 'RadioGroup';
		/**
		 * Multi-select group of checkboxes
		 */
		ComponentType[(ComponentType['CheckboxGroup'] = 22)] = 'CheckboxGroup';
		/**
		 * Single checkbox for binary choice
		 */
		ComponentType[(ComponentType['Checkbox'] = 23)] = 'Checkbox';
		/**
		 * Select menu for picking from defined text options
		 *
		 * @deprecated This is the old name for {@link ComponentType.StringSelect}
		 */
		ComponentType[(ComponentType['SelectMenu'] = 3)] = 'SelectMenu';
	})(ComponentType || (exports.ComponentType = ComponentType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/components/reference#button-button-styles}
	 */
	var ButtonStyle;
	(function (ButtonStyle) {
		/**
		 * The most important or recommended action in a group of options
		 */
		ButtonStyle[(ButtonStyle['Primary'] = 1)] = 'Primary';
		/**
		 * Alternative or supporting actions
		 */
		ButtonStyle[(ButtonStyle['Secondary'] = 2)] = 'Secondary';
		/**
		 * Positive confirmation or completion actions
		 */
		ButtonStyle[(ButtonStyle['Success'] = 3)] = 'Success';
		/**
		 * An action with irreversible consequences
		 */
		ButtonStyle[(ButtonStyle['Danger'] = 4)] = 'Danger';
		/**
		 * Navigates to a URL
		 */
		ButtonStyle[(ButtonStyle['Link'] = 5)] = 'Link';
		/**
		 * Purchase
		 */
		ButtonStyle[(ButtonStyle['Premium'] = 6)] = 'Premium';
	})(ButtonStyle || (exports.ButtonStyle = ButtonStyle = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/components/reference#text-input-text-input-styles}
	 */
	var TextInputStyle;
	(function (TextInputStyle) {
		/**
		 * Single-line input
		 */
		TextInputStyle[(TextInputStyle['Short'] = 1)] = 'Short';
		/**
		 * Multi-line input
		 */
		TextInputStyle[(TextInputStyle['Paragraph'] = 2)] = 'Paragraph';
	})(TextInputStyle || (exports.TextInputStyle = TextInputStyle = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/components/reference#user-select-select-default-value-structure}
	 */
	var SelectMenuDefaultValueType;
	(function (SelectMenuDefaultValueType) {
		SelectMenuDefaultValueType['Channel'] = 'channel';
		SelectMenuDefaultValueType['Role'] = 'role';
		SelectMenuDefaultValueType['User'] = 'user';
	})(SelectMenuDefaultValueType || (exports.SelectMenuDefaultValueType = SelectMenuDefaultValueType = {}));
	/**
	 * @unstable This enum is currently not documented by Discord
	 */
	var UnfurledMediaItemLoadingState;
	(function (UnfurledMediaItemLoadingState) {
		UnfurledMediaItemLoadingState[(UnfurledMediaItemLoadingState['Unknown'] = 0)] = 'Unknown';
		UnfurledMediaItemLoadingState[(UnfurledMediaItemLoadingState['Loading'] = 1)] = 'Loading';
		UnfurledMediaItemLoadingState[(UnfurledMediaItemLoadingState['LoadedSuccess'] = 2)] = 'LoadedSuccess';
		UnfurledMediaItemLoadingState[(UnfurledMediaItemLoadingState['LoadedNotFound'] = 3)] = 'LoadedNotFound';
	})(UnfurledMediaItemLoadingState || (exports.UnfurledMediaItemLoadingState = UnfurledMediaItemLoadingState = {}));
	/**
	 * @see {@link https://docs.discord.com/developers/components/reference#unfurled-media-item-unfurled-media-item-flags}
	 */
	var UnfurledMediaItemFlags;
	(function (UnfurledMediaItemFlags) {
		/**
		 * This image is animated
		 */
		UnfurledMediaItemFlags[(UnfurledMediaItemFlags['IsAnimated'] = 1)] = 'IsAnimated';
	})(UnfurledMediaItemFlags || (exports.UnfurledMediaItemFlags = UnfurledMediaItemFlags = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/components/reference#separator}
	 */
	var SeparatorSpacingSize;
	(function (SeparatorSpacingSize) {
		SeparatorSpacingSize[(SeparatorSpacingSize['Small'] = 1)] = 'Small';
		SeparatorSpacingSize[(SeparatorSpacingSize['Large'] = 2)] = 'Large';
	})(SeparatorSpacingSize || (exports.SeparatorSpacingSize = SeparatorSpacingSize = {}));
	/**
	 * @remarks All types can be negated by prefixing them with `-`, which means results will not include messages that match the type.
	 * @see {@link https://docs.discord.com/developers/resources/message#search-guild-messages-author-types}
	 */
	var MessageSearchAuthorType;
	(function (MessageSearchAuthorType) {
		/**
		 * Return messages sent by user accounts
		 */
		MessageSearchAuthorType['User'] = 'user';
		/**
		 * Return messages sent by bot accounts
		 */
		MessageSearchAuthorType['Bot'] = 'bot';
		/**
		 * Return messages sent by webhooks
		 */
		MessageSearchAuthorType['Webhook'] = 'webhook';
		/**
		 * Return messages not sent by user accounts
		 */
		MessageSearchAuthorType['NotUser'] = '-user';
		/**
		 * Return messages not sent by bot accounts
		 */
		MessageSearchAuthorType['NotBot'] = '-bot';
		/**
		 * Return messages not sent by webhooks
		 */
		MessageSearchAuthorType['NotWebhook'] = '-webhook';
	})(MessageSearchAuthorType || (exports.MessageSearchAuthorType = MessageSearchAuthorType = {}));
	/**
	 * @remarks All types can be negated by prefixing them with `-`, which means results will not include messages that match the type.
	 * @see {@link https://docs.discord.com/developers/resources/message#search-guild-messages-search-has-types}
	 */
	var MessageSearchHasType;
	(function (MessageSearchHasType) {
		/**
		 * Return messages that have an image
		 */
		MessageSearchHasType['Image'] = 'image';
		/**
		 * Return messages that have a sound attachment
		 */
		MessageSearchHasType['Sound'] = 'sound';
		/**
		 * Return messages that have a video
		 */
		MessageSearchHasType['Video'] = 'video';
		/**
		 * Return messages that have an attachment
		 */
		MessageSearchHasType['File'] = 'file';
		/**
		 * Return messages that have a sent sticker
		 */
		MessageSearchHasType['Sticker'] = 'sticker';
		/**
		 * Return messages that have an embed
		 */
		MessageSearchHasType['Embed'] = 'embed';
		/**
		 * Return messages that have a link
		 */
		MessageSearchHasType['Link'] = 'link';
		/**
		 * Return messages that have a poll
		 */
		MessageSearchHasType['Poll'] = 'poll';
		/**
		 * Return messages that have a forwarded message
		 */
		MessageSearchHasType['Snapshot'] = 'snapshot';
		/**
		 * Return messages that don't have an image
		 */
		MessageSearchHasType['NotImage'] = '-image';
		/**
		 * Return messages that don't have a sound attachment
		 */
		MessageSearchHasType['NotSound'] = '-sound';
		/**
		 * Return messages that don't have a video
		 */
		MessageSearchHasType['NotVideo'] = '-video';
		/**
		 * Return messages that don't have an attachment
		 */
		MessageSearchHasType['NotFile'] = '-file';
		/**
		 * Return messages that don't have a sent sticker
		 */
		MessageSearchHasType['NotSticker'] = '-sticker';
		/**
		 * Return messages that don't have an embed
		 */
		MessageSearchHasType['NotEmbed'] = '-embed';
		/**
		 * Return messages that don't have a link
		 */
		MessageSearchHasType['NotLink'] = '-link';
		/**
		 * Return messages that don't have a poll
		 */
		MessageSearchHasType['NotPoll'] = '-poll';
		/**
		 * Return messages that don't have a forwarded message
		 */
		MessageSearchHasType['NotSnapshot'] = '-snapshot';
	})(MessageSearchHasType || (exports.MessageSearchHasType = MessageSearchHasType = {}));
	/**
	 * @remarks These do not correspond 1:1 to actual {@link https://docs.discord.com/developers/resources/message#embed-object-embed-types | embed types} and encompass a wider range of actual types.
	 * @see {@link https://docs.discord.com/developers/resources/message#search-guild-messages-search-embed-types}
	 */
	var MessageSearchEmbedType;
	(function (MessageSearchEmbedType) {
		/**
		 * Return messages that have an image embed
		 */
		MessageSearchEmbedType['Image'] = 'image';
		/**
		 * Return messages that have a video embed
		 */
		MessageSearchEmbedType['Video'] = 'video';
		/**
		 * Return messages that have a gifv embed
		 *
		 * @remarks Messages sent before February 24, 2026 may not be properly indexed under the `gif` embed type.
		 */
		MessageSearchEmbedType['Gif'] = 'gif';
		/**
		 * Return messages that have a sound embed
		 */
		MessageSearchEmbedType['Sound'] = 'sound';
		/**
		 * Return messages that have an article embed
		 */
		MessageSearchEmbedType['Article'] = 'article';
	})(MessageSearchEmbedType || (exports.MessageSearchEmbedType = MessageSearchEmbedType = {}));
	/**
	 * @see {@link https://docs.discord.com/developers/resources/message#search-guild-messages-search-sort-modes}
	 */
	var MessageSearchSortMode;
	(function (MessageSearchSortMode) {
		/**
		 * Sort by the message creation time (default)
		 */
		MessageSearchSortMode['Timestamp'] = 'timestamp';
		/**
		 * Sort by the relevance of the message to the search query
		 */
		MessageSearchSortMode['Relevance'] = 'relevance';
	})(MessageSearchSortMode || (exports.MessageSearchSortMode = MessageSearchSortMode = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/monetization.js
var require_monetization$1 = /* @__PURE__ */ __commonJSMin((exports) => {
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.SubscriptionStatus = exports.SKUType = exports.SKUFlags = exports.EntitlementType = void 0;
	/**
	 * @see {@link https://discord.com/developers/docs/monetization/entitlements#entitlement-object-entitlement-types}
	 */
	var EntitlementType;
	(function (EntitlementType) {
		/**
		 * Entitlement was purchased by user
		 */
		EntitlementType[(EntitlementType['Purchase'] = 1)] = 'Purchase';
		/**
		 * Entitlement for Discord Nitro subscription
		 */
		EntitlementType[(EntitlementType['PremiumSubscription'] = 2)] = 'PremiumSubscription';
		/**
		 * Entitlement was gifted by developer
		 */
		EntitlementType[(EntitlementType['DeveloperGift'] = 3)] = 'DeveloperGift';
		/**
		 * Entitlement was purchased by a dev in application test mode
		 */
		EntitlementType[(EntitlementType['TestModePurchase'] = 4)] = 'TestModePurchase';
		/**
		 * Entitlement was granted when the SKU was free
		 */
		EntitlementType[(EntitlementType['FreePurchase'] = 5)] = 'FreePurchase';
		/**
		 * Entitlement was gifted by another user
		 */
		EntitlementType[(EntitlementType['UserGift'] = 6)] = 'UserGift';
		/**
		 * Entitlement was claimed by user for free as a Nitro Subscriber
		 */
		EntitlementType[(EntitlementType['PremiumPurchase'] = 7)] = 'PremiumPurchase';
		/**
		 * Entitlement was purchased as an app subscription
		 */
		EntitlementType[(EntitlementType['ApplicationSubscription'] = 8)] = 'ApplicationSubscription';
	})(EntitlementType || (exports.EntitlementType = EntitlementType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/monetization/skus#sku-object-sku-flags}
	 */
	var SKUFlags;
	(function (SKUFlags) {
		/**
		 * SKU is available for purchase
		 */
		SKUFlags[(SKUFlags['Available'] = 4)] = 'Available';
		/**
		 * Recurring SKU that can be purchased by a user and applied to a single server.
		 * Grants access to every user in that server.
		 */
		SKUFlags[(SKUFlags['GuildSubscription'] = 128)] = 'GuildSubscription';
		/**
		 * Recurring SKU purchased by a user for themselves. Grants access to the purchasing user in every server.
		 */
		SKUFlags[(SKUFlags['UserSubscription'] = 256)] = 'UserSubscription';
	})(SKUFlags || (exports.SKUFlags = SKUFlags = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/sku#sku-object-sku-types}
	 */
	var SKUType;
	(function (SKUType) {
		/**
		 * Durable one-time purchase
		 */
		SKUType[(SKUType['Durable'] = 2)] = 'Durable';
		/**
		 * Consumable one-time purchase
		 */
		SKUType[(SKUType['Consumable'] = 3)] = 'Consumable';
		/**
		 * Represents a recurring subscription
		 */
		SKUType[(SKUType['Subscription'] = 5)] = 'Subscription';
		/**
		 * System-generated group for each Subscription SKU created
		 */
		SKUType[(SKUType['SubscriptionGroup'] = 6)] = 'SubscriptionGroup';
	})(SKUType || (exports.SKUType = SKUType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/subscription#subscription-statuses}
	 */
	var SubscriptionStatus;
	(function (SubscriptionStatus) {
		/**
		 * Subscription is active and scheduled to renew.
		 */
		SubscriptionStatus[(SubscriptionStatus['Active'] = 0)] = 'Active';
		/**
		 * Subscription is inactive and not being charged.
		 */
		SubscriptionStatus[(SubscriptionStatus['Inactive'] = 1)] = 'Inactive';
		/**
		 * Subscription is active but will not renew.
		 */
		SubscriptionStatus[(SubscriptionStatus['Ending'] = 2)] = 'Ending';
	})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/oauth2.js
var require_oauth2 = /* @__PURE__ */ __commonJSMin((exports) => {
	/**
	 * Types extracted from https://discord.com/developers/docs/topics/oauth2
	 */
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.OAuth2Scopes = void 0;
	var OAuth2Scopes;
	(function (OAuth2Scopes) {
		/**
		 * For oauth2 bots, this puts the bot in the user's selected guild by default
		 */
		OAuth2Scopes['Bot'] = 'bot';
		/**
		 * Allows {@link https://discord.com/developers/docs/resources/user#get-user-connections | `/users/@me/connections`}
		 * to return linked third-party accounts
		 *
		 * @see {@link https://discord.com/developers/docs/resources/user#get-user-connections}
		 */
		OAuth2Scopes['Connections'] = 'connections';
		/**
		 * Allows your app to see information about the user's DMs and group DMs - requires Discord approval
		 */
		OAuth2Scopes['DMChannelsRead'] = 'dm_channels.read';
		/**
		 * Enables {@link https://discord.com/developers/docs/resources/user#get-current-user | `/users/@me`} to return an `email`
		 *
		 * @see {@link https://discord.com/developers/docs/resources/user#get-current-user}
		 */
		OAuth2Scopes['Email'] = 'email';
		/**
		 * Allows {@link https://discord.com/developers/docs/resources/user#get-current-user | `/users/@me`} without `email`
		 *
		 * @see {@link https://discord.com/developers/docs/resources/user#get-current-user}
		 */
		OAuth2Scopes['Identify'] = 'identify';
		/**
		 * Allows your app to read a user's Nitro subscription type as defined by `premium_type` on the
		 * {@link https://docs.discord.com/developers/resources/user#user-object-user-structure | User object} - only available to approved partners
		 *
		 * @see {@link https://docs.discord.com/developers/resources/user#user-object-user-structure}
		 */
		OAuth2Scopes['IdentifyPremium'] = 'identify.premium';
		/**
		 * Allows {@link https://discord.com/developers/docs/resources/user#get-current-user-guilds | `/users/@me/guilds`}
		 * to return basic information about all of a user's guilds
		 *
		 * @see {@link https://discord.com/developers/docs/resources/user#get-current-user-guilds}
		 */
		OAuth2Scopes['Guilds'] = 'guilds';
		/**
		 * Allows {@link https://discord.com/developers/docs/resources/guild#add-guild-member | `/guilds/[guild.id]/members/[user.id]`}
		 * to be used for joining users to a guild
		 *
		 * @see {@link https://discord.com/developers/docs/resources/guild#add-guild-member}
		 */
		OAuth2Scopes['GuildsJoin'] = 'guilds.join';
		/**
		 * Allows /users/\@me/guilds/\{guild.id\}/member to return a user's member information in a guild
		 *
		 * @see {@link https://discord.com/developers/docs/resources/user#get-current-user-guild-member}
		 */
		OAuth2Scopes['GuildsMembersRead'] = 'guilds.members.read';
		/**
		 * Allows your app to join users to a group dm
		 *
		 * @see {@link https://discord.com/developers/docs/resources/channel#group-dm-add-recipient}
		 */
		OAuth2Scopes['GroupDMJoins'] = 'gdm.join';
		/**
		 * For local rpc server api access, this allows you to read messages from all client channels
		 * (otherwise restricted to channels/guilds your app creates)
		 */
		OAuth2Scopes['MessagesRead'] = 'messages.read';
		/**
		 * Allows your app to update a user's connection and metadata for the app
		 */
		OAuth2Scopes['RoleConnectionsWrite'] = 'role_connections.write';
		/**
		 * For local rpc server access, this allows you to control a user's local Discord client - requires Discord approval
		 */
		OAuth2Scopes['RPC'] = 'rpc';
		/**
		 * For local rpc server access, this allows you to update a user's activity - requires Discord approval
		 */
		OAuth2Scopes['RPCActivitiesWrite'] = 'rpc.activities.write';
		/**
		 * For local rpc server access, this allows you to read a user's voice settings and listen for voice events - requires Discord approval
		 */
		OAuth2Scopes['RPCVoiceRead'] = 'rpc.voice.read';
		/**
		 * For local rpc server access, this allows you to update a user's voice settings - requires Discord approval
		 */
		OAuth2Scopes['RPCVoiceWrite'] = 'rpc.voice.write';
		/**
		 * For local rpc server api access, this allows you to receive notifications pushed out to the user - requires Discord approval
		 */
		OAuth2Scopes['RPCNotificationsRead'] = 'rpc.notifications.read';
		/**
		 * This generates a webhook that is returned in the oauth token response for authorization code grants
		 */
		OAuth2Scopes['WebhookIncoming'] = 'webhook.incoming';
		/**
		 * Allows your app to connect to voice on user's behalf and see all the voice members - requires Discord approval
		 */
		OAuth2Scopes['Voice'] = 'voice';
		/**
		 * Allows your app to upload/update builds for a user's applications - requires Discord approval
		 */
		OAuth2Scopes['ApplicationsBuildsUpload'] = 'applications.builds.upload';
		/**
		 * Allows your app to read build data for a user's applications
		 */
		OAuth2Scopes['ApplicationsBuildsRead'] = 'applications.builds.read';
		/**
		 * Allows your app to read and update store data (SKUs, store listings, achievements, etc.) for a user's applications
		 */
		OAuth2Scopes['ApplicationsStoreUpdate'] = 'applications.store.update';
		/**
		 * Allows your app to read entitlements for a user's applications
		 */
		OAuth2Scopes['ApplicationsEntitlements'] = 'applications.entitlements';
		/**
		 * Allows your app to know a user's friends and implicit relationships - requires Discord approval
		 */
		OAuth2Scopes['RelationshipsRead'] = 'relationships.read';
		/**
		 * Allows your app to fetch data from a user's "Now Playing/Recently Played" list - requires Discord approval
		 */
		OAuth2Scopes['ActivitiesRead'] = 'activities.read';
		/**
		 * Allows your app to update a user's activity - requires Discord approval (NOT REQUIRED FOR GAMESDK ACTIVITY MANAGER)
		 *
		 * @see {@link https://discord.com/developers/docs/game-sdk/activities}
		 */
		OAuth2Scopes['ActivitiesWrite'] = 'activities.write';
		/**
		 * Allows your app to use Application Commands in a guild
		 *
		 * @see {@link https://discord.com/developers/docs/interactions/application-commands}
		 */
		OAuth2Scopes['ApplicationsCommands'] = 'applications.commands';
		/**
		 * Allows your app to update its Application Commands via this bearer token - client credentials grant only
		 *
		 * @see {@link https://discord.com/developers/docs/interactions/application-commands}
		 */
		OAuth2Scopes['ApplicationsCommandsUpdate'] = 'applications.commands.update';
		/**
		 * Allows your app to update permissions for its commands using a Bearer token - client credentials grant only
		 *
		 * @see {@link https://discord.com/developers/docs/interactions/application-commands}
		 */
		OAuth2Scopes['ApplicationCommandsPermissionsUpdate'] = 'applications.commands.permissions.update';
	})(OAuth2Scopes || (exports.OAuth2Scopes = OAuth2Scopes = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/permissions.js
var require_permissions = /* @__PURE__ */ __commonJSMin((exports) => {
	/**
	 * Types extracted from https://discord.com/developers/docs/topics/permissions
	 */
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.RoleFlags = void 0;
	/**
	 * @see {@link https://discord.com/developers/docs/topics/permissions#role-object-role-flags}
	 */
	var RoleFlags;
	(function (RoleFlags) {
		/**
		 * Role can be selected by members in an onboarding prompt
		 */
		RoleFlags[(RoleFlags['InPrompt'] = 1)] = 'InPrompt';
	})(RoleFlags || (exports.RoleFlags = RoleFlags = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/poll.js
var require_poll = /* @__PURE__ */ __commonJSMin((exports) => {
	/**
	 * Types extracted from https://discord.com/developers/docs/resources/poll
	 */
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.PollLayoutType = void 0;
	/**
	 * @see {@link https://discord.com/developers/docs/resources/poll#layout-type}
	 */
	var PollLayoutType;
	(function (PollLayoutType) {
		/**
		 * The, uhm, default layout type
		 */
		PollLayoutType[(PollLayoutType['Default'] = 1)] = 'Default';
	})(PollLayoutType || (exports.PollLayoutType = PollLayoutType = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/stageInstance.js
var require_stageInstance = /* @__PURE__ */ __commonJSMin((exports) => {
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.StageInstancePrivacyLevel = void 0;
	/**
	 * @see {@link https://discord.com/developers/docs/resources/stage-instance#stage-instance-object-privacy-level}
	 */
	var StageInstancePrivacyLevel;
	(function (StageInstancePrivacyLevel) {
		/**
		 * The stage instance is visible publicly, such as on stage discovery
		 *
		 * @deprecated
		 * {@link https://github.com/discord/discord-api-docs/pull/4296 | discord-api-docs#4296}
		 */
		StageInstancePrivacyLevel[(StageInstancePrivacyLevel['Public'] = 1)] = 'Public';
		/**
		 * The stage instance is visible to only guild members
		 */
		StageInstancePrivacyLevel[(StageInstancePrivacyLevel['GuildOnly'] = 2)] = 'GuildOnly';
	})(StageInstancePrivacyLevel || (exports.StageInstancePrivacyLevel = StageInstancePrivacyLevel = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/sticker.js
var require_sticker = /* @__PURE__ */ __commonJSMin((exports) => {
	/**
	 * Types extracted from https://discord.com/developers/docs/resources/sticker
	 */
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.StickerFormatType = exports.StickerType = void 0;
	/**
	 * @see {@link https://discord.com/developers/docs/resources/sticker#sticker-object-sticker-types}
	 */
	var StickerType;
	(function (StickerType) {
		/**
		 * An official sticker in a pack
		 */
		StickerType[(StickerType['Standard'] = 1)] = 'Standard';
		/**
		 * A sticker uploaded to a guild for the guild's members
		 */
		StickerType[(StickerType['Guild'] = 2)] = 'Guild';
	})(StickerType || (exports.StickerType = StickerType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/sticker#sticker-object-sticker-format-types}
	 */
	var StickerFormatType;
	(function (StickerFormatType) {
		StickerFormatType[(StickerFormatType['PNG'] = 1)] = 'PNG';
		StickerFormatType[(StickerFormatType['APNG'] = 2)] = 'APNG';
		StickerFormatType[(StickerFormatType['Lottie'] = 3)] = 'Lottie';
		StickerFormatType[(StickerFormatType['GIF'] = 4)] = 'GIF';
	})(StickerFormatType || (exports.StickerFormatType = StickerFormatType = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/teams.js
var require_teams = /* @__PURE__ */ __commonJSMin((exports) => {
	/**
	 * Types extracted from https://discord.com/developers/docs/topics/teams
	 */
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.TeamMemberRole = exports.TeamMemberMembershipState = void 0;
	/**
	 * @see {@link https://discord.com/developers/docs/topics/teams#data-models-membership-state-enum}
	 */
	var TeamMemberMembershipState;
	(function (TeamMemberMembershipState) {
		TeamMemberMembershipState[(TeamMemberMembershipState['Invited'] = 1)] = 'Invited';
		TeamMemberMembershipState[(TeamMemberMembershipState['Accepted'] = 2)] = 'Accepted';
	})(TeamMemberMembershipState || (exports.TeamMemberMembershipState = TeamMemberMembershipState = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/topics/teams#team-member-roles-team-member-role-types}
	 */
	var TeamMemberRole;
	(function (TeamMemberRole) {
		TeamMemberRole['Admin'] = 'admin';
		TeamMemberRole['Developer'] = 'developer';
		TeamMemberRole['ReadOnly'] = 'read_only';
	})(TeamMemberRole || (exports.TeamMemberRole = TeamMemberRole = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/user.js
var require_user = /* @__PURE__ */ __commonJSMin((exports) => {
	/**
	 * Types extracted from https://discord.com/developers/docs/resources/user
	 */
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.NameplatePalette = exports.ConnectionVisibility = exports.ConnectionService = exports.UserPremiumType = exports.UserFlags = void 0;
	/**
	 * @see {@link https://discord.com/developers/docs/resources/user#user-object-user-flags}
	 */
	var UserFlags;
	(function (UserFlags) {
		/**
		 * Discord Employee
		 */
		UserFlags[(UserFlags['Staff'] = 1)] = 'Staff';
		/**
		 * Partnered Server Owner
		 */
		UserFlags[(UserFlags['Partner'] = 2)] = 'Partner';
		/**
		 * HypeSquad Events Member
		 */
		UserFlags[(UserFlags['Hypesquad'] = 4)] = 'Hypesquad';
		/**
		 * Bug Hunter Level 1
		 */
		UserFlags[(UserFlags['BugHunterLevel1'] = 8)] = 'BugHunterLevel1';
		/**
		 * @unstable This user flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 */
		UserFlags[(UserFlags['MFASMS'] = 16)] = 'MFASMS';
		/**
		 * @unstable This user flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 */
		UserFlags[(UserFlags['PremiumPromoDismissed'] = 32)] = 'PremiumPromoDismissed';
		/**
		 * House Bravery Member
		 */
		UserFlags[(UserFlags['HypeSquadOnlineHouse1'] = 64)] = 'HypeSquadOnlineHouse1';
		/**
		 * House Brilliance Member
		 */
		UserFlags[(UserFlags['HypeSquadOnlineHouse2'] = 128)] = 'HypeSquadOnlineHouse2';
		/**
		 * House Balance Member
		 */
		UserFlags[(UserFlags['HypeSquadOnlineHouse3'] = 256)] = 'HypeSquadOnlineHouse3';
		/**
		 * Early Nitro Supporter
		 */
		UserFlags[(UserFlags['PremiumEarlySupporter'] = 512)] = 'PremiumEarlySupporter';
		/**
		 * User is a {@link https://discord.com/developers/docs/topics/teams | team}
		 */
		UserFlags[(UserFlags['TeamPseudoUser'] = 1024)] = 'TeamPseudoUser';
		/**
		 * @unstable This user flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 */
		UserFlags[(UserFlags['HasUnreadUrgentMessages'] = 8192)] = 'HasUnreadUrgentMessages';
		/**
		 * Bug Hunter Level 2
		 */
		UserFlags[(UserFlags['BugHunterLevel2'] = 16384)] = 'BugHunterLevel2';
		/**
		 * Verified Bot
		 */
		UserFlags[(UserFlags['VerifiedBot'] = 65536)] = 'VerifiedBot';
		/**
		 * Early Verified Bot Developer
		 */
		UserFlags[(UserFlags['VerifiedDeveloper'] = 131072)] = 'VerifiedDeveloper';
		/**
		 * Moderator Programs Alumni
		 */
		UserFlags[(UserFlags['CertifiedModerator'] = 262144)] = 'CertifiedModerator';
		/**
		 * Bot uses only {@link https://discord.com/developers/docs/interactions/receiving-and-responding#receiving-an-interaction | HTTP interactions} and is shown in the online member list
		 */
		UserFlags[(UserFlags['BotHTTPInteractions'] = 524288)] = 'BotHTTPInteractions';
		/**
		 * User has been identified as spammer
		 *
		 * @unstable This user flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 */
		UserFlags[(UserFlags['Spammer'] = 1048576)] = 'Spammer';
		/**
		 * @unstable This user flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 */
		UserFlags[(UserFlags['DisablePremium'] = 2097152)] = 'DisablePremium';
		/**
		 * User is an {@link https://support-dev.discord.com/hc/articles/10113997751447 | Active Developer}
		 *
		 * @deprecated This user flag is no longer available. See {@link https://support-dev.discord.com/hc/articles/10113997751447-Active-Developer-Badge} for more information.
		 */
		UserFlags[(UserFlags['ActiveDeveloper'] = 4194304)] = 'ActiveDeveloper';
		/**
		 * User's account has been {@link https://support.discord.com/hc/articles/6461420677527 | quarantined} based on recent activity
		 *
		 * @unstable This user flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 * @privateRemarks
		 *
		 * This value would be `1 << 44`, but bit shifting above `1 << 30` requires bigints
		 */
		UserFlags[(UserFlags['Quarantined'] = 17592186044416)] = 'Quarantined';
		/**
		 * @unstable This user flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 * @privateRemarks
		 *
		 * This value would be `1 << 50`, but bit shifting above `1 << 30` requires bigints
		 */
		UserFlags[(UserFlags['Collaborator'] = 0x4000000000000)] = 'Collaborator';
		/**
		 * @unstable This user flag is currently not documented by Discord but has a known value which we will try to keep up to date.
		 * @privateRemarks
		 *
		 * This value would be `1 << 51`, but bit shifting above `1 << 30` requires bigints
		 */
		UserFlags[(UserFlags['RestrictedCollaborator'] = 0x8000000000000)] = 'RestrictedCollaborator';
	})(UserFlags || (exports.UserFlags = UserFlags = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/user#user-object-premium-types}
	 */
	var UserPremiumType;
	(function (UserPremiumType) {
		UserPremiumType[(UserPremiumType['None'] = 0)] = 'None';
		UserPremiumType[(UserPremiumType['NitroClassic'] = 1)] = 'NitroClassic';
		UserPremiumType[(UserPremiumType['Nitro'] = 2)] = 'Nitro';
		UserPremiumType[(UserPremiumType['NitroBasic'] = 3)] = 'NitroBasic';
	})(UserPremiumType || (exports.UserPremiumType = UserPremiumType = {}));
	var ConnectionService;
	(function (ConnectionService) {
		ConnectionService['AmazonMusic'] = 'amazon-music';
		ConnectionService['BattleNet'] = 'battlenet';
		ConnectionService['Bluesky'] = 'bluesky';
		ConnectionService['BungieNet'] = 'bungie';
		ConnectionService['Crunchyroll'] = 'crunchyroll';
		ConnectionService['Domain'] = 'domain';
		ConnectionService['eBay'] = 'ebay';
		ConnectionService['EpicGames'] = 'epicgames';
		ConnectionService['Facebook'] = 'facebook';
		ConnectionService['GitHub'] = 'github';
		ConnectionService['Instagram'] = 'instagram';
		ConnectionService['LeagueOfLegends'] = 'leagueoflegends';
		ConnectionService['Mastodon'] = 'mastodon';
		ConnectionService['PayPal'] = 'paypal';
		ConnectionService['PlayStationNetwork'] = 'playstation';
		ConnectionService['Reddit'] = 'reddit';
		ConnectionService['RiotGames'] = 'riotgames';
		ConnectionService['Roblox'] = 'roblox';
		ConnectionService['Spotify'] = 'spotify';
		ConnectionService['Skype'] = 'skype';
		ConnectionService['Steam'] = 'steam';
		ConnectionService['TikTok'] = 'tiktok';
		ConnectionService['Twitch'] = 'twitch';
		ConnectionService['X'] = 'twitter';
		/**
		 * @deprecated This is the old name for {@link ConnectionService.X}
		 */
		ConnectionService['Twitter'] = 'twitter';
		ConnectionService['Xbox'] = 'xbox';
		ConnectionService['YouTube'] = 'youtube';
	})(ConnectionService || (exports.ConnectionService = ConnectionService = {}));
	var ConnectionVisibility;
	(function (ConnectionVisibility) {
		/**
		 * Invisible to everyone except the user themselves
		 */
		ConnectionVisibility[(ConnectionVisibility['None'] = 0)] = 'None';
		/**
		 * Visible to everyone
		 */
		ConnectionVisibility[(ConnectionVisibility['Everyone'] = 1)] = 'Everyone';
	})(ConnectionVisibility || (exports.ConnectionVisibility = ConnectionVisibility = {}));
	/**
	 * Background color of a nameplate.
	 */
	var NameplatePalette;
	(function (NameplatePalette) {
		NameplatePalette['Berry'] = 'berry';
		NameplatePalette['BubbleGum'] = 'bubble_gum';
		NameplatePalette['Clover'] = 'clover';
		NameplatePalette['Cobalt'] = 'cobalt';
		NameplatePalette['Crimson'] = 'crimson';
		NameplatePalette['Forest'] = 'forest';
		NameplatePalette['Lemon'] = 'lemon';
		NameplatePalette['Sky'] = 'sky';
		NameplatePalette['Teal'] = 'teal';
		NameplatePalette['Violet'] = 'violet';
		NameplatePalette['White'] = 'white';
	})(NameplatePalette || (exports.NameplatePalette = NameplatePalette = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/webhook.js
var require_webhook = /* @__PURE__ */ __commonJSMin((exports) => {
	/**
	 * Types extracted from https://discord.com/developers/docs/resources/webhook
	 */
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.WebhookType = exports.ApplicationWebhookEventType = exports.ApplicationWebhookType = void 0;
	/**
	 * @see {@link https://discord.com/developers/docs/events/webhook-events#webhook-types}
	 */
	var ApplicationWebhookType;
	(function (ApplicationWebhookType) {
		/**
		 * PING event sent to verify your Webhook Event URL is active
		 */
		ApplicationWebhookType[(ApplicationWebhookType['Ping'] = 0)] = 'Ping';
		/**
		 * Webhook event (details for event in event body object)
		 */
		ApplicationWebhookType[(ApplicationWebhookType['Event'] = 1)] = 'Event';
	})(ApplicationWebhookType || (exports.ApplicationWebhookType = ApplicationWebhookType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/events/webhook-events#event-types}
	 */
	var ApplicationWebhookEventType;
	(function (ApplicationWebhookEventType) {
		/**
		 * Sent when an app was authorized by a user to a server or their account
		 */
		ApplicationWebhookEventType['ApplicationAuthorized'] = 'APPLICATION_AUTHORIZED';
		/**
		 * Sent when an app was deauthorized by a user
		 */
		ApplicationWebhookEventType['ApplicationDeauthorized'] = 'APPLICATION_DEAUTHORIZED';
		/**
		 * Entitlement was created
		 */
		ApplicationWebhookEventType['EntitlementCreate'] = 'ENTITLEMENT_CREATE';
		/**
		 * Entitlement was updated
		 */
		ApplicationWebhookEventType['EntitlementUpdate'] = 'ENTITLEMENT_UPDATE';
		/**
		 * Entitlement was deleted
		 */
		ApplicationWebhookEventType['EntitlementDelete'] = 'ENTITLEMENT_DELETE';
		/**
		 * User was added to a Quest (currently unavailable)
		 */
		ApplicationWebhookEventType['QuestUserEnrollment'] = 'QUEST_USER_ENROLLMENT';
	})(ApplicationWebhookEventType || (exports.ApplicationWebhookEventType = ApplicationWebhookEventType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/resources/webhook#webhook-object-webhook-types}
	 */
	var WebhookType;
	(function (WebhookType) {
		/**
		 * Incoming Webhooks can post messages to channels with a generated token
		 */
		WebhookType[(WebhookType['Incoming'] = 1)] = 'Incoming';
		/**
		 * Channel Follower Webhooks are internal webhooks used with Channel Following to post new messages into channels
		 */
		WebhookType[(WebhookType['ChannelFollower'] = 2)] = 'ChannelFollower';
		/**
		 * Application webhooks are webhooks used with Interactions
		 */
		WebhookType[(WebhookType['Application'] = 3)] = 'Application';
	})(WebhookType || (exports.WebhookType = WebhookType = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/index.js
var require_v10$4 = /* @__PURE__ */ __commonJSMin((exports) => {
	var __createBinding =
		(exports && exports.__createBinding) ||
		(Object.create
			? function (o, m, k, k2) {
					if (k2 === void 0) k2 = k;
					var desc = Object.getOwnPropertyDescriptor(m, k);
					if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable))
						desc = {
							enumerable: true,
							get: function () {
								return m[k];
							}
						};
					Object.defineProperty(o, k2, desc);
				}
			: function (o, m, k, k2) {
					if (k2 === void 0) k2 = k;
					o[k2] = m[k];
				});
	var __exportStar =
		(exports && exports.__exportStar) ||
		function (m, exports$4) {
			for (var p in m) if (p !== 'default' && !Object.prototype.hasOwnProperty.call(exports$4, p)) __createBinding(exports$4, m, p);
		};
	Object.defineProperty(exports, '__esModule', { value: true });
	__exportStar(require_common$2(), exports);
	__exportStar(require_application(), exports);
	__exportStar(require_auditLog(), exports);
	__exportStar(require_autoModeration(), exports);
	__exportStar(require_channel$1(), exports);
	__exportStar(require_gateway(), exports);
	__exportStar(require_guild(), exports);
	__exportStar(require_guildScheduledEvent(), exports);
	__exportStar(require_interactions(), exports);
	__exportStar(require_invite$1(), exports);
	__exportStar(require_message(), exports);
	__exportStar(require_monetization$1(), exports);
	__exportStar(require_oauth2(), exports);
	__exportStar(require_permissions(), exports);
	__exportStar(require_poll(), exports);
	__exportStar(require_stageInstance(), exports);
	__exportStar(require_sticker(), exports);
	__exportStar(require_teams(), exports);
	__exportStar(require_user(), exports);
	__exportStar(require_webhook(), exports);
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/payloads/v10/index.mjs
var v10_exports$3 = /* @__PURE__ */ __exportAll({
	APIApplicationCommandPermissionsConstant: () => APIApplicationCommandPermissionsConstant$1,
	ActivityFlags: () => ActivityFlags$1,
	ActivityLocationKind: () => ActivityLocationKind$1,
	ActivityPlatform: () => ActivityPlatform$1,
	ActivityType: () => ActivityType$1,
	AllowedMentionsTypes: () => AllowedMentionsTypes$1,
	ApplicationCommandOptionType: () => ApplicationCommandOptionType$1,
	ApplicationCommandPermissionType: () => ApplicationCommandPermissionType$1,
	ApplicationCommandType: () => ApplicationCommandType$1,
	ApplicationFlags: () => ApplicationFlags$1,
	ApplicationIntegrationType: () => ApplicationIntegrationType$1,
	ApplicationRoleConnectionMetadataType: () => ApplicationRoleConnectionMetadataType$1,
	ApplicationWebhookEventStatus: () => ApplicationWebhookEventStatus$1,
	ApplicationWebhookEventType: () => ApplicationWebhookEventType$1,
	ApplicationWebhookType: () => ApplicationWebhookType$1,
	AttachmentFlags: () => AttachmentFlags$1,
	AuditLogEvent: () => AuditLogEvent$1,
	AuditLogOptionsType: () => AuditLogOptionsType$1,
	AutoModerationActionType: () => AutoModerationActionType$1,
	AutoModerationRuleEventType: () => AutoModerationRuleEventType$1,
	AutoModerationRuleKeywordPresetType: () => AutoModerationRuleKeywordPresetType$1,
	AutoModerationRuleTriggerType: () => AutoModerationRuleTriggerType$1,
	BaseThemeType: () => BaseThemeType$1,
	ButtonStyle: () => ButtonStyle$1,
	ChannelFlags: () => ChannelFlags$1,
	ChannelType: () => ChannelType$1,
	ComponentType: () => ComponentType$1,
	ConnectionService: () => ConnectionService$1,
	ConnectionVisibility: () => ConnectionVisibility$1,
	EmbedFlags: () => EmbedFlags$1,
	EmbedMediaFlags: () => EmbedMediaFlags$1,
	EmbedType: () => EmbedType$1,
	EntitlementType: () => EntitlementType$1,
	EntryPointCommandHandlerType: () => EntryPointCommandHandlerType$1,
	ForumLayoutType: () => ForumLayoutType$1,
	GuildDefaultMessageNotifications: () => GuildDefaultMessageNotifications$1,
	GuildExplicitContentFilter: () => GuildExplicitContentFilter$1,
	GuildFeature: () => GuildFeature$1,
	GuildHubType: () => GuildHubType$1,
	GuildMFALevel: () => GuildMFALevel$1,
	GuildMemberFlags: () => GuildMemberFlags$1,
	GuildNSFWLevel: () => GuildNSFWLevel$1,
	GuildOnboardingMode: () => GuildOnboardingMode$1,
	GuildOnboardingPromptType: () => GuildOnboardingPromptType$1,
	GuildPremiumTier: () => GuildPremiumTier$1,
	GuildScheduledEventEntityType: () => GuildScheduledEventEntityType$1,
	GuildScheduledEventPrivacyLevel: () => GuildScheduledEventPrivacyLevel$1,
	GuildScheduledEventRecurrenceRuleFrequency: () => GuildScheduledEventRecurrenceRuleFrequency$1,
	GuildScheduledEventRecurrenceRuleMonth: () => GuildScheduledEventRecurrenceRuleMonth$1,
	GuildScheduledEventRecurrenceRuleWeekday: () => GuildScheduledEventRecurrenceRuleWeekday$1,
	GuildScheduledEventStatus: () => GuildScheduledEventStatus$1,
	GuildSystemChannelFlags: () => GuildSystemChannelFlags$1,
	GuildVerificationLevel: () => GuildVerificationLevel$1,
	GuildWidgetStyle: () => GuildWidgetStyle$1,
	IntegrationExpireBehavior: () => IntegrationExpireBehavior$1,
	InteractionContextType: () => InteractionContextType$1,
	InteractionResponseType: () => InteractionResponseType$1,
	InteractionType: () => InteractionType$1,
	InviteFlags: () => InviteFlags$1,
	InviteTargetType: () => InviteTargetType$1,
	InviteType: () => InviteType$1,
	MembershipScreeningFieldType: () => MembershipScreeningFieldType$1,
	MessageActivityType: () => MessageActivityType$1,
	MessageFlags: () => MessageFlags$1,
	MessageReferenceType: () => MessageReferenceType$1,
	MessageSearchAuthorType: () => MessageSearchAuthorType$1,
	MessageSearchEmbedType: () => MessageSearchEmbedType$1,
	MessageSearchHasType: () => MessageSearchHasType$1,
	MessageSearchSortMode: () => MessageSearchSortMode$1,
	MessageType: () => MessageType$1,
	NameplatePalette: () => NameplatePalette$1,
	OAuth2Scopes: () => OAuth2Scopes$1,
	OverwriteType: () => OverwriteType$1,
	PermissionFlagsBits: () => PermissionFlagsBits$1,
	PollLayoutType: () => PollLayoutType$1,
	PresenceUpdateStatus: () => PresenceUpdateStatus$1,
	RoleFlags: () => RoleFlags$1,
	SKUFlags: () => SKUFlags$1,
	SKUType: () => SKUType$1,
	SelectMenuDefaultValueType: () => SelectMenuDefaultValueType$1,
	SeparatorSpacingSize: () => SeparatorSpacingSize$1,
	SortOrderType: () => SortOrderType$1,
	StageInstancePrivacyLevel: () => StageInstancePrivacyLevel$1,
	StatusDisplayType: () => StatusDisplayType$1,
	StickerFormatType: () => StickerFormatType$1,
	StickerType: () => StickerType$1,
	SubscriptionStatus: () => SubscriptionStatus$1,
	TeamMemberMembershipState: () => TeamMemberMembershipState$1,
	TeamMemberRole: () => TeamMemberRole$1,
	TextInputStyle: () => TextInputStyle$1,
	ThreadAutoArchiveDuration: () => ThreadAutoArchiveDuration$1,
	ThreadMemberFlags: () => ThreadMemberFlags$1,
	UnfurledMediaItemFlags: () => UnfurledMediaItemFlags$1,
	UnfurledMediaItemLoadingState: () => UnfurledMediaItemLoadingState$1,
	UserFlags: () => UserFlags$1,
	UserPremiumType: () => UserPremiumType$1,
	VideoQualityMode: () => VideoQualityMode$1,
	WebhookType: () => WebhookType$1,
	default: () => v10_default$3
});
var import_v10$4,
	v10_default$3,
	APIApplicationCommandPermissionsConstant$1,
	ActivityFlags$1,
	ActivityLocationKind$1,
	ActivityPlatform$1,
	ActivityType$1,
	AllowedMentionsTypes$1,
	ApplicationCommandOptionType$1,
	ApplicationCommandPermissionType$1,
	ApplicationCommandType$1,
	ApplicationFlags$1,
	ApplicationIntegrationType$1,
	ApplicationRoleConnectionMetadataType$1,
	ApplicationWebhookEventStatus$1,
	ApplicationWebhookEventType$1,
	ApplicationWebhookType$1,
	AttachmentFlags$1,
	AuditLogEvent$1,
	AuditLogOptionsType$1,
	AutoModerationActionType$1,
	AutoModerationRuleEventType$1,
	AutoModerationRuleKeywordPresetType$1,
	AutoModerationRuleTriggerType$1,
	BaseThemeType$1,
	ButtonStyle$1,
	ChannelFlags$1,
	ChannelType$1,
	ComponentType$1,
	ConnectionService$1,
	ConnectionVisibility$1,
	EmbedFlags$1,
	EmbedMediaFlags$1,
	EmbedType$1,
	EntitlementType$1,
	EntryPointCommandHandlerType$1,
	ForumLayoutType$1,
	GuildDefaultMessageNotifications$1,
	GuildExplicitContentFilter$1,
	GuildFeature$1,
	GuildHubType$1,
	GuildMFALevel$1,
	GuildMemberFlags$1,
	GuildNSFWLevel$1,
	GuildOnboardingMode$1,
	GuildOnboardingPromptType$1,
	GuildPremiumTier$1,
	GuildScheduledEventEntityType$1,
	GuildScheduledEventPrivacyLevel$1,
	GuildScheduledEventRecurrenceRuleFrequency$1,
	GuildScheduledEventRecurrenceRuleMonth$1,
	GuildScheduledEventRecurrenceRuleWeekday$1,
	GuildScheduledEventStatus$1,
	GuildSystemChannelFlags$1,
	GuildVerificationLevel$1,
	GuildWidgetStyle$1,
	IntegrationExpireBehavior$1,
	InteractionContextType$1,
	InteractionResponseType$1,
	InteractionType$1,
	InviteFlags$1,
	InviteTargetType$1,
	InviteType$1,
	MembershipScreeningFieldType$1,
	MessageActivityType$1,
	MessageFlags$1,
	MessageReferenceType$1,
	MessageSearchAuthorType$1,
	MessageSearchEmbedType$1,
	MessageSearchHasType$1,
	MessageSearchSortMode$1,
	MessageType$1,
	NameplatePalette$1,
	OAuth2Scopes$1,
	OverwriteType$1,
	PermissionFlagsBits$1,
	PollLayoutType$1,
	PresenceUpdateStatus$1,
	RoleFlags$1,
	SKUFlags$1,
	SKUType$1,
	SelectMenuDefaultValueType$1,
	SeparatorSpacingSize$1,
	SortOrderType$1,
	StageInstancePrivacyLevel$1,
	StatusDisplayType$1,
	StickerFormatType$1,
	StickerType$1,
	SubscriptionStatus$1,
	TeamMemberMembershipState$1,
	TeamMemberRole$1,
	TextInputStyle$1,
	ThreadAutoArchiveDuration$1,
	ThreadMemberFlags$1,
	UnfurledMediaItemFlags$1,
	UnfurledMediaItemLoadingState$1,
	UserFlags$1,
	UserPremiumType$1,
	VideoQualityMode$1,
	WebhookType$1;
var init_v10$3 = __esmMin(() => {
	import_v10$4 = /* @__PURE__ */ __toESM(require_v10$4(), 1);
	v10_default$3 = import_v10$4.default;
	APIApplicationCommandPermissionsConstant$1 = import_v10$4.default.APIApplicationCommandPermissionsConstant;
	ActivityFlags$1 = import_v10$4.default.ActivityFlags;
	ActivityLocationKind$1 = import_v10$4.default.ActivityLocationKind;
	ActivityPlatform$1 = import_v10$4.default.ActivityPlatform;
	ActivityType$1 = import_v10$4.default.ActivityType;
	AllowedMentionsTypes$1 = import_v10$4.default.AllowedMentionsTypes;
	ApplicationCommandOptionType$1 = import_v10$4.default.ApplicationCommandOptionType;
	ApplicationCommandPermissionType$1 = import_v10$4.default.ApplicationCommandPermissionType;
	ApplicationCommandType$1 = import_v10$4.default.ApplicationCommandType;
	ApplicationFlags$1 = import_v10$4.default.ApplicationFlags;
	ApplicationIntegrationType$1 = import_v10$4.default.ApplicationIntegrationType;
	ApplicationRoleConnectionMetadataType$1 = import_v10$4.default.ApplicationRoleConnectionMetadataType;
	ApplicationWebhookEventStatus$1 = import_v10$4.default.ApplicationWebhookEventStatus;
	ApplicationWebhookEventType$1 = import_v10$4.default.ApplicationWebhookEventType;
	ApplicationWebhookType$1 = import_v10$4.default.ApplicationWebhookType;
	AttachmentFlags$1 = import_v10$4.default.AttachmentFlags;
	AuditLogEvent$1 = import_v10$4.default.AuditLogEvent;
	AuditLogOptionsType$1 = import_v10$4.default.AuditLogOptionsType;
	AutoModerationActionType$1 = import_v10$4.default.AutoModerationActionType;
	AutoModerationRuleEventType$1 = import_v10$4.default.AutoModerationRuleEventType;
	AutoModerationRuleKeywordPresetType$1 = import_v10$4.default.AutoModerationRuleKeywordPresetType;
	AutoModerationRuleTriggerType$1 = import_v10$4.default.AutoModerationRuleTriggerType;
	BaseThemeType$1 = import_v10$4.default.BaseThemeType;
	ButtonStyle$1 = import_v10$4.default.ButtonStyle;
	ChannelFlags$1 = import_v10$4.default.ChannelFlags;
	ChannelType$1 = import_v10$4.default.ChannelType;
	ComponentType$1 = import_v10$4.default.ComponentType;
	ConnectionService$1 = import_v10$4.default.ConnectionService;
	ConnectionVisibility$1 = import_v10$4.default.ConnectionVisibility;
	EmbedFlags$1 = import_v10$4.default.EmbedFlags;
	EmbedMediaFlags$1 = import_v10$4.default.EmbedMediaFlags;
	EmbedType$1 = import_v10$4.default.EmbedType;
	EntitlementType$1 = import_v10$4.default.EntitlementType;
	EntryPointCommandHandlerType$1 = import_v10$4.default.EntryPointCommandHandlerType;
	ForumLayoutType$1 = import_v10$4.default.ForumLayoutType;
	GuildDefaultMessageNotifications$1 = import_v10$4.default.GuildDefaultMessageNotifications;
	GuildExplicitContentFilter$1 = import_v10$4.default.GuildExplicitContentFilter;
	GuildFeature$1 = import_v10$4.default.GuildFeature;
	GuildHubType$1 = import_v10$4.default.GuildHubType;
	GuildMFALevel$1 = import_v10$4.default.GuildMFALevel;
	GuildMemberFlags$1 = import_v10$4.default.GuildMemberFlags;
	GuildNSFWLevel$1 = import_v10$4.default.GuildNSFWLevel;
	GuildOnboardingMode$1 = import_v10$4.default.GuildOnboardingMode;
	GuildOnboardingPromptType$1 = import_v10$4.default.GuildOnboardingPromptType;
	GuildPremiumTier$1 = import_v10$4.default.GuildPremiumTier;
	GuildScheduledEventEntityType$1 = import_v10$4.default.GuildScheduledEventEntityType;
	GuildScheduledEventPrivacyLevel$1 = import_v10$4.default.GuildScheduledEventPrivacyLevel;
	GuildScheduledEventRecurrenceRuleFrequency$1 = import_v10$4.default.GuildScheduledEventRecurrenceRuleFrequency;
	GuildScheduledEventRecurrenceRuleMonth$1 = import_v10$4.default.GuildScheduledEventRecurrenceRuleMonth;
	GuildScheduledEventRecurrenceRuleWeekday$1 = import_v10$4.default.GuildScheduledEventRecurrenceRuleWeekday;
	GuildScheduledEventStatus$1 = import_v10$4.default.GuildScheduledEventStatus;
	GuildSystemChannelFlags$1 = import_v10$4.default.GuildSystemChannelFlags;
	GuildVerificationLevel$1 = import_v10$4.default.GuildVerificationLevel;
	GuildWidgetStyle$1 = import_v10$4.default.GuildWidgetStyle;
	IntegrationExpireBehavior$1 = import_v10$4.default.IntegrationExpireBehavior;
	InteractionContextType$1 = import_v10$4.default.InteractionContextType;
	InteractionResponseType$1 = import_v10$4.default.InteractionResponseType;
	InteractionType$1 = import_v10$4.default.InteractionType;
	InviteFlags$1 = import_v10$4.default.InviteFlags;
	InviteTargetType$1 = import_v10$4.default.InviteTargetType;
	InviteType$1 = import_v10$4.default.InviteType;
	MembershipScreeningFieldType$1 = import_v10$4.default.MembershipScreeningFieldType;
	MessageActivityType$1 = import_v10$4.default.MessageActivityType;
	MessageFlags$1 = import_v10$4.default.MessageFlags;
	MessageReferenceType$1 = import_v10$4.default.MessageReferenceType;
	MessageSearchAuthorType$1 = import_v10$4.default.MessageSearchAuthorType;
	MessageSearchEmbedType$1 = import_v10$4.default.MessageSearchEmbedType;
	MessageSearchHasType$1 = import_v10$4.default.MessageSearchHasType;
	MessageSearchSortMode$1 = import_v10$4.default.MessageSearchSortMode;
	MessageType$1 = import_v10$4.default.MessageType;
	NameplatePalette$1 = import_v10$4.default.NameplatePalette;
	OAuth2Scopes$1 = import_v10$4.default.OAuth2Scopes;
	OverwriteType$1 = import_v10$4.default.OverwriteType;
	PermissionFlagsBits$1 = import_v10$4.default.PermissionFlagsBits;
	PollLayoutType$1 = import_v10$4.default.PollLayoutType;
	PresenceUpdateStatus$1 = import_v10$4.default.PresenceUpdateStatus;
	RoleFlags$1 = import_v10$4.default.RoleFlags;
	SKUFlags$1 = import_v10$4.default.SKUFlags;
	SKUType$1 = import_v10$4.default.SKUType;
	SelectMenuDefaultValueType$1 = import_v10$4.default.SelectMenuDefaultValueType;
	SeparatorSpacingSize$1 = import_v10$4.default.SeparatorSpacingSize;
	SortOrderType$1 = import_v10$4.default.SortOrderType;
	StageInstancePrivacyLevel$1 = import_v10$4.default.StageInstancePrivacyLevel;
	StatusDisplayType$1 = import_v10$4.default.StatusDisplayType;
	StickerFormatType$1 = import_v10$4.default.StickerFormatType;
	StickerType$1 = import_v10$4.default.StickerType;
	SubscriptionStatus$1 = import_v10$4.default.SubscriptionStatus;
	TeamMemberMembershipState$1 = import_v10$4.default.TeamMemberMembershipState;
	TeamMemberRole$1 = import_v10$4.default.TeamMemberRole;
	TextInputStyle$1 = import_v10$4.default.TextInputStyle;
	ThreadAutoArchiveDuration$1 = import_v10$4.default.ThreadAutoArchiveDuration;
	ThreadMemberFlags$1 = import_v10$4.default.ThreadMemberFlags;
	UnfurledMediaItemFlags$1 = import_v10$4.default.UnfurledMediaItemFlags;
	UnfurledMediaItemLoadingState$1 = import_v10$4.default.UnfurledMediaItemLoadingState;
	UserFlags$1 = import_v10$4.default.UserFlags;
	UserPremiumType$1 = import_v10$4.default.UserPremiumType;
	VideoQualityMode$1 = import_v10$4.default.VideoQualityMode;
	WebhookType$1 = import_v10$4.default.WebhookType;
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/utils/internals.js
var require_internals = /* @__PURE__ */ __commonJSMin((exports) => {
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.urlSafeCharacters = void 0;
	var pattern = /^[\d%A-Za-z-_]+$/g;
	exports.urlSafeCharacters = {
		test(input) {
			const result = pattern.test(input);
			pattern.lastIndex = 0;
			return result;
		}
	};
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/rest/common.js
var require_common$1 = /* @__PURE__ */ __commonJSMin((exports) => {
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.Locale = exports.CannotSendMessagesToThisUserErrorCodes = exports.RESTJSONErrorCodes = void 0;
	/**
	 * @see {@link https://discord.com/developers/docs/topics/opcodes-and-status-codes#json-json-error-codes}
	 */
	var RESTJSONErrorCodes;
	(function (RESTJSONErrorCodes) {
		RESTJSONErrorCodes[(RESTJSONErrorCodes['GeneralError'] = 0)] = 'GeneralError';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownAccount'] = 10001)] = 'UnknownAccount';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownApplication'] = 10002)] = 'UnknownApplication';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownChannel'] = 10003)] = 'UnknownChannel';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownGuild'] = 10004)] = 'UnknownGuild';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownIntegration'] = 10005)] = 'UnknownIntegration';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownInvite'] = 10006)] = 'UnknownInvite';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownMember'] = 10007)] = 'UnknownMember';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownMessage'] = 10008)] = 'UnknownMessage';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownPermissionOverwrite'] = 10009)] = 'UnknownPermissionOverwrite';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownProvider'] = 10010)] = 'UnknownProvider';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownRole'] = 10011)] = 'UnknownRole';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownToken'] = 10012)] = 'UnknownToken';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownUser'] = 10013)] = 'UnknownUser';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownEmoji'] = 10014)] = 'UnknownEmoji';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownWebhook'] = 10015)] = 'UnknownWebhook';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownWebhookService'] = 10016)] = 'UnknownWebhookService';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownSession'] = 10020)] = 'UnknownSession';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownAsset'] = 10021)] = 'UnknownAsset';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownBan'] = 10026)] = 'UnknownBan';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownSKU'] = 10027)] = 'UnknownSKU';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownStoreListing'] = 10028)] = 'UnknownStoreListing';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownEntitlement'] = 10029)] = 'UnknownEntitlement';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownBuild'] = 10030)] = 'UnknownBuild';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownLobby'] = 10031)] = 'UnknownLobby';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownBranch'] = 10032)] = 'UnknownBranch';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownStoreDirectoryLayout'] = 10033)] = 'UnknownStoreDirectoryLayout';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownRedistributable'] = 10036)] = 'UnknownRedistributable';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownGiftCode'] = 10038)] = 'UnknownGiftCode';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownStream'] = 10049)] = 'UnknownStream';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownPremiumServerSubscribeCooldown'] = 10050)] = 'UnknownPremiumServerSubscribeCooldown';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownGuildTemplate'] = 10057)] = 'UnknownGuildTemplate';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownDiscoverableServerCategory'] = 10059)] = 'UnknownDiscoverableServerCategory';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownSticker'] = 10060)] = 'UnknownSticker';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownStickerPack'] = 10061)] = 'UnknownStickerPack';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownInteraction'] = 10062)] = 'UnknownInteraction';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownApplicationCommand'] = 10063)] = 'UnknownApplicationCommand';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownVoiceState'] = 10065)] = 'UnknownVoiceState';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownApplicationCommandPermissions'] = 10066)] = 'UnknownApplicationCommandPermissions';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownStageInstance'] = 10067)] = 'UnknownStageInstance';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownGuildMemberVerificationForm'] = 10068)] = 'UnknownGuildMemberVerificationForm';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownGuildWelcomeScreen'] = 10069)] = 'UnknownGuildWelcomeScreen';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownGuildScheduledEvent'] = 10070)] = 'UnknownGuildScheduledEvent';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownGuildScheduledEventUser'] = 10071)] = 'UnknownGuildScheduledEventUser';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownTag'] = 10087)] = 'UnknownTag';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownSound'] = 10097)] = 'UnknownSound';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownInviteTargetUsersJob'] = 10124)] = 'UnknownInviteTargetUsersJob';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnknownInviteTargetUsers'] = 10129)] = 'UnknownInviteTargetUsers';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['BotsCannotUseThisEndpoint'] = 20001)] = 'BotsCannotUseThisEndpoint';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['OnlyBotsCanUseThisEndpoint'] = 20002)] = 'OnlyBotsCanUseThisEndpoint';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ExplicitContentCannotBeSentToTheDesiredRecipient'] = 20009)] =
			'ExplicitContentCannotBeSentToTheDesiredRecipient';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['NotAuthorizedToPerformThisActionOnThisApplication'] = 20012)] =
			'NotAuthorizedToPerformThisActionOnThisApplication';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ThisActionRequiresAPremiumSubscription'] = 20015)] = 'ThisActionRequiresAPremiumSubscription';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ActionCannotBePerformedDueToSlowmodeRateLimit'] = 20016)] =
			'ActionCannotBePerformedDueToSlowmodeRateLimit';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['TheMazeIsntMeantForYou'] = 20017)] = 'TheMazeIsntMeantForYou';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['OnlyTheOwnerOfThisAccountCanPerformThisAction'] = 20018)] =
			'OnlyTheOwnerOfThisAccountCanPerformThisAction';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['AnnouncementEditLimitExceeded'] = 20022)] = 'AnnouncementEditLimitExceeded';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UnderMinimumAge'] = 20024)] = 'UnderMinimumAge';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ChannelWriteRateLimit'] = 20028)] = 'ChannelWriteRateLimit';
		/**
		 * @deprecated Use {@link RESTJSONErrorCodes.ChannelWriteRateLimit} instead
		 */
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ChannelSendRateLimit'] = 20028)] = 'ChannelSendRateLimit';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ServerWriteRateLimit'] = 20029)] = 'ServerWriteRateLimit';
		/**
		 * @deprecated Use {@link RESTJSONErrorCodes.ServerWriteRateLimit} instead
		 */
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ServerSendRateLimit'] = 20029)] = 'ServerSendRateLimit';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['StageTopicServerNameServerDescriptionOrChannelNamesContainDisallowedWords'] = 20031)] =
			'StageTopicServerNameServerDescriptionOrChannelNamesContainDisallowedWords';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['GuildPremiumSubscriptionLevelTooLow'] = 20035)] = 'GuildPremiumSubscriptionLevelTooLow';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfGuildsReached'] = 30001)] = 'MaximumNumberOfGuildsReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfFriendsReached'] = 30002)] = 'MaximumNumberOfFriendsReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfPinsReachedForTheChannel'] = 30003)] = 'MaximumNumberOfPinsReachedForTheChannel';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfRecipientsReached'] = 30004)] = 'MaximumNumberOfRecipientsReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfGuildRolesReached'] = 30005)] = 'MaximumNumberOfGuildRolesReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfWebhooksReached'] = 30007)] = 'MaximumNumberOfWebhooksReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfEmojisReached'] = 30008)] = 'MaximumNumberOfEmojisReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfReactionsReached'] = 30010)] = 'MaximumNumberOfReactionsReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfGroupDMsReached'] = 30011)] = 'MaximumNumberOfGroupDMsReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfGuildChannelsReached'] = 30013)] = 'MaximumNumberOfGuildChannelsReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfAttachmentsInAMessageReached'] = 30015)] =
			'MaximumNumberOfAttachmentsInAMessageReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfInvitesReached'] = 30016)] = 'MaximumNumberOfInvitesReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfAnimatedEmojisReached'] = 30018)] = 'MaximumNumberOfAnimatedEmojisReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfServerMembersReached'] = 30019)] = 'MaximumNumberOfServerMembersReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfServerCategoriesReached'] = 30030)] = 'MaximumNumberOfServerCategoriesReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['GuildAlreadyHasTemplate'] = 30031)] = 'GuildAlreadyHasTemplate';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfApplicationCommandsReached'] = 30032)] = 'MaximumNumberOfApplicationCommandsReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumThreadParticipantsReached'] = 30033)] = 'MaximumThreadParticipantsReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumDailyApplicationCommandCreatesReached'] = 30034)] =
			'MaximumDailyApplicationCommandCreatesReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfNonGuildMemberBansHasBeenExceeded'] = 30035)] =
			'MaximumNumberOfNonGuildMemberBansHasBeenExceeded';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfBanFetchesHasBeenReached'] = 30037)] = 'MaximumNumberOfBanFetchesHasBeenReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfUncompletedGuildScheduledEventsReached'] = 30038)] =
			'MaximumNumberOfUncompletedGuildScheduledEventsReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfStickersReached'] = 30039)] = 'MaximumNumberOfStickersReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfPruneRequestsHasBeenReached'] = 30040)] = 'MaximumNumberOfPruneRequestsHasBeenReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfGuildWidgetSettingsUpdatesHasBeenReached'] = 30042)] =
			'MaximumNumberOfGuildWidgetSettingsUpdatesHasBeenReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfSoundboardSoundsReached'] = 30045)] = 'MaximumNumberOfSoundboardSoundsReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfEditsToMessagesOlderThanOneHourReached'] = 30046)] =
			'MaximumNumberOfEditsToMessagesOlderThanOneHourReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfPinnedThreadsInForumHasBeenReached'] = 30047)] =
			'MaximumNumberOfPinnedThreadsInForumHasBeenReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfTagsInForumHasBeenReached'] = 30048)] = 'MaximumNumberOfTagsInForumHasBeenReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['BitrateIsTooHighForChannelOfThisType'] = 30052)] = 'BitrateIsTooHighForChannelOfThisType';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfPremiumEmojisReached'] = 30056)] = 'MaximumNumberOfPremiumEmojisReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfWebhooksPerGuildReached'] = 30058)] = 'MaximumNumberOfWebhooksPerGuildReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumNumberOfChannelPermissionOverwritesReached'] = 30060)] =
			'MaximumNumberOfChannelPermissionOverwritesReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['TheChannelsForThisGuildAreTooLarge'] = 30061)] = 'TheChannelsForThisGuildAreTooLarge';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['Unauthorized'] = 40001)] = 'Unauthorized';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['VerifyYourAccount'] = 40002)] = 'VerifyYourAccount';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['OpeningDirectMessagesTooFast'] = 40003)] = 'OpeningDirectMessagesTooFast';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['SendMessagesHasBeenTemporarilyDisabled'] = 40004)] = 'SendMessagesHasBeenTemporarilyDisabled';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['RequestEntityTooLarge'] = 40005)] = 'RequestEntityTooLarge';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['FeatureTemporarilyDisabledServerSide'] = 40006)] = 'FeatureTemporarilyDisabledServerSide';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UserBannedFromThisGuild'] = 40007)] = 'UserBannedFromThisGuild';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['OnlyOneChannelCanHaveAParentIdModifiedAtATime'] = 40009)] =
			'OnlyOneChannelCanHaveAParentIdModifiedAtATime';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ConnectionHasBeenRevoked'] = 40012)] = 'ConnectionHasBeenRevoked';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['OnlyConsumableSKUsCanBeConsumed'] = 40018)] = 'OnlyConsumableSKUsCanBeConsumed';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['YouCanOnlyDeleteSandboxEntitlements'] = 40019)] = 'YouCanOnlyDeleteSandboxEntitlements';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['TargetUserIsNotConnectedToVoice'] = 40032)] = 'TargetUserIsNotConnectedToVoice';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ThisMessageWasAlreadyCrossposted'] = 40033)] = 'ThisMessageWasAlreadyCrossposted';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ApplicationCommandWithThatNameAlreadyExists'] = 40041)] =
			'ApplicationCommandWithThatNameAlreadyExists';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ApplicationInteractionFailedToSend'] = 40043)] = 'ApplicationInteractionFailedToSend';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotSendAMessageInAForumChannel'] = 40058)] = 'CannotSendAMessageInAForumChannel';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InteractionHasAlreadyBeenAcknowledged'] = 40060)] = 'InteractionHasAlreadyBeenAcknowledged';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['TagNamesMustBeUnique'] = 40061)] = 'TagNamesMustBeUnique';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ServiceResourceIsBeingRateLimited'] = 40062)] = 'ServiceResourceIsBeingRateLimited';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ThereAreNoTagsAvailableThatCanBeSetByNonModerators'] = 40066)] =
			'ThereAreNoTagsAvailableThatCanBeSetByNonModerators';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['TagRequiredToCreateAForumPostInThisChannel'] = 40067)] = 'TagRequiredToCreateAForumPostInThisChannel';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['AnEntitlementHasAlreadyBeenGrantedForThisResource'] = 40074)] =
			'AnEntitlementHasAlreadyBeenGrantedForThisResource';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ThisInteractionHasHitTheMaximumNumberOfFollowUpMessages'] = 40094)] =
			'ThisInteractionHasHitTheMaximumNumberOfFollowUpMessages';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CloudflareIsBlockingYourRequest'] = 40333)] = 'CloudflareIsBlockingYourRequest';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MissingAccess'] = 50001)] = 'MissingAccess';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InvalidAccountType'] = 50002)] = 'InvalidAccountType';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotExecuteActionOnDMChannel'] = 50003)] = 'CannotExecuteActionOnDMChannel';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['GuildWidgetDisabled'] = 50004)] = 'GuildWidgetDisabled';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotEditMessageAuthoredByAnotherUser'] = 50005)] = 'CannotEditMessageAuthoredByAnotherUser';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotSendAnEmptyMessage'] = 50006)] = 'CannotSendAnEmptyMessage';
		/**
		 * @see {@link RESTJSONErrorCodes.CannotSendMessagesToThisUserDueToHavingNoMutualGuilds} for a similar error code
		 */
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotSendMessagesToThisUser'] = 50007)] = 'CannotSendMessagesToThisUser';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotSendMessagesInNonTextChannel'] = 50008)] = 'CannotSendMessagesInNonTextChannel';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ChannelVerificationLevelTooHighForYouToGainAccess'] = 50009)] =
			'ChannelVerificationLevelTooHighForYouToGainAccess';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['OAuth2ApplicationDoesNotHaveBot'] = 50010)] = 'OAuth2ApplicationDoesNotHaveBot';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['OAuth2ApplicationLimitReached'] = 50011)] = 'OAuth2ApplicationLimitReached';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InvalidOAuth2State'] = 50012)] = 'InvalidOAuth2State';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MissingPermissions'] = 50013)] = 'MissingPermissions';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InvalidToken'] = 50014)] = 'InvalidToken';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['NoteWasTooLong'] = 50015)] = 'NoteWasTooLong';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ProvidedTooFewOrTooManyMessagesToDelete'] = 50016)] = 'ProvidedTooFewOrTooManyMessagesToDelete';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InvalidMFALevel'] = 50017)] = 'InvalidMFALevel';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MessageCanOnlyBePinnedInTheChannelItWasSentIn'] = 50019)] =
			'MessageCanOnlyBePinnedInTheChannelItWasSentIn';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InviteCodeInvalidOrTaken'] = 50020)] = 'InviteCodeInvalidOrTaken';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotExecuteActionOnSystemMessage'] = 50021)] = 'CannotExecuteActionOnSystemMessage';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotExecuteActionOnThisChannelType'] = 50024)] = 'CannotExecuteActionOnThisChannelType';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InvalidOAuth2AccessToken'] = 50025)] = 'InvalidOAuth2AccessToken';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MissingRequiredOAuth2Scope'] = 50026)] = 'MissingRequiredOAuth2Scope';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InvalidWebhookToken'] = 50027)] = 'InvalidWebhookToken';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InvalidRole'] = 50028)] = 'InvalidRole';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InvalidRecipients'] = 50033)] = 'InvalidRecipients';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['OneOfTheMessagesProvidedWasTooOldForBulkDelete'] = 50034)] =
			'OneOfTheMessagesProvidedWasTooOldForBulkDelete';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InvalidFormBodyOrContentType'] = 50035)] = 'InvalidFormBodyOrContentType';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InviteAcceptedToGuildWithoutTheBotBeingIn'] = 50036)] = 'InviteAcceptedToGuildWithoutTheBotBeingIn';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InvalidActivityAction'] = 50039)] = 'InvalidActivityAction';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InvalidAPIVersion'] = 50041)] = 'InvalidAPIVersion';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['FileUploadedExceedsMaximumSize'] = 50045)] = 'FileUploadedExceedsMaximumSize';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InvalidFileUploaded'] = 50046)] = 'InvalidFileUploaded';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotSelfRedeemThisGift'] = 50054)] = 'CannotSelfRedeemThisGift';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InvalidGuild'] = 50055)] = 'InvalidGuild';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InvalidSKU'] = 50057)] = 'InvalidSKU';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InvalidRequestOrigin'] = 50067)] = 'InvalidRequestOrigin';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InvalidMessageType'] = 50068)] = 'InvalidMessageType';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['PaymentSourceRequiredToRedeemGift'] = 50070)] = 'PaymentSourceRequiredToRedeemGift';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotModifyASystemWebhook'] = 50073)] = 'CannotModifyASystemWebhook';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotDeleteChannelRequiredForCommunityGuilds'] = 50074)] =
			'CannotDeleteChannelRequiredForCommunityGuilds';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotEditStickersWithinMessage'] = 50080)] = 'CannotEditStickersWithinMessage';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InvalidStickerSent'] = 50081)] = 'InvalidStickerSent';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InvalidActionOnArchivedThread'] = 50083)] = 'InvalidActionOnArchivedThread';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InvalidThreadNotificationSettings'] = 50084)] = 'InvalidThreadNotificationSettings';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ParameterEarlierThanCreation'] = 50085)] = 'ParameterEarlierThanCreation';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CommunityServerChannelsMustBeTextChannels'] = 50086)] = 'CommunityServerChannelsMustBeTextChannels';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['TheEntityTypeOfTheEventIsDifferentFromTheEntityYouAreTryingToStartTheEventFor'] = 50091)] =
			'TheEntityTypeOfTheEventIsDifferentFromTheEntityYouAreTryingToStartTheEventFor';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ServerNotAvailableInYourLocation'] = 50095)] = 'ServerNotAvailableInYourLocation';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ServerNeedsMonetizationEnabledToPerformThisAction'] = 50097)] =
			'ServerNeedsMonetizationEnabledToPerformThisAction';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ServerNeedsMoreBoostsToPerformThisAction'] = 50101)] = 'ServerNeedsMoreBoostsToPerformThisAction';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['RequestBodyContainsInvalidJSON'] = 50109)] = 'RequestBodyContainsInvalidJSON';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ProvidedFileIsInvalid'] = 50110)] = 'ProvidedFileIsInvalid';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ProvidedFileTypeIsInvalid'] = 50123)] = 'ProvidedFileTypeIsInvalid';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ProvidedFileDurationExceedsMaximumLength'] = 50124)] = 'ProvidedFileDurationExceedsMaximumLength';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['OwnerCannotBePendingMember'] = 50131)] = 'OwnerCannotBePendingMember';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['OwnershipCannotBeMovedToABotUser'] = 50132)] = 'OwnershipCannotBeMovedToABotUser';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['FailedToResizeAssetBelowTheMaximumSize'] = 50138)] = 'FailedToResizeAssetBelowTheMaximumSize';
		/**
		 * @deprecated This name is incorrect. Use {@link RESTJSONErrorCodes.FailedToResizeAssetBelowTheMaximumSize} instead
		 */
		RESTJSONErrorCodes[(RESTJSONErrorCodes['FailedToResizeAssetBelowTheMinimumSize'] = 50138)] = 'FailedToResizeAssetBelowTheMinimumSize';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotMixSubscriptionAndNonSubscriptionRolesForAnEmoji'] = 50144)] =
			'CannotMixSubscriptionAndNonSubscriptionRolesForAnEmoji';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotConvertBetweenPremiumEmojiAndNormalEmoji'] = 50145)] =
			'CannotConvertBetweenPremiumEmojiAndNormalEmoji';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UploadedFileNotFound'] = 50146)] = 'UploadedFileNotFound';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['SpecifiedEmojiIsInvalid'] = 50151)] = 'SpecifiedEmojiIsInvalid';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['VoiceMessagesDoNotSupportAdditionalContent'] = 50159)] = 'VoiceMessagesDoNotSupportAdditionalContent';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['VoiceMessagesMustHaveASingleAudioAttachment'] = 50160)] =
			'VoiceMessagesMustHaveASingleAudioAttachment';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['VoiceMessagesMustHaveSupportingMetadata'] = 50161)] = 'VoiceMessagesMustHaveSupportingMetadata';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['VoiceMessagesCannotBeEdited'] = 50162)] = 'VoiceMessagesCannotBeEdited';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotDeleteGuildSubscriptionIntegration'] = 50163)] = 'CannotDeleteGuildSubscriptionIntegration';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotSendVoiceEffectWhenUserIsServerMutedDeafenedOrSuppressed'] = 50167)] =
			'CannotSendVoiceEffectWhenUserIsServerMutedDeafenedOrSuppressed';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['YouCannotSendVoiceMessagesInThisChannel'] = 50173)] = 'YouCannotSendVoiceMessagesInThisChannel';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['TheUserAccountMustFirstBeVerified'] = 50178)] = 'TheUserAccountMustFirstBeVerified';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ProvidedFileDoesNotHaveAValidDuration'] = 50192)] = 'ProvidedFileDoesNotHaveAValidDuration';
		/**
		 * @see {@link RESTJSONErrorCodes.CannotSendMessagesToThisUser} for a similar error code
		 */
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotSendMessagesToThisUserDueToHavingNoMutualGuilds'] = 50278)] =
			'CannotSendMessagesToThisUserDueToHavingNoMutualGuilds';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['YouDoNotHavePermissionToSendThisSticker'] = 50600)] = 'YouDoNotHavePermissionToSendThisSticker';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['TwoFactorAuthenticationIsRequired'] = 60003)] = 'TwoFactorAuthenticationIsRequired';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['NoUsersWithDiscordTagExist'] = 80004)] = 'NoUsersWithDiscordTagExist';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ReactionWasBlocked'] = 90001)] = 'ReactionWasBlocked';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UserCannotUseBurstReactions'] = 90002)] = 'UserCannotUseBurstReactions';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['IndexNotYetAvailable'] = 11e4)] = 'IndexNotYetAvailable';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ApplicationNotYetAvailable'] = 110001)] = 'ApplicationNotYetAvailable';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['APIResourceOverloaded'] = 13e4)] = 'APIResourceOverloaded';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['TheStageIsAlreadyOpen'] = 150006)] = 'TheStageIsAlreadyOpen';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotReplyWithoutPermissionToReadMessageHistory'] = 160002)] =
			'CannotReplyWithoutPermissionToReadMessageHistory';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ThreadAlreadyCreatedForMessage'] = 160004)] = 'ThreadAlreadyCreatedForMessage';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ThreadLocked'] = 160005)] = 'ThreadLocked';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumActiveThreads'] = 160006)] = 'MaximumActiveThreads';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MaximumActiveAnnouncementThreads'] = 160007)] = 'MaximumActiveAnnouncementThreads';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotForwardMessageWithUnreadableContent'] = 160014)] = 'CannotForwardMessageWithUnreadableContent';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InvalidJSONForUploadedLottieFile'] = 170001)] = 'InvalidJSONForUploadedLottieFile';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['UploadedLottiesCannotContainRasterizedImages'] = 170002)] =
			'UploadedLottiesCannotContainRasterizedImages';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['StickerMaximumFramerateExceeded'] = 170003)] = 'StickerMaximumFramerateExceeded';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['StickerFrameCountExceedsMaximumOf1000Frames'] = 170004)] =
			'StickerFrameCountExceedsMaximumOf1000Frames';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['LottieAnimationMaximumDimensionsExceeded'] = 170005)] = 'LottieAnimationMaximumDimensionsExceeded';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['StickerFramerateIsTooSmallOrTooLarge'] = 170006)] = 'StickerFramerateIsTooSmallOrTooLarge';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['StickerAnimationDurationExceedsMaximumOf5Seconds'] = 170007)] =
			'StickerAnimationDurationExceedsMaximumOf5Seconds';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotUpdateAFinishedEvent'] = 18e4)] = 'CannotUpdateAFinishedEvent';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['FailedToCreateStageNeededForStageEvent'] = 180002)] = 'FailedToCreateStageNeededForStageEvent';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MessageWasBlockedByAutomaticModeration'] = 2e5)] = 'MessageWasBlockedByAutomaticModeration';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['TitleWasBlockedByAutomaticModeration'] = 200001)] = 'TitleWasBlockedByAutomaticModeration';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['WebhooksPostedToForumChannelsMustHaveAThreadNameOrThreadId'] = 220001)] =
			'WebhooksPostedToForumChannelsMustHaveAThreadNameOrThreadId';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['WebhooksPostedToForumChannelsCannotHaveBothAThreadNameAndThreadId'] = 220002)] =
			'WebhooksPostedToForumChannelsCannotHaveBothAThreadNameAndThreadId';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['WebhooksCanOnlyCreateThreadsInForumChannels'] = 220003)] =
			'WebhooksCanOnlyCreateThreadsInForumChannels';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['WebhookServicesCannotBeUsedInForumChannels'] = 220004)] =
			'WebhookServicesCannotBeUsedInForumChannels';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['MessageBlockedByHarmfulLinksFilter'] = 24e4)] = 'MessageBlockedByHarmfulLinksFilter';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['AccessToJoiningNewServersHasBeenLimitedForTheUser'] = 340015)] =
			'AccessToJoiningNewServersHasBeenLimitedForTheUser';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotEnableOnboardingRequirementsAreNotMet'] = 35e4)] =
			'CannotEnableOnboardingRequirementsAreNotMet';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotUpdateOnboardingWhileBelowRequirements'] = 350001)] =
			'CannotUpdateOnboardingWhileBelowRequirements';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['AccessToFileUploadsHasBeenLimitedForThisGuild'] = 400001)] =
			'AccessToFileUploadsHasBeenLimitedForThisGuild';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['FailedToBanUsers'] = 5e5)] = 'FailedToBanUsers';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['PollVotingBlocked'] = 52e4)] = 'PollVotingBlocked';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['PollExpired'] = 520001)] = 'PollExpired';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InvalidChannelTypeForPollCreation'] = 520002)] = 'InvalidChannelTypeForPollCreation';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotEditAPollMessage'] = 520003)] = 'CannotEditAPollMessage';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotUseAnEmojiIncludedWithThePoll'] = 520004)] = 'CannotUseAnEmojiIncludedWithThePoll';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['CannotExpireANonPollMessage'] = 520006)] = 'CannotExpireANonPollMessage';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['ProvisionalAccountsPermissionNotGranted'] = 53e4)] = 'ProvisionalAccountsPermissionNotGranted';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['IdTokenJWTExpired'] = 530001)] = 'IdTokenJWTExpired';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['IdTokenJWTIssuerMismatch'] = 530002)] = 'IdTokenJWTIssuerMismatch';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['IdTokenJWTAudienceMismatch'] = 530003)] = 'IdTokenJWTAudienceMismatch';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['IdTokenJWTIssuedTooLongAgo'] = 530004)] = 'IdTokenJWTIssuedTooLongAgo';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['FailedToGenerateUniqueUsername'] = 530006)] = 'FailedToGenerateUniqueUsername';
		RESTJSONErrorCodes[(RESTJSONErrorCodes['InvalidClientSecret'] = 530007)] = 'InvalidClientSecret';
	})(RESTJSONErrorCodes || (exports.RESTJSONErrorCodes = RESTJSONErrorCodes = {}));
	/**
	 * JSON Error Codes that represent "Cannot send messages to this user".
	 * Discord uses two different error codes for this error:
	 * - {@link RESTJSONErrorCodes.CannotSendMessagesToThisUser} (50_007)
	 * - {@link RESTJSONErrorCodes.CannotSendMessagesToThisUserDueToHavingNoMutualGuilds} (50_278)
	 */
	exports.CannotSendMessagesToThisUserErrorCodes = [
		RESTJSONErrorCodes.CannotSendMessagesToThisUser,
		RESTJSONErrorCodes.CannotSendMessagesToThisUserDueToHavingNoMutualGuilds
	];
	/**
	 * @see {@link https://discord.com/developers/docs/reference#locales}
	 */
	var Locale;
	(function (Locale) {
		Locale['Indonesian'] = 'id';
		Locale['EnglishUS'] = 'en-US';
		Locale['EnglishGB'] = 'en-GB';
		Locale['Bulgarian'] = 'bg';
		Locale['ChineseCN'] = 'zh-CN';
		Locale['ChineseTW'] = 'zh-TW';
		Locale['Croatian'] = 'hr';
		Locale['Czech'] = 'cs';
		Locale['Danish'] = 'da';
		Locale['Dutch'] = 'nl';
		Locale['Finnish'] = 'fi';
		Locale['French'] = 'fr';
		Locale['German'] = 'de';
		Locale['Greek'] = 'el';
		Locale['Hindi'] = 'hi';
		Locale['Hungarian'] = 'hu';
		Locale['Italian'] = 'it';
		Locale['Japanese'] = 'ja';
		Locale['Korean'] = 'ko';
		Locale['Lithuanian'] = 'lt';
		Locale['Norwegian'] = 'no';
		Locale['Polish'] = 'pl';
		Locale['PortugueseBR'] = 'pt-BR';
		Locale['Romanian'] = 'ro';
		Locale['Russian'] = 'ru';
		Locale['SpanishES'] = 'es-ES';
		Locale['SpanishLATAM'] = 'es-419';
		Locale['Swedish'] = 'sv-SE';
		Locale['Thai'] = 'th';
		Locale['Turkish'] = 'tr';
		Locale['Ukrainian'] = 'uk';
		Locale['Vietnamese'] = 'vi';
	})(Locale || (exports.Locale = Locale = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/rest/v10/channel.js
var require_channel = /* @__PURE__ */ __commonJSMin((exports) => {
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.ReactionType = void 0;
	/**
	 * @see {@link https://discord.com/developers/docs/resources/channel#get-reactions-reaction-types}
	 */
	var ReactionType;
	(function (ReactionType) {
		ReactionType[(ReactionType['Normal'] = 0)] = 'Normal';
		ReactionType[(ReactionType['Burst'] = 1)] = 'Burst';
		/**
		 * @deprecated Use {@link ReactionType.Burst} instead
		 */
		ReactionType[(ReactionType['Super'] = 1)] = 'Super';
	})(ReactionType || (exports.ReactionType = ReactionType = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/rest/v10/invite.js
var require_invite = /* @__PURE__ */ __commonJSMin((exports) => {
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.InviteTargetUsersJobStatus = void 0;
	/**
	 * @see {@link https://docs.discord.com/developers/resources/invite#get-target-users-job-status}
	 */
	var InviteTargetUsersJobStatus;
	(function (InviteTargetUsersJobStatus) {
		/**
		 * The default value.
		 */
		InviteTargetUsersJobStatus[(InviteTargetUsersJobStatus['Unspecified'] = 0)] = 'Unspecified';
		/**
		 * The job is still being processed.
		 */
		InviteTargetUsersJobStatus[(InviteTargetUsersJobStatus['Processing'] = 1)] = 'Processing';
		/**
		 * The job has been completed successfully.
		 */
		InviteTargetUsersJobStatus[(InviteTargetUsersJobStatus['Completed'] = 2)] = 'Completed';
		/**
		 * The job has failed; see `error_message` field for more details.
		 */
		InviteTargetUsersJobStatus[(InviteTargetUsersJobStatus['Failed'] = 3)] = 'Failed';
	})(InviteTargetUsersJobStatus || (exports.InviteTargetUsersJobStatus = InviteTargetUsersJobStatus = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/rest/v10/monetization.js
var require_monetization = /* @__PURE__ */ __commonJSMin((exports) => {
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.EntitlementOwnerType = void 0;
	/**
	 * @see {@link https://discord.com/developers/docs/resources/entitlement#create-test-entitlement}
	 */
	var EntitlementOwnerType;
	(function (EntitlementOwnerType) {
		EntitlementOwnerType[(EntitlementOwnerType['Guild'] = 1)] = 'Guild';
		EntitlementOwnerType[(EntitlementOwnerType['User'] = 2)] = 'User';
	})(EntitlementOwnerType || (exports.EntitlementOwnerType = EntitlementOwnerType = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/rest/v10/index.js
var require_v10$3 = /* @__PURE__ */ __commonJSMin((exports) => {
	var __createBinding =
		(exports && exports.__createBinding) ||
		(Object.create
			? function (o, m, k, k2) {
					if (k2 === void 0) k2 = k;
					var desc = Object.getOwnPropertyDescriptor(m, k);
					if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable))
						desc = {
							enumerable: true,
							get: function () {
								return m[k];
							}
						};
					Object.defineProperty(o, k2, desc);
				}
			: function (o, m, k, k2) {
					if (k2 === void 0) k2 = k;
					o[k2] = m[k];
				});
	var __exportStar =
		(exports && exports.__exportStar) ||
		function (m, exports$3) {
			for (var p in m) if (p !== 'default' && !Object.prototype.hasOwnProperty.call(exports$3, p)) __createBinding(exports$3, m, p);
		};
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.OAuth2Routes =
		exports.RouteBases =
		exports.CDNRoutes =
		exports.ImageFormat =
		exports.StickerPackApplicationId =
		exports.Routes =
		exports.APIVersion =
			void 0;
	var internals_1 = require_internals();
	__exportStar(require_common$1(), exports);
	__exportStar(require_channel(), exports);
	__exportStar(require_invite(), exports);
	__exportStar(require_monetization(), exports);
	exports.APIVersion = '10';
	exports.Routes = {
		/**
		 * Route for:
		 * - GET `/applications/{application.id}/role-connections/metadata`
		 * - PUT `/applications/{application.id}/role-connections/metadata`
		 */
		applicationRoleConnectionMetadata(applicationId) {
			return `/applications/${applicationId}/role-connections/metadata`;
		},
		/**
		 * Route for:
		 * - GET  `/guilds/{guild.id}/auto-moderation/rules`
		 * - POST `/guilds/{guild.id}/auto-moderation/rules`
		 */
		guildAutoModerationRules(guildId) {
			return `/guilds/${guildId}/auto-moderation/rules`;
		},
		/**
		 * Routes for:
		 * - GET    `/guilds/{guild.id}/auto-moderation/rules/{rule.id}`
		 * - PATCH  `/guilds/{guild.id}/auto-moderation/rules/{rule.id}`
		 * - DELETE `/guilds/{guild.id}/auto-moderation/rules/{rule.id}`
		 */
		guildAutoModerationRule(guildId, ruleId) {
			return `/guilds/${guildId}/auto-moderation/rules/${ruleId}`;
		},
		/**
		 * Route for:
		 * - GET `/guilds/{guild.id}/audit-logs`
		 */
		guildAuditLog(guildId) {
			return `/guilds/${guildId}/audit-logs`;
		},
		/**
		 * Route for:
		 * - GET    `/channels/{channel.id}`
		 * - PATCH  `/channels/{channel.id}`
		 * - DELETE `/channels/{channel.id}`
		 */
		channel(channelId) {
			return `/channels/${channelId}`;
		},
		/**
		 * Route for:
		 * - GET  `/channels/{channel.id}/messages`
		 * - POST `/channels/{channel.id}/messages`
		 */
		channelMessages(channelId) {
			return `/channels/${channelId}/messages`;
		},
		/**
		 * Route for:
		 * - GET    `/channels/{channel.id}/messages/{message.id}`
		 * - PATCH  `/channels/{channel.id}/messages/{message.id}`
		 * - DELETE `/channels/{channel.id}/messages/{message.id}`
		 */
		channelMessage(channelId, messageId) {
			return `/channels/${channelId}/messages/${messageId}`;
		},
		/**
		 * Route for:
		 * - POST `/channels/{channel.id}/messages/{message.id}/crosspost`
		 */
		channelMessageCrosspost(channelId, messageId) {
			return `/channels/${channelId}/messages/${messageId}/crosspost`;
		},
		/**
		 * Route for:
		 * - PUT    `/channels/{channel.id}/messages/{message.id}/reactions/{emoji}/@me`
		 * - DELETE `/channels/{channel.id}/messages/{message.id}/reactions/{emoji}/@me`
		 *
		 * **Note**: You need to URL encode the emoji yourself
		 */
		channelMessageOwnReaction(channelId, messageId, emoji) {
			return `/channels/${channelId}/messages/${messageId}/reactions/${emoji}/@me`;
		},
		/**
		 * Route for:
		 * - DELETE `/channels/{channel.id}/messages/{message.id}/reactions/{emoji}/{user.id}`
		 *
		 * **Note**: You need to URL encode the emoji yourself
		 */
		channelMessageUserReaction(channelId, messageId, emoji, userId) {
			return `/channels/${channelId}/messages/${messageId}/reactions/${emoji}/${userId}`;
		},
		/**
		 * Route for:
		 * - GET    `/channels/{channel.id}/messages/{message.id}/reactions/{emoji}`
		 * - DELETE `/channels/{channel.id}/messages/{message.id}/reactions/{emoji}`
		 *
		 * **Note**: You need to URL encode the emoji yourself
		 */
		channelMessageReaction(channelId, messageId, emoji) {
			return `/channels/${channelId}/messages/${messageId}/reactions/${emoji}`;
		},
		/**
		 * Route for:
		 * - DELETE `/channels/{channel.id}/messages/{message.id}/reactions`
		 */
		channelMessageAllReactions(channelId, messageId) {
			return `/channels/${channelId}/messages/${messageId}/reactions`;
		},
		/**
		 * Route for:
		 * - POST `/channels/{channel.id}/messages/bulk-delete`
		 */
		channelBulkDelete(channelId) {
			return `/channels/${channelId}/messages/bulk-delete`;
		},
		/**
		 * Route for:
		 * - PUT    `/channels/{channel.id}/permissions/{overwrite.id}`
		 * - DELETE `/channels/{channel.id}/permissions/{overwrite.id}`
		 */
		channelPermission(channelId, overwriteId) {
			return `/channels/${channelId}/permissions/${overwriteId}`;
		},
		/**
		 * Route for:
		 * - GET  `/channels/{channel.id}/invites`
		 * - POST `/channels/{channel.id}/invites`
		 */
		channelInvites(channelId) {
			return `/channels/${channelId}/invites`;
		},
		/**
		 * Route for:
		 * - POST `/channels/{channel.id}/followers`
		 */
		channelFollowers(channelId) {
			return `/channels/${channelId}/followers`;
		},
		/**
		 * Route for:
		 * - POST `/channels/{channel.id}/typing`
		 */
		channelTyping(channelId) {
			return `/channels/${channelId}/typing`;
		},
		/**
		 * Route for:
		 * - GET `/channels/{channel.id}/messages/pins`
		 */
		channelMessagesPins(channelId) {
			return `/channels/${channelId}/messages/pins`;
		},
		/**
		 * Route for:
		 * - PUT    `/channels/{channel.id}/messages/pins/{message.id}`
		 * - DELETE `/channels/{channel.id}/messages/pins/{message.id}`
		 */
		channelMessagesPin(channelId, messageId) {
			return `/channels/${channelId}/messages/pins/${messageId}`;
		},
		/**
		 * Route for:
		 * - GET `/channels/{channel.id}/pins`
		 *
		 * @deprecated Use {@link Routes.channelMessagesPins} instead.
		 */
		channelPins(channelId) {
			return `/channels/${channelId}/pins`;
		},
		/**
		 * Route for:
		 * - PUT    `/channels/{channel.id}/pins/{message.id}`
		 * - DELETE `/channels/{channel.id}/pins/{message.id}`
		 *
		 * @deprecated Use {@link Routes.channelMessagesPin} instead.
		 */
		channelPin(channelId, messageId) {
			return `/channels/${channelId}/pins/${messageId}`;
		},
		/**
		 * Route for:
		 * - PUT    `/channels/{channel.id}/recipients/{user.id}`
		 * - DELETE `/channels/{channel.id}/recipients/{user.id}`
		 */
		channelRecipient(channelId, userId) {
			return `/channels/${channelId}/recipients/${userId}`;
		},
		/**
		 * Route for:
		 * - PUT `/channels/{channel.id}/voice-status`
		 */
		channelVoiceStatus(channelId) {
			return `/channels/${channelId}/voice-status`;
		},
		/**
		 * Route for:
		 * - GET  `/guilds/{guild.id}/emojis`
		 * - POST `/guilds/{guild.id}/emojis`
		 */
		guildEmojis(guildId) {
			return `/guilds/${guildId}/emojis`;
		},
		/**
		 * Route for:
		 * - GET    `/guilds/{guild.id}/emojis/{emoji.id}`
		 * - PATCH  `/guilds/{guild.id}/emojis/{emoji.id}`
		 * - DELETE `/guilds/{guild.id}/emojis/{emoji.id}`
		 */
		guildEmoji(guildId, emojiId) {
			return `/guilds/${guildId}/emojis/${emojiId}`;
		},
		/**
		 * Route for:
		 * - POST `/guilds`
		 *
		 * @deprecated {@link https://discord.com/developers/docs/change-log#guild-create-deprecation}
		 */
		guilds() {
			return '/guilds';
		},
		/**
		 * Route for:
		 * - GET    `/guilds/{guild.id}`
		 * - PATCH  `/guilds/{guild.id}`
		 * - DELETE `/guilds/{guild.id}` (**deprecated**)
		 */
		guild(guildId) {
			return `/guilds/${guildId}`;
		},
		/**
		 * Route for:
		 * - GET `/guilds/{guild.id}/preview`
		 */
		guildPreview(guildId) {
			return `/guilds/${guildId}/preview`;
		},
		/**
		 * Route for:
		 * - GET   `/guilds/{guild.id}/channels`
		 * - POST  `/guilds/{guild.id}/channels`
		 * - PATCH `/guilds/{guild.id}/channels`
		 */
		guildChannels(guildId) {
			return `/guilds/${guildId}/channels`;
		},
		/**
		 * Route for:
		 * - GET    `/guilds/{guild.id}/members/{user.id}`
		 * - PUT    `/guilds/{guild.id}/members/{user.id}`
		 * - PATCH  `/guilds/{guild.id}/members/@me`
		 * - PATCH  `/guilds/{guild.id}/members/{user.id}`
		 * - DELETE `/guilds/{guild.id}/members/{user.id}`
		 */
		guildMember(guildId, userId = '@me') {
			return `/guilds/${guildId}/members/${userId}`;
		},
		/**
		 * Route for:
		 * - GET `/guilds/{guild.id}/members`
		 */
		guildMembers(guildId) {
			return `/guilds/${guildId}/members`;
		},
		/**
		 * Route for:
		 * - GET `/guilds/{guild.id}/members/search`
		 */
		guildMembersSearch(guildId) {
			return `/guilds/${guildId}/members/search`;
		},
		/**
		 * Route for:
		 * - GET `/guilds/{guild.id}/messages/search`
		 */
		guildMessagesSearch(guildId) {
			return `/guilds/${guildId}/messages/search`;
		},
		/**
		 * Route for:
		 * - PATCH `/guilds/{guild.id}/members/@me/nick`
		 *
		 * @deprecated Use {@link Routes.guildMember} instead.
		 */
		guildCurrentMemberNickname(guildId) {
			return `/guilds/${guildId}/members/@me/nick`;
		},
		/**
		 * Route for:
		 * - PUT    `/guilds/{guild.id}/members/{user.id}/roles/{role.id}`
		 * - DELETE `/guilds/{guild.id}/members/{user.id}/roles/{role.id}`
		 */
		guildMemberRole(guildId, memberId, roleId) {
			return `/guilds/${guildId}/members/${memberId}/roles/${roleId}`;
		},
		/**
		 * Route for:
		 * - POST `/guilds/{guild.id}/mfa`
		 *
		 * @deprecated
		 */
		guildMFA(guildId) {
			return `/guilds/${guildId}/mfa`;
		},
		/**
		 * Route for:
		 * - GET `/guilds/{guild.id}/bans`
		 */
		guildBans(guildId) {
			return `/guilds/${guildId}/bans`;
		},
		/**
		 * Route for:
		 * - GET    `/guilds/{guild.id}/bans/{user.id}`
		 * - PUT    `/guilds/{guild.id}/bans/{user.id}`
		 * - DELETE `/guilds/{guild.id}/bans/{user.id}`
		 */
		guildBan(guildId, userId) {
			return `/guilds/${guildId}/bans/${userId}`;
		},
		/**
		 * Route for:
		 * - GET   `/guilds/{guild.id}/roles`
		 * - POST  `/guilds/{guild.id}/roles`
		 * - PATCH `/guilds/{guild.id}/roles`
		 */
		guildRoles(guildId) {
			return `/guilds/${guildId}/roles`;
		},
		/**
		 * Route for:
		 * - GET    `/guilds/{guild.id}/roles/{role.id}`
		 * - PATCH  `/guilds/{guild.id}/roles/{role.id}`
		 * - DELETE `/guilds/{guild.id}/roles/{role.id}`
		 */
		guildRole(guildId, roleId) {
			return `/guilds/${guildId}/roles/${roleId}`;
		},
		/**
		 * Route for:
		 * - GET `/guilds/{guild.id}/roles/member-counts`
		 */
		guildRoleMemberCounts(guildId) {
			return `/guilds/${guildId}/roles/member-counts`;
		},
		/**
		 * Route for:
		 * - GET  `/guilds/{guild.id}/prune`
		 * - POST `/guilds/{guild.id}/prune`
		 */
		guildPrune(guildId) {
			return `/guilds/${guildId}/prune`;
		},
		/**
		 * Route for:
		 * - GET `/guilds/{guild.id}/regions`
		 */
		guildVoiceRegions(guildId) {
			return `/guilds/${guildId}/regions`;
		},
		/**
		 * Route for:
		 * - GET `/guilds/{guild.id}/invites`
		 */
		guildInvites(guildId) {
			return `/guilds/${guildId}/invites`;
		},
		/**
		 * Route for:
		 * - GET  `/guilds/{guild.id}/integrations`
		 */
		guildIntegrations(guildId) {
			return `/guilds/${guildId}/integrations`;
		},
		/**
		 * Route for:
		 * - DELETE `/guilds/{guild.id}/integrations/{integration.id}`
		 */
		guildIntegration(guildId, integrationId) {
			return `/guilds/${guildId}/integrations/${integrationId}`;
		},
		/**
		 * Route for:
		 * - GET   `/guilds/{guild.id}/widget`
		 * - PATCH `/guilds/{guild.id}/widget`
		 */
		guildWidgetSettings(guildId) {
			return `/guilds/${guildId}/widget`;
		},
		/**
		 * Route for:
		 * - GET `/guilds/{guild.id}/widget.json`
		 */
		guildWidgetJSON(guildId) {
			return `/guilds/${guildId}/widget.json`;
		},
		/**
		 * Route for:
		 * - GET `/guilds/{guild.id}/vanity-url`
		 */
		guildVanityUrl(guildId) {
			return `/guilds/${guildId}/vanity-url`;
		},
		/**
		 * Route for:
		 * - GET `/guilds/{guild.id}/widget.png`
		 */
		guildWidgetImage(guildId) {
			return `/guilds/${guildId}/widget.png`;
		},
		/**
		 * Route for:
		 * - GET    `/invites/{invite.code}`
		 * - DELETE `/invites/{invite.code}`
		 */
		invite(code) {
			return `/invites/${code}`;
		},
		/**
		 * Route for:
		 * - GET `/invites/{invite.code}/target-users`
		 * - PUT `/invites/{invite.code}/target-users`
		 */
		inviteTargetUsers(code) {
			return `/invites/${code}/target-users`;
		},
		/**
		 * Route for:
		 * - GET `/invites/{invite.code}/target-users/job-status`
		 */
		inviteTargetUsersJobStatus(code) {
			return `/invites/${code}/target-users/job-status`;
		},
		/**
		 * Route for:
		 * - GET  `/guilds/templates/{template.code}`
		 * - POST `/guilds/templates/{template.code}` (**deprecated**)
		 */
		template(code) {
			return `/guilds/templates/${code}`;
		},
		/**
		 * Route for:
		 * - GET  `/guilds/{guild.id}/templates`
		 * - POST `/guilds/{guild.id}/templates`
		 */
		guildTemplates(guildId) {
			return `/guilds/${guildId}/templates`;
		},
		/**
		 * Route for:
		 * - PUT    `/guilds/{guild.id}/templates/{template.code}`
		 * - PATCH  `/guilds/{guild.id}/templates/{template.code}`
		 * - DELETE `/guilds/{guild.id}/templates/{template.code}`
		 */
		guildTemplate(guildId, code) {
			return `/guilds/${guildId}/templates/${code}`;
		},
		/**
		 * Route for:
		 * - GET `/channels/{channel.id}/polls/{message.id}/answers/{answer_id}`
		 */
		pollAnswerVoters(channelId, messageId, answerId) {
			return `/channels/${channelId}/polls/${messageId}/answers/${answerId}`;
		},
		/**
		 * Route for:
		 * - POST `/channels/{channel.id}/polls/{message.id}/expire`
		 */
		expirePoll(channelId, messageId) {
			return `/channels/${channelId}/polls/${messageId}/expire`;
		},
		/**
		 * Route for:
		 * - POST `/channels/{channel.id}/threads`
		 * - POST `/channels/{channel.id}/messages/{message.id}/threads`
		 */
		threads(parentId, messageId) {
			const parts = ['', 'channels', parentId];
			if (messageId) parts.push('messages', messageId);
			parts.push('threads');
			return parts.join('/');
		},
		/**
		 * Route for:
		 * - GET `/guilds/{guild.id}/threads/active`
		 */
		guildActiveThreads(guildId) {
			return `/guilds/${guildId}/threads/active`;
		},
		/**
		 * Route for:
		 * - GET `/channels/{channel.id}/threads/archived/public`
		 * - GET `/channels/{channel.id}/threads/archived/private`
		 */
		channelThreads(channelId, archivedStatus) {
			return `/channels/${channelId}/threads/archived/${archivedStatus}`;
		},
		/**
		 * Route for:
		 * - GET `/channels/{channel.id}/users/@me/threads/archived/private`
		 */
		channelJoinedArchivedThreads(channelId) {
			return `/channels/${channelId}/users/@me/threads/archived/private`;
		},
		/**
		 * Route for:
		 * - GET    `/channels/{thread.id}/thread-members`
		 * - GET    `/channels/{thread.id}/thread-members/{user.id}`
		 * - PUT    `/channels/{thread.id}/thread-members/@me`
		 * - PUT    `/channels/{thread.id}/thread-members/{user.id}`
		 * - DELETE `/channels/{thread.id}/thread-members/@me`
		 * - DELETE `/channels/{thread.id}/thread-members/{user.id}`
		 */
		threadMembers(threadId, userId) {
			const parts = ['', 'channels', threadId, 'thread-members'];
			if (userId) parts.push(userId);
			return parts.join('/');
		},
		/**
		 * Route for:
		 * - GET   `/users/@me`
		 * - GET   `/users/{user.id}`
		 * - PATCH `/users/@me`
		 *
		 * @param userId - The user ID, defaulted to `@me`
		 */
		user(userId = '@me') {
			return `/users/${userId}`;
		},
		/**
		 * Route for:
		 * - GET    `/users/@me/applications/{application.id}/role-connection`
		 * - PUT    `/users/@me/applications/{application.id}/role-connection`
		 * - DELETE `/users/@me/applications/{application.id}/role-connection`
		 */
		userApplicationRoleConnection(applicationId) {
			return `/users/@me/applications/${applicationId}/role-connection`;
		},
		/**
		 * Route for:
		 * - GET `/users/@me/guilds`
		 */
		userGuilds() {
			return `/users/@me/guilds`;
		},
		/**
		 * Route for:
		 * - GET `/users/@me/guilds/{guild.id}/member`
		 */
		userGuildMember(guildId) {
			return `/users/@me/guilds/${guildId}/member`;
		},
		/**
		 * Route for:
		 * - DELETE `/users/@me/guilds/{guild.id}`
		 */
		userGuild(guildId) {
			return `/users/@me/guilds/${guildId}`;
		},
		/**
		 * Route for:
		 * - POST `/users/@me/channels`
		 */
		userChannels() {
			return `/users/@me/channels`;
		},
		/**
		 * Route for:
		 * - GET `/users/@me/connections`
		 */
		userConnections() {
			return `/users/@me/connections`;
		},
		/**
		 * Route for:
		 * - GET `/voice/regions`
		 */
		voiceRegions() {
			return `/voice/regions`;
		},
		/**
		 * Route for:
		 * - GET  `/channels/{channel.id}/webhooks`
		 * - POST `/channels/{channel.id}/webhooks`
		 */
		channelWebhooks(channelId) {
			return `/channels/${channelId}/webhooks`;
		},
		/**
		 * Route for:
		 * - GET `/guilds/{guild.id}/webhooks`
		 */
		guildWebhooks(guildId) {
			return `/guilds/${guildId}/webhooks`;
		},
		/**
		 * Route for:
		 * - GET    `/webhooks/{webhook.id}`
		 * - GET    `/webhooks/{webhook.id}/{webhook.token}`
		 * - PATCH  `/webhooks/{webhook.id}`
		 * - PATCH  `/webhooks/{webhook.id}/{webhook.token}`
		 * - DELETE `/webhooks/{webhook.id}`
		 * - DELETE `/webhooks/{webhook.id}/{webhook.token}`
		 * - POST   `/webhooks/{webhook.id}/{webhook.token}`
		 *
		 * - POST   `/webhooks/{application.id}/{interaction.token}`
		 */
		webhook(webhookId, webhookToken) {
			const parts = ['', 'webhooks', webhookId];
			if (webhookToken) parts.push(webhookToken);
			return parts.join('/');
		},
		/**
		 * Route for:
		 * - GET    `/webhooks/{webhook.id}/{webhook.token}/messages/@original`
		 * - GET    `/webhooks/{webhook.id}/{webhook.token}/messages/{message.id}`
		 * - PATCH  `/webhooks/{webhook.id}/{webhook.token}/messages/@original`
		 * - PATCH  `/webhooks/{webhook.id}/{webhook.token}/messages/{message.id}`
		 * - DELETE `/webhooks/{webhook.id}/{webhook.token}/messages/@original`
		 * - DELETE `/webhooks/{webhook.id}/{webhook.token}/messages/{message.id}`
		 *
		 * - PATCH  `/webhooks/{application.id}/{interaction.token}/messages/@original`
		 * - PATCH  `/webhooks/{application.id}/{interaction.token}/messages/{message.id}`
		 * - DELETE `/webhooks/{application.id}/{interaction.token}/messages/{message.id}`
		 */
		webhookMessage(webhookId, webhookToken, messageId = '@original') {
			return `/webhooks/${webhookId}/${webhookToken}/messages/${messageId}`;
		},
		/**
		 * Route for:
		 * - POST `/webhooks/{webhook.id}/{webhook.token}/github`
		 * - POST `/webhooks/{webhook.id}/{webhook.token}/slack`
		 */
		webhookPlatform(webhookId, webhookToken, platform) {
			return `/webhooks/${webhookId}/${webhookToken}/${platform}`;
		},
		/**
		 * Route for:
		 * - GET `/gateway`
		 */
		gateway() {
			return `/gateway`;
		},
		/**
		 * Route for:
		 * - GET `/gateway/bot`
		 */
		gatewayBot() {
			return `/gateway/bot`;
		},
		/**
		 * Route for:
		 * - GET `/oauth2/applications/@me`
		 */
		oauth2CurrentApplication() {
			return `/oauth2/applications/@me`;
		},
		/**
		 * Route for:
		 * - GET `/oauth2/@me`
		 */
		oauth2CurrentAuthorization() {
			return `/oauth2/@me`;
		},
		/**
		 * Route for:
		 * - GET `/oauth2/authorize`
		 */
		oauth2Authorization() {
			return `/oauth2/authorize`;
		},
		/**
		 * Route for:
		 * - POST `/oauth2/token`
		 */
		oauth2TokenExchange() {
			return `/oauth2/token`;
		},
		/**
		 * Route for:
		 * - POST `/oauth2/token/revoke`
		 */
		oauth2TokenRevocation() {
			return `/oauth2/token/revoke`;
		},
		/**
		 * Route for:
		 * - GET  `/applications/{application.id}/commands`
		 * - PUT  `/applications/{application.id}/commands`
		 * - POST `/applications/{application.id}/commands`
		 */
		applicationCommands(applicationId) {
			return `/applications/${applicationId}/commands`;
		},
		/**
		 * Route for:
		 * - GET    `/applications/{application.id}/commands/{command.id}`
		 * - PATCH  `/applications/{application.id}/commands/{command.id}`
		 * - DELETE `/applications/{application.id}/commands/{command.id}`
		 */
		applicationCommand(applicationId, commandId) {
			return `/applications/${applicationId}/commands/${commandId}`;
		},
		/**
		 * Route for:
		 * - GET  `/applications/{application.id}/guilds/{guild.id}/commands`
		 * - PUT  `/applications/{application.id}/guilds/{guild.id}/commands`
		 * - POST `/applications/{application.id}/guilds/{guild.id}/commands`
		 */
		applicationGuildCommands(applicationId, guildId) {
			return `/applications/${applicationId}/guilds/${guildId}/commands`;
		},
		/**
		 * Route for:
		 * - GET    `/applications/{application.id}/guilds/{guild.id}/commands/{command.id}`
		 * - PATCH  `/applications/{application.id}/guilds/{guild.id}/commands/{command.id}`
		 * - DELETE `/applications/{application.id}/guilds/{guild.id}/commands/{command.id}`
		 */
		applicationGuildCommand(applicationId, guildId, commandId) {
			return `/applications/${applicationId}/guilds/${guildId}/commands/${commandId}`;
		},
		/**
		 * Route for:
		 * - POST `/interactions/{interaction.id}/{interaction.token}/callback`
		 */
		interactionCallback(interactionId, interactionToken) {
			return `/interactions/${interactionId}/${interactionToken}/callback`;
		},
		/**
		 * Route for:
		 * - GET   `/guilds/{guild.id}/member-verification`
		 * - PATCH `/guilds/{guild.id}/member-verification`
		 *
		 * @unstable https://github.com/discord/discord-api-docs/pull/2547
		 */
		guildMemberVerification(guildId) {
			return `/guilds/${guildId}/member-verification`;
		},
		/**
		 * Route for:
		 * - GET `/guilds/{guild.id}/voice-states/@me`
		 * - GET `/guilds/{guild.id}/voice-states/{user.id}`
		 * - PATCH `/guilds/{guild.id}/voice-states/@me`
		 * - PATCH `/guilds/{guild.id}/voice-states/{user.id}`
		 */
		guildVoiceState(guildId, userId = '@me') {
			return `/guilds/${guildId}/voice-states/${userId}`;
		},
		/**
		 * Route for:
		 * - GET `/applications/{application.id}/guilds/{guild.id}/commands/permissions`
		 * - PUT `/applications/{application.id}/guilds/{guild.id}/commands/permissions`
		 */
		guildApplicationCommandsPermissions(applicationId, guildId) {
			return `/applications/${applicationId}/guilds/${guildId}/commands/permissions`;
		},
		/**
		 * Route for:
		 * - GET `/applications/{application.id}/guilds/{guild.id}/commands/{command.id}/permissions`
		 * - PUT `/applications/{application.id}/guilds/{guild.id}/commands/{command.id}/permissions`
		 */
		applicationCommandPermissions(applicationId, guildId, commandId) {
			return `/applications/${applicationId}/guilds/${guildId}/commands/${commandId}/permissions`;
		},
		/**
		 * Route for:
		 * - GET   `/guilds/{guild.id}/welcome-screen`
		 * - PATCH `/guilds/{guild.id}/welcome-screen`
		 */
		guildWelcomeScreen(guildId) {
			return `/guilds/${guildId}/welcome-screen`;
		},
		/**
		 * Route for:
		 * - POST `/stage-instances`
		 */
		stageInstances() {
			return `/stage-instances`;
		},
		/**
		 * Route for:
		 * - GET `/stage-instances/{channel.id}`
		 * - PATCH `/stage-instances/{channel.id}`
		 * - DELETE `/stage-instances/{channel.id}`
		 */
		stageInstance(channelId) {
			return `/stage-instances/${channelId}`;
		},
		/**
		 * Route for:
		 * - GET `/stickers/{sticker.id}`
		 */
		sticker(stickerId) {
			return `/stickers/${stickerId}`;
		},
		/**
		 * Route for:
		 * - GET `/sticker-packs`
		 */
		stickerPacks() {
			return '/sticker-packs';
		},
		/**
		 * Route for:
		 * - GET `/sticker-packs/{pack.id}`
		 */
		stickerPack(packId) {
			return `/sticker-packs/${packId}`;
		},
		/**
		 * Route for:
		 * - GET `/sticker-packs`
		 *
		 * @deprecated Use {@link Routes.stickerPacks} instead.
		 */
		nitroStickerPacks() {
			return '/sticker-packs';
		},
		/**
		 * Route for:
		 * - GET  `/guilds/{guild.id}/stickers`
		 * - POST `/guilds/{guild.id}/stickers`
		 */
		guildStickers(guildId) {
			return `/guilds/${guildId}/stickers`;
		},
		/**
		 * Route for:
		 * - GET    `/guilds/{guild.id}/stickers/{sticker.id}`
		 * - PATCH  `/guilds/{guild.id}/stickers/{sticker.id}`
		 * - DELETE `/guilds/{guild.id}/stickers/{sticker.id}`
		 */
		guildSticker(guildId, stickerId) {
			return `/guilds/${guildId}/stickers/${stickerId}`;
		},
		/**
		 * Route for:
		 * - GET  `/guilds/{guild.id}/scheduled-events`
		 * - POST `/guilds/{guild.id}/scheduled-events`
		 */
		guildScheduledEvents(guildId) {
			return `/guilds/${guildId}/scheduled-events`;
		},
		/**
		 * Route for:
		 * - GET  `/guilds/{guild.id}/scheduled-events/{guildScheduledEvent.id}`
		 * - PATCH `/guilds/{guild.id}/scheduled-events/{guildScheduledEvent.id}`
		 * - DELETE `/guilds/{guild.id}/scheduled-events/{guildScheduledEvent.id}`
		 */
		guildScheduledEvent(guildId, guildScheduledEventId) {
			return `/guilds/${guildId}/scheduled-events/${guildScheduledEventId}`;
		},
		/**
		 * Route for:
		 * - GET `/guilds/{guild.id}/scheduled-events/{guildScheduledEvent.id}/users`
		 */
		guildScheduledEventUsers(guildId, guildScheduledEventId) {
			return `/guilds/${guildId}/scheduled-events/${guildScheduledEventId}/users`;
		},
		/**
		 * Route for:
		 * - GET `/guilds/{guild.id}/onboarding`
		 * - PUT `/guilds/{guild.id}/onboarding`
		 */
		guildOnboarding(guildId) {
			return `/guilds/${guildId}/onboarding`;
		},
		/**
		 * Route for:
		 * - PUT `/guilds/${guild.id}/incident-actions`
		 */
		guildIncidentActions(guildId) {
			return `/guilds/${guildId}/incident-actions`;
		},
		/**
		 * Route for:
		 * - GET `/applications/@me`
		 * - PATCH `/applications/@me`
		 */
		currentApplication() {
			return '/applications/@me';
		},
		/**
		 * Route for:
		 * - GET `/applications/{application.id}/activity-instances/{instance_id}`
		 */
		applicationActivityInstance(applicationId, instanceId) {
			return `/applications/${applicationId}/activity-instances/${instanceId}`;
		},
		/**
		 * Route for:
		 * - GET `/applications/{application.id}/entitlements`
		 * - POST `/applications/{application.id}/entitlements`
		 */
		entitlements(applicationId) {
			return `/applications/${applicationId}/entitlements`;
		},
		/**
		 * Route for:
		 * - GET `/applications/{application.id}/entitlements/{entitlement.id}`
		 * - DELETE `/applications/{application.id}/entitlements/{entitlement.id}`
		 */
		entitlement(applicationId, entitlementId) {
			return `/applications/${applicationId}/entitlements/${entitlementId}`;
		},
		/**
		 * Route for:
		 * - GET `/applications/{application.id}/skus`
		 */
		skus(applicationId) {
			return `/applications/${applicationId}/skus`;
		},
		/**
		 * Route for:
		 * - POST `/guilds/{guild.id}/bulk-ban`
		 */
		guildBulkBan(guildId) {
			return `/guilds/${guildId}/bulk-ban`;
		},
		/**
		 * Route for:
		 * - POST `/applications/{application.id}/entitlements/{entitlement.id}/consume`
		 */
		consumeEntitlement(applicationId, entitlementId) {
			return `/applications/${applicationId}/entitlements/${entitlementId}/consume`;
		},
		/**
		 * Route for:
		 * - GET `/applications/{application.id}/emojis`
		 * - POST `/applications/{application.id}/emojis`
		 */
		applicationEmojis(applicationId) {
			return `/applications/${applicationId}/emojis`;
		},
		/**
		 * Route for:
		 * - GET `/applications/{application.id}/emojis/{emoji.id}`
		 * - PATCH `/applications/{application.id}/emojis/{emoji.id}`
		 * - DELETE `/applications/{application.id}/emojis/{emoji.id}`
		 */
		applicationEmoji(applicationId, emojiId) {
			return `/applications/${applicationId}/emojis/${emojiId}`;
		},
		/**
		 * Route for:
		 * - GET `/skus/{sku.id}/subscriptions`
		 */
		skuSubscriptions(skuId) {
			return `/skus/${skuId}/subscriptions`;
		},
		/**
		 * Route for:
		 * - GET `/skus/{sku.id}/subscriptions/{subscription.id}`
		 */
		skuSubscription(skuId, subscriptionId) {
			return `/skus/${skuId}/subscriptions/${subscriptionId}`;
		},
		/**
		 * Route for:
		 * - POST `/channels/{channel.id}/send-soundboard-sound`
		 */
		sendSoundboardSound(channelId) {
			return `/channels/${channelId}/send-soundboard-sound`;
		},
		/**
		 * Route for:
		 * - GET `/soundboard-default-sounds`
		 */
		soundboardDefaultSounds() {
			return '/soundboard-default-sounds';
		},
		/**
		 * Route for:
		 * - GET `/guilds/{guild.id}/soundboard-sounds`
		 * - POST `/guilds/{guild.id}/soundboard-sounds`
		 */
		guildSoundboardSounds(guildId) {
			return `/guilds/${guildId}/soundboard-sounds`;
		},
		/**
		 * Route for:
		 * - GET `/guilds/{guild.id}/soundboard-sounds/{sound.id}`
		 * - PATCH `/guilds/{guild.id}/soundboard-sounds/{sound.id}`
		 * - DELETE `/guilds/{guild.id}/soundboard-sounds/{sound.id}`
		 */
		guildSoundboardSound(guildId, soundId) {
			return `/guilds/${guildId}/soundboard-sounds/${soundId}`;
		}
	};
	for (const [key, fn] of Object.entries(exports.Routes))
		exports.Routes[key] = (...args) => {
			const escaped = args.map((arg) => {
				if (arg) {
					if (internals_1.urlSafeCharacters.test(String(arg))) return arg;
					return encodeURIComponent(arg);
				}
				return arg;
			});
			return fn.call(null, ...escaped);
		};
	Object.freeze(exports.Routes);
	exports.StickerPackApplicationId = '710982414301790216';
	var ImageFormat;
	(function (ImageFormat) {
		ImageFormat['JPEG'] = 'jpeg';
		ImageFormat['PNG'] = 'png';
		ImageFormat['WebP'] = 'webp';
		ImageFormat['GIF'] = 'gif';
		ImageFormat['Lottie'] = 'json';
	})(ImageFormat || (exports.ImageFormat = ImageFormat = {}));
	exports.CDNRoutes = {
		/**
		 * Route for:
		 * - GET `/emojis/{emoji.id}.{png|jpeg|webp|gif}`
		 *
		 * As this route supports GIFs, the hash will begin with `a_` if it is available in GIF format
		 *
		 * This route supports the extensions: PNG, JPEG, WebP, GIF
		 */
		emoji(emojiId, format) {
			return `/emojis/${emojiId}.${format}`;
		},
		/**
		 * Route for:
		 * - GET `/icons/{guild.id}/{guild.icon}.{png|jpeg|webp|gif}`
		 *
		 * As this route supports GIFs, the hash will begin with `a_` if it is available in GIF format
		 *
		 * This route supports the extensions: PNG, JPEG, WebP, GIF
		 */
		guildIcon(guildId, guildIcon, format) {
			return `/icons/${guildId}/${guildIcon}.${format}`;
		},
		/**
		 * Route for:
		 * - GET `/splashes/{guild.id}/{guild.splash}.{png|jpeg|webp}`
		 *
		 * This route supports the extensions: PNG, JPEG, WebP
		 */
		guildSplash(guildId, guildSplash, format) {
			return `/splashes/${guildId}/${guildSplash}.${format}`;
		},
		/**
		 * Route for:
		 * - GET `/discovery-splashes/{guild.id}/{guild.discovery_splash}.{png|jpeg|webp}`
		 *
		 * This route supports the extensions: PNG, JPEG, WebP
		 */
		guildDiscoverySplash(guildId, guildDiscoverySplash, format) {
			return `/discovery-splashes/${guildId}/${guildDiscoverySplash}.${format}`;
		},
		/**
		 * Route for:
		 * - GET `/banners/{guild.id}/{guild.banner}.{png|jpeg|webp|gif}`
		 *
		 * As this route supports GIFs, the hash will begin with `a_` if it is available in GIF format
		 *
		 * This route supports the extensions: PNG, JPEG, WebP, GIF
		 */
		guildBanner(guildId, guildBanner, format) {
			return `/banners/${guildId}/${guildBanner}.${format}`;
		},
		/**
		 * Route for:
		 * - GET `/banners/{user.id}/{user.banner}.{png|jpeg|webp|gif}`
		 *
		 * As this route supports GIFs, the hash will begin with `a_` if it is available in GIF format
		 *
		 * This route supports the extensions: PNG, JPEG, WebP, GIF
		 */
		userBanner(userId, userBanner, format) {
			return `/banners/${userId}/${userBanner}.${format}`;
		},
		/**
		 * Route for:
		 * - GET `/embed/avatars/{index}.png`
		 *
		 * The value for `index` parameter depends on whether the user is {@link https://discord.com/developers/docs/change-log#unique-usernames-on-discord | migrated to the new username system}.
		 * For users on the new username system, `index` will be `(user.id >> 22) % 6`.
		 * For users on the legacy username system, `index` will be `user.discriminator % 5`.
		 *
		 * This route supports the extension: PNG
		 */
		defaultUserAvatar(index) {
			return `/embed/avatars/${index}.png`;
		},
		/**
		 * Route for:
		 * - GET `/avatars/{user.id}/{user.avatar}.{png|jpeg|webp|gif}`
		 *
		 * As this route supports GIFs, the hash will begin with `a_` if it is available in GIF format
		 *
		 * This route supports the extensions: PNG, JPEG, WebP, GIF
		 */
		userAvatar(userId, userAvatar, format) {
			return `/avatars/${userId}/${userAvatar}.${format}`;
		},
		/**
		 * Route for:
		 * - GET `/guilds/{guild.id}/users/{user.id}/avatars/{guild_member.avatar}.{png|jpeg|webp|gif}`
		 *
		 * As this route supports GIFs, the hash will begin with `a_` if it is available in GIF format
		 *
		 * This route supports the extensions: PNG, JPEG, WebP, GIF
		 */
		guildMemberAvatar(guildId, userId, memberAvatar, format) {
			return `/guilds/${guildId}/users/${userId}/avatars/${memberAvatar}.${format}`;
		},
		/**
		 * Route for:
		 * - GET `/avatar-decorations/{user.id}/{user.avatar_decoration}.png`
		 *
		 * This route supports the extension: PNG
		 *
		 * @deprecated Use {@link CDNRoutes.avatarDecoration} instead.
		 */
		userAvatarDecoration(userId, userAvatarDecoration) {
			return `/avatar-decorations/${userId}/${userAvatarDecoration}.png`;
		},
		/**
		 * Route for:
		 * - GET `/avatar-decoration-presets/{avatar_decoration_data_asset}.png`
		 *
		 * This route supports the extension: PNG
		 */
		avatarDecoration(avatarDecorationDataAsset) {
			return `/avatar-decoration-presets/${avatarDecorationDataAsset}.png`;
		},
		/**
		 * Route for:
		 * - GET `/app-icons/{application.id}/{application.icon}.{png|jpeg|webp}`
		 *
		 * This route supports the extensions: PNG, JPEG, WebP
		 */
		applicationIcon(applicationId, applicationIcon, format) {
			return `/app-icons/${applicationId}/${applicationIcon}.${format}`;
		},
		/**
		 * Route for:
		 * - GET `/app-icons/{application.id}/{application.cover_image}.{png|jpeg|webp}`
		 *
		 * This route supports the extensions: PNG, JPEG, WebP
		 */
		applicationCover(applicationId, applicationCoverImage, format) {
			return `/app-icons/${applicationId}/${applicationCoverImage}.${format}`;
		},
		/**
		 * Route for:
		 * - GET `/app-assets/{application.id}/{application.asset_id}.{png|jpeg|webp}`
		 *
		 * This route supports the extensions: PNG, JPEG, WebP
		 */
		applicationAsset(applicationId, applicationAssetId, format) {
			return `/app-assets/${applicationId}/${applicationAssetId}.${format}`;
		},
		/**
		 * Route for:
		 * - GET `/app-assets/{application.id}/achievements/{achievement.id}/icons/{achievement.icon}.{png|jpeg|webp}`
		 *
		 * This route supports the extensions: PNG, JPEG, WebP
		 */
		achievementIcon(applicationId, achievementId, achievementIconHash, format) {
			return `/app-assets/${applicationId}/achievements/${achievementId}/icons/${achievementIconHash}.${format}`;
		},
		/**
		 * Route for:
		 * - GET `/app-assets/710982414301790216/store/{sticker_pack.banner.asset_id}.{png|jpeg|webp}`
		 *
		 * This route supports the extensions: PNG, JPEG, WebP
		 */
		stickerPackBanner(stickerPackBannerAssetId, format) {
			return `/app-assets/${exports.StickerPackApplicationId}/store/${stickerPackBannerAssetId}.${format}`;
		},
		/**
		 * Route for:
		 * - GET `/app-assets/${application.id}/store/${asset.id}.{png|jpeg|webp}}`
		 *
		 * This route supports the extensions: PNG, JPEG, WebP
		 */
		storePageAsset(applicationId, assetId, format = ImageFormat.PNG) {
			return `/app-assets/${applicationId}/store/${assetId}.${format}`;
		},
		/**
		 * Route for:
		 * - GET `/team-icons/{team.id}/{team.icon}.{png|jpeg|webp}`
		 *
		 * This route supports the extensions: PNG, JPEG, WebP
		 */
		teamIcon(teamId, teamIcon, format) {
			return `/team-icons/${teamId}/${teamIcon}.${format}`;
		},
		/**
		 * Route for:
		 * - GET `/stickers/{sticker.id}.{png|json}`
		 *
		 * This route supports the extensions: PNG, Lottie, GIF
		 */
		sticker(stickerId, format) {
			return `/stickers/${stickerId}.${format}`;
		},
		/**
		 * Route for:
		 * - GET `/role-icons/{role.id}/{role.icon}.{png|jpeg|webp}`
		 *
		 * This route supports the extensions: PNG, JPEG, WebP
		 */
		roleIcon(roleId, roleIcon, format) {
			return `/role-icons/${roleId}/${roleIcon}.${format}`;
		},
		/**
		 * Route for:
		 * - GET `/guild-events/{guild_scheduled_event.id}/{guild_scheduled_event.image}.{png|jpeg|webp}`
		 *
		 * This route supports the extensions: PNG, JPEG, WebP
		 */
		guildScheduledEventCover(guildScheduledEventId, guildScheduledEventCoverImage, format) {
			return `/guild-events/${guildScheduledEventId}/${guildScheduledEventCoverImage}.${format}`;
		},
		/**
		 * Route for:
		 * - GET `/guilds/${guild.id}/users/${user.id}/banners/${guild_member.banner}.{png|jpeg|webp|gif}`
		 *
		 * This route supports the extensions: PNG, JPEG, WebP, GIF
		 */
		guildMemberBanner(guildId, userId, guildMemberBanner, format) {
			return `/guilds/${guildId}/users/${userId}/banners/${guildMemberBanner}.${format}`;
		},
		/**
		 * Route for:
		 * - GET `/soundboard-sounds/${sound.id}`
		 */
		soundboardSound(soundId) {
			return `/soundboard-sounds/${soundId}`;
		},
		/**
		 * Route for:
		 * - GET `/guild-tag-badges/{guild.id}/{badge}.{png|jpeg|webp}`
		 *
		 * This route supports the extensions: PNG, JPEG, WebP
		 */
		guildTagBadge(guildId, guildTagBadge, format) {
			return `/guild-tag-badges/${guildId}/${guildTagBadge}.${format}`;
		}
	};
	for (const [key, fn] of Object.entries(exports.CDNRoutes))
		exports.CDNRoutes[key] = (...args) => {
			const escaped = args.map((arg) => {
				if (arg) {
					if (internals_1.urlSafeCharacters.test(String(arg))) return arg;
					return encodeURIComponent(arg);
				}
				return arg;
			});
			return fn.call(null, ...escaped);
		};
	Object.freeze(exports.CDNRoutes);
	exports.RouteBases = {
		api: `https://discord.com/api/v${exports.APIVersion}`,
		cdn: 'https://cdn.discordapp.com',
		media: 'https://media.discordapp.net',
		invite: 'https://discord.gg',
		template: 'https://discord.new',
		gift: 'https://discord.gift',
		scheduledEvent: 'https://discord.com/events'
	};
	Object.freeze(exports.RouteBases);
	exports.OAuth2Routes = {
		authorizationURL: `${exports.RouteBases.api}${exports.Routes.oauth2Authorization()}`,
		tokenURL: `${exports.RouteBases.api}${exports.Routes.oauth2TokenExchange()}`,
		/**
		 * @see {@link https://tools.ietf.org/html/rfc7009}
		 */
		tokenRevocationURL: `${exports.RouteBases.api}${exports.Routes.oauth2TokenRevocation()}`
	};
	Object.freeze(exports.OAuth2Routes);
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/rest/v10/index.mjs
var v10_exports$2 = /* @__PURE__ */ __exportAll({
	APIVersion: () => APIVersion$1,
	CDNRoutes: () => CDNRoutes$1,
	CannotSendMessagesToThisUserErrorCodes: () => CannotSendMessagesToThisUserErrorCodes$1,
	EntitlementOwnerType: () => EntitlementOwnerType$1,
	ImageFormat: () => ImageFormat$1,
	InviteTargetUsersJobStatus: () => InviteTargetUsersJobStatus$1,
	Locale: () => Locale$1,
	OAuth2Routes: () => OAuth2Routes$1,
	RESTJSONErrorCodes: () => RESTJSONErrorCodes$1,
	ReactionType: () => ReactionType$1,
	RouteBases: () => RouteBases$1,
	Routes: () => Routes$1,
	StickerPackApplicationId: () => StickerPackApplicationId$1,
	default: () => v10_default$2
});
var import_v10$3,
	v10_default$2,
	APIVersion$1,
	CDNRoutes$1,
	CannotSendMessagesToThisUserErrorCodes$1,
	EntitlementOwnerType$1,
	ImageFormat$1,
	InviteTargetUsersJobStatus$1,
	Locale$1,
	OAuth2Routes$1,
	RESTJSONErrorCodes$1,
	ReactionType$1,
	RouteBases$1,
	Routes$1,
	StickerPackApplicationId$1;
var init_v10$2 = __esmMin(() => {
	import_v10$3 = /* @__PURE__ */ __toESM(require_v10$3(), 1);
	v10_default$2 = import_v10$3.default;
	APIVersion$1 = import_v10$3.default.APIVersion;
	CDNRoutes$1 = import_v10$3.default.CDNRoutes;
	CannotSendMessagesToThisUserErrorCodes$1 = import_v10$3.default.CannotSendMessagesToThisUserErrorCodes;
	EntitlementOwnerType$1 = import_v10$3.default.EntitlementOwnerType;
	ImageFormat$1 = import_v10$3.default.ImageFormat;
	InviteTargetUsersJobStatus$1 = import_v10$3.default.InviteTargetUsersJobStatus;
	Locale$1 = import_v10$3.default.Locale;
	OAuth2Routes$1 = import_v10$3.default.OAuth2Routes;
	RESTJSONErrorCodes$1 = import_v10$3.default.RESTJSONErrorCodes;
	ReactionType$1 = import_v10$3.default.ReactionType;
	RouteBases$1 = import_v10$3.default.RouteBases;
	Routes$1 = import_v10$3.default.Routes;
	StickerPackApplicationId$1 = import_v10$3.default.StickerPackApplicationId;
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/rpc/common.js
var require_common = /* @__PURE__ */ __commonJSMin((exports) => {
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.RPCCloseEventCodes =
		exports.RPCErrorCodes =
		exports.RelationshipType =
		exports.VoiceConnectionStates =
		exports.RPCVoiceShortcutKeyComboKeyType =
		exports.RPCVoiceSettingsModeType =
		exports.RPCDeviceType =
			void 0;
	var RPCDeviceType;
	(function (RPCDeviceType) {
		RPCDeviceType['AudioInput'] = 'audioinput';
		RPCDeviceType['AudioOutput'] = 'audiooutput';
		RPCDeviceType['VideoInput'] = 'videoinput';
	})(RPCDeviceType || (exports.RPCDeviceType = RPCDeviceType = {}));
	var RPCVoiceSettingsModeType;
	(function (RPCVoiceSettingsModeType) {
		RPCVoiceSettingsModeType['PushToTalk'] = 'PUSH_TO_TALK';
		RPCVoiceSettingsModeType['VoiceActivity'] = 'VOICE_ACTIVITY';
	})(RPCVoiceSettingsModeType || (exports.RPCVoiceSettingsModeType = RPCVoiceSettingsModeType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/topics/rpc#getvoicesettings-key-types}
	 */
	var RPCVoiceShortcutKeyComboKeyType;
	(function (RPCVoiceShortcutKeyComboKeyType) {
		RPCVoiceShortcutKeyComboKeyType[(RPCVoiceShortcutKeyComboKeyType['KeyboardKey'] = 0)] = 'KeyboardKey';
		RPCVoiceShortcutKeyComboKeyType[(RPCVoiceShortcutKeyComboKeyType['MouseButton'] = 1)] = 'MouseButton';
		RPCVoiceShortcutKeyComboKeyType[(RPCVoiceShortcutKeyComboKeyType['KeyboardModifierKey'] = 2)] = 'KeyboardModifierKey';
		RPCVoiceShortcutKeyComboKeyType[(RPCVoiceShortcutKeyComboKeyType['GamepadButton'] = 3)] = 'GamepadButton';
	})(RPCVoiceShortcutKeyComboKeyType || (exports.RPCVoiceShortcutKeyComboKeyType = RPCVoiceShortcutKeyComboKeyType = {}));
	var VoiceConnectionStates;
	(function (VoiceConnectionStates) {
		/**
		 * TCP disconnected
		 */
		VoiceConnectionStates['Disconnected'] = 'DISCONNECTED';
		/**
		 * Waiting for voice endpoint
		 */
		VoiceConnectionStates['AwaitingEndpoint'] = 'AWAITING_ENDPOINT';
		/**
		 * TCP authenticating
		 */
		VoiceConnectionStates['Authenticating'] = 'AUTHENTICATING';
		/**
		 * TCP connecting
		 */
		VoiceConnectionStates['Connecting'] = 'CONNECTING';
		/**
		 * TCP connected
		 */
		VoiceConnectionStates['Connected'] = 'CONNECTED';
		/**
		 * TCP connected, Voice disconnected
		 */
		VoiceConnectionStates['VoiceDisconnected'] = 'VOICE_DISCONNECTED';
		/**
		 * TCP connected, Voice connecting
		 */
		VoiceConnectionStates['VoiceConnecting'] = 'VOICE_CONNECTING';
		/**
		 * TCP connected, Voice connected
		 */
		VoiceConnectionStates['VoiceConnected'] = 'VOICE_CONNECTED';
		/**
		 * No route to host
		 */
		VoiceConnectionStates['NoRoute'] = 'NO_ROUTE';
		/**
		 * WebRTC ice checking
		 */
		VoiceConnectionStates['IceChecking'] = 'ICE_CHECKING';
	})(VoiceConnectionStates || (exports.VoiceConnectionStates = VoiceConnectionStates = {}));
	/**
	 * @unstable
	 */
	var RelationshipType;
	(function (RelationshipType) {
		RelationshipType[(RelationshipType['None'] = 0)] = 'None';
		RelationshipType[(RelationshipType['Friend'] = 1)] = 'Friend';
		RelationshipType[(RelationshipType['Blocked'] = 2)] = 'Blocked';
		RelationshipType[(RelationshipType['PendingIncoming'] = 3)] = 'PendingIncoming';
		RelationshipType[(RelationshipType['PendingOutgoing'] = 4)] = 'PendingOutgoing';
		RelationshipType[(RelationshipType['Implicit'] = 5)] = 'Implicit';
	})(RelationshipType || (exports.RelationshipType = RelationshipType = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/topics/opcodes-and-status-codes#rpc-rpc-error-codes}
	 */
	var RPCErrorCodes;
	(function (RPCErrorCodes) {
		/**
		 * An unknown error occurred.
		 */
		RPCErrorCodes[(RPCErrorCodes['UnknownError'] = 1e3)] = 'UnknownError';
		/**
		 * @unstable
		 */
		RPCErrorCodes[(RPCErrorCodes['ServiceUnavailable'] = 1001)] = 'ServiceUnavailable';
		/**
		 * @unstable
		 */
		RPCErrorCodes[(RPCErrorCodes['TransactionAborted'] = 1002)] = 'TransactionAborted';
		/**
		 * You sent an invalid payload.
		 */
		RPCErrorCodes[(RPCErrorCodes['InvalidPayload'] = 4e3)] = 'InvalidPayload';
		/**
		 * Invalid command name specified.
		 */
		RPCErrorCodes[(RPCErrorCodes['InvalidCommand'] = 4002)] = 'InvalidCommand';
		/**
		 * Invalid guild ID specified.
		 */
		RPCErrorCodes[(RPCErrorCodes['InvalidGuild'] = 4003)] = 'InvalidGuild';
		/**
		 * Invalid event name specified.
		 */
		RPCErrorCodes[(RPCErrorCodes['InvalidEvent'] = 4004)] = 'InvalidEvent';
		/**
		 * Invalid channel ID specified.
		 */
		RPCErrorCodes[(RPCErrorCodes['InvalidChannel'] = 4005)] = 'InvalidChannel';
		/**
		 * You lack permissions to access the given resource.
		 */
		RPCErrorCodes[(RPCErrorCodes['InvalidPermissions'] = 4006)] = 'InvalidPermissions';
		/**
		 * An invalid OAuth2 application ID was used to authorize or authenticate with.
		 */
		RPCErrorCodes[(RPCErrorCodes['InvalidClientId'] = 4007)] = 'InvalidClientId';
		/**
		 * An invalid OAuth2 application origin was used to authorize or authenticate with.
		 */
		RPCErrorCodes[(RPCErrorCodes['InvalidOrigin'] = 4008)] = 'InvalidOrigin';
		/**
		 * An invalid OAuth2 token was used to authorize or authenticate with.
		 */
		RPCErrorCodes[(RPCErrorCodes['InvalidToken'] = 4009)] = 'InvalidToken';
		/**
		 * The specified user ID was invalid.
		 */
		RPCErrorCodes[(RPCErrorCodes['InvalidUser'] = 4010)] = 'InvalidUser';
		/**
		 * @unstable
		 */
		RPCErrorCodes[(RPCErrorCodes['InvalidInvite'] = 4011)] = 'InvalidInvite';
		/**
		 * @unstable
		 */
		RPCErrorCodes[(RPCErrorCodes['InvalidActivityJoinRequest'] = 4012)] = 'InvalidActivityJoinRequest';
		/**
		 * @unstable
		 */
		RPCErrorCodes[(RPCErrorCodes['InvalidEntitlement'] = 4013)] = 'InvalidEntitlement';
		/**
		 * @unstable
		 */
		RPCErrorCodes[(RPCErrorCodes['InvalidGiftCode'] = 4014)] = 'InvalidGiftCode';
		/**
		 * A standard OAuth2 error occurred; check the data object for the OAuth2 error details.
		 */
		RPCErrorCodes[(RPCErrorCodes['OAuth2Error'] = 5e3)] = 'OAuth2Error';
		/**
		 * An asynchronous `SELECT_TEXT_CHANNEL`/`SELECT_VOICE_CHANNEL` command timed out.
		 */
		RPCErrorCodes[(RPCErrorCodes['SelectChannelTimedOut'] = 5001)] = 'SelectChannelTimedOut';
		/**
		 * An asynchronous `GET_GUILD` command timed out.
		 */
		RPCErrorCodes[(RPCErrorCodes['GetGuildTimedOut'] = 5002)] = 'GetGuildTimedOut';
		/**
		 * You tried to join a user to a voice channel but the user was already in one.
		 */
		RPCErrorCodes[(RPCErrorCodes['SelectVoiceForceRequired'] = 5003)] = 'SelectVoiceForceRequired';
		/**
		 * You tried to capture more than one shortcut key at once.
		 */
		RPCErrorCodes[(RPCErrorCodes['CaptureShortcutAlreadyListening'] = 5004)] = 'CaptureShortcutAlreadyListening';
		/**
		 * @unstable
		 */
		RPCErrorCodes[(RPCErrorCodes['InvalidActivitySecret'] = 5005)] = 'InvalidActivitySecret';
		/**
		 * @unstable
		 */
		RPCErrorCodes[(RPCErrorCodes['NoEligibleActivity'] = 5006)] = 'NoEligibleActivity';
		/**
		 * @unstable
		 */
		RPCErrorCodes[(RPCErrorCodes['PurchaseCanceled'] = 5007)] = 'PurchaseCanceled';
		/**
		 * @unstable
		 */
		RPCErrorCodes[(RPCErrorCodes['PurchaseError'] = 5008)] = 'PurchaseError';
		/**
		 * @unstable
		 */
		RPCErrorCodes[(RPCErrorCodes['UnauthorizedForAchievement'] = 5009)] = 'UnauthorizedForAchievement';
		/**
		 * @unstable
		 */
		RPCErrorCodes[(RPCErrorCodes['RateLimited'] = 5010)] = 'RateLimited';
	})(RPCErrorCodes || (exports.RPCErrorCodes = RPCErrorCodes = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/topics/opcodes-and-status-codes#rpc-rpc-close-event-codes}
	 */
	var RPCCloseEventCodes;
	(function (RPCCloseEventCodes) {
		/**
		 * @unstable
		 */
		RPCCloseEventCodes[(RPCCloseEventCodes['CloseNormal'] = 1e3)] = 'CloseNormal';
		/**
		 * @unstable
		 */
		RPCCloseEventCodes[(RPCCloseEventCodes['CloseUnsupported'] = 1003)] = 'CloseUnsupported';
		/**
		 * @unstable
		 */
		RPCCloseEventCodes[(RPCCloseEventCodes['CloseAbnormal'] = 1006)] = 'CloseAbnormal';
		/**
		 * You connected to the RPC server with an invalid client ID.
		 */
		RPCCloseEventCodes[(RPCCloseEventCodes['InvalidClientId'] = 4e3)] = 'InvalidClientId';
		/**
		 * You connected to the RPC server with an invalid origin.
		 */
		RPCCloseEventCodes[(RPCCloseEventCodes['InvalidOrigin'] = 4001)] = 'InvalidOrigin';
		/**
		 * You are being rate limited.
		 */
		RPCCloseEventCodes[(RPCCloseEventCodes['RateLimited'] = 4002)] = 'RateLimited';
		/**
		 * The OAuth2 token associated with a connection was revoked, get a new one!
		 */
		RPCCloseEventCodes[(RPCCloseEventCodes['TokenRevoked'] = 4003)] = 'TokenRevoked';
		/**
		 * The RPC Server version specified in the connection string was not valid.
		 */
		RPCCloseEventCodes[(RPCCloseEventCodes['InvalidVersion'] = 4004)] = 'InvalidVersion';
		/**
		 * The encoding specified in the connection string was not valid.
		 */
		RPCCloseEventCodes[(RPCCloseEventCodes['InvalidEncoding'] = 4005)] = 'InvalidEncoding';
	})(RPCCloseEventCodes || (exports.RPCCloseEventCodes = RPCCloseEventCodes = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/rpc/v10.js
var require_v10$2 = /* @__PURE__ */ __commonJSMin((exports) => {
	var __createBinding =
		(exports && exports.__createBinding) ||
		(Object.create
			? function (o, m, k, k2) {
					if (k2 === void 0) k2 = k;
					var desc = Object.getOwnPropertyDescriptor(m, k);
					if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable))
						desc = {
							enumerable: true,
							get: function () {
								return m[k];
							}
						};
					Object.defineProperty(o, k2, desc);
				}
			: function (o, m, k, k2) {
					if (k2 === void 0) k2 = k;
					o[k2] = m[k];
				});
	var __exportStar =
		(exports && exports.__exportStar) ||
		function (m, exports$2) {
			for (var p in m) if (p !== 'default' && !Object.prototype.hasOwnProperty.call(exports$2, p)) __createBinding(exports$2, m, p);
		};
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.RPCEvents = exports.RPCCommands = exports.RPCVersion = void 0;
	__exportStar(require_common(), exports);
	exports.RPCVersion = '1';
	/**
	 * @see {@link https://discord.com/developers/docs/topics/rpc#commands-and-events-rpc-commands}
	 */
	var RPCCommands;
	(function (RPCCommands) {
		/**
		 * @unstable
		 */
		RPCCommands['AcceptActivityInvite'] = 'ACCEPT_ACTIVITY_INVITE';
		/**
		 * @unstable
		 */
		RPCCommands['ActivityInviteUser'] = 'ACTIVITY_INVITE_USER';
		/**
		 * Used to authenticate an existing client with your app
		 */
		RPCCommands['Authenticate'] = 'AUTHENTICATE';
		/**
		 * Used to authorize a new client with your app
		 */
		RPCCommands['Authorize'] = 'AUTHORIZE';
		/**
		 * @unstable
		 */
		RPCCommands['BraintreePopupBridgeCallback'] = 'BRAINTREE_POPUP_BRIDGE_CALLBACK';
		/**
		 * @unstable
		 */
		RPCCommands['BrowserHandoff'] = 'BROWSER_HANDOFF';
		/**
		 * 	used to reject a Rich Presence Ask to Join request
		 *
		 * @unstable the documented similarly named command `CLOSE_ACTIVITY_REQUEST` does not exist, but `CLOSE_ACTIVITY_JOIN_REQUEST` does
		 */
		RPCCommands['CloseActivityJoinRequest'] = 'CLOSE_ACTIVITY_JOIN_REQUEST';
		/**
		 * @unstable
		 */
		RPCCommands['ConnectionsCallback'] = 'CONNECTIONS_CALLBACK';
		RPCCommands['CreateChannelInvite'] = 'CREATE_CHANNEL_INVITE';
		/**
		 * @unstable
		 */
		RPCCommands['DeepLink'] = 'DEEP_LINK';
		/**
		 * Event dispatch
		 */
		RPCCommands['Dispatch'] = 'DISPATCH';
		/**
		 * @unstable
		 */
		RPCCommands['GetApplicationTicket'] = 'GET_APPLICATION_TICKET';
		/**
		 * Used to retrieve channel information from the client
		 */
		RPCCommands['GetChannel'] = 'GET_CHANNEL';
		/**
		 * Used to retrieve a list of channels for a guild from the client
		 */
		RPCCommands['GetChannels'] = 'GET_CHANNELS';
		/**
		 * @unstable
		 */
		RPCCommands['GetEntitlementTicket'] = 'GET_ENTITLEMENT_TICKET';
		/**
		 * @unstable
		 */
		RPCCommands['GetEntitlements'] = 'GET_ENTITLEMENTS';
		/**
		 * Used to retrieve guild information from the client
		 */
		RPCCommands['GetGuild'] = 'GET_GUILD';
		/**
		 * Used to retrieve a list of guilds from the client
		 */
		RPCCommands['GetGuilds'] = 'GET_GUILDS';
		/**
		 * @unstable
		 */
		RPCCommands['GetImage'] = 'GET_IMAGE';
		/**
		 * @unstable
		 */
		RPCCommands['GetNetworkingConfig'] = 'GET_NETWORKING_CONFIG';
		/**
		 * @unstable
		 */
		RPCCommands['GetRelationships'] = 'GET_RELATIONSHIPS';
		/**
		 * Used to get the current voice channel the client is in
		 */
		RPCCommands['GetSelectedVoiceChannel'] = 'GET_SELECTED_VOICE_CHANNEL';
		/**
		 * @unstable
		 */
		RPCCommands['GetSkus'] = 'GET_SKUS';
		/**
		 * @unstable
		 */
		RPCCommands['GetUser'] = 'GET_USER';
		/**
		 * Used to retrieve the client's voice settings
		 */
		RPCCommands['GetVoiceSettings'] = 'GET_VOICE_SETTINGS';
		/**
		 * @unstable
		 */
		RPCCommands['GiftCodeBrowser'] = 'GIFT_CODE_BROWSER';
		/**
		 * @unstable
		 */
		RPCCommands['GuildTemplateBrowser'] = 'GUILD_TEMPLATE_BROWSER';
		/**
		 * @unstable
		 */
		RPCCommands['InviteBrowser'] = 'INVITE_BROWSER';
		/**
		 * @unstable
		 */
		RPCCommands['NetworkingCreateToken'] = 'NETWORKING_CREATE_TOKEN';
		/**
		 * @unstable
		 */
		RPCCommands['NetworkingPeerMetrics'] = 'NETWORKING_PEER_METRICS';
		/**
		 * @unstable
		 */
		RPCCommands['NetworkingSystemMetrics'] = 'NETWORKING_SYSTEM_METRICS';
		/**
		 * @unstable
		 */
		RPCCommands['OpenOverlayActivityInvite'] = 'OPEN_OVERLAY_ACTIVITY_INVITE';
		/**
		 * @unstable
		 */
		RPCCommands['OpenOverlayGuildInvite'] = 'OPEN_OVERLAY_GUILD_INVITE';
		/**
		 * @unstable
		 */
		RPCCommands['OpenOverlayVoiceSettings'] = 'OPEN_OVERLAY_VOICE_SETTINGS';
		/**
		 * @unstable
		 */
		RPCCommands['Overlay'] = 'OVERLAY';
		/**
		 * Used to join or leave a text channel, group dm, or dm
		 */
		RPCCommands['SelectTextChannel'] = 'SELECT_TEXT_CHANNEL';
		/**
		 * Used to join or leave a voice channel, group dm, or dm
		 */
		RPCCommands['SelectVoiceChannel'] = 'SELECT_VOICE_CHANNEL';
		/**
		 * Used to consent to a Rich Presence Ask to Join request
		 */
		RPCCommands['SendActivityJoinInvite'] = 'SEND_ACTIVITY_JOIN_INVITE';
		/**
		 * Used to update a user's Rich Presence
		 */
		RPCCommands['SetActivity'] = 'SET_ACTIVITY';
		/**
		 * Used to send info about certified hardware devices
		 */
		RPCCommands['SetCertifiedDevices'] = 'SET_CERTIFIED_DEVICES';
		/**
		 * @unstable
		 */
		RPCCommands['SetOverlayLocked'] = 'SET_OVERLAY_LOCKED';
		/**
		 * Used to change voice settings of users in voice channels
		 */
		RPCCommands['SetUserVoiceSettings'] = 'SET_USER_VOICE_SETTINGS';
		RPCCommands['SetUserVoiceSettings2'] = 'SET_USER_VOICE_SETTINGS_2';
		/**
		 * Used to set the client's voice settings
		 */
		RPCCommands['SetVoiceSettings'] = 'SET_VOICE_SETTINGS';
		RPCCommands['SetVoiceSettings2'] = 'SET_VOICE_SETTINGS_2';
		/**
		 * @unstable
		 */
		RPCCommands['StartPurchase'] = 'START_PURCHASE';
		/**
		 * Used to subscribe to an RPC event
		 */
		RPCCommands['Subscribe'] = 'SUBSCRIBE';
		/**
		 * Used to unsubscribe from an RPC event
		 */
		RPCCommands['Unsubscribe'] = 'UNSUBSCRIBE';
		/**
		 * @unstable
		 */
		RPCCommands['ValidateApplication'] = 'VALIDATE_APPLICATION';
	})(RPCCommands || (exports.RPCCommands = RPCCommands = {}));
	/**
	 * @see {@link https://discord.com/developers/docs/topics/rpc#commands-and-events-rpc-events}
	 */
	var RPCEvents;
	(function (RPCEvents) {
		/**
		 * @unstable
		 */
		RPCEvents['ActivityInvite'] = 'ACTIVITY_INVITE';
		RPCEvents['ActivityJoin'] = 'ACTIVITY_JOIN';
		RPCEvents['ActivityJoinRequest'] = 'ACTIVITY_JOIN_REQUEST';
		RPCEvents['ActivitySpectate'] = 'ACTIVITY_SPECTATE';
		RPCEvents['ChannelCreate'] = 'CHANNEL_CREATE';
		RPCEvents['CurrentUserUpdate'] = 'CURRENT_USER_UPDATE';
		/**
		 * @unstable
		 */
		RPCEvents['EntitlementCreate'] = 'ENTITLEMENT_CREATE';
		/**
		 * @unstable
		 */
		RPCEvents['EntitlementDelete'] = 'ENTITLEMENT_DELETE';
		RPCEvents['Error'] = 'ERROR';
		/**
		 * @unstable
		 */
		RPCEvents['GameJoin'] = 'GAME_JOIN';
		/**
		 * @unstable
		 */
		RPCEvents['GameSpectate'] = 'GAME_SPECTATE';
		RPCEvents['GuildCreate'] = 'GUILD_CREATE';
		RPCEvents['GuildStatus'] = 'GUILD_STATUS';
		/**
		 * Dispatches message objects, with the exception of deletions, which only contains the id in the message object.
		 */
		RPCEvents['MessageCreate'] = 'MESSAGE_CREATE';
		/**
		 * Dispatches message objects, with the exception of deletions, which only contains the id in the message object.
		 */
		RPCEvents['MessageDelete'] = 'MESSAGE_DELETE';
		/**
		 * Dispatches message objects, with the exception of deletions, which only contains the id in the message object.
		 */
		RPCEvents['MessageUpdate'] = 'MESSAGE_UPDATE';
		/**
		 * This event requires the `rpc.notifications.read` {@link https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes | OAuth2 scope}.
		 */
		RPCEvents['NotificationCreate'] = 'NOTIFICATION_CREATE';
		/**
		 * @unstable
		 */
		RPCEvents['Overlay'] = 'OVERLAY';
		/**
		 * @unstable
		 */
		RPCEvents['OverlayUpdate'] = 'OVERLAY_UPDATE';
		RPCEvents['Ready'] = 'READY';
		/**
		 * @unstable
		 */
		RPCEvents['RelationshipUpdate'] = 'RELATIONSHIP_UPDATE';
		RPCEvents['SpeakingStart'] = 'SPEAKING_START';
		RPCEvents['SpeakingStop'] = 'SPEAKING_STOP';
		RPCEvents['VoiceChannelSelect'] = 'VOICE_CHANNEL_SELECT';
		RPCEvents['VoiceConnectionStatus'] = 'VOICE_CONNECTION_STATUS';
		RPCEvents['VoiceSettingsUpdate'] = 'VOICE_SETTINGS_UPDATE';
		/**
		 * @unstable
		 */
		RPCEvents['VoiceSettingsUpdate2'] = 'VOICE_SETTINGS_UPDATE_2';
		/**
		 * Dispatches channel voice state objects
		 */
		RPCEvents['VoiceStateCreate'] = 'VOICE_STATE_CREATE';
		/**
		 * Dispatches channel voice state objects
		 */
		RPCEvents['VoiceStateDelete'] = 'VOICE_STATE_DELETE';
		/**
		 * Dispatches channel voice state objects
		 */
		RPCEvents['VoiceStateUpdate'] = 'VOICE_STATE_UPDATE';
	})(RPCEvents || (exports.RPCEvents = RPCEvents = {}));
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/rpc/v10.mjs
var v10_exports$1 = /* @__PURE__ */ __exportAll({
	RPCCloseEventCodes: () => RPCCloseEventCodes$1,
	RPCCommands: () => RPCCommands$1,
	RPCDeviceType: () => RPCDeviceType$1,
	RPCErrorCodes: () => RPCErrorCodes$1,
	RPCEvents: () => RPCEvents$1,
	RPCVersion: () => RPCVersion$1,
	RPCVoiceSettingsModeType: () => RPCVoiceSettingsModeType$1,
	RPCVoiceShortcutKeyComboKeyType: () => RPCVoiceShortcutKeyComboKeyType$1,
	RelationshipType: () => RelationshipType$1,
	VoiceConnectionStates: () => VoiceConnectionStates$1,
	default: () => v10_default$1
});
var import_v10$2,
	v10_default$1,
	RPCCloseEventCodes$1,
	RPCCommands$1,
	RPCDeviceType$1,
	RPCErrorCodes$1,
	RPCEvents$1,
	RPCVersion$1,
	RPCVoiceSettingsModeType$1,
	RPCVoiceShortcutKeyComboKeyType$1,
	RelationshipType$1,
	VoiceConnectionStates$1;
var init_v10$1 = __esmMin(() => {
	import_v10$2 = /* @__PURE__ */ __toESM(require_v10$2(), 1);
	v10_default$1 = import_v10$2.default;
	RPCCloseEventCodes$1 = import_v10$2.default.RPCCloseEventCodes;
	RPCCommands$1 = import_v10$2.default.RPCCommands;
	RPCDeviceType$1 = import_v10$2.default.RPCDeviceType;
	RPCErrorCodes$1 = import_v10$2.default.RPCErrorCodes;
	RPCEvents$1 = import_v10$2.default.RPCEvents;
	RPCVersion$1 = import_v10$2.default.RPCVersion;
	RPCVoiceSettingsModeType$1 = import_v10$2.default.RPCVoiceSettingsModeType;
	RPCVoiceShortcutKeyComboKeyType$1 = import_v10$2.default.RPCVoiceShortcutKeyComboKeyType;
	RelationshipType$1 = import_v10$2.default.RelationshipType;
	VoiceConnectionStates$1 = import_v10$2.default.VoiceConnectionStates;
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/utils/v10.js
var require_v10$1 = /* @__PURE__ */ __commonJSMin((exports) => {
	Object.defineProperty(exports, '__esModule', { value: true });
	exports.isDMInteraction = isDMInteraction;
	exports.isGuildInteraction = isGuildInteraction;
	exports.isApplicationCommandDMInteraction = isApplicationCommandDMInteraction;
	exports.isApplicationCommandGuildInteraction = isApplicationCommandGuildInteraction;
	exports.isMessageComponentDMInteraction = isMessageComponentDMInteraction;
	exports.isMessageComponentGuildInteraction = isMessageComponentGuildInteraction;
	exports.isLinkButton = isLinkButton;
	exports.isInteractionButton = isInteractionButton;
	exports.isModalSubmitInteraction = isModalSubmitInteraction;
	exports.isMessageComponentInteraction = isMessageComponentInteraction;
	exports.isMessageComponentButtonInteraction = isMessageComponentButtonInteraction;
	exports.isMessageComponentSelectMenuInteraction = isMessageComponentSelectMenuInteraction;
	exports.isChatInputApplicationCommandInteraction = isChatInputApplicationCommandInteraction;
	exports.isContextMenuApplicationCommandInteraction = isContextMenuApplicationCommandInteraction;
	var index_1 = (init_v10$3(), __toCommonJS(v10_exports$3));
	/**
	 * A type guard check for DM interactions
	 *
	 * @param interaction - The interaction to check against
	 * @returns A boolean that indicates if the interaction was received in a DM channel
	 */
	function isDMInteraction(interaction) {
		return Reflect.has(interaction, 'user');
	}
	/**
	 * A type guard check for guild interactions
	 *
	 * @param interaction - The interaction to check against
	 * @returns A boolean that indicates if the interaction was received in a guild
	 */
	function isGuildInteraction(interaction) {
		return Reflect.has(interaction, 'guild_id');
	}
	/**
	 * A type guard check for DM application command interactions
	 *
	 * @param interaction - The application command interaction to check against
	 * @returns A boolean that indicates if the application command interaction was received in a DM channel
	 */
	function isApplicationCommandDMInteraction(interaction) {
		return isDMInteraction(interaction);
	}
	/**
	 * A type guard check for guild application command interactions
	 *
	 * @param interaction - The interaction to check against
	 * @returns A boolean that indicates if the application command interaction was received in a guild
	 */
	function isApplicationCommandGuildInteraction(interaction) {
		return isGuildInteraction(interaction);
	}
	/**
	 * A type guard check for DM message component interactions
	 *
	 * @param interaction - The message component interaction to check against
	 * @returns A boolean that indicates if the message component interaction was received in a DM channel
	 */
	function isMessageComponentDMInteraction(interaction) {
		return isDMInteraction(interaction);
	}
	/**
	 * A type guard check for guild message component interactions
	 *
	 * @param interaction - The interaction to check against
	 * @returns A boolean that indicates if the message component interaction was received in a guild
	 */
	function isMessageComponentGuildInteraction(interaction) {
		return isGuildInteraction(interaction);
	}
	/**
	 * A type guard check for buttons that have a `url` attached to them.
	 *
	 * @param component - The button to check against
	 * @returns A boolean that indicates if the button has a `url` attached to it
	 */
	function isLinkButton(component) {
		return component.style === index_1.ButtonStyle.Link;
	}
	/**
	 * A type guard check for buttons that have a `custom_id` attached to them.
	 *
	 * @param component - The button to check against
	 * @returns A boolean that indicates if the button has a `custom_id` attached to it
	 */
	function isInteractionButton(component) {
		return ![index_1.ButtonStyle.Link, index_1.ButtonStyle.Premium].includes(component.style);
	}
	/**
	 * A type guard check for modals submit interactions
	 *
	 * @param interaction - The interaction to check against
	 * @returns A boolean that indicates if the interaction is a modal submission
	 */
	function isModalSubmitInteraction(interaction) {
		return interaction.type === index_1.InteractionType.ModalSubmit;
	}
	/**
	 * A type guard check for message component interactions
	 *
	 * @param interaction - The interaction to check against
	 * @returns A boolean that indicates if the interaction is a message component
	 */
	function isMessageComponentInteraction(interaction) {
		return interaction.type === index_1.InteractionType.MessageComponent;
	}
	/**
	 * A type guard check for button message component interactions
	 *
	 * @param interaction - The message component interaction to check against
	 * @returns A boolean that indicates if the message component is a button
	 */
	function isMessageComponentButtonInteraction(interaction) {
		return interaction.data.component_type === index_1.ComponentType.Button;
	}
	/**
	 * A type guard check for select menu message component interactions
	 *
	 * @param interaction - The message component interaction to check against
	 * @returns A boolean that indicates if the message component is a select menu
	 */
	function isMessageComponentSelectMenuInteraction(interaction) {
		return [
			index_1.ComponentType.StringSelect,
			index_1.ComponentType.UserSelect,
			index_1.ComponentType.RoleSelect,
			index_1.ComponentType.MentionableSelect,
			index_1.ComponentType.ChannelSelect
		].includes(interaction.data.component_type);
	}
	/**
	 * A type guard check for chat input application commands.
	 *
	 * @param interaction - The interaction to check against
	 * @returns A boolean that indicates if the interaction is a chat input application command
	 */
	function isChatInputApplicationCommandInteraction(interaction) {
		return interaction.data.type === index_1.ApplicationCommandType.ChatInput;
	}
	/**
	 * A type guard check for context menu application commands.
	 *
	 * @param interaction - The interaction to check against
	 * @returns A boolean that indicates if the interaction is a context menu application command
	 */
	function isContextMenuApplicationCommandInteraction(interaction) {
		return interaction.data.type === index_1.ApplicationCommandType.Message || interaction.data.type === index_1.ApplicationCommandType.User;
	}
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/utils/v10.mjs
var v10_exports = /* @__PURE__ */ __exportAll({
	default: () => v10_default,
	isApplicationCommandDMInteraction: () => isApplicationCommandDMInteraction,
	isApplicationCommandGuildInteraction: () => isApplicationCommandGuildInteraction,
	isChatInputApplicationCommandInteraction: () => isChatInputApplicationCommandInteraction,
	isContextMenuApplicationCommandInteraction: () => isContextMenuApplicationCommandInteraction,
	isDMInteraction: () => isDMInteraction,
	isGuildInteraction: () => isGuildInteraction,
	isInteractionButton: () => isInteractionButton,
	isLinkButton: () => isLinkButton,
	isMessageComponentButtonInteraction: () => isMessageComponentButtonInteraction,
	isMessageComponentDMInteraction: () => isMessageComponentDMInteraction,
	isMessageComponentGuildInteraction: () => isMessageComponentGuildInteraction,
	isMessageComponentInteraction: () => isMessageComponentInteraction,
	isMessageComponentSelectMenuInteraction: () => isMessageComponentSelectMenuInteraction,
	isModalSubmitInteraction: () => isModalSubmitInteraction
});
var import_v10$1,
	v10_default,
	isApplicationCommandDMInteraction,
	isApplicationCommandGuildInteraction,
	isChatInputApplicationCommandInteraction,
	isContextMenuApplicationCommandInteraction,
	isDMInteraction,
	isGuildInteraction,
	isInteractionButton,
	isLinkButton,
	isMessageComponentButtonInteraction,
	isMessageComponentDMInteraction,
	isMessageComponentGuildInteraction,
	isMessageComponentInteraction,
	isMessageComponentSelectMenuInteraction,
	isModalSubmitInteraction;
var init_v10 = __esmMin(() => {
	import_v10$1 = /* @__PURE__ */ __toESM(require_v10$1(), 1);
	v10_default = import_v10$1.default;
	isApplicationCommandDMInteraction = import_v10$1.isApplicationCommandDMInteraction;
	isApplicationCommandGuildInteraction = import_v10$1.isApplicationCommandGuildInteraction;
	isChatInputApplicationCommandInteraction = import_v10$1.isChatInputApplicationCommandInteraction;
	isContextMenuApplicationCommandInteraction = import_v10$1.isContextMenuApplicationCommandInteraction;
	isDMInteraction = import_v10$1.isDMInteraction;
	isGuildInteraction = import_v10$1.isGuildInteraction;
	isInteractionButton = import_v10$1.isInteractionButton;
	isLinkButton = import_v10$1.isLinkButton;
	isMessageComponentButtonInteraction = import_v10$1.isMessageComponentButtonInteraction;
	isMessageComponentDMInteraction = import_v10$1.isMessageComponentDMInteraction;
	isMessageComponentGuildInteraction = import_v10$1.isMessageComponentGuildInteraction;
	isMessageComponentInteraction = import_v10$1.isMessageComponentInteraction;
	isMessageComponentSelectMenuInteraction = import_v10$1.isMessageComponentSelectMenuInteraction;
	isModalSubmitInteraction = import_v10$1.isModalSubmitInteraction;
});
//#endregion
//#region ../../node_modules/.pnpm/discord-api-types@0.38.55/node_modules/discord-api-types/v10.mjs
var import_v10 = /* @__PURE__ */ __toESM(
	/* @__PURE__ */ __commonJSMin((exports) => {
		var __createBinding =
			(exports && exports.__createBinding) ||
			(Object.create
				? function (o, m, k, k2) {
						if (k2 === void 0) k2 = k;
						var desc = Object.getOwnPropertyDescriptor(m, k);
						if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable))
							desc = {
								enumerable: true,
								get: function () {
									return m[k];
								}
							};
						Object.defineProperty(o, k2, desc);
					}
				: function (o, m, k, k2) {
						if (k2 === void 0) k2 = k;
						o[k2] = m[k];
					});
		var __setModuleDefault =
			(exports && exports.__setModuleDefault) ||
			(Object.create
				? function (o, v) {
						Object.defineProperty(o, 'default', {
							enumerable: true,
							value: v
						});
					}
				: function (o, v) {
						o['default'] = v;
					});
		var __exportStar =
			(exports && exports.__exportStar) ||
			function (m, exports$1) {
				for (var p in m) if (p !== 'default' && !Object.prototype.hasOwnProperty.call(exports$1, p)) __createBinding(exports$1, m, p);
			};
		var __importStar =
			(exports && exports.__importStar) ||
			(function () {
				var ownKeys = function (o) {
					ownKeys =
						Object.getOwnPropertyNames ||
						function (o) {
							var ar = [];
							for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
							return ar;
						};
					return ownKeys(o);
				};
				return function (mod) {
					if (mod && mod.__esModule) return mod;
					var result = {};
					if (mod != null) {
						for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== 'default') __createBinding(result, mod, k[i]);
					}
					__setModuleDefault(result, mod);
					return result;
				};
			})();
		Object.defineProperty(exports, '__esModule', { value: true });
		exports.Utils = void 0;
		__exportStar((init_v10$4(), __toCommonJS(v10_exports$4)), exports);
		__exportStar((init_globals(), __toCommonJS(globals_exports)), exports);
		__exportStar((init_v10$3(), __toCommonJS(v10_exports$3)), exports);
		__exportStar((init_v10$2(), __toCommonJS(v10_exports$2)), exports);
		__exportStar((init_v10$1(), __toCommonJS(v10_exports$1)), exports);
		__exportStar(require_internals(), exports);
		exports.Utils = __importStar((init_v10(), __toCommonJS(v10_exports)));
	})(),
	1
);
import_v10.default.APIApplicationCommandPermissionsConstant;
var APIVersion = import_v10.default.APIVersion;
import_v10.default.ActivityFlags;
import_v10.default.ActivityLocationKind;
import_v10.default.ActivityPlatform;
import_v10.default.ActivityType;
import_v10.default.AllowedMentionsTypes;
var ApplicationCommandOptionType = import_v10.default.ApplicationCommandOptionType;
import_v10.default.ApplicationCommandPermissionType;
var ApplicationCommandType = import_v10.default.ApplicationCommandType;
import_v10.default.ApplicationFlags;
var ApplicationIntegrationType = import_v10.default.ApplicationIntegrationType;
import_v10.default.ApplicationRoleConnectionMetadataType;
import_v10.default.ApplicationWebhookEventStatus;
import_v10.default.ApplicationWebhookEventType;
import_v10.default.ApplicationWebhookType;
import_v10.default.AttachmentFlags;
import_v10.default.AuditLogEvent;
import_v10.default.AuditLogOptionsType;
import_v10.default.AutoModerationActionType;
import_v10.default.AutoModerationRuleEventType;
import_v10.default.AutoModerationRuleKeywordPresetType;
import_v10.default.AutoModerationRuleTriggerType;
import_v10.default.BaseThemeType;
var ButtonStyle = import_v10.default.ButtonStyle;
var CDNRoutes = import_v10.default.CDNRoutes;
import_v10.default.CannotSendMessagesToThisUserErrorCodes;
import_v10.default.ChannelFlags;
var ChannelType = import_v10.default.ChannelType;
var ComponentType = import_v10.default.ComponentType;
import_v10.default.ConnectionService;
import_v10.default.ConnectionVisibility;
import_v10.default.EmbedFlags;
import_v10.default.EmbedMediaFlags;
import_v10.default.EmbedType;
import_v10.default.EntitlementOwnerType;
import_v10.default.EntitlementType;
import_v10.default.EntryPointCommandHandlerType;
import_v10.default.FormattingPatterns;
import_v10.default.ForumLayoutType;
import_v10.default.GatewayCapabilityBits;
import_v10.default.GatewayCloseCodes;
import_v10.default.GatewayDispatchEvents;
import_v10.default.GatewayIntentBits;
import_v10.default.GatewayOpcodes;
import_v10.default.GatewayRequestChannelInfoField;
import_v10.default.GatewayVersion;
import_v10.default.GuildDefaultMessageNotifications;
import_v10.default.GuildExplicitContentFilter;
import_v10.default.GuildFeature;
import_v10.default.GuildHubType;
import_v10.default.GuildMFALevel;
import_v10.default.GuildMemberFlags;
import_v10.default.GuildNSFWLevel;
import_v10.default.GuildOnboardingMode;
import_v10.default.GuildOnboardingPromptType;
import_v10.default.GuildPremiumTier;
import_v10.default.GuildScheduledEventEntityType;
import_v10.default.GuildScheduledEventPrivacyLevel;
import_v10.default.GuildScheduledEventRecurrenceRuleFrequency;
import_v10.default.GuildScheduledEventRecurrenceRuleMonth;
import_v10.default.GuildScheduledEventRecurrenceRuleWeekday;
import_v10.default.GuildScheduledEventStatus;
import_v10.default.GuildSystemChannelFlags;
import_v10.default.GuildVerificationLevel;
import_v10.default.GuildWidgetStyle;
import_v10.default.ImageFormat;
import_v10.default.IntegrationExpireBehavior;
var InteractionContextType = import_v10.default.InteractionContextType;
var InteractionResponseType = import_v10.default.InteractionResponseType;
var InteractionType = import_v10.default.InteractionType;
import_v10.default.InviteFlags;
import_v10.default.InviteTargetType;
import_v10.default.InviteTargetUsersJobStatus;
import_v10.default.InviteType;
var Locale = import_v10.default.Locale;
import_v10.default.MembershipScreeningFieldType;
import_v10.default.MessageActivityType;
var MessageFlags = import_v10.default.MessageFlags;
import_v10.default.MessageReferenceType;
import_v10.default.MessageSearchAuthorType;
import_v10.default.MessageSearchEmbedType;
import_v10.default.MessageSearchHasType;
import_v10.default.MessageSearchSortMode;
import_v10.default.MessageType;
import_v10.default.NameplatePalette;
import_v10.default.OAuth2Routes;
import_v10.default.OAuth2Scopes;
import_v10.default.OverwriteType;
import_v10.default.PermissionFlagsBits;
import_v10.default.PollLayoutType;
import_v10.default.PresenceUpdateStatus;
import_v10.default.RESTJSONErrorCodes;
import_v10.default.RPCCloseEventCodes;
import_v10.default.RPCCommands;
import_v10.default.RPCDeviceType;
import_v10.default.RPCErrorCodes;
import_v10.default.RPCEvents;
import_v10.default.RPCVersion;
import_v10.default.RPCVoiceSettingsModeType;
import_v10.default.RPCVoiceShortcutKeyComboKeyType;
import_v10.default.ReactionType;
import_v10.default.RelationshipType;
import_v10.default.RoleFlags;
import_v10.default.RouteBases;
var Routes = import_v10.default.Routes;
import_v10.default.SKUFlags;
import_v10.default.SKUType;
var SelectMenuDefaultValueType = import_v10.default.SelectMenuDefaultValueType;
var SeparatorSpacingSize = import_v10.default.SeparatorSpacingSize;
import_v10.default.SortOrderType;
import_v10.default.StageInstancePrivacyLevel;
import_v10.default.StatusDisplayType;
import_v10.default.StickerFormatType;
import_v10.default.StickerPackApplicationId;
import_v10.default.StickerType;
import_v10.default.SubscriptionStatus;
import_v10.default.TeamMemberMembershipState;
import_v10.default.TeamMemberRole;
var TextInputStyle = import_v10.default.TextInputStyle;
import_v10.default.ThreadAutoArchiveDuration;
import_v10.default.ThreadMemberFlags;
import_v10.default.UnfurledMediaItemFlags;
import_v10.default.UnfurledMediaItemLoadingState;
import_v10.default.UserFlags;
import_v10.default.UserPremiumType;
import_v10.default.Utils;
import_v10.default.VideoQualityMode;
import_v10.default.VoiceChannelEffectSendAnimationType;
import_v10.default.VoiceConnectionStates;
import_v10.default.WebhookType;
import_v10.default.urlSafeCharacters;
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/isArray.js
var require_isArray = /* @__PURE__ */ __commonJSMin((exports, module) => {
	module.exports = Array.isArray;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_freeGlobal.js
var require__freeGlobal = /* @__PURE__ */ __commonJSMin((exports, module) => {
	module.exports = typeof global == 'object' && global && global.Object === Object && global;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_root.js
var require__root = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var freeGlobal = require__freeGlobal();
	/** Detect free variable `self`. */
	var freeSelf = typeof self == 'object' && self && self.Object === Object && self;
	module.exports = freeGlobal || freeSelf || Function('return this')();
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_Symbol.js
var require__Symbol = /* @__PURE__ */ __commonJSMin((exports, module) => {
	module.exports = require__root().Symbol;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_getRawTag.js
var require__getRawTag = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var Symbol = require__Symbol();
	/** Used for built-in method references. */
	var objectProto = Object.prototype;
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var nativeObjectToString = objectProto.toString;
	/** Built-in value references. */
	var symToStringTag = Symbol ? Symbol.toStringTag : void 0;
	/**
	 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the raw `toStringTag`.
	 */
	function getRawTag(value) {
		var isOwn = hasOwnProperty.call(value, symToStringTag),
			tag = value[symToStringTag];
		try {
			value[symToStringTag] = void 0;
			var unmasked = true;
		} catch (e) {}
		var result = nativeObjectToString.call(value);
		if (unmasked) {
			if (isOwn) value[symToStringTag] = tag;
			else delete value[symToStringTag];
		}
		return result;
	}
	module.exports = getRawTag;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_objectToString.js
var require__objectToString = /* @__PURE__ */ __commonJSMin((exports, module) => {
	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var nativeObjectToString = Object.prototype.toString;
	/**
	 * Converts `value` to a string using `Object.prototype.toString`.
	 *
	 * @private
	 * @param {*} value The value to convert.
	 * @returns {string} Returns the converted string.
	 */
	function objectToString(value) {
		return nativeObjectToString.call(value);
	}
	module.exports = objectToString;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_baseGetTag.js
var require__baseGetTag = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var Symbol = require__Symbol();
	var getRawTag = require__getRawTag();
	var objectToString = require__objectToString();
	/** `Object#toString` result references. */
	var nullTag = '[object Null]';
	var undefinedTag = '[object Undefined]';
	/** Built-in value references. */
	var symToStringTag = Symbol ? Symbol.toStringTag : void 0;
	/**
	 * The base implementation of `getTag` without fallbacks for buggy environments.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the `toStringTag`.
	 */
	function baseGetTag(value) {
		if (value == null) return value === void 0 ? undefinedTag : nullTag;
		return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
	}
	module.exports = baseGetTag;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/isObjectLike.js
var require_isObjectLike = /* @__PURE__ */ __commonJSMin((exports, module) => {
	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */
	function isObjectLike(value) {
		return value != null && typeof value == 'object';
	}
	module.exports = isObjectLike;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/isSymbol.js
var require_isSymbol = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var baseGetTag = require__baseGetTag();
	var isObjectLike = require_isObjectLike();
	/** `Object#toString` result references. */
	var symbolTag = '[object Symbol]';
	/**
	 * Checks if `value` is classified as a `Symbol` primitive or object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
	 * @example
	 *
	 * _.isSymbol(Symbol.iterator);
	 * // => true
	 *
	 * _.isSymbol('abc');
	 * // => false
	 */
	function isSymbol(value) {
		return typeof value == 'symbol' || (isObjectLike(value) && baseGetTag(value) == symbolTag);
	}
	module.exports = isSymbol;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_isKey.js
var require__isKey = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var isArray = require_isArray();
	var isSymbol = require_isSymbol();
	/** Used to match property names within property paths. */
	var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
	var reIsPlainProp = /^\w*$/;
	/**
	 * Checks if `value` is a property name and not a property path.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {Object} [object] The object to query keys on.
	 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
	 */
	function isKey(value, object) {
		if (isArray(value)) return false;
		var type = typeof value;
		if (type == 'number' || type == 'symbol' || type == 'boolean' || value == null || isSymbol(value)) return true;
		return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || (object != null && value in Object(object));
	}
	module.exports = isKey;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/isObject.js
var require_isObject = /* @__PURE__ */ __commonJSMin((exports, module) => {
	/**
	 * Checks if `value` is the
	 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
	 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */
	function isObject(value) {
		var type = typeof value;
		return value != null && (type == 'object' || type == 'function');
	}
	module.exports = isObject;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/isFunction.js
var require_isFunction = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var baseGetTag = require__baseGetTag();
	var isObject = require_isObject();
	/** `Object#toString` result references. */
	var asyncTag = '[object AsyncFunction]';
	var funcTag = '[object Function]';
	var genTag = '[object GeneratorFunction]';
	var proxyTag = '[object Proxy]';
	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction(value) {
		if (!isObject(value)) return false;
		var tag = baseGetTag(value);
		return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
	}
	module.exports = isFunction;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_coreJsData.js
var require__coreJsData = /* @__PURE__ */ __commonJSMin((exports, module) => {
	module.exports = require__root()['__core-js_shared__'];
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_isMasked.js
var require__isMasked = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var coreJsData = require__coreJsData();
	/** Used to detect methods masquerading as native. */
	var maskSrcKey = (function () {
		var uid = /[^.]+$/.exec((coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO) || '');
		return uid ? 'Symbol(src)_1.' + uid : '';
	})();
	/**
	 * Checks if `func` has its source masked.
	 *
	 * @private
	 * @param {Function} func The function to check.
	 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
	 */
	function isMasked(func) {
		return !!maskSrcKey && maskSrcKey in func;
	}
	module.exports = isMasked;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_toSource.js
var require__toSource = /* @__PURE__ */ __commonJSMin((exports, module) => {
	/** Used to resolve the decompiled source of functions. */
	var funcToString = Function.prototype.toString;
	/**
	 * Converts `func` to its source code.
	 *
	 * @private
	 * @param {Function} func The function to convert.
	 * @returns {string} Returns the source code.
	 */
	function toSource(func) {
		if (func != null) {
			try {
				return funcToString.call(func);
			} catch (e) {}
			try {
				return func + '';
			} catch (e) {}
		}
		return '';
	}
	module.exports = toSource;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_baseIsNative.js
var require__baseIsNative = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var isFunction = require_isFunction();
	var isMasked = require__isMasked();
	var isObject = require_isObject();
	var toSource = require__toSource();
	/**
	 * Used to match `RegExp`
	 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
	 */
	var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
	/** Used to detect host constructors (Safari). */
	var reIsHostCtor = /^\[object .+?Constructor\]$/;
	/** Used for built-in method references. */
	var funcProto = Function.prototype;
	var objectProto = Object.prototype;
	/** Used to resolve the decompiled source of functions. */
	var funcToString = funcProto.toString;
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	/** Used to detect if a method is native. */
	var reIsNative = RegExp(
		'^' +
			funcToString
				.call(hasOwnProperty)
				.replace(reRegExpChar, '\\$&')
				.replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') +
			'$'
	);
	/**
	 * The base implementation of `_.isNative` without bad shim checks.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a native function,
	 *  else `false`.
	 */
	function baseIsNative(value) {
		if (!isObject(value) || isMasked(value)) return false;
		return (isFunction(value) ? reIsNative : reIsHostCtor).test(toSource(value));
	}
	module.exports = baseIsNative;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_getValue.js
var require__getValue = /* @__PURE__ */ __commonJSMin((exports, module) => {
	/**
	 * Gets the value at `key` of `object`.
	 *
	 * @private
	 * @param {Object} [object] The object to query.
	 * @param {string} key The key of the property to get.
	 * @returns {*} Returns the property value.
	 */
	function getValue(object, key) {
		return object == null ? void 0 : object[key];
	}
	module.exports = getValue;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_getNative.js
var require__getNative = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var baseIsNative = require__baseIsNative();
	var getValue = require__getValue();
	/**
	 * Gets the native function at `key` of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {string} key The key of the method to get.
	 * @returns {*} Returns the function if it's native, else `undefined`.
	 */
	function getNative(object, key) {
		var value = getValue(object, key);
		return baseIsNative(value) ? value : void 0;
	}
	module.exports = getNative;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_nativeCreate.js
var require__nativeCreate = /* @__PURE__ */ __commonJSMin((exports, module) => {
	module.exports = require__getNative()(Object, 'create');
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_hashClear.js
var require__hashClear = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var nativeCreate = require__nativeCreate();
	/**
	 * Removes all key-value entries from the hash.
	 *
	 * @private
	 * @name clear
	 * @memberOf Hash
	 */
	function hashClear() {
		this.__data__ = nativeCreate ? nativeCreate(null) : {};
		this.size = 0;
	}
	module.exports = hashClear;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_hashDelete.js
var require__hashDelete = /* @__PURE__ */ __commonJSMin((exports, module) => {
	/**
	 * Removes `key` and its value from the hash.
	 *
	 * @private
	 * @name delete
	 * @memberOf Hash
	 * @param {Object} hash The hash to modify.
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function hashDelete(key) {
		var result = this.has(key) && delete this.__data__[key];
		this.size -= result ? 1 : 0;
		return result;
	}
	module.exports = hashDelete;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_hashGet.js
var require__hashGet = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var nativeCreate = require__nativeCreate();
	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = '__lodash_hash_undefined__';
	/** Used to check objects for own properties. */
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	/**
	 * Gets the hash value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Hash
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function hashGet(key) {
		var data = this.__data__;
		if (nativeCreate) {
			var result = data[key];
			return result === HASH_UNDEFINED ? void 0 : result;
		}
		return hasOwnProperty.call(data, key) ? data[key] : void 0;
	}
	module.exports = hashGet;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_hashHas.js
var require__hashHas = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var nativeCreate = require__nativeCreate();
	/** Used to check objects for own properties. */
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	/**
	 * Checks if a hash value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Hash
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function hashHas(key) {
		var data = this.__data__;
		return nativeCreate ? data[key] !== void 0 : hasOwnProperty.call(data, key);
	}
	module.exports = hashHas;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_hashSet.js
var require__hashSet = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var nativeCreate = require__nativeCreate();
	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = '__lodash_hash_undefined__';
	/**
	 * Sets the hash `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Hash
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the hash instance.
	 */
	function hashSet(key, value) {
		var data = this.__data__;
		this.size += this.has(key) ? 0 : 1;
		data[key] = nativeCreate && value === void 0 ? HASH_UNDEFINED : value;
		return this;
	}
	module.exports = hashSet;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_Hash.js
var require__Hash = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var hashClear = require__hashClear();
	var hashDelete = require__hashDelete();
	var hashGet = require__hashGet();
	var hashHas = require__hashHas();
	var hashSet = require__hashSet();
	/**
	 * Creates a hash object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function Hash(entries) {
		var index = -1,
			length = entries == null ? 0 : entries.length;
		this.clear();
		while (++index < length) {
			var entry = entries[index];
			this.set(entry[0], entry[1]);
		}
	}
	Hash.prototype.clear = hashClear;
	Hash.prototype['delete'] = hashDelete;
	Hash.prototype.get = hashGet;
	Hash.prototype.has = hashHas;
	Hash.prototype.set = hashSet;
	module.exports = Hash;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_listCacheClear.js
var require__listCacheClear = /* @__PURE__ */ __commonJSMin((exports, module) => {
	/**
	 * Removes all key-value entries from the list cache.
	 *
	 * @private
	 * @name clear
	 * @memberOf ListCache
	 */
	function listCacheClear() {
		this.__data__ = [];
		this.size = 0;
	}
	module.exports = listCacheClear;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/eq.js
var require_eq = /* @__PURE__ */ __commonJSMin((exports, module) => {
	/**
	 * Performs a
	 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * comparison between two values to determine if they are equivalent.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 * var other = { 'a': 1 };
	 *
	 * _.eq(object, object);
	 * // => true
	 *
	 * _.eq(object, other);
	 * // => false
	 *
	 * _.eq('a', 'a');
	 * // => true
	 *
	 * _.eq('a', Object('a'));
	 * // => false
	 *
	 * _.eq(NaN, NaN);
	 * // => true
	 */
	function eq(value, other) {
		return value === other || (value !== value && other !== other);
	}
	module.exports = eq;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_assocIndexOf.js
var require__assocIndexOf = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var eq = require_eq();
	/**
	 * Gets the index at which the `key` is found in `array` of key-value pairs.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} key The key to search for.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function assocIndexOf(array, key) {
		var length = array.length;
		while (length--) if (eq(array[length][0], key)) return length;
		return -1;
	}
	module.exports = assocIndexOf;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_listCacheDelete.js
var require__listCacheDelete = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var assocIndexOf = require__assocIndexOf();
	/** Built-in value references. */
	var splice = Array.prototype.splice;
	/**
	 * Removes `key` and its value from the list cache.
	 *
	 * @private
	 * @name delete
	 * @memberOf ListCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function listCacheDelete(key) {
		var data = this.__data__,
			index = assocIndexOf(data, key);
		if (index < 0) return false;
		if (index == data.length - 1) data.pop();
		else splice.call(data, index, 1);
		--this.size;
		return true;
	}
	module.exports = listCacheDelete;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_listCacheGet.js
var require__listCacheGet = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var assocIndexOf = require__assocIndexOf();
	/**
	 * Gets the list cache value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf ListCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function listCacheGet(key) {
		var data = this.__data__,
			index = assocIndexOf(data, key);
		return index < 0 ? void 0 : data[index][1];
	}
	module.exports = listCacheGet;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_listCacheHas.js
var require__listCacheHas = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var assocIndexOf = require__assocIndexOf();
	/**
	 * Checks if a list cache value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf ListCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function listCacheHas(key) {
		return assocIndexOf(this.__data__, key) > -1;
	}
	module.exports = listCacheHas;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_listCacheSet.js
var require__listCacheSet = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var assocIndexOf = require__assocIndexOf();
	/**
	 * Sets the list cache `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf ListCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the list cache instance.
	 */
	function listCacheSet(key, value) {
		var data = this.__data__,
			index = assocIndexOf(data, key);
		if (index < 0) {
			++this.size;
			data.push([key, value]);
		} else data[index][1] = value;
		return this;
	}
	module.exports = listCacheSet;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_ListCache.js
var require__ListCache = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var listCacheClear = require__listCacheClear();
	var listCacheDelete = require__listCacheDelete();
	var listCacheGet = require__listCacheGet();
	var listCacheHas = require__listCacheHas();
	var listCacheSet = require__listCacheSet();
	/**
	 * Creates an list cache object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function ListCache(entries) {
		var index = -1,
			length = entries == null ? 0 : entries.length;
		this.clear();
		while (++index < length) {
			var entry = entries[index];
			this.set(entry[0], entry[1]);
		}
	}
	ListCache.prototype.clear = listCacheClear;
	ListCache.prototype['delete'] = listCacheDelete;
	ListCache.prototype.get = listCacheGet;
	ListCache.prototype.has = listCacheHas;
	ListCache.prototype.set = listCacheSet;
	module.exports = ListCache;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_Map.js
var require__Map = /* @__PURE__ */ __commonJSMin((exports, module) => {
	module.exports = require__getNative()(require__root(), 'Map');
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_mapCacheClear.js
var require__mapCacheClear = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var Hash = require__Hash();
	var ListCache = require__ListCache();
	var Map = require__Map();
	/**
	 * Removes all key-value entries from the map.
	 *
	 * @private
	 * @name clear
	 * @memberOf MapCache
	 */
	function mapCacheClear() {
		this.size = 0;
		this.__data__ = {
			hash: new Hash(),
			map: new (Map || ListCache)(),
			string: new Hash()
		};
	}
	module.exports = mapCacheClear;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_isKeyable.js
var require__isKeyable = /* @__PURE__ */ __commonJSMin((exports, module) => {
	/**
	 * Checks if `value` is suitable for use as unique object key.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
	 */
	function isKeyable(value) {
		var type = typeof value;
		return type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean' ? value !== '__proto__' : value === null;
	}
	module.exports = isKeyable;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_getMapData.js
var require__getMapData = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var isKeyable = require__isKeyable();
	/**
	 * Gets the data for `map`.
	 *
	 * @private
	 * @param {Object} map The map to query.
	 * @param {string} key The reference key.
	 * @returns {*} Returns the map data.
	 */
	function getMapData(map, key) {
		var data = map.__data__;
		return isKeyable(key) ? data[typeof key == 'string' ? 'string' : 'hash'] : data.map;
	}
	module.exports = getMapData;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_mapCacheDelete.js
var require__mapCacheDelete = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var getMapData = require__getMapData();
	/**
	 * Removes `key` and its value from the map.
	 *
	 * @private
	 * @name delete
	 * @memberOf MapCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function mapCacheDelete(key) {
		var result = getMapData(this, key)['delete'](key);
		this.size -= result ? 1 : 0;
		return result;
	}
	module.exports = mapCacheDelete;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_mapCacheGet.js
var require__mapCacheGet = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var getMapData = require__getMapData();
	/**
	 * Gets the map value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf MapCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function mapCacheGet(key) {
		return getMapData(this, key).get(key);
	}
	module.exports = mapCacheGet;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_mapCacheHas.js
var require__mapCacheHas = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var getMapData = require__getMapData();
	/**
	 * Checks if a map value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf MapCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function mapCacheHas(key) {
		return getMapData(this, key).has(key);
	}
	module.exports = mapCacheHas;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_mapCacheSet.js
var require__mapCacheSet = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var getMapData = require__getMapData();
	/**
	 * Sets the map `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf MapCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the map cache instance.
	 */
	function mapCacheSet(key, value) {
		var data = getMapData(this, key),
			size = data.size;
		data.set(key, value);
		this.size += data.size == size ? 0 : 1;
		return this;
	}
	module.exports = mapCacheSet;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_MapCache.js
var require__MapCache = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var mapCacheClear = require__mapCacheClear();
	var mapCacheDelete = require__mapCacheDelete();
	var mapCacheGet = require__mapCacheGet();
	var mapCacheHas = require__mapCacheHas();
	var mapCacheSet = require__mapCacheSet();
	/**
	 * Creates a map cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function MapCache(entries) {
		var index = -1,
			length = entries == null ? 0 : entries.length;
		this.clear();
		while (++index < length) {
			var entry = entries[index];
			this.set(entry[0], entry[1]);
		}
	}
	MapCache.prototype.clear = mapCacheClear;
	MapCache.prototype['delete'] = mapCacheDelete;
	MapCache.prototype.get = mapCacheGet;
	MapCache.prototype.has = mapCacheHas;
	MapCache.prototype.set = mapCacheSet;
	module.exports = MapCache;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/memoize.js
var require_memoize = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var MapCache = require__MapCache();
	/** Error message constants. */
	var FUNC_ERROR_TEXT = 'Expected a function';
	/**
	 * Creates a function that memoizes the result of `func`. If `resolver` is
	 * provided, it determines the cache key for storing the result based on the
	 * arguments provided to the memoized function. By default, the first argument
	 * provided to the memoized function is used as the map cache key. The `func`
	 * is invoked with the `this` binding of the memoized function.
	 *
	 * **Note:** The cache is exposed as the `cache` property on the memoized
	 * function. Its creation may be customized by replacing the `_.memoize.Cache`
	 * constructor with one whose instances implement the
	 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
	 * method interface of `clear`, `delete`, `get`, `has`, and `set`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Function
	 * @param {Function} func The function to have its output memoized.
	 * @param {Function} [resolver] The function to resolve the cache key.
	 * @returns {Function} Returns the new memoized function.
	 * @example
	 *
	 * var object = { 'a': 1, 'b': 2 };
	 * var other = { 'c': 3, 'd': 4 };
	 *
	 * var values = _.memoize(_.values);
	 * values(object);
	 * // => [1, 2]
	 *
	 * values(other);
	 * // => [3, 4]
	 *
	 * object.a = 2;
	 * values(object);
	 * // => [1, 2]
	 *
	 * // Modify the result cache.
	 * values.cache.set(object, ['a', 'b']);
	 * values(object);
	 * // => ['a', 'b']
	 *
	 * // Replace `_.memoize.Cache`.
	 * _.memoize.Cache = WeakMap;
	 */
	function memoize(func, resolver) {
		if (typeof func != 'function' || (resolver != null && typeof resolver != 'function')) throw new TypeError(FUNC_ERROR_TEXT);
		var memoized = function () {
			var args = arguments,
				key = resolver ? resolver.apply(this, args) : args[0],
				cache = memoized.cache;
			if (cache.has(key)) return cache.get(key);
			var result = func.apply(this, args);
			memoized.cache = cache.set(key, result) || cache;
			return result;
		};
		memoized.cache = new (memoize.Cache || MapCache)();
		return memoized;
	}
	memoize.Cache = MapCache;
	module.exports = memoize;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_memoizeCapped.js
var require__memoizeCapped = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var memoize = require_memoize();
	/** Used as the maximum memoize cache size. */
	var MAX_MEMOIZE_SIZE = 500;
	/**
	 * A specialized version of `_.memoize` which clears the memoized function's
	 * cache when it exceeds `MAX_MEMOIZE_SIZE`.
	 *
	 * @private
	 * @param {Function} func The function to have its output memoized.
	 * @returns {Function} Returns the new memoized function.
	 */
	function memoizeCapped(func) {
		var result = memoize(func, function (key) {
			if (cache.size === MAX_MEMOIZE_SIZE) cache.clear();
			return key;
		});
		var cache = result.cache;
		return result;
	}
	module.exports = memoizeCapped;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_stringToPath.js
var require__stringToPath = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var memoizeCapped = require__memoizeCapped();
	/** Used to match property names within property paths. */
	var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
	/** Used to match backslashes in property paths. */
	var reEscapeChar = /\\(\\)?/g;
	module.exports = memoizeCapped(function (string) {
		var result = [];
		if (string.charCodeAt(0) === 46) result.push('');
		string.replace(rePropName, function (match, number, quote, subString) {
			result.push(quote ? subString.replace(reEscapeChar, '$1') : number || match);
		});
		return result;
	});
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_arrayMap.js
var require__arrayMap = /* @__PURE__ */ __commonJSMin((exports, module) => {
	/**
	 * A specialized version of `_.map` for arrays without support for iteratee
	 * shorthands.
	 *
	 * @private
	 * @param {Array} [array] The array to iterate over.
	 * @param {Function} iteratee The function invoked per iteration.
	 * @returns {Array} Returns the new mapped array.
	 */
	function arrayMap(array, iteratee) {
		var index = -1,
			length = array == null ? 0 : array.length,
			result = Array(length);
		while (++index < length) result[index] = iteratee(array[index], index, array);
		return result;
	}
	module.exports = arrayMap;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_baseToString.js
var require__baseToString = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var Symbol = require__Symbol();
	var arrayMap = require__arrayMap();
	var isArray = require_isArray();
	var isSymbol = require_isSymbol();
	/** Used as references for various `Number` constants. */
	var INFINITY = 1 / 0;
	/** Used to convert symbols to primitives and strings. */
	var symbolProto = Symbol ? Symbol.prototype : void 0;
	var symbolToString = symbolProto ? symbolProto.toString : void 0;
	/**
	 * The base implementation of `_.toString` which doesn't convert nullish
	 * values to empty strings.
	 *
	 * @private
	 * @param {*} value The value to process.
	 * @returns {string} Returns the string.
	 */
	function baseToString(value) {
		if (typeof value == 'string') return value;
		if (isArray(value)) return arrayMap(value, baseToString) + '';
		if (isSymbol(value)) return symbolToString ? symbolToString.call(value) : '';
		var result = value + '';
		return result == '0' && 1 / value == -INFINITY ? '-0' : result;
	}
	module.exports = baseToString;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/toString.js
var require_toString = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var baseToString = require__baseToString();
	/**
	 * Converts `value` to a string. An empty string is returned for `null`
	 * and `undefined` values. The sign of `-0` is preserved.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to convert.
	 * @returns {string} Returns the converted string.
	 * @example
	 *
	 * _.toString(null);
	 * // => ''
	 *
	 * _.toString(-0);
	 * // => '-0'
	 *
	 * _.toString([1, 2, 3]);
	 * // => '1,2,3'
	 */
	function toString(value) {
		return value == null ? '' : baseToString(value);
	}
	module.exports = toString;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_castPath.js
var require__castPath = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var isArray = require_isArray();
	var isKey = require__isKey();
	var stringToPath = require__stringToPath();
	var toString = require_toString();
	/**
	 * Casts `value` to a path array if it's not one.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @param {Object} [object] The object to query keys on.
	 * @returns {Array} Returns the cast property path array.
	 */
	function castPath(value, object) {
		if (isArray(value)) return value;
		return isKey(value, object) ? [value] : stringToPath(toString(value));
	}
	module.exports = castPath;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_toKey.js
var require__toKey = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var isSymbol = require_isSymbol();
	/** Used as references for various `Number` constants. */
	var INFINITY = 1 / 0;
	/**
	 * Converts `value` to a string key if it's not a string or symbol.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @returns {string|symbol} Returns the key.
	 */
	function toKey(value) {
		if (typeof value == 'string' || isSymbol(value)) return value;
		var result = value + '';
		return result == '0' && 1 / value == -INFINITY ? '-0' : result;
	}
	module.exports = toKey;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_baseGet.js
var require__baseGet = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var castPath = require__castPath();
	var toKey = require__toKey();
	/**
	 * The base implementation of `_.get` without support for default values.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path of the property to get.
	 * @returns {*} Returns the resolved value.
	 */
	function baseGet(object, path) {
		path = castPath(path, object);
		var index = 0,
			length = path.length;
		while (object != null && index < length) object = object[toKey(path[index++])];
		return index && index == length ? object : void 0;
	}
	module.exports = baseGet;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/get.js
var require_get = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var baseGet = require__baseGet();
	/**
	 * Gets the value at `path` of `object`. If the resolved value is
	 * `undefined`, the `defaultValue` is returned in its place.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.7.0
	 * @category Object
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path of the property to get.
	 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
	 * @returns {*} Returns the resolved value.
	 * @example
	 *
	 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
	 *
	 * _.get(object, 'a[0].b.c');
	 * // => 3
	 *
	 * _.get(object, ['a', '0', 'b', 'c']);
	 * // => 3
	 *
	 * _.get(object, 'a.b.c', 'default');
	 * // => 'default'
	 */
	function get(object, path, defaultValue) {
		var result = object == null ? void 0 : baseGet(object, path);
		return result === void 0 ? defaultValue : result;
	}
	module.exports = get;
});
//#endregion
//#region ../../node_modules/.pnpm/fast-deep-equal@3.1.3/node_modules/fast-deep-equal/es6/index.js
var require_es6 = /* @__PURE__ */ __commonJSMin((exports, module) => {
	module.exports = function equal(a, b) {
		if (a === b) return true;
		if (a && b && typeof a == 'object' && typeof b == 'object') {
			if (a.constructor !== b.constructor) return false;
			var length, i, keys;
			if (Array.isArray(a)) {
				length = a.length;
				if (length != b.length) return false;
				for (i = length; i-- !== 0; ) if (!equal(a[i], b[i])) return false;
				return true;
			}
			if (a instanceof Map && b instanceof Map) {
				if (a.size !== b.size) return false;
				for (i of a.entries()) if (!b.has(i[0])) return false;
				for (i of a.entries()) if (!equal(i[1], b.get(i[0]))) return false;
				return true;
			}
			if (a instanceof Set && b instanceof Set) {
				if (a.size !== b.size) return false;
				for (i of a.entries()) if (!b.has(i[0])) return false;
				return true;
			}
			if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
				length = a.length;
				if (length != b.length) return false;
				for (i = length; i-- !== 0; ) if (a[i] !== b[i]) return false;
				return true;
			}
			if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
			if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
			if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
			keys = Object.keys(a);
			length = keys.length;
			if (length !== Object.keys(b).length) return false;
			for (i = length; i-- !== 0; ) if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
			for (i = length; i-- !== 0; ) {
				var key = keys[i];
				if (!equal(a[key], b[key])) return false;
			}
			return true;
		}
		return a !== a && b !== b;
	};
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_setCacheAdd.js
var require__setCacheAdd = /* @__PURE__ */ __commonJSMin((exports, module) => {
	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = '__lodash_hash_undefined__';
	/**
	 * Adds `value` to the array cache.
	 *
	 * @private
	 * @name add
	 * @memberOf SetCache
	 * @alias push
	 * @param {*} value The value to cache.
	 * @returns {Object} Returns the cache instance.
	 */
	function setCacheAdd(value) {
		this.__data__.set(value, HASH_UNDEFINED);
		return this;
	}
	module.exports = setCacheAdd;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_setCacheHas.js
var require__setCacheHas = /* @__PURE__ */ __commonJSMin((exports, module) => {
	/**
	 * Checks if `value` is in the array cache.
	 *
	 * @private
	 * @name has
	 * @memberOf SetCache
	 * @param {*} value The value to search for.
	 * @returns {boolean} Returns `true` if `value` is found, else `false`.
	 */
	function setCacheHas(value) {
		return this.__data__.has(value);
	}
	module.exports = setCacheHas;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_SetCache.js
var require__SetCache = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var MapCache = require__MapCache();
	var setCacheAdd = require__setCacheAdd();
	var setCacheHas = require__setCacheHas();
	/**
	 *
	 * Creates an array cache object to store unique values.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [values] The values to cache.
	 */
	function SetCache(values) {
		var index = -1,
			length = values == null ? 0 : values.length;
		this.__data__ = new MapCache();
		while (++index < length) this.add(values[index]);
	}
	SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
	SetCache.prototype.has = setCacheHas;
	module.exports = SetCache;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_baseFindIndex.js
var require__baseFindIndex = /* @__PURE__ */ __commonJSMin((exports, module) => {
	/**
	 * The base implementation of `_.findIndex` and `_.findLastIndex` without
	 * support for iteratee shorthands.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {Function} predicate The function invoked per iteration.
	 * @param {number} fromIndex The index to search from.
	 * @param {boolean} [fromRight] Specify iterating from right to left.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function baseFindIndex(array, predicate, fromIndex, fromRight) {
		var length = array.length,
			index = fromIndex + (fromRight ? 1 : -1);
		while (fromRight ? index-- : ++index < length) if (predicate(array[index], index, array)) return index;
		return -1;
	}
	module.exports = baseFindIndex;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_baseIsNaN.js
var require__baseIsNaN = /* @__PURE__ */ __commonJSMin((exports, module) => {
	/**
	 * The base implementation of `_.isNaN` without support for number objects.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
	 */
	function baseIsNaN(value) {
		return value !== value;
	}
	module.exports = baseIsNaN;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_strictIndexOf.js
var require__strictIndexOf = /* @__PURE__ */ __commonJSMin((exports, module) => {
	/**
	 * A specialized version of `_.indexOf` which performs strict equality
	 * comparisons of values, i.e. `===`.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} value The value to search for.
	 * @param {number} fromIndex The index to search from.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function strictIndexOf(array, value, fromIndex) {
		var index = fromIndex - 1,
			length = array.length;
		while (++index < length) if (array[index] === value) return index;
		return -1;
	}
	module.exports = strictIndexOf;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_baseIndexOf.js
var require__baseIndexOf = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var baseFindIndex = require__baseFindIndex();
	var baseIsNaN = require__baseIsNaN();
	var strictIndexOf = require__strictIndexOf();
	/**
	 * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} value The value to search for.
	 * @param {number} fromIndex The index to search from.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function baseIndexOf(array, value, fromIndex) {
		return value === value ? strictIndexOf(array, value, fromIndex) : baseFindIndex(array, baseIsNaN, fromIndex);
	}
	module.exports = baseIndexOf;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_arrayIncludes.js
var require__arrayIncludes = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var baseIndexOf = require__baseIndexOf();
	/**
	 * A specialized version of `_.includes` for arrays without support for
	 * specifying an index to search from.
	 *
	 * @private
	 * @param {Array} [array] The array to inspect.
	 * @param {*} target The value to search for.
	 * @returns {boolean} Returns `true` if `target` is found, else `false`.
	 */
	function arrayIncludes(array, value) {
		return !!(array == null ? 0 : array.length) && baseIndexOf(array, value, 0) > -1;
	}
	module.exports = arrayIncludes;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_arrayIncludesWith.js
var require__arrayIncludesWith = /* @__PURE__ */ __commonJSMin((exports, module) => {
	/**
	 * This function is like `arrayIncludes` except that it accepts a comparator.
	 *
	 * @private
	 * @param {Array} [array] The array to inspect.
	 * @param {*} target The value to search for.
	 * @param {Function} comparator The comparator invoked per element.
	 * @returns {boolean} Returns `true` if `target` is found, else `false`.
	 */
	function arrayIncludesWith(array, value, comparator) {
		var index = -1,
			length = array == null ? 0 : array.length;
		while (++index < length) if (comparator(value, array[index])) return true;
		return false;
	}
	module.exports = arrayIncludesWith;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_cacheHas.js
var require__cacheHas = /* @__PURE__ */ __commonJSMin((exports, module) => {
	/**
	 * Checks if a `cache` value for `key` exists.
	 *
	 * @private
	 * @param {Object} cache The cache to query.
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function cacheHas(cache, key) {
		return cache.has(key);
	}
	module.exports = cacheHas;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_Set.js
var require__Set = /* @__PURE__ */ __commonJSMin((exports, module) => {
	module.exports = require__getNative()(require__root(), 'Set');
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/noop.js
var require_noop = /* @__PURE__ */ __commonJSMin((exports, module) => {
	/**
	 * This method returns `undefined`.
	 *
	 * @static
	 * @memberOf _
	 * @since 2.3.0
	 * @category Util
	 * @example
	 *
	 * _.times(2, _.noop);
	 * // => [undefined, undefined]
	 */
	function noop() {}
	module.exports = noop;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_setToArray.js
var require__setToArray = /* @__PURE__ */ __commonJSMin((exports, module) => {
	/**
	 * Converts `set` to an array of its values.
	 *
	 * @private
	 * @param {Object} set The set to convert.
	 * @returns {Array} Returns the values.
	 */
	function setToArray(set) {
		var index = -1,
			result = Array(set.size);
		set.forEach(function (value) {
			result[++index] = value;
		});
		return result;
	}
	module.exports = setToArray;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_createSet.js
var require__createSet = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var Set = require__Set();
	var noop = require_noop();
	var setToArray = require__setToArray();
	module.exports = !(Set && 1 / setToArray(new Set([, -0]))[1] == 1 / 0)
		? noop
		: function (values) {
				return new Set(values);
			};
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/_baseUniq.js
var require__baseUniq = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var SetCache = require__SetCache();
	var arrayIncludes = require__arrayIncludes();
	var arrayIncludesWith = require__arrayIncludesWith();
	var cacheHas = require__cacheHas();
	var createSet = require__createSet();
	var setToArray = require__setToArray();
	/** Used as the size to enable large array optimizations. */
	var LARGE_ARRAY_SIZE = 200;
	/**
	 * The base implementation of `_.uniqBy` without support for iteratee shorthands.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {Function} [iteratee] The iteratee invoked per element.
	 * @param {Function} [comparator] The comparator invoked per element.
	 * @returns {Array} Returns the new duplicate free array.
	 */
	function baseUniq(array, iteratee, comparator) {
		var index = -1,
			includes = arrayIncludes,
			length = array.length,
			isCommon = true,
			result = [],
			seen = result;
		if (comparator) {
			isCommon = false;
			includes = arrayIncludesWith;
		} else if (length >= LARGE_ARRAY_SIZE) {
			var set = iteratee ? null : createSet(array);
			if (set) return setToArray(set);
			isCommon = false;
			includes = cacheHas;
			seen = new SetCache();
		} else seen = iteratee ? [] : result;
		outer: while (++index < length) {
			var value = array[index],
				computed = iteratee ? iteratee(value) : value;
			value = comparator || value !== 0 ? value : 0;
			if (isCommon && computed === computed) {
				var seenIndex = seen.length;
				while (seenIndex--) if (seen[seenIndex] === computed) continue outer;
				if (iteratee) seen.push(computed);
				result.push(value);
			} else if (!includes(seen, computed, comparator)) {
				if (seen !== result) seen.push(computed);
				result.push(value);
			}
		}
		return result;
	}
	module.exports = baseUniq;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash@4.18.1/node_modules/lodash/uniqWith.js
var require_uniqWith = /* @__PURE__ */ __commonJSMin((exports, module) => {
	var baseUniq = require__baseUniq();
	/**
	 * This method is like `_.uniq` except that it accepts `comparator` which
	 * is invoked to compare elements of `array`. The order of result values is
	 * determined by the order they occur in the array.The comparator is invoked
	 * with two arguments: (arrVal, othVal).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Array
	 * @param {Array} array The array to inspect.
	 * @param {Function} [comparator] The comparator invoked per element.
	 * @returns {Array} Returns the new duplicate free array.
	 * @example
	 *
	 * var objects = [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }, { 'x': 1, 'y': 2 }];
	 *
	 * _.uniqWith(objects, _.isEqual);
	 * // => [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }]
	 */
	function uniqWith(array, comparator) {
		comparator = typeof comparator == 'function' ? comparator : void 0;
		return array && array.length ? baseUniq(array, void 0, comparator) : [];
	}
	module.exports = uniqWith;
});
//#endregion
//#region ../../node_modules/.pnpm/@sapphire+shapeshift@4.0.0/node_modules/@sapphire/shapeshift/dist/esm/index.mjs
var import_get = /* @__PURE__ */ __toESM(require_get(), 1);
var import_es6 = /* @__PURE__ */ __toESM(require_es6(), 1);
var import_uniqWith = /* @__PURE__ */ __toESM(require_uniqWith(), 1);
var __defProp$2 = Object.defineProperty;
var __name$2 = (target, value) =>
	__defProp$2(target, 'name', {
		value,
		configurable: true
	});
var e;
var t;
var n;
var r = 'undefined' != typeof globalThis ? globalThis : 'undefined' != typeof self ? self : globalThis;
var o = (e = {});
function i() {
	throw new Error('setTimeout has not been defined');
}
__name$2(i, 'i');
function u() {
	throw new Error('clearTimeout has not been defined');
}
__name$2(u, 'u');
function c(e3) {
	if (t === setTimeout) return setTimeout(e3, 0);
	if ((t === i || !t) && setTimeout) return ((t = setTimeout), setTimeout(e3, 0));
	try {
		return t(e3, 0);
	} catch (n3) {
		try {
			return t.call(null, e3, 0);
		} catch (n4) {
			return t.call(this || r, e3, 0);
		}
	}
}
__name$2(c, 'c');
(function () {
	try {
		t = 'function' == typeof setTimeout ? setTimeout : i;
	} catch (e3) {
		t = i;
	}
	try {
		n = 'function' == typeof clearTimeout ? clearTimeout : u;
	} catch (e3) {
		n = u;
	}
})();
var l;
var s = [];
var f = false;
var a = -1;
function h() {
	f && l && ((f = false), l.length ? (s = l.concat(s)) : (a = -1), s.length && d());
}
__name$2(h, 'h');
function d() {
	if (!f) {
		var e3 = c(h);
		f = true;
		for (var t3 = s.length; t3; ) {
			for (l = s, s = []; ++a < t3; ) l && l[a].run();
			((a = -1), (t3 = s.length));
		}
		((l = null),
			(f = false),
			(function (e4) {
				if (n === clearTimeout) return clearTimeout(e4);
				if ((n === u || !n) && clearTimeout) return ((n = clearTimeout), clearTimeout(e4));
				try {
					n(e4);
				} catch (t4) {
					try {
						return n.call(null, e4);
					} catch (t5) {
						return n.call(this || r, e4);
					}
				}
			})(e3));
	}
}
__name$2(d, 'd');
function m(e3, t3) {
	(((this || r).fun = e3), ((this || r).array = t3));
}
__name$2(m, 'm');
function p() {}
__name$2(p, 'p');
((o.nextTick = function (e3) {
	var t3 = new Array(arguments.length - 1);
	if (arguments.length > 1) for (var n3 = 1; n3 < arguments.length; n3++) t3[n3 - 1] = arguments[n3];
	(s.push(new m(e3, t3)), 1 !== s.length || f || c(d));
}),
	(m.prototype.run = function () {
		(this || r).fun.apply(null, (this || r).array);
	}),
	(o.title = 'browser'),
	(o.browser = true),
	(o.env = {}),
	(o.argv = []),
	(o.version = ''),
	(o.versions = {}),
	(o.on = p),
	(o.addListener = p),
	(o.once = p),
	(o.off = p),
	(o.removeListener = p),
	(o.removeAllListeners = p),
	(o.emit = p),
	(o.prependListener = p),
	(o.prependOnceListener = p),
	(o.listeners = function (e3) {
		return [];
	}),
	(o.binding = function (e3) {
		throw new Error('process.binding is not supported');
	}),
	(o.cwd = function () {
		return '/';
	}),
	(o.chdir = function (e3) {
		throw new Error('process.chdir is not supported');
	}),
	(o.umask = function () {
		return 0;
	}));
var T = e;
T.addListener;
T.argv;
T.binding;
T.browser;
T.chdir;
T.cwd;
T.emit;
T.env;
T.listeners;
T.nextTick;
T.off;
T.on;
T.once;
T.prependListener;
T.prependOnceListener;
T.removeAllListeners;
T.removeListener;
T.title;
T.umask;
T.version;
T.versions;
var t2 = 'function' == typeof Symbol && 'symbol' == typeof Symbol.toStringTag;
var e2 = Object.prototype.toString;
var o2 = /* @__PURE__ */ __name$2(function (o3) {
	return !(t2 && o3 && 'object' == typeof o3 && Symbol.toStringTag in o3) && '[object Arguments]' === e2.call(o3);
}, 'o');
var n2 = /* @__PURE__ */ __name$2(function (t3) {
	return (
		!!o2(t3) ||
		(null !== t3 &&
			'object' == typeof t3 &&
			'number' == typeof t3.length &&
			t3.length >= 0 &&
			'[object Array]' !== e2.call(t3) &&
			'[object Function]' === e2.call(t3.callee))
	);
}, 'n');
var r2 = (function () {
	return o2(arguments);
})();
o2.isLegacyArguments = n2;
var l2 = r2 ? o2 : n2;
var t$1 = Object.prototype.toString;
var o$1 = Function.prototype.toString;
var n$1 = /^\s*(?:function)?\*/;
var e$1 = 'function' == typeof Symbol && 'symbol' == typeof Symbol.toStringTag;
var r$1 = Object.getPrototypeOf;
var c2 = (function () {
	if (!e$1) return false;
	try {
		return Function('return function*() {}')();
	} catch (t3) {}
})();
var u2 = c2 ? r$1(c2) : {};
var i2 = /* @__PURE__ */ __name$2(function (c3) {
	return 'function' == typeof c3 && (!!n$1.test(o$1.call(c3)) || (e$1 ? r$1(c3) === u2 : '[object GeneratorFunction]' === t$1.call(c3)));
}, 'i');
var t$2 =
	'function' == typeof Object.create
		? function (t3, e3) {
				e3 &&
					((t3.super_ = e3),
					(t3.prototype = Object.create(e3.prototype, {
						constructor: {
							value: t3,
							enumerable: false,
							writable: true,
							configurable: true
						}
					})));
			}
		: function (t3, e3) {
				if (e3) {
					t3.super_ = e3;
					var o3 = /* @__PURE__ */ __name$2(function () {}, 'o');
					((o3.prototype = e3.prototype), (t3.prototype = new o3()), (t3.prototype.constructor = t3));
				}
			};
var i$1 = /* @__PURE__ */ __name$2(function (e3) {
	return e3 && 'object' == typeof e3 && 'function' == typeof e3.copy && 'function' == typeof e3.fill && 'function' == typeof e3.readUInt8;
}, 'i$1');
var o$2 = {};
var u$1 = i$1;
var f2 = l2;
var a2 = i2;
function c$1(e3) {
	return e3.call.bind(e3);
}
__name$2(c$1, 'c$1');
var s2 = 'undefined' != typeof BigInt;
var p2 = 'undefined' != typeof Symbol;
var y = p2 && void 0 !== Symbol.toStringTag;
var l$1 = 'undefined' != typeof Uint8Array;
var d2 = 'undefined' != typeof ArrayBuffer;
if (l$1 && y)
	var g = Object.getPrototypeOf(Uint8Array.prototype),
		b = c$1(Object.getOwnPropertyDescriptor(g, Symbol.toStringTag).get);
var m2 = c$1(Object.prototype.toString);
var h2 = c$1(Number.prototype.valueOf);
var j = c$1(String.prototype.valueOf);
var A = c$1(Boolean.prototype.valueOf);
if (s2) var w = c$1(BigInt.prototype.valueOf);
if (p2) var v = c$1(Symbol.prototype.valueOf);
function O(e3, t3) {
	if ('object' != typeof e3) return false;
	try {
		return (t3(e3), true);
	} catch (e4) {
		return false;
	}
}
__name$2(O, 'O');
function S(e3) {
	return l$1 && y ? void 0 !== b(e3) : B(e3) || k(e3) || E(e3) || D(e3) || U(e3) || P(e3) || x(e3) || I(e3) || M(e3) || z(e3) || F(e3);
}
__name$2(S, 'S');
function B(e3) {
	return l$1 && y ? 'Uint8Array' === b(e3) : '[object Uint8Array]' === m2(e3) || (u$1(e3) && void 0 !== e3.buffer);
}
__name$2(B, 'B');
function k(e3) {
	return l$1 && y ? 'Uint8ClampedArray' === b(e3) : '[object Uint8ClampedArray]' === m2(e3);
}
__name$2(k, 'k');
function E(e3) {
	return l$1 && y ? 'Uint16Array' === b(e3) : '[object Uint16Array]' === m2(e3);
}
__name$2(E, 'E');
function D(e3) {
	return l$1 && y ? 'Uint32Array' === b(e3) : '[object Uint32Array]' === m2(e3);
}
__name$2(D, 'D');
function U(e3) {
	return l$1 && y ? 'Int8Array' === b(e3) : '[object Int8Array]' === m2(e3);
}
__name$2(U, 'U');
function P(e3) {
	return l$1 && y ? 'Int16Array' === b(e3) : '[object Int16Array]' === m2(e3);
}
__name$2(P, 'P');
function x(e3) {
	return l$1 && y ? 'Int32Array' === b(e3) : '[object Int32Array]' === m2(e3);
}
__name$2(x, 'x');
function I(e3) {
	return l$1 && y ? 'Float32Array' === b(e3) : '[object Float32Array]' === m2(e3);
}
__name$2(I, 'I');
function M(e3) {
	return l$1 && y ? 'Float64Array' === b(e3) : '[object Float64Array]' === m2(e3);
}
__name$2(M, 'M');
function z(e3) {
	return l$1 && y ? 'BigInt64Array' === b(e3) : '[object BigInt64Array]' === m2(e3);
}
__name$2(z, 'z');
function F(e3) {
	return l$1 && y ? 'BigUint64Array' === b(e3) : '[object BigUint64Array]' === m2(e3);
}
__name$2(F, 'F');
function T2(e3) {
	return '[object Map]' === m2(e3);
}
__name$2(T2, 'T');
function N(e3) {
	return '[object Set]' === m2(e3);
}
__name$2(N, 'N');
function W(e3) {
	return '[object WeakMap]' === m2(e3);
}
__name$2(W, 'W');
function $(e3) {
	return '[object WeakSet]' === m2(e3);
}
__name$2($, '$');
function C(e3) {
	return '[object ArrayBuffer]' === m2(e3);
}
__name$2(C, 'C');
function V(e3) {
	return 'undefined' != typeof ArrayBuffer && (C.working ? C(e3) : e3 instanceof ArrayBuffer);
}
__name$2(V, 'V');
function G(e3) {
	return '[object DataView]' === m2(e3);
}
__name$2(G, 'G');
function R(e3) {
	return 'undefined' != typeof DataView && (G.working ? G(e3) : e3 instanceof DataView);
}
__name$2(R, 'R');
function J(e3) {
	return '[object SharedArrayBuffer]' === m2(e3);
}
__name$2(J, 'J');
function _(e3) {
	return 'undefined' != typeof SharedArrayBuffer && (J.working ? J(e3) : e3 instanceof SharedArrayBuffer);
}
__name$2(_, '_');
function H(e3) {
	return O(e3, h2);
}
__name$2(H, 'H');
function Z(e3) {
	return O(e3, j);
}
__name$2(Z, 'Z');
function q(e3) {
	return O(e3, A);
}
__name$2(q, 'q');
function K(e3) {
	return s2 && O(e3, w);
}
__name$2(K, 'K');
function L(e3) {
	return p2 && O(e3, v);
}
__name$2(L, 'L');
((o$2.isArgumentsObject = f2),
	(o$2.isGeneratorFunction = a2),
	(o$2.isPromise = function (e3) {
		return (
			('undefined' != typeof Promise && e3 instanceof Promise) ||
			(null !== e3 && 'object' == typeof e3 && 'function' == typeof e3.then && 'function' == typeof e3.catch)
		);
	}),
	(o$2.isArrayBufferView = function (e3) {
		return d2 && ArrayBuffer.isView ? ArrayBuffer.isView(e3) : S(e3) || R(e3);
	}),
	(o$2.isTypedArray = S),
	(o$2.isUint8Array = B),
	(o$2.isUint8ClampedArray = k),
	(o$2.isUint16Array = E),
	(o$2.isUint32Array = D),
	(o$2.isInt8Array = U),
	(o$2.isInt16Array = P),
	(o$2.isInt32Array = x),
	(o$2.isFloat32Array = I),
	(o$2.isFloat64Array = M),
	(o$2.isBigInt64Array = z),
	(o$2.isBigUint64Array = F),
	(T2.working = 'undefined' != typeof Map && T2(/* @__PURE__ */ new Map())),
	(o$2.isMap = function (e3) {
		return 'undefined' != typeof Map && (T2.working ? T2(e3) : e3 instanceof Map);
	}),
	(N.working = 'undefined' != typeof Set && N(/* @__PURE__ */ new Set())),
	(o$2.isSet = function (e3) {
		return 'undefined' != typeof Set && (N.working ? N(e3) : e3 instanceof Set);
	}),
	(W.working = 'undefined' != typeof WeakMap && W(/* @__PURE__ */ new WeakMap())),
	(o$2.isWeakMap = function (e3) {
		return 'undefined' != typeof WeakMap && (W.working ? W(e3) : e3 instanceof WeakMap);
	}),
	($.working = 'undefined' != typeof WeakSet && $(/* @__PURE__ */ new WeakSet())),
	(o$2.isWeakSet = function (e3) {
		return $(e3);
	}),
	(C.working = 'undefined' != typeof ArrayBuffer && C(/* @__PURE__ */ new ArrayBuffer())),
	(o$2.isArrayBuffer = V),
	(G.working = 'undefined' != typeof ArrayBuffer && 'undefined' != typeof DataView && G(new DataView(/* @__PURE__ */ new ArrayBuffer(1), 0, 1))),
	(o$2.isDataView = R),
	(J.working = 'undefined' != typeof SharedArrayBuffer && J(new SharedArrayBuffer())),
	(o$2.isSharedArrayBuffer = _),
	(o$2.isAsyncFunction = function (e3) {
		return '[object AsyncFunction]' === m2(e3);
	}),
	(o$2.isMapIterator = function (e3) {
		return '[object Map Iterator]' === m2(e3);
	}),
	(o$2.isSetIterator = function (e3) {
		return '[object Set Iterator]' === m2(e3);
	}),
	(o$2.isGeneratorObject = function (e3) {
		return '[object Generator]' === m2(e3);
	}),
	(o$2.isWebAssemblyCompiledModule = function (e3) {
		return '[object WebAssembly.Module]' === m2(e3);
	}),
	(o$2.isNumberObject = H),
	(o$2.isStringObject = Z),
	(o$2.isBooleanObject = q),
	(o$2.isBigIntObject = K),
	(o$2.isSymbolObject = L),
	(o$2.isBoxedPrimitive = function (e3) {
		return H(e3) || Z(e3) || q(e3) || K(e3) || L(e3);
	}),
	(o$2.isAnyArrayBuffer = function (e3) {
		return l$1 && (V(e3) || _(e3));
	}),
	['isProxy', 'isExternal', 'isModuleNamespaceObject'].forEach(function (e3) {
		Object.defineProperty(o$2, e3, {
			enumerable: false,
			value: function () {
				throw new Error(e3 + ' is not supported in userland');
			}
		});
	}));
var Q = 'undefined' != typeof globalThis ? globalThis : 'undefined' != typeof self ? self : globalThis;
var X = {};
var Y = T;
var ee =
	Object.getOwnPropertyDescriptors ||
	function (e3) {
		for (var t3 = Object.keys(e3), r3 = {}, n3 = 0; n3 < t3.length; n3++) r3[t3[n3]] = Object.getOwnPropertyDescriptor(e3, t3[n3]);
		return r3;
	};
var te = /%[sdj%]/g;
((X.format = function (e3) {
	if (!ge(e3)) {
		for (var t3 = [], r3 = 0; r3 < arguments.length; r3++) t3.push(oe(arguments[r3]));
		return t3.join(' ');
	}
	r3 = 1;
	for (
		var n3 = arguments,
			i3 = n3.length,
			o3 = String(e3).replace(te, function (e4) {
				if ('%%' === e4) return '%';
				if (r3 >= i3) return e4;
				switch (e4) {
					case '%s':
						return String(n3[r3++]);
					case '%d':
						return Number(n3[r3++]);
					case '%j':
						try {
							return JSON.stringify(n3[r3++]);
						} catch (e5) {
							return '[Circular]';
						}
					default:
						return e4;
				}
			}),
			u3 = n3[r3];
		r3 < i3;
		u3 = n3[++r3]
	)
		le(u3) || !he(u3) ? (o3 += ' ' + u3) : (o3 += ' ' + oe(u3));
	return o3;
}),
	(X.deprecate = function (e3, t3) {
		if (void 0 !== Y && true === Y.noDeprecation) return e3;
		if (void 0 === Y)
			return function () {
				return X.deprecate(e3, t3).apply(this || Q, arguments);
			};
		var r3 = false;
		return function () {
			if (!r3) {
				if (Y.throwDeprecation) throw new Error(t3);
				(Y.traceDeprecation ? console.trace(t3) : console.error(t3), (r3 = true));
			}
			return e3.apply(this || Q, arguments);
		};
	}));
var re = {};
var ne = /^$/;
if (Y.env.NODE_DEBUG) {
	ie = Y.env.NODE_DEBUG;
	((ie = ie
		.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
		.replace(/\*/g, '.*')
		.replace(/,/g, '$|^')
		.toUpperCase()),
		(ne = new RegExp('^' + ie + '$', 'i')));
}
var ie;
function oe(e3, t3) {
	var r3 = {
		seen: [],
		stylize: fe
	};
	return (
		arguments.length >= 3 && (r3.depth = arguments[2]),
		arguments.length >= 4 && (r3.colors = arguments[3]),
		ye(t3) ? (r3.showHidden = t3) : t3 && X._extend(r3, t3),
		be(r3.showHidden) && (r3.showHidden = false),
		be(r3.depth) && (r3.depth = 2),
		be(r3.colors) && (r3.colors = false),
		be(r3.customInspect) && (r3.customInspect = true),
		r3.colors && (r3.stylize = ue),
		ae(r3, e3, r3.depth)
	);
}
__name$2(oe, 'oe');
function ue(e3, t3) {
	var r3 = oe.styles[t3];
	return r3 ? '\x1B[' + oe.colors[r3][0] + 'm' + e3 + '\x1B[' + oe.colors[r3][1] + 'm' : e3;
}
__name$2(ue, 'ue');
function fe(e3, t3) {
	return e3;
}
__name$2(fe, 'fe');
function ae(e3, t3, r3) {
	if (e3.customInspect && t3 && we(t3.inspect) && t3.inspect !== X.inspect && (!t3.constructor || t3.constructor.prototype !== t3)) {
		var n3 = t3.inspect(r3, e3);
		return (ge(n3) || (n3 = ae(e3, n3, r3)), n3);
	}
	var i3 = (function (e4, t4) {
		if (be(t4)) return e4.stylize('undefined', 'undefined');
		if (ge(t4)) {
			var r4 = "'" + JSON.stringify(t4).replace(/^"|"$/g, '').replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
			return e4.stylize(r4, 'string');
		}
		if (de(t4)) return e4.stylize('' + t4, 'number');
		if (ye(t4)) return e4.stylize('' + t4, 'boolean');
		if (le(t4)) return e4.stylize('null', 'null');
	})(e3, t3);
	if (i3) return i3;
	var o3 = Object.keys(t3),
		u3 = (function (e4) {
			var t4 = {};
			return (
				e4.forEach(function (e5, r4) {
					t4[e5] = true;
				}),
				t4
			);
		})(o3);
	if ((e3.showHidden && (o3 = Object.getOwnPropertyNames(t3)), Ae(t3) && (o3.indexOf('message') >= 0 || o3.indexOf('description') >= 0)))
		return ce(t3);
	if (0 === o3.length) {
		if (we(t3)) {
			var f3 = t3.name ? ': ' + t3.name : '';
			return e3.stylize('[Function' + f3 + ']', 'special');
		}
		if (me(t3)) return e3.stylize(RegExp.prototype.toString.call(t3), 'regexp');
		if (je(t3)) return e3.stylize(Date.prototype.toString.call(t3), 'date');
		if (Ae(t3)) return ce(t3);
	}
	var a3,
		c3 = '',
		s4 = false,
		p3 = ['{', '}'];
	(pe(t3) && ((s4 = true), (p3 = ['[', ']'])), we(t3)) && (c3 = ' [Function' + (t3.name ? ': ' + t3.name : '') + ']');
	return (
		me(t3) && (c3 = ' ' + RegExp.prototype.toString.call(t3)),
		je(t3) && (c3 = ' ' + Date.prototype.toUTCString.call(t3)),
		Ae(t3) && (c3 = ' ' + ce(t3)),
		0 !== o3.length || (s4 && 0 != t3.length)
			? r3 < 0
				? me(t3)
					? e3.stylize(RegExp.prototype.toString.call(t3), 'regexp')
					: e3.stylize('[Object]', 'special')
				: (e3.seen.push(t3),
					(a3 = s4
						? (function (e4, t4, r4, n4, i4) {
								for (var o4 = [], u4 = 0, f4 = t4.length; u4 < f4; ++u4)
									ke(t4, String(u4)) ? o4.push(se(e4, t4, r4, n4, String(u4), true)) : o4.push('');
								return (
									i4.forEach(function (i5) {
										i5.match(/^\d+$/) || o4.push(se(e4, t4, r4, n4, i5, true));
									}),
									o4
								);
							})(e3, t3, r3, u3, o3)
						: o3.map(function (n4) {
								return se(e3, t3, r3, u3, n4, s4);
							})),
					e3.seen.pop(),
					(function (e4, t4, r4) {
						var n4 = 0;
						if (
							e4.reduce(function (e5, t5) {
								return (n4++, t5.indexOf('\n') >= 0 && n4++, e5 + t5.replace(/\u001b\[\d\d?m/g, '').length + 1);
							}, 0) > 60
						)
							return r4[0] + ('' === t4 ? '' : t4 + '\n ') + ' ' + e4.join(',\n  ') + ' ' + r4[1];
						return r4[0] + t4 + ' ' + e4.join(', ') + ' ' + r4[1];
					})(a3, c3, p3))
			: p3[0] + c3 + p3[1]
	);
}
__name$2(ae, 'ae');
function ce(e3) {
	return '[' + Error.prototype.toString.call(e3) + ']';
}
__name$2(ce, 'ce');
function se(e3, t3, r3, n3, i3, o3) {
	var u3, f3, a3;
	if (
		((a3 = Object.getOwnPropertyDescriptor(t3, i3) || { value: t3[i3] }).get
			? (f3 = a3.set ? e3.stylize('[Getter/Setter]', 'special') : e3.stylize('[Getter]', 'special'))
			: a3.set && (f3 = e3.stylize('[Setter]', 'special')),
		ke(n3, i3) || (u3 = '[' + i3 + ']'),
		f3 ||
			(e3.seen.indexOf(a3.value) < 0
				? (f3 = le(r3) ? ae(e3, a3.value, null) : ae(e3, a3.value, r3 - 1)).indexOf('\n') > -1 &&
					(f3 = o3
						? f3
								.split('\n')
								.map(function (e4) {
									return '  ' + e4;
								})
								.join('\n')
								.substr(2)
						: '\n' +
							f3
								.split('\n')
								.map(function (e4) {
									return '   ' + e4;
								})
								.join('\n'))
				: (f3 = e3.stylize('[Circular]', 'special'))),
		be(u3))
	) {
		if (o3 && i3.match(/^\d+$/)) return f3;
		(u3 = JSON.stringify('' + i3)).match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)
			? ((u3 = u3.substr(1, u3.length - 2)), (u3 = e3.stylize(u3, 'name')))
			: ((u3 = u3
					.replace(/'/g, "\\'")
					.replace(/\\"/g, '"')
					.replace(/(^"|"$)/g, "'")),
				(u3 = e3.stylize(u3, 'string')));
	}
	return u3 + ': ' + f3;
}
__name$2(se, 'se');
function pe(e3) {
	return Array.isArray(e3);
}
__name$2(pe, 'pe');
function ye(e3) {
	return 'boolean' == typeof e3;
}
__name$2(ye, 'ye');
function le(e3) {
	return null === e3;
}
__name$2(le, 'le');
function de(e3) {
	return 'number' == typeof e3;
}
__name$2(de, 'de');
function ge(e3) {
	return 'string' == typeof e3;
}
__name$2(ge, 'ge');
function be(e3) {
	return void 0 === e3;
}
__name$2(be, 'be');
function me(e3) {
	return he(e3) && '[object RegExp]' === ve(e3);
}
__name$2(me, 'me');
function he(e3) {
	return 'object' == typeof e3 && null !== e3;
}
__name$2(he, 'he');
function je(e3) {
	return he(e3) && '[object Date]' === ve(e3);
}
__name$2(je, 'je');
function Ae(e3) {
	return he(e3) && ('[object Error]' === ve(e3) || e3 instanceof Error);
}
__name$2(Ae, 'Ae');
function we(e3) {
	return 'function' == typeof e3;
}
__name$2(we, 'we');
function ve(e3) {
	return Object.prototype.toString.call(e3);
}
__name$2(ve, 've');
function Oe(e3) {
	return e3 < 10 ? '0' + e3.toString(10) : e3.toString(10);
}
__name$2(Oe, 'Oe');
((X.debuglog = function (e3) {
	if (((e3 = e3.toUpperCase()), !re[e3]))
		if (ne.test(e3)) {
			var t3 = Y.pid;
			re[e3] = function () {
				var r3 = X.format.apply(X, arguments);
				console.error('%s %d: %s', e3, t3, r3);
			};
		} else re[e3] = function () {};
	return re[e3];
}),
	(X.inspect = oe),
	(oe.colors = {
		bold: [1, 22],
		italic: [3, 23],
		underline: [4, 24],
		inverse: [7, 27],
		white: [37, 39],
		grey: [90, 39],
		black: [30, 39],
		blue: [34, 39],
		cyan: [36, 39],
		green: [32, 39],
		magenta: [35, 39],
		red: [31, 39],
		yellow: [33, 39]
	}),
	(oe.styles = {
		special: 'cyan',
		number: 'yellow',
		boolean: 'yellow',
		undefined: 'grey',
		null: 'bold',
		string: 'green',
		date: 'magenta',
		regexp: 'red'
	}),
	(X.types = o$2),
	(X.isArray = pe),
	(X.isBoolean = ye),
	(X.isNull = le),
	(X.isNullOrUndefined = function (e3) {
		return null == e3;
	}),
	(X.isNumber = de),
	(X.isString = ge),
	(X.isSymbol = function (e3) {
		return 'symbol' == typeof e3;
	}),
	(X.isUndefined = be),
	(X.isRegExp = me),
	(X.types.isRegExp = me),
	(X.isObject = he),
	(X.isDate = je),
	(X.types.isDate = je),
	(X.isError = Ae),
	(X.types.isNativeError = Ae),
	(X.isFunction = we),
	(X.isPrimitive = function (e3) {
		return null === e3 || 'boolean' == typeof e3 || 'number' == typeof e3 || 'string' == typeof e3 || 'symbol' == typeof e3 || void 0 === e3;
	}),
	(X.isBuffer = i$1));
var Se = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function Be() {
	var e3 = /* @__PURE__ */ new Date(),
		t3 = [Oe(e3.getHours()), Oe(e3.getMinutes()), Oe(e3.getSeconds())].join(':');
	return [e3.getDate(), Se[e3.getMonth()], t3].join(' ');
}
__name$2(Be, 'Be');
function ke(e3, t3) {
	return Object.prototype.hasOwnProperty.call(e3, t3);
}
__name$2(ke, 'ke');
((X.log = function () {
	console.log('%s - %s', Be(), X.format.apply(X, arguments));
}),
	(X.inherits = t$2),
	(X._extend = function (e3, t3) {
		if (!t3 || !he(t3)) return e3;
		for (var r3 = Object.keys(t3), n3 = r3.length; n3--; ) e3[r3[n3]] = t3[r3[n3]];
		return e3;
	}));
var Ee = 'undefined' != typeof Symbol ? Symbol('util.promisify.custom') : void 0;
function De(e3, t3) {
	if (!e3) {
		var r3 = /* @__PURE__ */ new Error('Promise was rejected with a falsy value');
		((r3.reason = e3), (e3 = r3));
	}
	return t3(e3);
}
__name$2(De, 'De');
((X.promisify = function (e3) {
	if ('function' != typeof e3) throw new TypeError('The "original" argument must be of type Function');
	if (Ee && e3[Ee]) {
		var t3;
		if ('function' != typeof (t3 = e3[Ee])) throw new TypeError('The "util.promisify.custom" argument must be of type Function');
		return (
			Object.defineProperty(t3, Ee, {
				value: t3,
				enumerable: false,
				writable: false,
				configurable: true
			}),
			t3
		);
	}
	function t3() {
		for (
			var t4,
				r3,
				n3 = new Promise(function (e4, n4) {
					((t4 = e4), (r3 = n4));
				}),
				i3 = [],
				o3 = 0;
			o3 < arguments.length;
			o3++
		)
			i3.push(arguments[o3]);
		i3.push(function (e4, n4) {
			e4 ? r3(e4) : t4(n4);
		});
		try {
			e3.apply(this || Q, i3);
		} catch (e4) {
			r3(e4);
		}
		return n3;
	}
	__name$2(t3, 't');
	return (
		Object.setPrototypeOf(t3, Object.getPrototypeOf(e3)),
		Ee &&
			Object.defineProperty(t3, Ee, {
				value: t3,
				enumerable: false,
				writable: false,
				configurable: true
			}),
		Object.defineProperties(t3, ee(e3))
	);
}),
	(X.promisify.custom = Ee),
	(X.callbackify = function (e3) {
		if ('function' != typeof e3) throw new TypeError('The "original" argument must be of type Function');
		function t3() {
			for (var t4 = [], r3 = 0; r3 < arguments.length; r3++) t4.push(arguments[r3]);
			var n3 = t4.pop();
			if ('function' != typeof n3) throw new TypeError('The last argument must be of type Function');
			var i3 = this || Q,
				o3 = /* @__PURE__ */ __name$2(function () {
					return n3.apply(i3, arguments);
				}, 'o');
			e3.apply(this || Q, t4).then(
				function (e4) {
					Y.nextTick(o3.bind(null, null, e4));
				},
				function (e4) {
					Y.nextTick(De.bind(null, e4, o3));
				}
			);
		}
		__name$2(t3, 't');
		return (Object.setPrototypeOf(t3, Object.getPrototypeOf(e3)), Object.defineProperties(t3, ee(e3)), t3);
	}));
X._extend;
X.callbackify;
X.debuglog;
X.deprecate;
X.format;
X.inherits;
X.inspect;
X.isArray;
X.isBoolean;
X.isBuffer;
X.isDate;
X.isError;
X.isFunction;
X.isNull;
X.isNullOrUndefined;
X.isNumber;
X.isObject;
X.isPrimitive;
X.isRegExp;
X.isString;
X.isSymbol;
X.isUndefined;
X.log;
X.promisify;
X._extend;
X.callbackify;
X.debuglog;
X.deprecate;
X.format;
X.inherits;
X.inspect;
X.isArray;
X.isBoolean;
X.isBuffer;
X.isDate;
X.isError;
X.isFunction;
X.isNull;
X.isNullOrUndefined;
X.isNumber;
X.isObject;
X.isPrimitive;
X.isRegExp;
X.isString;
X.isSymbol;
X.isUndefined;
X.log;
X.promisify;
X.types;
X._extend;
X.callbackify;
X.debuglog;
X.deprecate;
X.format;
X.inherits;
var inspect2 = X.inspect;
X.isArray;
X.isBoolean;
X.isBuffer;
X.isDate;
X.isError;
X.isFunction;
X.isNull;
X.isNullOrUndefined;
X.isNumber;
X.isObject;
X.isPrimitive;
X.isRegExp;
X.isString;
X.isSymbol;
X.isUndefined;
X.log;
X.promisify;
X.types;
X.TextEncoder = globalThis.TextEncoder;
X.TextDecoder = globalThis.TextDecoder;
var customInspectSymbol = Symbol.for('nodejs.util.inspect.custom');
var customInspectSymbolStackLess = Symbol.for('nodejs.util.inspect.custom.stack-less');
var _BaseError = class _BaseError extends Error {
	toJSON() {
		return {
			name: this.name,
			message: this.message
		};
	}
	[customInspectSymbol](depth, options) {
		return `${this[customInspectSymbolStackLess](depth, options)}
${this.stack.slice(this.stack.indexOf('\n'))}`;
	}
};
__name$2(_BaseError, 'BaseError');
var BaseError = _BaseError;
var _BaseConstraintError = class _BaseConstraintError extends BaseError {
	constructor(constraint, message, given) {
		super(message);
		this.constraint = constraint;
		this.given = given;
	}
	toJSON() {
		return {
			name: this.name,
			constraint: this.constraint,
			given: this.given,
			message: this.message
		};
	}
};
__name$2(_BaseConstraintError, 'BaseConstraintError');
var BaseConstraintError = _BaseConstraintError;
var _ExpectedConstraintError = class _ExpectedConstraintError extends BaseConstraintError {
	constructor(constraint, message, given, expected) {
		super(constraint, message, given);
		this.expected = expected;
	}
	toJSON() {
		return {
			name: this.name,
			constraint: this.constraint,
			given: this.given,
			expected: this.expected,
			message: this.message
		};
	}
	[customInspectSymbolStackLess](depth, options) {
		const constraint = options.stylize(this.constraint, 'string');
		if (depth < 0) return options.stylize(`[ExpectedConstraintError: ${constraint}]`, 'special');
		const newOptions = {
			...options,
			depth: options.depth === null ? null : options.depth - 1
		};
		const padding = `
  ${options.stylize('|', 'undefined')} `;
		const given = inspect2(this.given, newOptions).replace(/\n/g, padding);
		return `${`${options.stylize('ExpectedConstraintError', 'special')} > ${constraint}`}
  ${options.stylize(this.message, 'regexp')}
${`
  ${options.stylize('Expected: ', 'string')}${options.stylize(this.expected, 'boolean')}`}
${`
  ${options.stylize('Received:', 'regexp')}${padding}${given}`}`;
	}
};
__name$2(_ExpectedConstraintError, 'ExpectedConstraintError');
var ExpectedConstraintError = _ExpectedConstraintError;
var _Result = class _Result {
	constructor(success, value, error) {
		this.success = success;
		if (success) this.value = value;
		else this.error = error;
	}
	isOk() {
		return this.success;
	}
	isErr() {
		return !this.success;
	}
	unwrap() {
		if (this.isOk()) return this.value;
		throw this.error;
	}
	static ok(value) {
		return new _Result(true, value);
	}
	static err(error) {
		return new _Result(false, void 0, error);
	}
};
__name$2(_Result, 'Result');
var Result = _Result;
function whenConstraint(key, options, validator, validatorOptions) {
	return {
		run(input, parent) {
			if (!parent)
				return Result.err(
					new ExpectedConstraintError(
						's.object(T.when)',
						validatorOptions?.message ?? 'Validator has no parent',
						parent,
						'Validator to have a parent'
					)
				);
			const isKeyArray = Array.isArray(key);
			const predicate = resolveBooleanIs(
				options,
				isKeyArray ? key.map((k2) => (0, import_get.default)(parent, k2)) : (0, import_get.default)(parent, key),
				isKeyArray
			)
				? options.then
				: options.otherwise;
			if (predicate) return predicate(validator).run(input);
			return Result.ok(input);
		}
	};
}
__name$2(whenConstraint, 'whenConstraint');
function resolveBooleanIs(options, value, isKeyArray) {
	if (options.is === void 0) return isKeyArray ? !value.some((val) => !val) : Boolean(value);
	if (typeof options.is === 'function') return options.is(value);
	return value === options.is;
}
__name$2(resolveBooleanIs, 'resolveBooleanIs');
var validationEnabled = true;
function setGlobalValidationEnabled(enabled) {
	validationEnabled = enabled;
}
__name$2(setGlobalValidationEnabled, 'setGlobalValidationEnabled');
function getGlobalValidationEnabled() {
	return validationEnabled;
}
__name$2(getGlobalValidationEnabled, 'getGlobalValidationEnabled');
function getValue(valueOrFn) {
	return typeof valueOrFn === 'function' ? valueOrFn() : valueOrFn;
}
__name$2(getValue, 'getValue');
var _BaseValidator = class _BaseValidator {
	constructor(validatorOptions = {}, constraints = []) {
		this.constraints = [];
		this.isValidationEnabled = null;
		this.constraints = constraints;
		this.validatorOptions = validatorOptions;
	}
	setParent(parent) {
		this.parent = parent;
		return this;
	}
	optional(options = this.validatorOptions) {
		return new UnionValidator([new LiteralValidator(void 0, options), this.clone()], options);
	}
	nullable(options = this.validatorOptions) {
		return new UnionValidator([new LiteralValidator(null, options), this.clone()], options);
	}
	nullish(options = this.validatorOptions) {
		return new UnionValidator([new NullishValidator(options), this.clone()], options);
	}
	array(options = this.validatorOptions) {
		return new ArrayValidator(this.clone(), options);
	}
	set(options = this.validatorOptions) {
		return new SetValidator(this.clone(), options);
	}
	or(...predicates) {
		return new UnionValidator([this.clone(), ...predicates], this.validatorOptions);
	}
	transform(cb, options = this.validatorOptions) {
		return this.addConstraint({ run: (input) => Result.ok(cb(input)) }, options);
	}
	reshape(cb, options = this.validatorOptions) {
		return this.addConstraint({ run: cb }, options);
	}
	default(value, options = this.validatorOptions) {
		return new DefaultValidator(this.clone(), value, options);
	}
	when(key, options, validatorOptions) {
		return this.addConstraint(whenConstraint(key, options, this, validatorOptions));
	}
	describe(description) {
		const clone = this.clone();
		clone.description = description;
		return clone;
	}
	run(value) {
		let result = this.handle(value);
		if (result.isErr()) return result;
		for (const constraint of this.constraints) {
			result = constraint.run(result.value, this.parent);
			if (result.isErr()) break;
		}
		return result;
	}
	parse(value) {
		if (!this.shouldRunConstraints) return this.handle(value).unwrap();
		return this.constraints.reduce((v2, constraint) => constraint.run(v2).unwrap(), this.handle(value).unwrap());
	}
	is(value) {
		return this.run(value).isOk();
	}
	/**
	 * Sets if the validator should also run constraints or just do basic checks.
	 * @param isValidationEnabled Whether this validator should be enabled or disabled. You can pass boolean or a function returning boolean which will be called just before parsing.
	 * Set to `null` to go off of the global configuration.
	 */
	setValidationEnabled(isValidationEnabled) {
		const clone = this.clone();
		clone.isValidationEnabled = isValidationEnabled;
		return clone;
	}
	getValidationEnabled() {
		return getValue(this.isValidationEnabled);
	}
	get shouldRunConstraints() {
		return getValue(this.isValidationEnabled) ?? getGlobalValidationEnabled();
	}
	clone() {
		const clone = Reflect.construct(this.constructor, [this.validatorOptions, this.constraints]);
		clone.isValidationEnabled = this.isValidationEnabled;
		return clone;
	}
	addConstraint(constraint, validatorOptions = this.validatorOptions) {
		const clone = this.clone();
		clone.validatorOptions = validatorOptions;
		clone.constraints = clone.constraints.concat(constraint);
		return clone;
	}
};
__name$2(_BaseValidator, 'BaseValidator');
var BaseValidator = _BaseValidator;
function isUnique(input) {
	if (input.length < 2) return true;
	return (0, import_uniqWith.default)(input, import_es6.default).length === input.length;
}
__name$2(isUnique, 'isUnique');
function lessThan(a3, b2) {
	return a3 < b2;
}
__name$2(lessThan, 'lessThan');
function lessThanOrEqual(a3, b2) {
	return a3 <= b2;
}
__name$2(lessThanOrEqual, 'lessThanOrEqual');
function greaterThan(a3, b2) {
	return a3 > b2;
}
__name$2(greaterThan, 'greaterThan');
function greaterThanOrEqual(a3, b2) {
	return a3 >= b2;
}
__name$2(greaterThanOrEqual, 'greaterThanOrEqual');
function equal(a3, b2) {
	return a3 === b2;
}
__name$2(equal, 'equal');
function notEqual(a3, b2) {
	return a3 !== b2;
}
__name$2(notEqual, 'notEqual');
function arrayLengthComparator(comparator, name, expected, length, options) {
	return {
		run(input) {
			return comparator(input.length, length)
				? Result.ok(input)
				: Result.err(new ExpectedConstraintError(name, options?.message ?? 'Invalid Array length', input, expected));
		}
	};
}
__name$2(arrayLengthComparator, 'arrayLengthComparator');
function arrayLengthLessThan(value, options) {
	return arrayLengthComparator(lessThan, 's.array(T).lengthLessThan()', `expected.length < ${value}`, value, options);
}
__name$2(arrayLengthLessThan, 'arrayLengthLessThan');
function arrayLengthLessThanOrEqual(value, options) {
	return arrayLengthComparator(lessThanOrEqual, 's.array(T).lengthLessThanOrEqual()', `expected.length <= ${value}`, value, options);
}
__name$2(arrayLengthLessThanOrEqual, 'arrayLengthLessThanOrEqual');
function arrayLengthGreaterThan(value, options) {
	return arrayLengthComparator(greaterThan, 's.array(T).lengthGreaterThan()', `expected.length > ${value}`, value, options);
}
__name$2(arrayLengthGreaterThan, 'arrayLengthGreaterThan');
function arrayLengthGreaterThanOrEqual(value, options) {
	return arrayLengthComparator(greaterThanOrEqual, 's.array(T).lengthGreaterThanOrEqual()', `expected.length >= ${value}`, value, options);
}
__name$2(arrayLengthGreaterThanOrEqual, 'arrayLengthGreaterThanOrEqual');
function arrayLengthEqual(value, options) {
	return arrayLengthComparator(equal, 's.array(T).lengthEqual()', `expected.length === ${value}`, value, options);
}
__name$2(arrayLengthEqual, 'arrayLengthEqual');
function arrayLengthNotEqual(value, options) {
	return arrayLengthComparator(notEqual, 's.array(T).lengthNotEqual()', `expected.length !== ${value}`, value, options);
}
__name$2(arrayLengthNotEqual, 'arrayLengthNotEqual');
function arrayLengthRange(start, endBefore, options) {
	const expected = `expected.length >= ${start} && expected.length < ${endBefore}`;
	return {
		run(input) {
			return input.length >= start && input.length < endBefore
				? Result.ok(input)
				: Result.err(new ExpectedConstraintError('s.array(T).lengthRange()', options?.message ?? 'Invalid Array length', input, expected));
		}
	};
}
__name$2(arrayLengthRange, 'arrayLengthRange');
function arrayLengthRangeInclusive(start, end, options) {
	const expected = `expected.length >= ${start} && expected.length <= ${end}`;
	return {
		run(input) {
			return input.length >= start && input.length <= end
				? Result.ok(input)
				: Result.err(
						new ExpectedConstraintError('s.array(T).lengthRangeInclusive()', options?.message ?? 'Invalid Array length', input, expected)
					);
		}
	};
}
__name$2(arrayLengthRangeInclusive, 'arrayLengthRangeInclusive');
function arrayLengthRangeExclusive(startAfter, endBefore, options) {
	const expected = `expected.length > ${startAfter} && expected.length < ${endBefore}`;
	return {
		run(input) {
			return input.length > startAfter && input.length < endBefore
				? Result.ok(input)
				: Result.err(
						new ExpectedConstraintError('s.array(T).lengthRangeExclusive()', options?.message ?? 'Invalid Array length', input, expected)
					);
		}
	};
}
__name$2(arrayLengthRangeExclusive, 'arrayLengthRangeExclusive');
function uniqueArray(options) {
	return {
		run(input) {
			return isUnique(input)
				? Result.ok(input)
				: Result.err(
						new ExpectedConstraintError(
							's.array(T).unique()',
							options?.message ?? 'Array values are not unique',
							input,
							'Expected all values to be unique'
						)
					);
		}
	};
}
__name$2(uniqueArray, 'uniqueArray');
var _CombinedPropertyError = class _CombinedPropertyError extends BaseError {
	constructor(errors, validatorOptions) {
		super(validatorOptions?.message ?? 'Received one or more errors');
		this.errors = errors;
	}
	[customInspectSymbolStackLess](depth, options) {
		if (depth < 0) return options.stylize('[CombinedPropertyError]', 'special');
		const newOptions = {
			...options,
			depth: options.depth === null ? null : options.depth - 1,
			compact: true
		};
		const padding = `
  ${options.stylize('|', 'undefined')} `;
		return `${`${options.stylize('CombinedPropertyError', 'special')} (${options.stylize(this.errors.length.toString(), 'number')})`}
  ${options.stylize(this.message, 'regexp')}

${this.errors
	.map(([key, error]) => {
		const property = _CombinedPropertyError.formatProperty(key, options);
		const body = error[customInspectSymbolStackLess](depth - 1, newOptions).replace(/\n/g, padding);
		return `  input${property}${padding}${body}`;
	})
	.join('\n\n')}`;
	}
	static formatProperty(key, options) {
		if (typeof key === 'string') return options.stylize(`.${key}`, 'symbol');
		if (typeof key === 'number') return `[${options.stylize(key.toString(), 'number')}]`;
		return `[${options.stylize('Symbol', 'symbol')}(${key.description})]`;
	}
};
__name$2(_CombinedPropertyError, 'CombinedPropertyError');
var CombinedPropertyError = _CombinedPropertyError;
var _ValidationError = class _ValidationError extends BaseError {
	constructor(validator, message, given) {
		super(message);
		this.validator = validator;
		this.given = given;
	}
	toJSON() {
		return {
			name: this.name,
			message: 'Unknown validation error occurred.',
			validator: this.validator,
			given: this.given
		};
	}
	[customInspectSymbolStackLess](depth, options) {
		const validator = options.stylize(this.validator, 'string');
		if (depth < 0) return options.stylize(`[ValidationError: ${validator}]`, 'special');
		const newOptions = {
			...options,
			depth: options.depth === null ? null : options.depth - 1,
			compact: true
		};
		const padding = `
  ${options.stylize('|', 'undefined')} `;
		const given = inspect2(this.given, newOptions).replace(/\n/g, padding);
		return `${`${options.stylize('ValidationError', 'special')} > ${validator}`}
  ${options.stylize(this.message, 'regexp')}
${`
  ${options.stylize('Received:', 'regexp')}${padding}${given}`}`;
	}
};
__name$2(_ValidationError, 'ValidationError');
var ValidationError = _ValidationError;
var _ArrayValidator = class _ArrayValidator extends BaseValidator {
	constructor(validator, validatorOptions = {}, constraints = []) {
		super(validatorOptions, constraints);
		this.validator = validator;
	}
	lengthLessThan(length, options = this.validatorOptions) {
		return this.addConstraint(arrayLengthLessThan(length, options));
	}
	lengthLessThanOrEqual(length, options = this.validatorOptions) {
		return this.addConstraint(arrayLengthLessThanOrEqual(length, options));
	}
	lengthGreaterThan(length, options = this.validatorOptions) {
		return this.addConstraint(arrayLengthGreaterThan(length, options));
	}
	lengthGreaterThanOrEqual(length, options = this.validatorOptions) {
		return this.addConstraint(arrayLengthGreaterThanOrEqual(length, options));
	}
	lengthEqual(length, options = this.validatorOptions) {
		return this.addConstraint(arrayLengthEqual(length, options));
	}
	lengthNotEqual(length, options = this.validatorOptions) {
		return this.addConstraint(arrayLengthNotEqual(length, options));
	}
	lengthRange(start, endBefore, options = this.validatorOptions) {
		return this.addConstraint(arrayLengthRange(start, endBefore, options));
	}
	lengthRangeInclusive(startAt, endAt, options = this.validatorOptions) {
		return this.addConstraint(arrayLengthRangeInclusive(startAt, endAt, options));
	}
	lengthRangeExclusive(startAfter, endBefore, options = this.validatorOptions) {
		return this.addConstraint(arrayLengthRangeExclusive(startAfter, endBefore, options));
	}
	unique(options = this.validatorOptions) {
		return this.addConstraint(uniqueArray(options));
	}
	clone() {
		return Reflect.construct(this.constructor, [this.validator, this.validatorOptions, this.constraints]);
	}
	handle(values) {
		if (!Array.isArray(values))
			return Result.err(new ValidationError('s.array(T)', this.validatorOptions.message ?? 'Expected an array', values));
		if (!this.shouldRunConstraints) return Result.ok(values);
		const errors = [];
		const transformed = [];
		for (let i3 = 0; i3 < values.length; i3++) {
			const result = this.validator.run(values[i3]);
			if (result.isOk()) transformed.push(result.value);
			else errors.push([i3, result.error]);
		}
		return errors.length === 0 ? Result.ok(transformed) : Result.err(new CombinedPropertyError(errors, this.validatorOptions));
	}
};
__name$2(_ArrayValidator, 'ArrayValidator');
var ArrayValidator = _ArrayValidator;
function bigintComparator(comparator, name, expected, number, options) {
	return {
		run(input) {
			return comparator(input, number)
				? Result.ok(input)
				: Result.err(new ExpectedConstraintError(name, options?.message ?? 'Invalid bigint value', input, expected));
		}
	};
}
__name$2(bigintComparator, 'bigintComparator');
function bigintLessThan(value, options) {
	return bigintComparator(lessThan, 's.bigint().lessThan()', `expected < ${value}n`, value, options);
}
__name$2(bigintLessThan, 'bigintLessThan');
function bigintLessThanOrEqual(value, options) {
	return bigintComparator(lessThanOrEqual, 's.bigint().lessThanOrEqual()', `expected <= ${value}n`, value, options);
}
__name$2(bigintLessThanOrEqual, 'bigintLessThanOrEqual');
function bigintGreaterThan(value, options) {
	return bigintComparator(greaterThan, 's.bigint().greaterThan()', `expected > ${value}n`, value, options);
}
__name$2(bigintGreaterThan, 'bigintGreaterThan');
function bigintGreaterThanOrEqual(value, options) {
	return bigintComparator(greaterThanOrEqual, 's.bigint().greaterThanOrEqual()', `expected >= ${value}n`, value, options);
}
__name$2(bigintGreaterThanOrEqual, 'bigintGreaterThanOrEqual');
function bigintEqual(value, options) {
	return bigintComparator(equal, 's.bigint().equal()', `expected === ${value}n`, value, options);
}
__name$2(bigintEqual, 'bigintEqual');
function bigintNotEqual(value, options) {
	return bigintComparator(notEqual, 's.bigint().notEqual()', `expected !== ${value}n`, value, options);
}
__name$2(bigintNotEqual, 'bigintNotEqual');
function bigintDivisibleBy(divider, options) {
	const expected = `expected % ${divider}n === 0n`;
	return {
		run(input) {
			return input % divider === 0n
				? Result.ok(input)
				: Result.err(new ExpectedConstraintError('s.bigint().divisibleBy()', options?.message ?? 'BigInt is not divisible', input, expected));
		}
	};
}
__name$2(bigintDivisibleBy, 'bigintDivisibleBy');
var _BigIntValidator = class _BigIntValidator extends BaseValidator {
	lessThan(number, options = this.validatorOptions) {
		return this.addConstraint(bigintLessThan(number, options));
	}
	lessThanOrEqual(number, options = this.validatorOptions) {
		return this.addConstraint(bigintLessThanOrEqual(number, options));
	}
	greaterThan(number, options = this.validatorOptions) {
		return this.addConstraint(bigintGreaterThan(number, options));
	}
	greaterThanOrEqual(number, options = this.validatorOptions) {
		return this.addConstraint(bigintGreaterThanOrEqual(number, options));
	}
	equal(number, options = this.validatorOptions) {
		return this.addConstraint(bigintEqual(number, options));
	}
	notEqual(number, options = this.validatorOptions) {
		return this.addConstraint(bigintNotEqual(number, options));
	}
	positive(options = this.validatorOptions) {
		return this.greaterThanOrEqual(0n, options);
	}
	negative(options = this.validatorOptions) {
		return this.lessThan(0n, options);
	}
	divisibleBy(number, options = this.validatorOptions) {
		return this.addConstraint(bigintDivisibleBy(number, options));
	}
	abs(options = this.validatorOptions) {
		return this.transform((value) => (value < 0 ? -value : value), options);
	}
	intN(bits, options = this.validatorOptions) {
		return this.transform((value) => BigInt.asIntN(bits, value), options);
	}
	uintN(bits, options = this.validatorOptions) {
		return this.transform((value) => BigInt.asUintN(bits, value), options);
	}
	handle(value) {
		return typeof value === 'bigint'
			? Result.ok(value)
			: Result.err(new ValidationError('s.bigint()', this.validatorOptions.message ?? 'Expected a bigint primitive', value));
	}
};
__name$2(_BigIntValidator, 'BigIntValidator');
var BigIntValidator = _BigIntValidator;
function booleanTrue(options) {
	return {
		run(input) {
			return input
				? Result.ok(input)
				: Result.err(new ExpectedConstraintError('s.boolean().true()', options?.message ?? 'Invalid boolean value', input, 'true'));
		}
	};
}
__name$2(booleanTrue, 'booleanTrue');
function booleanFalse(options) {
	return {
		run(input) {
			return input
				? Result.err(new ExpectedConstraintError('s.boolean().false()', options?.message ?? 'Invalid boolean value', input, 'false'))
				: Result.ok(input);
		}
	};
}
__name$2(booleanFalse, 'booleanFalse');
var _BooleanValidator = class _BooleanValidator extends BaseValidator {
	true(options = this.validatorOptions) {
		return this.addConstraint(booleanTrue(options));
	}
	false(options = this.validatorOptions) {
		return this.addConstraint(booleanFalse(options));
	}
	equal(value, options = this.validatorOptions) {
		return value ? this.true(options) : this.false(options);
	}
	notEqual(value, options = this.validatorOptions) {
		return value ? this.false(options) : this.true(options);
	}
	handle(value) {
		return typeof value === 'boolean'
			? Result.ok(value)
			: Result.err(new ValidationError('s.boolean()', this.validatorOptions.message ?? 'Expected a boolean primitive', value));
	}
};
__name$2(_BooleanValidator, 'BooleanValidator');
var BooleanValidator = _BooleanValidator;
function dateComparator(comparator, name, expected, number, options) {
	return {
		run(input) {
			return comparator(input.getTime(), number)
				? Result.ok(input)
				: Result.err(new ExpectedConstraintError(name, options?.message ?? 'Invalid Date value', input, expected));
		}
	};
}
__name$2(dateComparator, 'dateComparator');
function dateLessThan(value, options) {
	return dateComparator(lessThan, 's.date().lessThan()', `expected < ${value.toISOString()}`, value.getTime(), options);
}
__name$2(dateLessThan, 'dateLessThan');
function dateLessThanOrEqual(value, options) {
	return dateComparator(lessThanOrEqual, 's.date().lessThanOrEqual()', `expected <= ${value.toISOString()}`, value.getTime(), options);
}
__name$2(dateLessThanOrEqual, 'dateLessThanOrEqual');
function dateGreaterThan(value, options) {
	return dateComparator(greaterThan, 's.date().greaterThan()', `expected > ${value.toISOString()}`, value.getTime(), options);
}
__name$2(dateGreaterThan, 'dateGreaterThan');
function dateGreaterThanOrEqual(value, options) {
	return dateComparator(greaterThanOrEqual, 's.date().greaterThanOrEqual()', `expected >= ${value.toISOString()}`, value.getTime(), options);
}
__name$2(dateGreaterThanOrEqual, 'dateGreaterThanOrEqual');
function dateEqual(value, options) {
	return dateComparator(equal, 's.date().equal()', `expected === ${value.toISOString()}`, value.getTime(), options);
}
__name$2(dateEqual, 'dateEqual');
function dateNotEqual(value, options) {
	return dateComparator(notEqual, 's.date().notEqual()', `expected !== ${value.toISOString()}`, value.getTime(), options);
}
__name$2(dateNotEqual, 'dateNotEqual');
function dateInvalid(options) {
	return {
		run(input) {
			return Number.isNaN(input.getTime())
				? Result.ok(input)
				: Result.err(new ExpectedConstraintError('s.date().invalid()', options?.message ?? 'Invalid Date value', input, 'expected === NaN'));
		}
	};
}
__name$2(dateInvalid, 'dateInvalid');
function dateValid(options) {
	return {
		run(input) {
			return Number.isNaN(input.getTime())
				? Result.err(new ExpectedConstraintError('s.date().valid()', options?.message ?? 'Invalid Date value', input, 'expected !== NaN'))
				: Result.ok(input);
		}
	};
}
__name$2(dateValid, 'dateValid');
var _DateValidator = class _DateValidator extends BaseValidator {
	lessThan(date, options = this.validatorOptions) {
		return this.addConstraint(dateLessThan(new Date(date), options));
	}
	lessThanOrEqual(date, options = this.validatorOptions) {
		return this.addConstraint(dateLessThanOrEqual(new Date(date), options));
	}
	greaterThan(date, options = this.validatorOptions) {
		return this.addConstraint(dateGreaterThan(new Date(date), options));
	}
	greaterThanOrEqual(date, options = this.validatorOptions) {
		return this.addConstraint(dateGreaterThanOrEqual(new Date(date), options));
	}
	equal(date, options = this.validatorOptions) {
		const resolved = new Date(date);
		return Number.isNaN(resolved.getTime()) ? this.invalid(options) : this.addConstraint(dateEqual(resolved, options));
	}
	notEqual(date, options = this.validatorOptions) {
		const resolved = new Date(date);
		return Number.isNaN(resolved.getTime()) ? this.valid(options) : this.addConstraint(dateNotEqual(resolved, options));
	}
	valid(options = this.validatorOptions) {
		return this.addConstraint(dateValid(options));
	}
	invalid(options = this.validatorOptions) {
		return this.addConstraint(dateInvalid(options));
	}
	handle(value) {
		return value instanceof Date
			? Result.ok(value)
			: Result.err(new ValidationError('s.date()', this.validatorOptions.message ?? 'Expected a Date', value));
	}
};
__name$2(_DateValidator, 'DateValidator');
var DateValidator = _DateValidator;
var _ExpectedValidationError = class _ExpectedValidationError extends ValidationError {
	constructor(validator, message, given, expected) {
		super(validator, message, given);
		this.expected = expected;
	}
	toJSON() {
		return {
			name: this.name,
			validator: this.validator,
			given: this.given,
			expected: this.expected,
			message: this.message
		};
	}
	[customInspectSymbolStackLess](depth, options) {
		const validator = options.stylize(this.validator, 'string');
		if (depth < 0) return options.stylize(`[ExpectedValidationError: ${validator}]`, 'special');
		const newOptions = {
			...options,
			depth: options.depth === null ? null : options.depth - 1
		};
		const padding = `
  ${options.stylize('|', 'undefined')} `;
		const expected = inspect2(this.expected, newOptions).replace(/\n/g, padding);
		const given = inspect2(this.given, newOptions).replace(/\n/g, padding);
		return `${`${options.stylize('ExpectedValidationError', 'special')} > ${validator}`}
  ${options.stylize(this.message, 'regexp')}
${`
  ${options.stylize('Expected:', 'string')}${padding}${expected}`}
${`
  ${options.stylize('Received:', 'regexp')}${padding}${given}`}`;
	}
};
__name$2(_ExpectedValidationError, 'ExpectedValidationError');
var ExpectedValidationError = _ExpectedValidationError;
var _InstanceValidator = class _InstanceValidator extends BaseValidator {
	constructor(expected, validatorOptions = {}, constraints = []) {
		super(validatorOptions, constraints);
		this.expected = expected;
	}
	handle(value) {
		return value instanceof this.expected
			? Result.ok(value)
			: Result.err(new ExpectedValidationError('s.instance(V)', this.validatorOptions.message ?? 'Expected', value, this.expected));
	}
	clone() {
		return Reflect.construct(this.constructor, [this.expected, this.validatorOptions, this.constraints]);
	}
};
__name$2(_InstanceValidator, 'InstanceValidator');
var InstanceValidator = _InstanceValidator;
var _LiteralValidator = class _LiteralValidator extends BaseValidator {
	constructor(literal, validatorOptions = {}, constraints = []) {
		super(validatorOptions, constraints);
		this.expected = literal;
	}
	handle(value) {
		return Object.is(value, this.expected)
			? Result.ok(value)
			: Result.err(
					new ExpectedValidationError('s.literal(V)', this.validatorOptions.message ?? 'Expected values to be equals', value, this.expected)
				);
	}
	clone() {
		return Reflect.construct(this.constructor, [this.expected, this.validatorOptions, this.constraints]);
	}
};
__name$2(_LiteralValidator, 'LiteralValidator');
var LiteralValidator = _LiteralValidator;
var _NeverValidator = class _NeverValidator extends BaseValidator {
	handle(value) {
		return Result.err(new ValidationError('s.never()', this.validatorOptions.message ?? 'Expected a value to not be passed', value));
	}
};
__name$2(_NeverValidator, 'NeverValidator');
var NeverValidator = _NeverValidator;
var _NullishValidator = class _NullishValidator extends BaseValidator {
	handle(value) {
		return value === void 0 || value === null
			? Result.ok(value)
			: Result.err(new ValidationError('s.nullish()', this.validatorOptions.message ?? 'Expected undefined or null', value));
	}
};
__name$2(_NullishValidator, 'NullishValidator');
var NullishValidator = _NullishValidator;
function numberComparator(comparator, name, expected, number, options) {
	return {
		run(input) {
			return comparator(input, number)
				? Result.ok(input)
				: Result.err(new ExpectedConstraintError(name, options?.message ?? 'Invalid number value', input, expected));
		}
	};
}
__name$2(numberComparator, 'numberComparator');
function numberLessThan(value, options) {
	return numberComparator(lessThan, 's.number().lessThan()', `expected < ${value}`, value, options);
}
__name$2(numberLessThan, 'numberLessThan');
function numberLessThanOrEqual(value, options) {
	return numberComparator(lessThanOrEqual, 's.number().lessThanOrEqual()', `expected <= ${value}`, value, options);
}
__name$2(numberLessThanOrEqual, 'numberLessThanOrEqual');
function numberGreaterThan(value, options) {
	return numberComparator(greaterThan, 's.number().greaterThan()', `expected > ${value}`, value, options);
}
__name$2(numberGreaterThan, 'numberGreaterThan');
function numberGreaterThanOrEqual(value, options) {
	return numberComparator(greaterThanOrEqual, 's.number().greaterThanOrEqual()', `expected >= ${value}`, value, options);
}
__name$2(numberGreaterThanOrEqual, 'numberGreaterThanOrEqual');
function numberEqual(value, options) {
	return numberComparator(equal, 's.number().equal()', `expected === ${value}`, value, options);
}
__name$2(numberEqual, 'numberEqual');
function numberNotEqual(value, options) {
	return numberComparator(notEqual, 's.number().notEqual()', `expected !== ${value}`, value, options);
}
__name$2(numberNotEqual, 'numberNotEqual');
function numberInt(options) {
	return {
		run(input) {
			return Number.isInteger(input)
				? Result.ok(input)
				: Result.err(
						new ExpectedConstraintError(
							's.number().int()',
							options?.message ?? 'Given value is not an integer',
							input,
							'Number.isInteger(expected) to be true'
						)
					);
		}
	};
}
__name$2(numberInt, 'numberInt');
function numberSafeInt(options) {
	return {
		run(input) {
			return Number.isSafeInteger(input)
				? Result.ok(input)
				: Result.err(
						new ExpectedConstraintError(
							's.number().safeInt()',
							options?.message ?? 'Given value is not a safe integer',
							input,
							'Number.isSafeInteger(expected) to be true'
						)
					);
		}
	};
}
__name$2(numberSafeInt, 'numberSafeInt');
function numberFinite(options) {
	return {
		run(input) {
			return Number.isFinite(input)
				? Result.ok(input)
				: Result.err(
						new ExpectedConstraintError(
							's.number().finite()',
							options?.message ?? 'Given value is not finite',
							input,
							'Number.isFinite(expected) to be true'
						)
					);
		}
	};
}
__name$2(numberFinite, 'numberFinite');
function numberNaN(options) {
	return {
		run(input) {
			return Number.isNaN(input)
				? Result.ok(input)
				: Result.err(
						new ExpectedConstraintError('s.number().equal(NaN)', options?.message ?? 'Invalid number value', input, 'expected === NaN')
					);
		}
	};
}
__name$2(numberNaN, 'numberNaN');
function numberNotNaN(options) {
	return {
		run(input) {
			return Number.isNaN(input)
				? Result.err(
						new ExpectedConstraintError('s.number().notEqual(NaN)', options?.message ?? 'Invalid number value', input, 'expected !== NaN')
					)
				: Result.ok(input);
		}
	};
}
__name$2(numberNotNaN, 'numberNotNaN');
function numberDivisibleBy(divider, options) {
	const expected = `expected % ${divider} === 0`;
	return {
		run(input) {
			return input % divider === 0
				? Result.ok(input)
				: Result.err(new ExpectedConstraintError('s.number().divisibleBy()', options?.message ?? 'Number is not divisible', input, expected));
		}
	};
}
__name$2(numberDivisibleBy, 'numberDivisibleBy');
var _NumberValidator = class _NumberValidator extends BaseValidator {
	lessThan(number, options = this.validatorOptions) {
		return this.addConstraint(numberLessThan(number, options));
	}
	lessThanOrEqual(number, options = this.validatorOptions) {
		return this.addConstraint(numberLessThanOrEqual(number, options));
	}
	greaterThan(number, options = this.validatorOptions) {
		return this.addConstraint(numberGreaterThan(number, options));
	}
	greaterThanOrEqual(number, options = this.validatorOptions) {
		return this.addConstraint(numberGreaterThanOrEqual(number, options));
	}
	equal(number, options = this.validatorOptions) {
		return Number.isNaN(number) ? this.addConstraint(numberNaN(options)) : this.addConstraint(numberEqual(number, options));
	}
	notEqual(number, options = this.validatorOptions) {
		return Number.isNaN(number) ? this.addConstraint(numberNotNaN(options)) : this.addConstraint(numberNotEqual(number, options));
	}
	int(options = this.validatorOptions) {
		return this.addConstraint(numberInt(options));
	}
	safeInt(options = this.validatorOptions) {
		return this.addConstraint(numberSafeInt(options));
	}
	finite(options = this.validatorOptions) {
		return this.addConstraint(numberFinite(options));
	}
	positive(options = this.validatorOptions) {
		return this.greaterThanOrEqual(0, options);
	}
	negative(options = this.validatorOptions) {
		return this.lessThan(0, options);
	}
	divisibleBy(divider, options = this.validatorOptions) {
		return this.addConstraint(numberDivisibleBy(divider, options));
	}
	abs(options = this.validatorOptions) {
		return this.transform(Math.abs, options);
	}
	sign(options = this.validatorOptions) {
		return this.transform(Math.sign, options);
	}
	trunc(options = this.validatorOptions) {
		return this.transform(Math.trunc, options);
	}
	floor(options = this.validatorOptions) {
		return this.transform(Math.floor, options);
	}
	fround(options = this.validatorOptions) {
		return this.transform(Math.fround, options);
	}
	round(options = this.validatorOptions) {
		return this.transform(Math.round, options);
	}
	ceil(options = this.validatorOptions) {
		return this.transform(Math.ceil, options);
	}
	handle(value) {
		return typeof value === 'number'
			? Result.ok(value)
			: Result.err(new ValidationError('s.number()', this.validatorOptions.message ?? 'Expected a number primitive', value));
	}
};
__name$2(_NumberValidator, 'NumberValidator');
var NumberValidator = _NumberValidator;
var _MissingPropertyError = class _MissingPropertyError extends BaseError {
	constructor(property, validatorOptions) {
		super(validatorOptions?.message ?? 'A required property is missing');
		this.property = property;
	}
	toJSON() {
		return {
			name: this.name,
			message: this.message,
			property: this.property
		};
	}
	[customInspectSymbolStackLess](depth, options) {
		const property = options.stylize(this.property.toString(), 'string');
		if (depth < 0) return options.stylize(`[MissingPropertyError: ${property}]`, 'special');
		return `${`${options.stylize('MissingPropertyError', 'special')} > ${property}`}
  ${options.stylize(this.message, 'regexp')}`;
	}
};
__name$2(_MissingPropertyError, 'MissingPropertyError');
var MissingPropertyError = _MissingPropertyError;
var _UnknownPropertyError = class _UnknownPropertyError extends BaseError {
	constructor(property, value, options) {
		super(options?.message ?? 'Received unexpected property');
		this.property = property;
		this.value = value;
	}
	toJSON() {
		return {
			name: this.name,
			message: this.message,
			property: this.property,
			value: this.value
		};
	}
	[customInspectSymbolStackLess](depth, options) {
		const property = options.stylize(this.property.toString(), 'string');
		if (depth < 0) return options.stylize(`[UnknownPropertyError: ${property}]`, 'special');
		const newOptions = {
			...options,
			depth: options.depth === null ? null : options.depth - 1,
			compact: true
		};
		const padding = `
  ${options.stylize('|', 'undefined')} `;
		const given = inspect2(this.value, newOptions).replace(/\n/g, padding);
		return `${`${options.stylize('UnknownPropertyError', 'special')} > ${property}`}
  ${options.stylize(this.message, 'regexp')}
${`
  ${options.stylize('Received:', 'regexp')}${padding}${given}`}`;
	}
};
__name$2(_UnknownPropertyError, 'UnknownPropertyError');
var UnknownPropertyError = _UnknownPropertyError;
var _DefaultValidator = class _DefaultValidator extends BaseValidator {
	constructor(validator, value, validatorOptions = {}, constraints = []) {
		super(validatorOptions, constraints);
		this.validator = validator;
		this.defaultValue = value;
	}
	default(value, options = this.validatorOptions) {
		const clone = this.clone();
		clone.validatorOptions = options;
		clone.defaultValue = value;
		return clone;
	}
	handle(value) {
		return typeof value === 'undefined' ? Result.ok(getValue(this.defaultValue)) : this.validator['handle'](value);
	}
	clone() {
		return Reflect.construct(this.constructor, [this.validator, this.defaultValue, this.validatorOptions, this.constraints]);
	}
};
__name$2(_DefaultValidator, 'DefaultValidator');
var DefaultValidator = _DefaultValidator;
var _CombinedError = class _CombinedError extends BaseError {
	constructor(errors, validatorOptions) {
		super(validatorOptions?.message ?? 'Received one or more errors');
		this.errors = errors;
	}
	[customInspectSymbolStackLess](depth, options) {
		if (depth < 0) return options.stylize('[CombinedError]', 'special');
		const newOptions = {
			...options,
			depth: options.depth === null ? null : options.depth - 1,
			compact: true
		};
		const padding = `
  ${options.stylize('|', 'undefined')} `;
		return `${`${options.stylize('CombinedError', 'special')} (${options.stylize(this.errors.length.toString(), 'number')})`}
  ${options.stylize(this.message, 'regexp')}

${this.errors
	.map((error, i3) => {
		return `  ${options.stylize((i3 + 1).toString(), 'number')} ${error[customInspectSymbolStackLess](depth - 1, newOptions).replace(/\n/g, padding)}`;
	})
	.join('\n\n')}`;
	}
};
__name$2(_CombinedError, 'CombinedError');
var CombinedError = _CombinedError;
var _UnionValidator = class _UnionValidator extends BaseValidator {
	constructor(validators, validatorOptions, constraints = []) {
		super(validatorOptions, constraints);
		this.validators = validators;
	}
	optional(options = this.validatorOptions) {
		if (this.validators.length === 0)
			return new _UnionValidator([new LiteralValidator(void 0, options)], this.validatorOptions, this.constraints);
		const [validator] = this.validators;
		if (validator instanceof LiteralValidator) {
			if (validator.expected === void 0) return this.clone();
			if (validator.expected === null)
				return new _UnionValidator([new NullishValidator(options), ...this.validators.slice(1)], this.validatorOptions, this.constraints);
		} else if (validator instanceof NullishValidator) return this.clone();
		return new _UnionValidator([new LiteralValidator(void 0, options), ...this.validators], this.validatorOptions);
	}
	required(options = this.validatorOptions) {
		if (this.validators.length === 0) return this.clone();
		const [validator] = this.validators;
		if (validator instanceof LiteralValidator) {
			if (validator.expected === void 0) return new _UnionValidator(this.validators.slice(1), this.validatorOptions, this.constraints);
		} else if (validator instanceof NullishValidator)
			return new _UnionValidator([new LiteralValidator(null, options), ...this.validators.slice(1)], this.validatorOptions, this.constraints);
		return this.clone();
	}
	nullable(options = this.validatorOptions) {
		if (this.validators.length === 0) return new _UnionValidator([new LiteralValidator(null, options)], this.validatorOptions, this.constraints);
		const [validator] = this.validators;
		if (validator instanceof LiteralValidator) {
			if (validator.expected === null) return this.clone();
			if (validator.expected === void 0)
				return new _UnionValidator([new NullishValidator(options), ...this.validators.slice(1)], this.validatorOptions, this.constraints);
		} else if (validator instanceof NullishValidator) return this.clone();
		return new _UnionValidator([new LiteralValidator(null, options), ...this.validators], this.validatorOptions);
	}
	nullish(options = this.validatorOptions) {
		if (this.validators.length === 0) return new _UnionValidator([new NullishValidator(options)], options, this.constraints);
		const [validator] = this.validators;
		if (validator instanceof LiteralValidator) {
			if (validator.expected === null || validator.expected === void 0)
				return new _UnionValidator([new NullishValidator(options), ...this.validators.slice(1)], options, this.constraints);
		} else if (validator instanceof NullishValidator) return this.clone();
		return new _UnionValidator([new NullishValidator(options), ...this.validators], options);
	}
	or(...predicates) {
		return new _UnionValidator([...this.validators, ...predicates], this.validatorOptions);
	}
	clone() {
		return Reflect.construct(this.constructor, [this.validators, this.validatorOptions, this.constraints]);
	}
	handle(value) {
		const errors = [];
		for (const validator of this.validators) {
			const result = validator.run(value);
			if (result.isOk()) return result;
			errors.push(result.error);
		}
		return Result.err(new CombinedError(errors, this.validatorOptions));
	}
};
__name$2(_UnionValidator, 'UnionValidator');
var UnionValidator = _UnionValidator;
var _ObjectValidator = class _ObjectValidator extends BaseValidator {
	constructor(shape, strategy = 0, validatorOptions = {}, constraints = []) {
		super(validatorOptions, constraints);
		this.keys = [];
		this.requiredKeys = /* @__PURE__ */ new Map();
		this.possiblyUndefinedKeys = /* @__PURE__ */ new Map();
		this.possiblyUndefinedKeysWithDefaults = /* @__PURE__ */ new Map();
		this.shape = shape;
		this.strategy = strategy;
		switch (this.strategy) {
			case 0:
				this.handleStrategy = (value) => this.handleIgnoreStrategy(value);
				break;
			case 1:
				this.handleStrategy = (value) => this.handleStrictStrategy(value);
				break;
			case 2:
				this.handleStrategy = (value) => this.handlePassthroughStrategy(value);
		}
		const shapeEntries = Object.entries(shape);
		this.keys = shapeEntries.map(([key]) => key);
		for (const [key, validator] of shapeEntries)
			if (validator instanceof UnionValidator) {
				const [possiblyLiteralOrNullishPredicate] = validator['validators'];
				if (possiblyLiteralOrNullishPredicate instanceof NullishValidator) this.possiblyUndefinedKeys.set(key, validator);
				else if (possiblyLiteralOrNullishPredicate instanceof LiteralValidator) {
					if (possiblyLiteralOrNullishPredicate.expected === void 0) this.possiblyUndefinedKeys.set(key, validator);
					else this.requiredKeys.set(key, validator);
				} else if (validator instanceof DefaultValidator) this.possiblyUndefinedKeysWithDefaults.set(key, validator);
				else this.requiredKeys.set(key, validator);
			} else if (validator instanceof NullishValidator) this.possiblyUndefinedKeys.set(key, validator);
			else if (validator instanceof LiteralValidator) {
				if (validator.expected === void 0) this.possiblyUndefinedKeys.set(key, validator);
				else this.requiredKeys.set(key, validator);
			} else if (validator instanceof DefaultValidator) this.possiblyUndefinedKeysWithDefaults.set(key, validator);
			else this.requiredKeys.set(key, validator);
	}
	strict(options = this.validatorOptions) {
		return Reflect.construct(this.constructor, [this.shape, 1, options, this.constraints]);
	}
	ignore(options = this.validatorOptions) {
		return Reflect.construct(this.constructor, [this.shape, 0, options, this.constraints]);
	}
	passthrough(options = this.validatorOptions) {
		return Reflect.construct(this.constructor, [this.shape, 2, options, this.constraints]);
	}
	partial(options = this.validatorOptions) {
		const shape = Object.fromEntries(this.keys.map((key) => [key, this.shape[key].optional(options)]));
		return Reflect.construct(this.constructor, [shape, this.strategy, options, this.constraints]);
	}
	required(options = this.validatorOptions) {
		const shape = Object.fromEntries(
			this.keys.map((key) => {
				let validator = this.shape[key];
				if (validator instanceof UnionValidator) validator = validator.required(options);
				return [key, validator];
			})
		);
		return Reflect.construct(this.constructor, [shape, this.strategy, options, this.constraints]);
	}
	extend(schema, options = this.validatorOptions) {
		const shape = {
			...this.shape,
			...(schema instanceof _ObjectValidator ? schema.shape : schema)
		};
		return Reflect.construct(this.constructor, [shape, this.strategy, options, this.constraints]);
	}
	pick(keys, options = this.validatorOptions) {
		const shape = Object.fromEntries(keys.filter((key) => this.keys.includes(key)).map((key) => [key, this.shape[key]]));
		return Reflect.construct(this.constructor, [shape, this.strategy, options, this.constraints]);
	}
	omit(keys, options = this.validatorOptions) {
		const shape = Object.fromEntries(this.keys.filter((key) => !keys.includes(key)).map((key) => [key, this.shape[key]]));
		return Reflect.construct(this.constructor, [shape, this.strategy, options, this.constraints]);
	}
	handle(value) {
		const typeOfValue = typeof value;
		if (typeOfValue !== 'object')
			return Result.err(
				new ValidationError(
					's.object(T)',
					this.validatorOptions.message ?? `Expected the value to be an object, but received ${typeOfValue} instead`,
					value
				)
			);
		if (value === null)
			return Result.err(new ValidationError('s.object(T)', this.validatorOptions.message ?? 'Expected the value to not be null', value));
		if (Array.isArray(value))
			return Result.err(new ValidationError('s.object(T)', this.validatorOptions.message ?? 'Expected the value to not be an array', value));
		if (!this.shouldRunConstraints) return Result.ok(value);
		for (const predicate of Object.values(this.shape)) predicate.setParent(this.parent ?? value);
		return this.handleStrategy(value);
	}
	clone() {
		return Reflect.construct(this.constructor, [this.shape, this.strategy, this.validatorOptions, this.constraints]);
	}
	handleIgnoreStrategy(value) {
		const errors = [];
		const finalObject = {};
		const inputEntries = new Map(Object.entries(value));
		const runPredicate = /* @__PURE__ */ __name$2((key, predicate) => {
			const result = predicate.run(value[key]);
			if (result.isOk()) finalObject[key] = result.value;
			else {
				const error = result.error;
				errors.push([key, error]);
			}
		}, 'runPredicate');
		for (const [key, predicate] of this.requiredKeys)
			if (inputEntries.delete(key)) runPredicate(key, predicate);
			else errors.push([key, new MissingPropertyError(key, this.validatorOptions)]);
		for (const [key, validator] of this.possiblyUndefinedKeysWithDefaults) {
			inputEntries.delete(key);
			runPredicate(key, validator);
		}
		if (inputEntries.size === 0)
			return errors.length === 0 ? Result.ok(finalObject) : Result.err(new CombinedPropertyError(errors, this.validatorOptions));
		if (this.possiblyUndefinedKeys.size > inputEntries.size)
			for (const [key] of inputEntries) {
				const predicate = this.possiblyUndefinedKeys.get(key);
				if (predicate) runPredicate(key, predicate);
			}
		else for (const [key, predicate] of this.possiblyUndefinedKeys) if (inputEntries.delete(key)) runPredicate(key, predicate);
		return errors.length === 0 ? Result.ok(finalObject) : Result.err(new CombinedPropertyError(errors, this.validatorOptions));
	}
	handleStrictStrategy(value) {
		const errors = [];
		const finalResult = {};
		const inputEntries = new Map(Object.entries(value));
		const runPredicate = /* @__PURE__ */ __name$2((key, predicate) => {
			const result = predicate.run(value[key]);
			if (result.isOk()) finalResult[key] = result.value;
			else {
				const error = result.error;
				errors.push([key, error]);
			}
		}, 'runPredicate');
		for (const [key, predicate] of this.requiredKeys)
			if (inputEntries.delete(key)) runPredicate(key, predicate);
			else errors.push([key, new MissingPropertyError(key, this.validatorOptions)]);
		for (const [key, validator] of this.possiblyUndefinedKeysWithDefaults) {
			inputEntries.delete(key);
			runPredicate(key, validator);
		}
		for (const [key, predicate] of this.possiblyUndefinedKeys) {
			if (inputEntries.size === 0) break;
			if (inputEntries.delete(key)) runPredicate(key, predicate);
		}
		if (inputEntries.size !== 0)
			for (const [key, value2] of inputEntries.entries()) errors.push([key, new UnknownPropertyError(key, value2, this.validatorOptions)]);
		return errors.length === 0 ? Result.ok(finalResult) : Result.err(new CombinedPropertyError(errors, this.validatorOptions));
	}
	handlePassthroughStrategy(value) {
		const result = this.handleIgnoreStrategy(value);
		return result.isErr()
			? result
			: Result.ok({
					...value,
					...result.value
				});
	}
};
__name$2(_ObjectValidator, 'ObjectValidator');
var ObjectValidator = _ObjectValidator;
var _PassthroughValidator = class _PassthroughValidator extends BaseValidator {
	handle(value) {
		return Result.ok(value);
	}
};
__name$2(_PassthroughValidator, 'PassthroughValidator');
var PassthroughValidator = _PassthroughValidator;
var _RecordValidator = class _RecordValidator extends BaseValidator {
	constructor(validator, validatorOptions = {}, constraints = []) {
		super(validatorOptions, constraints);
		this.validator = validator;
	}
	clone() {
		return Reflect.construct(this.constructor, [this.validator, this.validatorOptions, this.constraints]);
	}
	handle(value) {
		if (typeof value !== 'object')
			return Result.err(new ValidationError('s.record(T)', this.validatorOptions.message ?? 'Expected an object', value));
		if (value === null)
			return Result.err(new ValidationError('s.record(T)', this.validatorOptions.message ?? 'Expected the value to not be null', value));
		if (Array.isArray(value))
			return Result.err(new ValidationError('s.record(T)', this.validatorOptions.message ?? 'Expected the value to not be an array', value));
		if (!this.shouldRunConstraints) return Result.ok(value);
		const errors = [];
		const transformed = {};
		for (const [key, val] of Object.entries(value)) {
			const result = this.validator.run(val);
			if (result.isOk()) transformed[key] = result.value;
			else errors.push([key, result.error]);
		}
		return errors.length === 0 ? Result.ok(transformed) : Result.err(new CombinedPropertyError(errors, this.validatorOptions));
	}
};
__name$2(_RecordValidator, 'RecordValidator');
var RecordValidator = _RecordValidator;
var _SetValidator = class _SetValidator extends BaseValidator {
	constructor(validator, validatorOptions, constraints = []) {
		super(validatorOptions, constraints);
		this.validator = validator;
	}
	clone() {
		return Reflect.construct(this.constructor, [this.validator, this.validatorOptions, this.constraints]);
	}
	handle(values) {
		if (!(values instanceof Set)) return Result.err(new ValidationError('s.set(T)', this.validatorOptions.message ?? 'Expected a set', values));
		if (!this.shouldRunConstraints) return Result.ok(values);
		const errors = [];
		const transformed = /* @__PURE__ */ new Set();
		for (const value of values) {
			const result = this.validator.run(value);
			if (result.isOk()) transformed.add(result.value);
			else errors.push(result.error);
		}
		return errors.length === 0 ? Result.ok(transformed) : Result.err(new CombinedError(errors, this.validatorOptions));
	}
};
__name$2(_SetValidator, 'SetValidator');
var SetValidator = _SetValidator;
var accountRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_+-.]*)[A-Z0-9_+-]$/i;
function validateEmail(email) {
	if (!email) return false;
	const atIndex = email.indexOf('@');
	if (atIndex === -1) return false;
	if (atIndex > 64) return false;
	const domainIndex = atIndex + 1;
	if (email.includes('@', domainIndex)) return false;
	if (email.length - domainIndex > 255) return false;
	let dotIndex = email.indexOf('.', domainIndex);
	if (dotIndex === -1) return false;
	let lastDotIndex = domainIndex;
	do {
		if (dotIndex - lastDotIndex > 63) return false;
		lastDotIndex = dotIndex + 1;
	} while ((dotIndex = email.indexOf('.', lastDotIndex)) !== -1);
	if (email.length - lastDotIndex > 63) return false;
	return accountRegex.test(email.slice(0, atIndex)) && validateEmailDomain(email.slice(domainIndex));
}
__name$2(validateEmail, 'validateEmail');
function validateEmailDomain(domain) {
	try {
		return new URL(`http://${domain}`).hostname === domain;
	} catch {
		return false;
	}
}
__name$2(validateEmailDomain, 'validateEmailDomain');
var v4Seg = '(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])';
var v4Str = `(${v4Seg}[.]){3}${v4Seg}`;
var IPv4Reg = new RegExp(`^${v4Str}$`);
var v6Seg = '(?:[0-9a-fA-F]{1,4})';
var IPv6Reg = new RegExp(
	`^((?:${v6Seg}:){7}(?:${v6Seg}|:)|(?:${v6Seg}:){6}(?:${v4Str}|:${v6Seg}|:)|(?:${v6Seg}:){5}(?::${v4Str}|(:${v6Seg}){1,2}|:)|(?:${v6Seg}:){4}(?:(:${v6Seg}){0,1}:${v4Str}|(:${v6Seg}){1,3}|:)|(?:${v6Seg}:){3}(?:(:${v6Seg}){0,2}:${v4Str}|(:${v6Seg}){1,4}|:)|(?:${v6Seg}:){2}(?:(:${v6Seg}){0,3}:${v4Str}|(:${v6Seg}){1,5}|:)|(?:${v6Seg}:){1}(?:(:${v6Seg}){0,4}:${v4Str}|(:${v6Seg}){1,6}|:)|(?::((?::${v6Seg}){0,5}:${v4Str}|(?::${v6Seg}){1,7}|:)))(%[0-9a-zA-Z-.:]{1,})?$`
);
function isIPv4(s4) {
	return IPv4Reg.test(s4);
}
__name$2(isIPv4, 'isIPv4');
function isIPv6(s4) {
	return IPv6Reg.test(s4);
}
__name$2(isIPv6, 'isIPv6');
function isIP(s4) {
	if (isIPv4(s4)) return 4;
	if (isIPv6(s4)) return 6;
	return 0;
}
__name$2(isIP, 'isIP');
var phoneNumberRegex = /^((?:\+|0{0,2})\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
function validatePhoneNumber(input) {
	return phoneNumberRegex.test(input);
}
__name$2(validatePhoneNumber, 'validatePhoneNumber');
var _MultiplePossibilitiesConstraintError = class _MultiplePossibilitiesConstraintError extends BaseConstraintError {
	constructor(constraint, message, given, expected) {
		super(constraint, message, given);
		this.expected = expected;
	}
	toJSON() {
		return {
			name: this.name,
			message: this.message,
			constraint: this.constraint,
			given: this.given,
			expected: this.expected
		};
	}
	[customInspectSymbolStackLess](depth, options) {
		const constraint = options.stylize(this.constraint, 'string');
		if (depth < 0) return options.stylize(`[MultiplePossibilitiesConstraintError: ${constraint}]`, 'special');
		const newOptions = {
			...options,
			depth: options.depth === null ? null : options.depth - 1
		};
		const verticalLine = options.stylize('|', 'undefined');
		const padding = `
  ${verticalLine} `;
		const given = inspect2(this.given, newOptions).replace(/\n/g, padding);
		const header = `${options.stylize('MultiplePossibilitiesConstraintError', 'special')} > ${constraint}`;
		const message = options.stylize(this.message, 'regexp');
		const expectedPadding = `
  ${verticalLine} - `;
		return `${header}
  ${message}
${`
  ${options.stylize('Expected any of the following:', 'string')}${expectedPadding}${this.expected.map((possible) => options.stylize(possible, 'boolean')).join(expectedPadding)}`}
${`
  ${options.stylize('Received:', 'regexp')}${padding}${given}`}`;
	}
};
__name$2(_MultiplePossibilitiesConstraintError, 'MultiplePossibilitiesConstraintError');
var MultiplePossibilitiesConstraintError = _MultiplePossibilitiesConstraintError;
function combinedErrorFn(...fns) {
	switch (fns.length) {
		case 0:
			return () => null;
		case 1:
			return fns[0];
		case 2: {
			const [fn0, fn1] = fns;
			return (...params) => fn0(...params) || fn1(...params);
		}
		default:
			return (...params) => {
				for (const fn of fns) {
					const result = fn(...params);
					if (result) return result;
				}
				return null;
			};
	}
}
__name$2(combinedErrorFn, 'combinedErrorFn');
function createUrlValidators(options, validatorOptions) {
	const fns = [];
	if (options?.allowedProtocols?.length) fns.push(allowedProtocolsFn(options.allowedProtocols, validatorOptions));
	if (options?.allowedDomains?.length) fns.push(allowedDomainsFn(options.allowedDomains, validatorOptions));
	return combinedErrorFn(...fns);
}
__name$2(createUrlValidators, 'createUrlValidators');
function allowedProtocolsFn(allowedProtocols, options) {
	return (input, url) =>
		allowedProtocols.includes(url.protocol)
			? null
			: new MultiplePossibilitiesConstraintError('s.string().url()', options?.message ?? 'Invalid URL protocol', input, allowedProtocols);
}
__name$2(allowedProtocolsFn, 'allowedProtocolsFn');
function allowedDomainsFn(allowedDomains, options) {
	return (input, url) =>
		allowedDomains.includes(url.hostname)
			? null
			: new MultiplePossibilitiesConstraintError('s.string().url()', options?.message ?? 'Invalid URL domain', input, allowedDomains);
}
__name$2(allowedDomainsFn, 'allowedDomainsFn');
function stringLengthComparator(comparator, name, expected, length, options) {
	return {
		run(input) {
			return comparator(input.length, length)
				? Result.ok(input)
				: Result.err(new ExpectedConstraintError(name, options?.message ?? 'Invalid string length', input, expected));
		}
	};
}
__name$2(stringLengthComparator, 'stringLengthComparator');
function stringLengthLessThan(length, options) {
	return stringLengthComparator(lessThan, 's.string().lengthLessThan()', `expected.length < ${length}`, length, options);
}
__name$2(stringLengthLessThan, 'stringLengthLessThan');
function stringLengthLessThanOrEqual(length, options) {
	return stringLengthComparator(lessThanOrEqual, 's.string().lengthLessThanOrEqual()', `expected.length <= ${length}`, length, options);
}
__name$2(stringLengthLessThanOrEqual, 'stringLengthLessThanOrEqual');
function stringLengthGreaterThan(length, options) {
	return stringLengthComparator(greaterThan, 's.string().lengthGreaterThan()', `expected.length > ${length}`, length, options);
}
__name$2(stringLengthGreaterThan, 'stringLengthGreaterThan');
function stringLengthGreaterThanOrEqual(length, options) {
	return stringLengthComparator(greaterThanOrEqual, 's.string().lengthGreaterThanOrEqual()', `expected.length >= ${length}`, length, options);
}
__name$2(stringLengthGreaterThanOrEqual, 'stringLengthGreaterThanOrEqual');
function stringLengthEqual(length, options) {
	return stringLengthComparator(equal, 's.string().lengthEqual()', `expected.length === ${length}`, length, options);
}
__name$2(stringLengthEqual, 'stringLengthEqual');
function stringLengthNotEqual(length, options) {
	return stringLengthComparator(notEqual, 's.string().lengthNotEqual()', `expected.length !== ${length}`, length, options);
}
__name$2(stringLengthNotEqual, 'stringLengthNotEqual');
function stringEmail(options) {
	return {
		run(input) {
			return validateEmail(input)
				? Result.ok(input)
				: Result.err(
						new ExpectedConstraintError(
							's.string().email()',
							options?.message ?? 'Invalid email address',
							input,
							'expected to be an email address'
						)
					);
		}
	};
}
__name$2(stringEmail, 'stringEmail');
function stringRegexValidator(type, expected, regex, options) {
	return {
		run(input) {
			return regex.test(input)
				? Result.ok(input)
				: Result.err(new ExpectedConstraintError(type, options?.message ?? 'Invalid string format', input, expected));
		}
	};
}
__name$2(stringRegexValidator, 'stringRegexValidator');
function stringUrl(options, validatorOptions) {
	const validatorFn = createUrlValidators(options, validatorOptions);
	return {
		run(input) {
			let url;
			try {
				url = new URL(input);
			} catch {
				return Result.err(
					new ExpectedConstraintError('s.string().url()', validatorOptions?.message ?? 'Invalid URL', input, 'expected to match a URL')
				);
			}
			const validatorFnResult = validatorFn(input, url);
			if (validatorFnResult === null) return Result.ok(input);
			return Result.err(validatorFnResult);
		}
	};
}
__name$2(stringUrl, 'stringUrl');
function stringIp(version, options) {
	const ipVersion = version ? `v${version}` : '';
	const validatorFn = version === 4 ? isIPv4 : version === 6 ? isIPv6 : isIP;
	const name = `s.string().ip${ipVersion}()`;
	const message = `Invalid IP${ipVersion} address`;
	const expected = `expected to be an IP${ipVersion} address`;
	return {
		run(input) {
			return validatorFn(input)
				? Result.ok(input)
				: Result.err(new ExpectedConstraintError(name, options?.message ?? message, input, expected));
		}
	};
}
__name$2(stringIp, 'stringIp');
function stringRegex(regex, options) {
	return stringRegexValidator('s.string().regex()', `expected ${regex}.test(expected) to be true`, regex, options);
}
__name$2(stringRegex, 'stringRegex');
function stringUuid({ version = 4, nullable = false } = {}, options) {
	version ?? (version = '1-5');
	const regex = new RegExp(
		`^(?:[0-9A-F]{8}-[0-9A-F]{4}-[${version}][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}${nullable ? '|00000000-0000-0000-0000-000000000000' : ''})$`,
		'i'
	);
	return stringRegexValidator(
		's.string().uuid()',
		`expected to match UUID${typeof version === 'number' ? `v${version}` : ` in range of ${version}`}`,
		regex,
		options
	);
}
__name$2(stringUuid, 'stringUuid');
function stringDate(options) {
	return {
		run(input) {
			const time = Date.parse(input);
			return Number.isNaN(time)
				? Result.err(
						new ExpectedConstraintError(
							's.string().date()',
							options?.message ?? 'Invalid date string',
							input,
							'expected to be a valid date string (in the ISO 8601 or ECMA-262 format)'
						)
					)
				: Result.ok(input);
		}
	};
}
__name$2(stringDate, 'stringDate');
function stringPhone(options) {
	return {
		run(input) {
			return validatePhoneNumber(input)
				? Result.ok(input)
				: Result.err(
						new ExpectedConstraintError(
							's.string().phone()',
							options?.message ?? 'Invalid phone number',
							input,
							'expected to be a phone number'
						)
					);
		}
	};
}
__name$2(stringPhone, 'stringPhone');
var _StringValidator = class _StringValidator extends BaseValidator {
	lengthLessThan(length, options = this.validatorOptions) {
		return this.addConstraint(stringLengthLessThan(length, options));
	}
	lengthLessThanOrEqual(length, options = this.validatorOptions) {
		return this.addConstraint(stringLengthLessThanOrEqual(length, options));
	}
	lengthGreaterThan(length, options = this.validatorOptions) {
		return this.addConstraint(stringLengthGreaterThan(length, options));
	}
	lengthGreaterThanOrEqual(length, options = this.validatorOptions) {
		return this.addConstraint(stringLengthGreaterThanOrEqual(length, options));
	}
	lengthEqual(length, options = this.validatorOptions) {
		return this.addConstraint(stringLengthEqual(length, options));
	}
	lengthNotEqual(length, options = this.validatorOptions) {
		return this.addConstraint(stringLengthNotEqual(length, options));
	}
	email(options = this.validatorOptions) {
		return this.addConstraint(stringEmail(options));
	}
	url(options, validatorOptions = this.validatorOptions) {
		if (this.isUrlOptions(options)) return this.addConstraint(stringUrl(options, validatorOptions));
		return this.addConstraint(stringUrl(void 0, validatorOptions));
	}
	uuid(options, validatorOptions = this.validatorOptions) {
		if (this.isStringUuidOptions(options)) return this.addConstraint(stringUuid(options, validatorOptions));
		return this.addConstraint(stringUuid(void 0, validatorOptions));
	}
	regex(regex, options = this.validatorOptions) {
		return this.addConstraint(stringRegex(regex, options));
	}
	date(options = this.validatorOptions) {
		return this.addConstraint(stringDate(options));
	}
	ipv4(options = this.validatorOptions) {
		return this.ip(4, options);
	}
	ipv6(options = this.validatorOptions) {
		return this.ip(6, options);
	}
	ip(version, options = this.validatorOptions) {
		return this.addConstraint(stringIp(version, options));
	}
	phone(options = this.validatorOptions) {
		return this.addConstraint(stringPhone(options));
	}
	handle(value) {
		return typeof value === 'string'
			? Result.ok(value)
			: Result.err(new ValidationError('s.string()', this.validatorOptions.message ?? 'Expected a string primitive', value));
	}
	isUrlOptions(options) {
		return options?.message === void 0;
	}
	isStringUuidOptions(options) {
		return options?.message === void 0;
	}
};
__name$2(_StringValidator, 'StringValidator');
var StringValidator = _StringValidator;
var _TupleValidator = class _TupleValidator extends BaseValidator {
	constructor(validators, validatorOptions = {}, constraints = []) {
		super(validatorOptions, constraints);
		this.validators = [];
		this.validators = validators;
	}
	clone() {
		return Reflect.construct(this.constructor, [this.validators, this.validatorOptions, this.constraints]);
	}
	handle(values) {
		if (!Array.isArray(values))
			return Result.err(new ValidationError('s.tuple(T)', this.validatorOptions.message ?? 'Expected an array', values));
		if (values.length !== this.validators.length)
			return Result.err(
				new ValidationError('s.tuple(T)', this.validatorOptions.message ?? `Expected an array of length ${this.validators.length}`, values)
			);
		if (!this.shouldRunConstraints) return Result.ok(values);
		const errors = [];
		const transformed = [];
		for (let i3 = 0; i3 < values.length; i3++) {
			const result = this.validators[i3].run(values[i3]);
			if (result.isOk()) transformed.push(result.value);
			else errors.push([i3, result.error]);
		}
		return errors.length === 0 ? Result.ok(transformed) : Result.err(new CombinedPropertyError(errors, this.validatorOptions));
	}
};
__name$2(_TupleValidator, 'TupleValidator');
var TupleValidator = _TupleValidator;
var _MapValidator = class _MapValidator extends BaseValidator {
	constructor(keyValidator, valueValidator, validatorOptions = {}, constraints = []) {
		super(validatorOptions, constraints);
		this.keyValidator = keyValidator;
		this.valueValidator = valueValidator;
	}
	clone() {
		return Reflect.construct(this.constructor, [this.keyValidator, this.valueValidator, this.validatorOptions, this.constraints]);
	}
	handle(value) {
		if (!(value instanceof Map)) return Result.err(new ValidationError('s.map(K, V)', this.validatorOptions.message ?? 'Expected a map', value));
		if (!this.shouldRunConstraints) return Result.ok(value);
		const errors = [];
		const transformed = /* @__PURE__ */ new Map();
		for (const [key, val] of value.entries()) {
			const keyResult = this.keyValidator.run(key);
			const valueResult = this.valueValidator.run(val);
			const { length } = errors;
			if (keyResult.isErr()) errors.push([key, keyResult.error]);
			if (valueResult.isErr()) errors.push([key, valueResult.error]);
			if (errors.length === length) transformed.set(keyResult.value, valueResult.value);
		}
		return errors.length === 0 ? Result.ok(transformed) : Result.err(new CombinedPropertyError(errors, this.validatorOptions));
	}
};
__name$2(_MapValidator, 'MapValidator');
var MapValidator = _MapValidator;
var _LazyValidator = class _LazyValidator extends BaseValidator {
	constructor(validator, validatorOptions = {}, constraints = []) {
		super(validatorOptions, constraints);
		this.validator = validator;
	}
	clone() {
		return Reflect.construct(this.constructor, [this.validator, this.validatorOptions, this.constraints]);
	}
	handle(values) {
		return this.validator(values).run(values);
	}
};
__name$2(_LazyValidator, 'LazyValidator');
var LazyValidator = _LazyValidator;
var _UnknownEnumValueError = class _UnknownEnumValueError extends BaseError {
	constructor(value, keys, enumMappings, validatorOptions) {
		super(validatorOptions?.message ?? 'Expected the value to be one of the following enum values:');
		this.value = value;
		this.enumKeys = keys;
		this.enumMappings = enumMappings;
	}
	toJSON() {
		return {
			name: this.name,
			message: this.message,
			value: this.value,
			enumKeys: this.enumKeys,
			enumMappings: [...this.enumMappings.entries()]
		};
	}
	[customInspectSymbolStackLess](depth, options) {
		const value = options.stylize(this.value.toString(), 'string');
		if (depth < 0) return options.stylize(`[UnknownEnumValueError: ${value}]`, 'special');
		const padding = `
  ${options.stylize('|', 'undefined')} `;
		const pairs = this.enumKeys
			.map((key) => {
				const enumValue = this.enumMappings.get(key);
				return `${options.stylize(key, 'string')} or ${options.stylize(enumValue.toString(), typeof enumValue === 'number' ? 'number' : 'string')}`;
			})
			.join(padding);
		return `${`${options.stylize('UnknownEnumValueError', 'special')} > ${value}`}
  ${options.stylize(this.message, 'regexp')}
${`${padding}${pairs}`}`;
	}
};
__name$2(_UnknownEnumValueError, 'UnknownEnumValueError');
var UnknownEnumValueError = _UnknownEnumValueError;
var _NativeEnumValidator = class _NativeEnumValidator extends BaseValidator {
	constructor(enumShape, validatorOptions = {}) {
		super(validatorOptions);
		this.hasNumericElements = false;
		this.enumMapping = /* @__PURE__ */ new Map();
		this.enumShape = enumShape;
		this.enumKeys = Object.keys(enumShape).filter((key) => {
			return typeof enumShape[enumShape[key]] !== 'number';
		});
		for (const key of this.enumKeys) {
			const enumValue = enumShape[key];
			this.enumMapping.set(key, enumValue);
			this.enumMapping.set(enumValue, enumValue);
			if (typeof enumValue === 'number') {
				this.hasNumericElements = true;
				this.enumMapping.set(`${enumValue}`, enumValue);
			}
		}
	}
	handle(value) {
		const typeOfValue = typeof value;
		if (typeOfValue === 'number') {
			if (!this.hasNumericElements)
				return Result.err(
					new ValidationError('s.nativeEnum(T)', this.validatorOptions.message ?? 'Expected the value to be a string', value)
				);
		} else if (typeOfValue !== 'string')
			return Result.err(
				new ValidationError('s.nativeEnum(T)', this.validatorOptions.message ?? 'Expected the value to be a string or number', value)
			);
		const casted = value;
		const possibleEnumValue = this.enumMapping.get(casted);
		return typeof possibleEnumValue === 'undefined'
			? Result.err(new UnknownEnumValueError(casted, this.enumKeys, this.enumMapping, this.validatorOptions))
			: Result.ok(possibleEnumValue);
	}
	clone() {
		return Reflect.construct(this.constructor, [this.enumShape, this.validatorOptions]);
	}
};
__name$2(_NativeEnumValidator, 'NativeEnumValidator');
var NativeEnumValidator = _NativeEnumValidator;
function typedArrayByteLengthComparator(comparator, name, expected, length, options) {
	return {
		run(input) {
			return comparator(input.byteLength, length)
				? Result.ok(input)
				: Result.err(new ExpectedConstraintError(name, options?.message ?? 'Invalid Typed Array byte length', input, expected));
		}
	};
}
__name$2(typedArrayByteLengthComparator, 'typedArrayByteLengthComparator');
function typedArrayByteLengthLessThan(value, options) {
	return typedArrayByteLengthComparator(lessThan, 's.typedArray(T).byteLengthLessThan()', `expected.byteLength < ${value}`, value, options);
}
__name$2(typedArrayByteLengthLessThan, 'typedArrayByteLengthLessThan');
function typedArrayByteLengthLessThanOrEqual(value, options) {
	return typedArrayByteLengthComparator(
		lessThanOrEqual,
		's.typedArray(T).byteLengthLessThanOrEqual()',
		`expected.byteLength <= ${value}`,
		value,
		options
	);
}
__name$2(typedArrayByteLengthLessThanOrEqual, 'typedArrayByteLengthLessThanOrEqual');
function typedArrayByteLengthGreaterThan(value, options) {
	return typedArrayByteLengthComparator(greaterThan, 's.typedArray(T).byteLengthGreaterThan()', `expected.byteLength > ${value}`, value, options);
}
__name$2(typedArrayByteLengthGreaterThan, 'typedArrayByteLengthGreaterThan');
function typedArrayByteLengthGreaterThanOrEqual(value, options) {
	return typedArrayByteLengthComparator(
		greaterThanOrEqual,
		's.typedArray(T).byteLengthGreaterThanOrEqual()',
		`expected.byteLength >= ${value}`,
		value,
		options
	);
}
__name$2(typedArrayByteLengthGreaterThanOrEqual, 'typedArrayByteLengthGreaterThanOrEqual');
function typedArrayByteLengthEqual(value, options) {
	return typedArrayByteLengthComparator(equal, 's.typedArray(T).byteLengthEqual()', `expected.byteLength === ${value}`, value, options);
}
__name$2(typedArrayByteLengthEqual, 'typedArrayByteLengthEqual');
function typedArrayByteLengthNotEqual(value, options) {
	return typedArrayByteLengthComparator(notEqual, 's.typedArray(T).byteLengthNotEqual()', `expected.byteLength !== ${value}`, value, options);
}
__name$2(typedArrayByteLengthNotEqual, 'typedArrayByteLengthNotEqual');
function typedArrayByteLengthRange(start, endBefore, options) {
	const expected = `expected.byteLength >= ${start} && expected.byteLength < ${endBefore}`;
	return {
		run(input) {
			return input.byteLength >= start && input.byteLength < endBefore
				? Result.ok(input)
				: Result.err(
						new ExpectedConstraintError(
							's.typedArray(T).byteLengthRange()',
							options?.message ?? 'Invalid Typed Array byte length',
							input,
							expected
						)
					);
		}
	};
}
__name$2(typedArrayByteLengthRange, 'typedArrayByteLengthRange');
function typedArrayByteLengthRangeInclusive(start, end, options) {
	const expected = `expected.byteLength >= ${start} && expected.byteLength <= ${end}`;
	return {
		run(input) {
			return input.byteLength >= start && input.byteLength <= end
				? Result.ok(input)
				: Result.err(
						new ExpectedConstraintError(
							's.typedArray(T).byteLengthRangeInclusive()',
							options?.message ?? 'Invalid Typed Array byte length',
							input,
							expected
						)
					);
		}
	};
}
__name$2(typedArrayByteLengthRangeInclusive, 'typedArrayByteLengthRangeInclusive');
function typedArrayByteLengthRangeExclusive(startAfter, endBefore, options) {
	const expected = `expected.byteLength > ${startAfter} && expected.byteLength < ${endBefore}`;
	return {
		run(input) {
			return input.byteLength > startAfter && input.byteLength < endBefore
				? Result.ok(input)
				: Result.err(
						new ExpectedConstraintError(
							's.typedArray(T).byteLengthRangeExclusive()',
							options?.message ?? 'Invalid Typed Array byte length',
							input,
							expected
						)
					);
		}
	};
}
__name$2(typedArrayByteLengthRangeExclusive, 'typedArrayByteLengthRangeExclusive');
function typedArrayLengthComparator(comparator, name, expected, length, options) {
	return {
		run(input) {
			return comparator(input.length, length)
				? Result.ok(input)
				: Result.err(new ExpectedConstraintError(name, options?.message ?? 'Invalid Typed Array length', input, expected));
		}
	};
}
__name$2(typedArrayLengthComparator, 'typedArrayLengthComparator');
function typedArrayLengthLessThan(value, options) {
	return typedArrayLengthComparator(lessThan, 's.typedArray(T).lengthLessThan()', `expected.length < ${value}`, value, options);
}
__name$2(typedArrayLengthLessThan, 'typedArrayLengthLessThan');
function typedArrayLengthLessThanOrEqual(value, options) {
	return typedArrayLengthComparator(lessThanOrEqual, 's.typedArray(T).lengthLessThanOrEqual()', `expected.length <= ${value}`, value, options);
}
__name$2(typedArrayLengthLessThanOrEqual, 'typedArrayLengthLessThanOrEqual');
function typedArrayLengthGreaterThan(value, options) {
	return typedArrayLengthComparator(greaterThan, 's.typedArray(T).lengthGreaterThan()', `expected.length > ${value}`, value, options);
}
__name$2(typedArrayLengthGreaterThan, 'typedArrayLengthGreaterThan');
function typedArrayLengthGreaterThanOrEqual(value, options) {
	return typedArrayLengthComparator(
		greaterThanOrEqual,
		's.typedArray(T).lengthGreaterThanOrEqual()',
		`expected.length >= ${value}`,
		value,
		options
	);
}
__name$2(typedArrayLengthGreaterThanOrEqual, 'typedArrayLengthGreaterThanOrEqual');
function typedArrayLengthEqual(value, options) {
	return typedArrayLengthComparator(equal, 's.typedArray(T).lengthEqual()', `expected.length === ${value}`, value, options);
}
__name$2(typedArrayLengthEqual, 'typedArrayLengthEqual');
function typedArrayLengthNotEqual(value, options) {
	return typedArrayLengthComparator(notEqual, 's.typedArray(T).lengthNotEqual()', `expected.length !== ${value}`, value, options);
}
__name$2(typedArrayLengthNotEqual, 'typedArrayLengthNotEqual');
function typedArrayLengthRange(start, endBefore, options) {
	const expected = `expected.length >= ${start} && expected.length < ${endBefore}`;
	return {
		run(input) {
			return input.length >= start && input.length < endBefore
				? Result.ok(input)
				: Result.err(
						new ExpectedConstraintError(
							's.typedArray(T).lengthRange()',
							options?.message ?? 'Invalid Typed Array length',
							input,
							expected
						)
					);
		}
	};
}
__name$2(typedArrayLengthRange, 'typedArrayLengthRange');
function typedArrayLengthRangeInclusive(start, end, options) {
	const expected = `expected.length >= ${start} && expected.length <= ${end}`;
	return {
		run(input) {
			return input.length >= start && input.length <= end
				? Result.ok(input)
				: Result.err(
						new ExpectedConstraintError(
							's.typedArray(T).lengthRangeInclusive()',
							options?.message ?? 'Invalid Typed Array length',
							input,
							expected
						)
					);
		}
	};
}
__name$2(typedArrayLengthRangeInclusive, 'typedArrayLengthRangeInclusive');
function typedArrayLengthRangeExclusive(startAfter, endBefore, options) {
	const expected = `expected.length > ${startAfter} && expected.length < ${endBefore}`;
	return {
		run(input) {
			return input.length > startAfter && input.length < endBefore
				? Result.ok(input)
				: Result.err(
						new ExpectedConstraintError(
							's.typedArray(T).lengthRangeExclusive()',
							options?.message ?? 'Invalid Typed Array length',
							input,
							expected
						)
					);
		}
	};
}
__name$2(typedArrayLengthRangeExclusive, 'typedArrayLengthRangeExclusive');
var vowels = ['a', 'e', 'i', 'o', 'u'];
var aOrAn = /* @__PURE__ */ __name$2((word) => {
	return `${vowels.includes(word[0].toLowerCase()) ? 'an' : 'a'} ${word}`;
}, 'aOrAn');
var TypedArrays = {
	Int8Array: (x2) => x2 instanceof Int8Array,
	Uint8Array: (x2) => x2 instanceof Uint8Array,
	Uint8ClampedArray: (x2) => x2 instanceof Uint8ClampedArray,
	Int16Array: (x2) => x2 instanceof Int16Array,
	Uint16Array: (x2) => x2 instanceof Uint16Array,
	Int32Array: (x2) => x2 instanceof Int32Array,
	Uint32Array: (x2) => x2 instanceof Uint32Array,
	Float32Array: (x2) => x2 instanceof Float32Array,
	Float64Array: (x2) => x2 instanceof Float64Array,
	BigInt64Array: (x2) => x2 instanceof BigInt64Array,
	BigUint64Array: (x2) => x2 instanceof BigUint64Array,
	TypedArray: (x2) => ArrayBuffer.isView(x2) && !(x2 instanceof DataView)
};
var _TypedArrayValidator = class _TypedArrayValidator extends BaseValidator {
	constructor(type, validatorOptions = {}, constraints = []) {
		super(validatorOptions, constraints);
		this.type = type;
	}
	byteLengthLessThan(length, options = this.validatorOptions) {
		return this.addConstraint(typedArrayByteLengthLessThan(length, options));
	}
	byteLengthLessThanOrEqual(length, options = this.validatorOptions) {
		return this.addConstraint(typedArrayByteLengthLessThanOrEqual(length, options));
	}
	byteLengthGreaterThan(length, options = this.validatorOptions) {
		return this.addConstraint(typedArrayByteLengthGreaterThan(length, options));
	}
	byteLengthGreaterThanOrEqual(length, options = this.validatorOptions) {
		return this.addConstraint(typedArrayByteLengthGreaterThanOrEqual(length, options));
	}
	byteLengthEqual(length, options = this.validatorOptions) {
		return this.addConstraint(typedArrayByteLengthEqual(length, options));
	}
	byteLengthNotEqual(length, options = this.validatorOptions) {
		return this.addConstraint(typedArrayByteLengthNotEqual(length, options));
	}
	byteLengthRange(start, endBefore, options = this.validatorOptions) {
		return this.addConstraint(typedArrayByteLengthRange(start, endBefore, options));
	}
	byteLengthRangeInclusive(startAt, endAt, options = this.validatorOptions) {
		return this.addConstraint(typedArrayByteLengthRangeInclusive(startAt, endAt, options));
	}
	byteLengthRangeExclusive(startAfter, endBefore, options = this.validatorOptions) {
		return this.addConstraint(typedArrayByteLengthRangeExclusive(startAfter, endBefore, options));
	}
	lengthLessThan(length, options = this.validatorOptions) {
		return this.addConstraint(typedArrayLengthLessThan(length, options));
	}
	lengthLessThanOrEqual(length, options = this.validatorOptions) {
		return this.addConstraint(typedArrayLengthLessThanOrEqual(length, options));
	}
	lengthGreaterThan(length, options = this.validatorOptions) {
		return this.addConstraint(typedArrayLengthGreaterThan(length, options));
	}
	lengthGreaterThanOrEqual(length, options = this.validatorOptions) {
		return this.addConstraint(typedArrayLengthGreaterThanOrEqual(length, options));
	}
	lengthEqual(length, options = this.validatorOptions) {
		return this.addConstraint(typedArrayLengthEqual(length, options));
	}
	lengthNotEqual(length, options = this.validatorOptions) {
		return this.addConstraint(typedArrayLengthNotEqual(length, options));
	}
	lengthRange(start, endBefore, options = this.validatorOptions) {
		return this.addConstraint(typedArrayLengthRange(start, endBefore, options));
	}
	lengthRangeInclusive(startAt, endAt, options = this.validatorOptions) {
		return this.addConstraint(typedArrayLengthRangeInclusive(startAt, endAt, options));
	}
	lengthRangeExclusive(startAfter, endBefore, options = this.validatorOptions) {
		return this.addConstraint(typedArrayLengthRangeExclusive(startAfter, endBefore, options));
	}
	clone() {
		return Reflect.construct(this.constructor, [this.type, this.validatorOptions, this.constraints]);
	}
	handle(value) {
		return TypedArrays[this.type](value)
			? Result.ok(value)
			: Result.err(new ValidationError('s.typedArray()', this.validatorOptions.message ?? `Expected ${aOrAn(this.type)}`, value));
	}
};
__name$2(_TypedArrayValidator, 'TypedArrayValidator');
var TypedArrayValidator = _TypedArrayValidator;
var _Shapes = class _Shapes {
	string(options) {
		return new StringValidator(options);
	}
	number(options) {
		return new NumberValidator(options);
	}
	bigint(options) {
		return new BigIntValidator(options);
	}
	boolean(options) {
		return new BooleanValidator(options);
	}
	date(options) {
		return new DateValidator(options);
	}
	object(shape, options) {
		return new ObjectValidator(shape, 0, options);
	}
	undefined(options) {
		return this.literal(void 0, { equalsOptions: options });
	}
	null(options) {
		return this.literal(null, { equalsOptions: options });
	}
	nullish(options) {
		return new NullishValidator(options);
	}
	any(options) {
		return new PassthroughValidator(options);
	}
	unknown(options) {
		return new PassthroughValidator(options);
	}
	never(options) {
		return new NeverValidator(options);
	}
	enum(values, options) {
		return this.union(
			values.map((value) => this.literal(value, { equalsOptions: options })),
			options
		);
	}
	nativeEnum(enumShape, options) {
		return new NativeEnumValidator(enumShape, options);
	}
	literal(value, options) {
		if (value instanceof Date) return this.date(options?.dateOptions).equal(value, options?.equalsOptions);
		return new LiteralValidator(value, options?.equalsOptions);
	}
	instance(expected, options) {
		return new InstanceValidator(expected, options);
	}
	union(validators, options) {
		return new UnionValidator(validators, options);
	}
	array(validator, options) {
		return new ArrayValidator(validator, options);
	}
	typedArray(type = 'TypedArray', options) {
		return new TypedArrayValidator(type, options);
	}
	int8Array(options) {
		return this.typedArray('Int8Array', options);
	}
	uint8Array(options) {
		return this.typedArray('Uint8Array', options);
	}
	uint8ClampedArray(options) {
		return this.typedArray('Uint8ClampedArray', options);
	}
	int16Array(options) {
		return this.typedArray('Int16Array', options);
	}
	uint16Array(options) {
		return this.typedArray('Uint16Array', options);
	}
	int32Array(options) {
		return this.typedArray('Int32Array', options);
	}
	uint32Array(options) {
		return this.typedArray('Uint32Array', options);
	}
	float32Array(options) {
		return this.typedArray('Float32Array', options);
	}
	float64Array(options) {
		return this.typedArray('Float64Array', options);
	}
	bigInt64Array(options) {
		return this.typedArray('BigInt64Array', options);
	}
	bigUint64Array(options) {
		return this.typedArray('BigUint64Array', options);
	}
	tuple(validators, options) {
		return new TupleValidator(validators, options);
	}
	set(validator, options) {
		return new SetValidator(validator, options);
	}
	record(validator, options) {
		return new RecordValidator(validator, options);
	}
	map(keyValidator, valueValidator, options) {
		return new MapValidator(keyValidator, valueValidator, options);
	}
	lazy(validator, options) {
		return new LazyValidator(validator, options);
	}
};
__name$2(_Shapes, 'Shapes');
var s3 = new _Shapes();
/**
 * @license MIT
 * @copyright 2020 Colin McDonnell
 * @see https://github.com/colinhacks/zod/blob/master/LICENSE
 */
//#endregion
//#region ../../node_modules/.pnpm/@discordjs+formatters@0.6.2/node_modules/@discordjs/formatters/dist/index.mjs
var __defProp$1 = Object.defineProperty;
var __name$1 = (target, value) =>
	__defProp$1(target, 'name', {
		value,
		configurable: true
	});
function escapeMarkdown(text, options = {}) {
	const {
		codeBlock: codeBlock2 = true,
		inlineCode: inlineCode2 = true,
		bold: bold2 = true,
		italic: italic2 = true,
		underline: underline2 = true,
		strikethrough: strikethrough2 = true,
		spoiler: spoiler2 = true,
		codeBlockContent = true,
		inlineCodeContent = true,
		escape = true,
		heading: heading2 = false,
		bulletedList = false,
		numberedList = false,
		maskedLink = false
	} = options;
	if (!codeBlockContent)
		return text
			.split('```')
			.map((subString, index, array) => {
				if (index % 2 && index !== array.length - 1) return subString;
				return escapeMarkdown(subString, {
					inlineCode: inlineCode2,
					bold: bold2,
					italic: italic2,
					underline: underline2,
					strikethrough: strikethrough2,
					spoiler: spoiler2,
					inlineCodeContent,
					escape,
					heading: heading2,
					bulletedList,
					numberedList,
					maskedLink
				});
			})
			.join(codeBlock2 ? '\\`\\`\\`' : '```');
	if (!inlineCodeContent)
		return text
			.split(/(?<=^|[^`])`(?=[^`]|$)/g)
			.map((subString, index, array) => {
				if (index % 2 && index !== array.length - 1) return subString;
				return escapeMarkdown(subString, {
					codeBlock: codeBlock2,
					bold: bold2,
					italic: italic2,
					underline: underline2,
					strikethrough: strikethrough2,
					spoiler: spoiler2,
					escape,
					heading: heading2,
					bulletedList,
					numberedList,
					maskedLink
				});
			})
			.join(inlineCode2 ? '\\`' : '`');
	let res = text;
	if (escape) res = escapeEscape(res);
	if (inlineCode2) res = escapeInlineCode(res);
	if (codeBlock2) res = escapeCodeBlock(res);
	if (italic2) res = escapeItalic(res);
	if (bold2) res = escapeBold(res);
	if (underline2) res = escapeUnderline(res);
	if (strikethrough2) res = escapeStrikethrough(res);
	if (spoiler2) res = escapeSpoiler(res);
	if (heading2) res = escapeHeading(res);
	if (bulletedList) res = escapeBulletedList(res);
	if (numberedList) res = escapeNumberedList(res);
	if (maskedLink) res = escapeMaskedLink(res);
	return res;
}
__name$1(escapeMarkdown, 'escapeMarkdown');
function escapeCodeBlock(text) {
	return text.replaceAll('```', '\\`\\`\\`');
}
__name$1(escapeCodeBlock, 'escapeCodeBlock');
function escapeInlineCode(text) {
	return text.replaceAll(/(?<=^|[^`])``?(?=[^`]|$)/g, (match) => (match.length === 2 ? '\\`\\`' : '\\`'));
}
__name$1(escapeInlineCode, 'escapeInlineCode');
function escapeItalic(text) {
	let idx = 0;
	const newText = text.replaceAll(/(?<=^|[^*])(?<!(?<!<)https?:\/\/\S*|<[^\s:]+:\/[^\s>]*)\*([^*]|\*\*|$)/g, (_, match) => {
		if (match === '**') return ++idx % 2 ? `\\*${match}` : `${match}\\*`;
		return `\\*${match}`;
	});
	idx = 0;
	return newText.replaceAll(/(?<=^|[^_])(?<!<a?:.+|(?<!<)https?:\/\/\S*|<[^\s:]:\/[^\s>]*)_(?!:\d+>)([^_]|__|$)/g, (_, match) => {
		if (match === '__') return ++idx % 2 ? `\\_${match}` : `${match}\\_`;
		return `\\_${match}`;
	});
}
__name$1(escapeItalic, 'escapeItalic');
function escapeBold(text) {
	let idx = 0;
	return text.replaceAll(/\*\*(\*)?/g, (_, match) => {
		if (match) return ++idx % 2 ? `${match}\\*\\*` : `\\*\\*${match}`;
		return '\\*\\*';
	});
}
__name$1(escapeBold, 'escapeBold');
function escapeUnderline(text) {
	let idx = 0;
	return text.replaceAll(/(?<!<a?:.+|https?:\/\/\S+)__(_)?(?!:\d+>)/g, (_, match) => {
		if (match) return ++idx % 2 ? `${match}\\_\\_` : `\\_\\_${match}`;
		return '\\_\\_';
	});
}
__name$1(escapeUnderline, 'escapeUnderline');
function escapeStrikethrough(text) {
	return text.replaceAll('~~', '\\~\\~');
}
__name$1(escapeStrikethrough, 'escapeStrikethrough');
function escapeSpoiler(text) {
	return text.replaceAll('||', '\\|\\|');
}
__name$1(escapeSpoiler, 'escapeSpoiler');
function escapeEscape(text) {
	return text.replaceAll('\\', '\\\\');
}
__name$1(escapeEscape, 'escapeEscape');
function escapeHeading(text) {
	return text.replaceAll(/^( {0,2})([*-] )?( *)(#{1,3} )/gm, '$1$2$3\\$4');
}
__name$1(escapeHeading, 'escapeHeading');
function escapeBulletedList(text) {
	return text.replaceAll(/^( *)([*-])( +)/gm, '$1\\$2$3');
}
__name$1(escapeBulletedList, 'escapeBulletedList');
function escapeNumberedList(text) {
	return text.replaceAll(/^( *\d+)\./gm, '$1\\.');
}
__name$1(escapeNumberedList, 'escapeNumberedList');
function escapeMaskedLink(text) {
	return text.replaceAll(/\[.+]\(.+\)/gm, '\\$&');
}
__name$1(escapeMaskedLink, 'escapeMaskedLink');
function codeBlock(language, content) {
	return content === void 0
		? `\`\`\`
${language}
\`\`\``
		: `\`\`\`${language}
${content}
\`\`\``;
}
__name$1(codeBlock, 'codeBlock');
function inlineCode(content) {
	return `\`${content}\``;
}
__name$1(inlineCode, 'inlineCode');
function italic(content) {
	return `_${content}_`;
}
__name$1(italic, 'italic');
function bold(content) {
	return `**${content}**`;
}
__name$1(bold, 'bold');
function underscore(content) {
	return underline(content);
}
__name$1(underscore, 'underscore');
function underline(content) {
	return `__${content}__`;
}
__name$1(underline, 'underline');
function strikethrough(content) {
	return `~~${content}~~`;
}
__name$1(strikethrough, 'strikethrough');
function quote(content) {
	return `> ${content}`;
}
__name$1(quote, 'quote');
function blockQuote(content) {
	return `>>> ${content}`;
}
__name$1(blockQuote, 'blockQuote');
function hideLinkEmbed(url) {
	return `<${url}>`;
}
__name$1(hideLinkEmbed, 'hideLinkEmbed');
function hyperlink(content, url, title) {
	return title ? `[${content}](${url} "${title}")` : `[${content}](${url})`;
}
__name$1(hyperlink, 'hyperlink');
function spoiler(content) {
	return `||${content}||`;
}
__name$1(spoiler, 'spoiler');
function userMention(userId) {
	return `<@${userId}>`;
}
__name$1(userMention, 'userMention');
function channelMention(channelId) {
	return `<#${channelId}>`;
}
__name$1(channelMention, 'channelMention');
function roleMention(roleId) {
	return `<@&${roleId}>`;
}
__name$1(roleMention, 'roleMention');
function linkedRoleMention(roleId) {
	return `<id:linked-roles:${roleId}>`;
}
__name$1(linkedRoleMention, 'linkedRoleMention');
function chatInputApplicationCommandMention(commandName, subcommandGroupName, subcommandName, commandId) {
	if (commandId !== void 0) return `</${commandName} ${subcommandGroupName} ${subcommandName}:${commandId}>`;
	if (subcommandName !== void 0) return `</${commandName} ${subcommandGroupName}:${subcommandName}>`;
	return `</${commandName}:${subcommandGroupName}>`;
}
__name$1(chatInputApplicationCommandMention, 'chatInputApplicationCommandMention');
function formatEmoji(emojiIdOrOptions, animated) {
	const {
		id,
		animated: isAnimated,
		name: emojiName
	} = typeof emojiIdOrOptions === 'string'
		? {
				id: emojiIdOrOptions,
				animated: animated ?? false
			}
		: emojiIdOrOptions;
	return `<${isAnimated ? 'a' : ''}:${emojiName ?? 'emoji'}:${id}>`;
}
__name$1(formatEmoji, 'formatEmoji');
function channelLink(channelId, guildId) {
	return `https://discord.com/channels/${guildId ?? '@me'}/${channelId}`;
}
__name$1(channelLink, 'channelLink');
function messageLink(channelId, messageId, guildId) {
	return `${guildId === void 0 ? channelLink(channelId) : channelLink(channelId, guildId)}/${messageId}`;
}
__name$1(messageLink, 'messageLink');
function heading(content, level) {
	switch (level) {
		case 3:
			return `### ${content}`;
		case 2:
			return `## ${content}`;
		default:
			return `# ${content}`;
	}
}
__name$1(heading, 'heading');
function listCallback(element, startNumber, depth = 0) {
	if (Array.isArray(element)) return element.map((element2) => listCallback(element2, startNumber, depth + 1)).join('\n');
	return `${'  '.repeat(depth - 1)}${startNumber ? `${startNumber}.` : '-'} ${element}`;
}
__name$1(listCallback, 'listCallback');
function orderedList(list, startNumber = 1) {
	return listCallback(list, Math.max(startNumber, 1));
}
__name$1(orderedList, 'orderedList');
function unorderedList(list) {
	return listCallback(list);
}
__name$1(unorderedList, 'unorderedList');
function subtext(content) {
	return `-# ${content}`;
}
__name$1(subtext, 'subtext');
function time(timeOrSeconds, style) {
	if (typeof timeOrSeconds !== 'number') timeOrSeconds = Math.floor((timeOrSeconds?.getTime() ?? Date.now()) / 1e3);
	return typeof style === 'string' ? `<t:${timeOrSeconds}:${style}>` : `<t:${timeOrSeconds}>`;
}
__name$1(time, 'time');
function applicationDirectory(applicationId, skuId) {
	const url = `https://discord.com/application-directory/${applicationId}/store`;
	return skuId ? `${url}/${skuId}` : url;
}
__name$1(applicationDirectory, 'applicationDirectory');
function email(email2, headers) {
	if (headers)
		return `<${email2}?${new URLSearchParams(Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]))).toString()}>`;
	return `<${email2}>`;
}
__name$1(email, 'email');
function phoneNumber(phoneNumber2) {
	if (!phoneNumber2.startsWith('+')) throw new Error('Phone number must start with a "+" sign.');
	return `<${phoneNumber2}>`;
}
__name$1(phoneNumber, 'phoneNumber');
//#endregion
//#region ../../node_modules/.pnpm/ts-mixer@6.0.4/node_modules/ts-mixer/dist/esm/index.js
var import_fast_deep_equal = /* @__PURE__ */ __toESM(
	/* @__PURE__ */ __commonJSMin((exports, module) => {
		module.exports = function equal(a, b) {
			if (a === b) return true;
			if (a && b && typeof a == 'object' && typeof b == 'object') {
				if (a.constructor !== b.constructor) return false;
				var length, i, keys;
				if (Array.isArray(a)) {
					length = a.length;
					if (length != b.length) return false;
					for (i = length; i-- !== 0; ) if (!equal(a[i], b[i])) return false;
					return true;
				}
				if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
				if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
				if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
				keys = Object.keys(a);
				length = keys.length;
				if (length !== Object.keys(b).length) return false;
				for (i = length; i-- !== 0; ) if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
				for (i = length; i-- !== 0; ) {
					var key = keys[i];
					if (!equal(a[key], b[key])) return false;
				}
				return true;
			}
			return a !== a && b !== b;
		};
	})(),
	1
);
/**
 * Utility function that works like `Object.apply`, but copies getters and setters properly as well.  Additionally gives
 * the option to exclude properties by name.
 */
var copyProps = (dest, src, exclude = []) => {
	const props = Object.getOwnPropertyDescriptors(src);
	for (let prop of exclude) delete props[prop];
	Object.defineProperties(dest, props);
};
/**
 * Returns the full chain of prototypes up until Object.prototype given a starting object.  The order of prototypes will
 * be closest to farthest in the chain.
 */
var protoChain = (obj, currentChain = [obj]) => {
	const proto = Object.getPrototypeOf(obj);
	if (proto === null) return currentChain;
	return protoChain(proto, [...currentChain, proto]);
};
/**
 * Identifies the nearest ancestor common to all the given objects in their prototype chains.  For most unrelated
 * objects, this function should return Object.prototype.
 */
var nearestCommonProto = (...objs) => {
	if (objs.length === 0) return void 0;
	let commonProto = void 0;
	const protoChains = objs.map((obj) => protoChain(obj));
	while (protoChains.every((protoChain) => protoChain.length > 0)) {
		const protos = protoChains.map((protoChain) => protoChain.pop());
		const potentialCommonProto = protos[0];
		if (protos.every((proto) => proto === potentialCommonProto)) commonProto = potentialCommonProto;
		else break;
	}
	return commonProto;
};
/**
 * Creates a new prototype object that is a mixture of the given prototypes.  The mixing is achieved by first
 * identifying the nearest common ancestor and using it as the prototype for a new object.  Then all properties/methods
 * downstream of this prototype (ONLY downstream) are copied into the new object.
 *
 * The resulting prototype is more performant than softMixProtos(...), as well as ES5 compatible.  However, it's not as
 * flexible as updates to the source prototypes aren't captured by the mixed result.  See softMixProtos for why you may
 * want to use that instead.
 */
var hardMixProtos = (ingredients, constructor, exclude = []) => {
	var _a;
	const base = (_a = nearestCommonProto(...ingredients)) !== null && _a !== void 0 ? _a : Object.prototype;
	const mixedProto = Object.create(base);
	const visitedProtos = protoChain(base);
	for (let prototype of ingredients) {
		let protos = protoChain(prototype);
		for (let i = protos.length - 1; i >= 0; i--) {
			let newProto = protos[i];
			if (visitedProtos.indexOf(newProto) === -1) {
				copyProps(mixedProto, newProto, ['constructor', ...exclude]);
				visitedProtos.push(newProto);
			}
		}
	}
	mixedProto.constructor = constructor;
	return mixedProto;
};
var unique = (arr) => arr.filter((e, i) => arr.indexOf(e) == i);
/**
 * Finds the ingredient with the given prop, searching in reverse order and breadth-first if searching ingredient
 * prototypes is required.
 */
var getIngredientWithProp = (prop, ingredients) => {
	const protoChains = ingredients.map((ingredient) => protoChain(ingredient));
	let protoDepth = 0;
	let protosAreLeftToSearch = true;
	while (protosAreLeftToSearch) {
		protosAreLeftToSearch = false;
		for (let i = ingredients.length - 1; i >= 0; i--) {
			const searchTarget = protoChains[i][protoDepth];
			if (searchTarget !== void 0 && searchTarget !== null) {
				protosAreLeftToSearch = true;
				if (Object.getOwnPropertyDescriptor(searchTarget, prop) != void 0) return protoChains[i][0];
			}
		}
		protoDepth++;
	}
};
/**
 * "Mixes" ingredients by wrapping them in a Proxy.  The optional prototype argument allows the mixed object to sit
 * downstream of an existing prototype chain.  Note that "properties" cannot be added, deleted, or modified.
 */
var proxyMix = (ingredients, prototype = Object.prototype) =>
	new Proxy(
		{},
		{
			getPrototypeOf() {
				return prototype;
			},
			setPrototypeOf() {
				throw Error('Cannot set prototype of Proxies created by ts-mixer');
			},
			getOwnPropertyDescriptor(_, prop) {
				return Object.getOwnPropertyDescriptor(getIngredientWithProp(prop, ingredients) || {}, prop);
			},
			defineProperty() {
				throw new Error('Cannot define new properties on Proxies created by ts-mixer');
			},
			has(_, prop) {
				return getIngredientWithProp(prop, ingredients) !== void 0 || prototype[prop] !== void 0;
			},
			get(_, prop) {
				return (getIngredientWithProp(prop, ingredients) || prototype)[prop];
			},
			set(_, prop, val) {
				const ingredientWithProp = getIngredientWithProp(prop, ingredients);
				if (ingredientWithProp === void 0) throw new Error('Cannot set new properties on Proxies created by ts-mixer');
				ingredientWithProp[prop] = val;
				return true;
			},
			deleteProperty() {
				throw new Error('Cannot delete properties on Proxies created by ts-mixer');
			},
			ownKeys() {
				return ingredients.map(Object.getOwnPropertyNames).reduce((prev, curr) => curr.concat(prev.filter((key) => curr.indexOf(key) < 0)));
			}
		}
	);
/**
 * Creates a new proxy-prototype object that is a "soft" mixture of the given prototypes.  The mixing is achieved by
 * proxying all property access to the ingredients.  This is not ES5 compatible and less performant.  However, any
 * changes made to the source prototypes will be reflected in the proxy-prototype, which may be desirable.
 */
var softMixProtos = (ingredients, constructor) => proxyMix([...ingredients, { constructor }]);
var settings = {
	initFunction: null,
	staticsStrategy: 'copy',
	prototypeStrategy: 'copy',
	decoratorInheritance: 'deep'
};
var mixins = /* @__PURE__ */ new WeakMap();
var getMixinsForClass = (clazz) => mixins.get(clazz);
var registerMixins = (mixedClass, constituents) => mixins.set(mixedClass, constituents);
var mergeObjectsOfDecorators = (o1, o2) => {
	var _a, _b;
	const allKeys = unique([...Object.getOwnPropertyNames(o1), ...Object.getOwnPropertyNames(o2)]);
	const mergedObject = {};
	for (let key of allKeys)
		mergedObject[key] = unique([
			...((_a = o1 === null || o1 === void 0 ? void 0 : o1[key]) !== null && _a !== void 0 ? _a : []),
			...((_b = o2 === null || o2 === void 0 ? void 0 : o2[key]) !== null && _b !== void 0 ? _b : [])
		]);
	return mergedObject;
};
var mergePropertyAndMethodDecorators = (d1, d2) => {
	var _a, _b, _c, _d;
	return {
		property: mergeObjectsOfDecorators(
			(_a = d1 === null || d1 === void 0 ? void 0 : d1.property) !== null && _a !== void 0 ? _a : {},
			(_b = d2 === null || d2 === void 0 ? void 0 : d2.property) !== null && _b !== void 0 ? _b : {}
		),
		method: mergeObjectsOfDecorators(
			(_c = d1 === null || d1 === void 0 ? void 0 : d1.method) !== null && _c !== void 0 ? _c : {},
			(_d = d2 === null || d2 === void 0 ? void 0 : d2.method) !== null && _d !== void 0 ? _d : {}
		)
	};
};
var mergeDecorators = (d1, d2) => {
	var _a, _b, _c, _d, _e, _f;
	return {
		class: unique([
			...((_a = d1 === null || d1 === void 0 ? void 0 : d1.class) !== null && _a !== void 0 ? _a : []),
			...((_b = d2 === null || d2 === void 0 ? void 0 : d2.class) !== null && _b !== void 0 ? _b : [])
		]),
		static: mergePropertyAndMethodDecorators(
			(_c = d1 === null || d1 === void 0 ? void 0 : d1.static) !== null && _c !== void 0 ? _c : {},
			(_d = d2 === null || d2 === void 0 ? void 0 : d2.static) !== null && _d !== void 0 ? _d : {}
		),
		instance: mergePropertyAndMethodDecorators(
			(_e = d1 === null || d1 === void 0 ? void 0 : d1.instance) !== null && _e !== void 0 ? _e : {},
			(_f = d2 === null || d2 === void 0 ? void 0 : d2.instance) !== null && _f !== void 0 ? _f : {}
		)
	};
};
var decorators = /* @__PURE__ */ new Map();
var findAllConstituentClasses = (...classes) => {
	var _a;
	const allClasses = /* @__PURE__ */ new Set();
	const frontier = /* @__PURE__ */ new Set(classes);
	while (frontier.size > 0)
		for (let clazz of frontier) {
			const protoChainClasses = protoChain(clazz.prototype).map((proto) => proto.constructor);
			const mixinClasses = (_a = getMixinsForClass(clazz)) !== null && _a !== void 0 ? _a : [];
			const newClasses = [...protoChainClasses, ...mixinClasses].filter((c) => !allClasses.has(c));
			for (let newClass of newClasses) frontier.add(newClass);
			allClasses.add(clazz);
			frontier.delete(clazz);
		}
	return [...allClasses];
};
var deepDecoratorSearch = (...classes) => {
	const decoratorsForClassChain = findAllConstituentClasses(...classes)
		.map((clazz) => decorators.get(clazz))
		.filter((decorators) => !!decorators);
	if (decoratorsForClassChain.length == 0) return {};
	if (decoratorsForClassChain.length == 1) return decoratorsForClassChain[0];
	return decoratorsForClassChain.reduce((d1, d2) => mergeDecorators(d1, d2));
};
var directDecoratorSearch = (...classes) => {
	const classDecorators = classes.map((clazz) => getDecoratorsForClass(clazz));
	if (classDecorators.length === 0) return {};
	if (classDecorators.length === 1) return classDecorators[0];
	return classDecorators.reduce((d1, d2) => mergeDecorators(d1, d2));
};
var getDecoratorsForClass = (clazz) => {
	let decoratorsForClass = decorators.get(clazz);
	if (!decoratorsForClass) {
		decoratorsForClass = {};
		decorators.set(clazz, decoratorsForClass);
	}
	return decoratorsForClass;
};
function Mixin(...constructors) {
	var _a, _b, _c;
	const prototypes = constructors.map((constructor) => constructor.prototype);
	const initFunctionName = settings.initFunction;
	if (initFunctionName !== null) {
		const initFunctions = prototypes.map((proto) => proto[initFunctionName]).filter((func) => typeof func === 'function');
		const combinedInitFunction = function (...args) {
			for (let initFunction of initFunctions) initFunction.apply(this, args);
		};
		const extraProto = { [initFunctionName]: combinedInitFunction };
		prototypes.push(extraProto);
	}
	function MixedClass(...args) {
		for (const constructor of constructors) copyProps(this, new constructor(...args));
		if (initFunctionName !== null && typeof this[initFunctionName] === 'function') this[initFunctionName].apply(this, args);
	}
	MixedClass.prototype = settings.prototypeStrategy === 'copy' ? hardMixProtos(prototypes, MixedClass) : softMixProtos(prototypes, MixedClass);
	Object.setPrototypeOf(
		MixedClass,
		settings.staticsStrategy === 'copy' ? hardMixProtos(constructors, null, ['prototype']) : proxyMix(constructors, Function.prototype)
	);
	let DecoratedMixedClass = MixedClass;
	if (settings.decoratorInheritance !== 'none') {
		const classDecorators =
			settings.decoratorInheritance === 'deep' ? deepDecoratorSearch(...constructors) : directDecoratorSearch(...constructors);
		for (let decorator of (_a = classDecorators === null || classDecorators === void 0 ? void 0 : classDecorators.class) !== null && _a !== void 0
			? _a
			: []) {
			const result = decorator(DecoratedMixedClass);
			if (result) DecoratedMixedClass = result;
		}
		applyPropAndMethodDecorators(
			(_b = classDecorators === null || classDecorators === void 0 ? void 0 : classDecorators.static) !== null && _b !== void 0 ? _b : {},
			DecoratedMixedClass
		);
		applyPropAndMethodDecorators(
			(_c = classDecorators === null || classDecorators === void 0 ? void 0 : classDecorators.instance) !== null && _c !== void 0 ? _c : {},
			DecoratedMixedClass.prototype
		);
	}
	registerMixins(DecoratedMixedClass, constructors);
	return DecoratedMixedClass;
}
var applyPropAndMethodDecorators = (propAndMethodDecorators, target) => {
	const propDecorators = propAndMethodDecorators.property;
	const methodDecorators = propAndMethodDecorators.method;
	if (propDecorators) for (let key in propDecorators) for (let decorator of propDecorators[key]) decorator(target, key);
	if (methodDecorators)
		for (let key in methodDecorators)
			for (let decorator of methodDecorators[key]) decorator(target, key, Object.getOwnPropertyDescriptor(target, key));
};
/**
 * A decorator version of the `Mixin` function.  You'll want to use this instead of `Mixin` for mixing generic classes.
 */
var mix =
	(...ingredients) =>
	(decoratedClass) => {
		const mixedClass = Mixin(...ingredients.concat([decoratedClass]));
		Object.defineProperty(mixedClass, 'name', {
			value: decoratedClass.name,
			writable: false
		});
		return mixedClass;
	};
//#endregion
//#region ../../node_modules/.pnpm/@discordjs+builders@1.14.1/node_modules/@discordjs/builders/dist/index.mjs
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __name = (target, value) =>
	__defProp(target, 'name', {
		value,
		configurable: true
	});
var __export = (target, all) => {
	for (var name in all)
		__defProp(target, name, {
			get: all[name],
			enumerable: true
		});
};
var __decorateClass = (decorators, target, key, kind) => {
	var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
	for (var i = decorators.length - 1, decorator; i >= 0; i--)
		if ((decorator = decorators[i])) result = (kind ? decorator(target, key, result) : decorator(result)) || result;
	if (kind && result) __defProp(target, key, result);
	return result;
};
__export(
	{},
	{
		RGBPredicate: () => RGBPredicate,
		authorNamePredicate: () => authorNamePredicate,
		colorPredicate: () => colorPredicate,
		descriptionPredicate: () => descriptionPredicate,
		embedAuthorPredicate: () => embedAuthorPredicate,
		embedFieldPredicate: () => embedFieldPredicate,
		embedFieldsArrayPredicate: () => embedFieldsArrayPredicate,
		embedFooterPredicate: () => embedFooterPredicate,
		fieldInlinePredicate: () => fieldInlinePredicate,
		fieldLengthPredicate: () => fieldLengthPredicate,
		fieldNamePredicate: () => fieldNamePredicate,
		fieldValuePredicate: () => fieldValuePredicate,
		footerTextPredicate: () => footerTextPredicate,
		imageURLPredicate: () => imageURLPredicate,
		timestampPredicate: () => timestampPredicate,
		titlePredicate: () => titlePredicate,
		urlPredicate: () => urlPredicate,
		validateFieldLength: () => validateFieldLength
	}
);
var validate = true;
function enableValidators() {
	return (validate = true);
}
__name(enableValidators, 'enableValidators');
function disableValidators() {
	return (validate = false);
}
__name(disableValidators, 'disableValidators');
function isValidationEnabled() {
	return validate;
}
__name(isValidationEnabled, 'isValidationEnabled');
var fieldNamePredicate = s3.string().lengthLessThanOrEqual(256).setValidationEnabled(isValidationEnabled);
var fieldValuePredicate = s3.string().lengthLessThanOrEqual(1024).setValidationEnabled(isValidationEnabled);
var fieldInlinePredicate = s3.boolean().optional();
var embedFieldPredicate = s3
	.object({
		name: fieldNamePredicate,
		value: fieldValuePredicate,
		inline: fieldInlinePredicate
	})
	.setValidationEnabled(isValidationEnabled);
var embedFieldsArrayPredicate = embedFieldPredicate.array().setValidationEnabled(isValidationEnabled);
var fieldLengthPredicate = s3.number().lessThanOrEqual(25).setValidationEnabled(isValidationEnabled);
function validateFieldLength(amountAdding, fields) {
	fieldLengthPredicate.parse((fields?.length ?? 0) + amountAdding);
}
__name(validateFieldLength, 'validateFieldLength');
var authorNamePredicate = fieldNamePredicate.lengthGreaterThanOrEqual(1).nullable().setValidationEnabled(isValidationEnabled);
var imageURLPredicate = s3
	.string()
	.url({ allowedProtocols: ['http:', 'https:', 'attachment:'] })
	.nullish()
	.setValidationEnabled(isValidationEnabled);
var urlPredicate = s3
	.string()
	.url({ allowedProtocols: ['http:', 'https:'] })
	.nullish()
	.setValidationEnabled(isValidationEnabled);
var embedAuthorPredicate = s3
	.object({
		name: authorNamePredicate,
		iconURL: imageURLPredicate,
		url: urlPredicate
	})
	.setValidationEnabled(isValidationEnabled);
var RGBPredicate = s3.number().int().greaterThanOrEqual(0).lessThanOrEqual(255).setValidationEnabled(isValidationEnabled);
var colorPredicate = s3
	.number()
	.int()
	.greaterThanOrEqual(0)
	.lessThanOrEqual(16777215)
	.or(s3.tuple([RGBPredicate, RGBPredicate, RGBPredicate]))
	.nullable()
	.setValidationEnabled(isValidationEnabled);
var descriptionPredicate = s3.string().lengthGreaterThanOrEqual(1).lengthLessThanOrEqual(4096).nullable().setValidationEnabled(isValidationEnabled);
var footerTextPredicate = s3.string().lengthGreaterThanOrEqual(1).lengthLessThanOrEqual(2048).nullable().setValidationEnabled(isValidationEnabled);
var embedFooterPredicate = s3
	.object({
		text: footerTextPredicate,
		iconURL: imageURLPredicate
	})
	.setValidationEnabled(isValidationEnabled);
var timestampPredicate = s3.union([s3.number(), s3.date()]).nullable().setValidationEnabled(isValidationEnabled);
var titlePredicate = fieldNamePredicate.lengthGreaterThanOrEqual(1).nullable().setValidationEnabled(isValidationEnabled);
function normalizeArray(arr) {
	if (Array.isArray(arr[0])) return [...arr[0]];
	return arr;
}
__name(normalizeArray, 'normalizeArray');
var EmbedBuilder = class {
	static {
		__name(this, 'EmbedBuilder');
	}
	/**
	 * The API data associated with this embed.
	 */
	data;
	/**
	 * Creates a new embed from API data.
	 *
	 * @param data - The API data to create this embed with
	 */
	constructor(data = {}) {
		this.data = { ...data };
		if (data.timestamp) this.data.timestamp = new Date(data.timestamp).toISOString();
	}
	/**
	 * Appends fields to the embed.
	 *
	 * @remarks
	 * This method accepts either an array of fields or a variable number of field parameters.
	 * The maximum amount of fields that can be added is 25.
	 * @example
	 * Using an array:
	 * ```ts
	 * const fields: APIEmbedField[] = ...;
	 * const embed = new EmbedBuilder()
	 * 	.addFields(fields);
	 * ```
	 * @example
	 * Using rest parameters (variadic):
	 * ```ts
	 * const embed = new EmbedBuilder()
	 * 	.addFields(
	 * 		{ name: 'Field 1', value: 'Value 1' },
	 * 		{ name: 'Field 2', value: 'Value 2' },
	 * 	);
	 * ```
	 * @param fields - The fields to add
	 */
	addFields(...fields) {
		const normalizedFields = normalizeArray(fields);
		validateFieldLength(normalizedFields.length, this.data.fields);
		embedFieldsArrayPredicate.parse(normalizedFields);
		if (this.data.fields) this.data.fields.push(...normalizedFields);
		else this.data.fields = normalizedFields;
		return this;
	}
	/**
	 * Removes, replaces, or inserts fields for this embed.
	 *
	 * @remarks
	 * This method behaves similarly
	 * to {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/splice | Array.prototype.splice()}.
	 * The maximum amount of fields that can be added is 25.
	 *
	 * It's useful for modifying and adjusting order of the already-existing fields of an embed.
	 * @example
	 * Remove the first field:
	 * ```ts
	 * embed.spliceFields(0, 1);
	 * ```
	 * @example
	 * Remove the first n fields:
	 * ```ts
	 * const n = 4;
	 * embed.spliceFields(0, n);
	 * ```
	 * @example
	 * Remove the last field:
	 * ```ts
	 * embed.spliceFields(-1, 1);
	 * ```
	 * @param index - The index to start at
	 * @param deleteCount - The number of fields to remove
	 * @param fields - The replacing field objects
	 */
	spliceFields(index, deleteCount, ...fields) {
		validateFieldLength(fields.length - deleteCount, this.data.fields);
		embedFieldsArrayPredicate.parse(fields);
		if (this.data.fields) this.data.fields.splice(index, deleteCount, ...fields);
		else this.data.fields = fields;
		return this;
	}
	/**
	 * Sets the fields for this embed.
	 *
	 * @remarks
	 * This method is an alias for {@link EmbedBuilder.spliceFields}. More specifically,
	 * it splices the entire array of fields, replacing them with the provided fields.
	 *
	 * You can set a maximum of 25 fields.
	 * @param fields - The fields to set
	 */
	setFields(...fields) {
		this.spliceFields(0, this.data.fields?.length ?? 0, ...normalizeArray(fields));
		return this;
	}
	/**
	 * Sets the author of this embed.
	 *
	 * @param options - The options to use
	 */
	setAuthor(options) {
		if (options === null) {
			this.data.author = void 0;
			return this;
		}
		embedAuthorPredicate.parse(options);
		this.data.author = {
			name: options.name,
			url: options.url,
			icon_url: options.iconURL
		};
		return this;
	}
	/**
	 * Sets the color of this embed.
	 *
	 * @param color - The color to use
	 */
	setColor(color) {
		colorPredicate.parse(color);
		if (Array.isArray(color)) {
			const [red, green, blue] = color;
			this.data.color = (red << 16) + (green << 8) + blue;
			return this;
		}
		this.data.color = color ?? void 0;
		return this;
	}
	/**
	 * Sets the description of this embed.
	 *
	 * @param description - The description to use
	 */
	setDescription(description) {
		descriptionPredicate.parse(description);
		this.data.description = description ?? void 0;
		return this;
	}
	/**
	 * Sets the footer of this embed.
	 *
	 * @param options - The footer to use
	 */
	setFooter(options) {
		if (options === null) {
			this.data.footer = void 0;
			return this;
		}
		embedFooterPredicate.parse(options);
		this.data.footer = {
			text: options.text,
			icon_url: options.iconURL
		};
		return this;
	}
	/**
	 * Sets the image of this embed.
	 *
	 * @param url - The image URL to use
	 */
	setImage(url) {
		imageURLPredicate.parse(url);
		this.data.image = url ? { url } : void 0;
		return this;
	}
	/**
	 * Sets the thumbnail of this embed.
	 *
	 * @param url - The thumbnail URL to use
	 */
	setThumbnail(url) {
		imageURLPredicate.parse(url);
		this.data.thumbnail = url ? { url } : void 0;
		return this;
	}
	/**
	 * Sets the timestamp of this embed.
	 *
	 * @param timestamp - The timestamp or date to use
	 */
	setTimestamp(timestamp = Date.now()) {
		timestampPredicate.parse(timestamp);
		this.data.timestamp = timestamp ? new Date(timestamp).toISOString() : void 0;
		return this;
	}
	/**
	 * Sets the title for this embed.
	 *
	 * @param title - The title to use
	 */
	setTitle(title) {
		titlePredicate.parse(title);
		this.data.title = title ?? void 0;
		return this;
	}
	/**
	 * Sets the URL of this embed.
	 *
	 * @param url - The URL to use
	 */
	setURL(url) {
		urlPredicate.parse(url);
		this.data.url = url ?? void 0;
		return this;
	}
	/**
	 * Serializes this builder to API-compatible JSON data.
	 *
	 * @remarks
	 * This method runs validations on the data before serializing it.
	 * As such, it may throw an error if the data is invalid.
	 */
	toJSON() {
		return { ...this.data };
	}
};
__export(
	{},
	{
		buttonLabelValidator: () => buttonLabelValidator,
		buttonStyleValidator: () => buttonStyleValidator,
		channelTypesValidator: () => channelTypesValidator,
		customIdValidator: () => customIdValidator,
		defaultValidator: () => defaultValidator,
		disabledValidator: () => disabledValidator,
		emojiValidator: () => emojiValidator,
		idValidator: () => idValidator,
		jsonOptionValidator: () => jsonOptionValidator,
		labelValueDescriptionValidator: () => labelValueDescriptionValidator,
		minMaxValidator: () => minMaxValidator,
		optionValidator: () => optionValidator,
		optionsLengthValidator: () => optionsLengthValidator,
		optionsValidator: () => optionsValidator,
		placeholderValidator: () => placeholderValidator,
		urlValidator: () => urlValidator,
		validateRequiredButtonParameters: () => validateRequiredButtonParameters,
		validateRequiredSelectMenuOptionParameters: () => validateRequiredSelectMenuOptionParameters,
		validateRequiredSelectMenuParameters: () => validateRequiredSelectMenuParameters
	}
);
var StringSelectMenuOptionBuilder = class {
	/**
	 * Creates a new string select menu option from API data.
	 *
	 * @param data - The API data to create this string select menu option with
	 * @example
	 * Creating a string select menu option from an API data object:
	 * ```ts
	 * const selectMenuOption = new SelectMenuOptionBuilder({
	 * 	label: 'catchy label',
	 * 	value: '1',
	 * });
	 * ```
	 * @example
	 * Creating a string select menu option using setters and API data:
	 * ```ts
	 * const selectMenuOption = new SelectMenuOptionBuilder({
	 * 	default: true,
	 * 	value: '1',
	 * })
	 * 	.setLabel('woah');
	 * ```
	 */
	constructor(data = {}) {
		this.data = data;
	}
	static {
		__name(this, 'StringSelectMenuOptionBuilder');
	}
	/**
	 * Sets the label for this option.
	 *
	 * @param label - The label to use
	 */
	setLabel(label) {
		this.data.label = labelValueDescriptionValidator.parse(label);
		return this;
	}
	/**
	 * Sets the value for this option.
	 *
	 * @param value - The value to use
	 */
	setValue(value) {
		this.data.value = labelValueDescriptionValidator.parse(value);
		return this;
	}
	/**
	 * Sets the description for this option.
	 *
	 * @param description - The description to use
	 */
	setDescription(description) {
		this.data.description = labelValueDescriptionValidator.parse(description);
		return this;
	}
	/**
	 * Sets whether this option is selected by default.
	 *
	 * @param isDefault - Whether this option is selected by default
	 */
	setDefault(isDefault = true) {
		this.data.default = defaultValidator.parse(isDefault);
		return this;
	}
	/**
	 * Sets the emoji to display for this option.
	 *
	 * @param emoji - The emoji to use
	 */
	setEmoji(emoji) {
		this.data.emoji = emojiValidator.parse(emoji);
		return this;
	}
	/**
	 * {@inheritDoc BaseSelectMenuBuilder.toJSON}
	 */
	toJSON() {
		validateRequiredSelectMenuOptionParameters(this.data.label, this.data.value);
		return { ...this.data };
	}
};
var idValidator = s3.number().safeInt().greaterThanOrEqual(1).lessThan(4294967296).setValidationEnabled(isValidationEnabled);
var customIdValidator = s3.string().lengthGreaterThanOrEqual(1).lengthLessThanOrEqual(100).setValidationEnabled(isValidationEnabled);
var emojiValidator = s3
	.object({
		id: s3.string(),
		name: s3.string(),
		animated: s3.boolean()
	})
	.partial()
	.strict()
	.setValidationEnabled(isValidationEnabled);
var disabledValidator = s3.boolean();
var buttonLabelValidator = s3.string().lengthGreaterThanOrEqual(1).lengthLessThanOrEqual(80).setValidationEnabled(isValidationEnabled);
var buttonStyleValidator = s3.nativeEnum(ButtonStyle);
var placeholderValidator = s3.string().lengthLessThanOrEqual(150).setValidationEnabled(isValidationEnabled);
var minMaxValidator = s3.number().int().greaterThanOrEqual(0).lessThanOrEqual(25).setValidationEnabled(isValidationEnabled);
var labelValueDescriptionValidator = s3.string().lengthGreaterThanOrEqual(1).lengthLessThanOrEqual(100).setValidationEnabled(isValidationEnabled);
var jsonOptionValidator = s3
	.object({
		label: labelValueDescriptionValidator,
		value: labelValueDescriptionValidator,
		description: labelValueDescriptionValidator.optional(),
		emoji: emojiValidator.optional(),
		default: s3.boolean().optional()
	})
	.setValidationEnabled(isValidationEnabled);
var optionValidator = s3.instance(StringSelectMenuOptionBuilder).setValidationEnabled(isValidationEnabled);
var optionsValidator = optionValidator.array().lengthGreaterThanOrEqual(0).setValidationEnabled(isValidationEnabled);
var optionsLengthValidator = s3.number().int().greaterThanOrEqual(0).lessThanOrEqual(25).setValidationEnabled(isValidationEnabled);
function validateRequiredSelectMenuParameters(options, customId) {
	customIdValidator.parse(customId);
	optionsValidator.parse(options);
}
__name(validateRequiredSelectMenuParameters, 'validateRequiredSelectMenuParameters');
var defaultValidator = s3.boolean();
function validateRequiredSelectMenuOptionParameters(label, value) {
	labelValueDescriptionValidator.parse(label);
	labelValueDescriptionValidator.parse(value);
}
__name(validateRequiredSelectMenuOptionParameters, 'validateRequiredSelectMenuOptionParameters');
var channelTypesValidator = s3.nativeEnum(ChannelType).array().setValidationEnabled(isValidationEnabled);
var urlValidator = s3
	.string()
	.url({ allowedProtocols: ['http:', 'https:', 'discord:'] })
	.setValidationEnabled(isValidationEnabled);
function validateRequiredButtonParameters(style, label, emoji, customId, skuId, url) {
	if (style === ButtonStyle.Premium) {
		if (!skuId) throw new RangeError('Premium buttons must have an SKU id.');
		if (customId || label || url || emoji) throw new RangeError('Premium buttons cannot have a custom id, label, URL, or emoji.');
	} else {
		if (skuId) throw new RangeError('Non-premium buttons must not have an SKU id.');
		if (url && customId) throw new RangeError('URL and custom id are mutually exclusive.');
		if (!label && !emoji) throw new RangeError('Non-premium buttons must have a label and/or an emoji.');
		if (style === ButtonStyle.Link) {
			if (!url) throw new RangeError('Link buttons must have a URL.');
		} else if (url) throw new RangeError('Non-premium and non-link buttons cannot have a URL.');
	}
}
__name(validateRequiredButtonParameters, 'validateRequiredButtonParameters');
var ComponentBuilder = class {
	static {
		__name(this, 'ComponentBuilder');
	}
	/**
	 * The API data associated with this component.
	 */
	data;
	/**
	 * Constructs a new kind of component.
	 *
	 * @param data - The data to construct a component out of
	 */
	constructor(data) {
		this.data = data;
	}
	/**
	 * Sets the id (not the custom id) for this component.
	 *
	 * @param id - The id for this component
	 */
	setId(id) {
		this.data.id = idValidator.parse(id);
		return this;
	}
	/**
	 * Clears the id of this component, defaulting to a default incremented id.
	 */
	clearId() {
		this.data.id = void 0;
		return this;
	}
};
var ButtonBuilder = class extends ComponentBuilder {
	static {
		__name(this, 'ButtonBuilder');
	}
	/**
	 * Creates a new button from API data.
	 *
	 * @param data - The API data to create this button with
	 * @example
	 * Creating a button from an API data object:
	 * ```ts
	 * const button = new ButtonBuilder({
	 * 	custom_id: 'a cool button',
	 * 	style: ButtonStyle.Primary,
	 * 	label: 'Click Me',
	 * 	emoji: {
	 * 		name: 'smile',
	 * 		id: '123456789012345678',
	 * 	},
	 * });
	 * ```
	 * @example
	 * Creating a button using setters and API data:
	 * ```ts
	 * const button = new ButtonBuilder({
	 * 	style: ButtonStyle.Secondary,
	 * 	label: 'Click Me',
	 * })
	 * 	.setEmoji({ name: '🙂' })
	 * 	.setCustomId('another cool button');
	 * ```
	 */
	constructor(data) {
		super({
			type: ComponentType.Button,
			...data
		});
	}
	/**
	 * Sets the style of this button.
	 *
	 * @param style - The style to use
	 */
	setStyle(style) {
		this.data.style = buttonStyleValidator.parse(style);
		return this;
	}
	/**
	 * Sets the URL for this button.
	 *
	 * @remarks
	 * This method is only available to buttons using the `Link` button style.
	 * Only three types of URL schemes are currently supported: `https://`, `http://`, and `discord://`.
	 * @param url - The URL to use
	 */
	setURL(url) {
		this.data.url = urlValidator.parse(url);
		return this;
	}
	/**
	 * Sets the custom id for this button.
	 *
	 * @remarks
	 * This method is only applicable to buttons that are not using the `Link` button style.
	 * @param customId - The custom id to use
	 */
	setCustomId(customId) {
		this.data.custom_id = customIdValidator.parse(customId);
		return this;
	}
	/**
	 * Sets the SKU id that represents a purchasable SKU for this button.
	 *
	 * @remarks Only available when using premium-style buttons.
	 * @param skuId - The SKU id to use
	 */
	setSKUId(skuId) {
		this.data.sku_id = skuId;
		return this;
	}
	/**
	 * Sets the emoji to display on this button.
	 *
	 * @param emoji - The emoji to use
	 */
	setEmoji(emoji) {
		this.data.emoji = emojiValidator.parse(emoji);
		return this;
	}
	/**
	 * Sets whether this button is disabled.
	 *
	 * @param disabled - Whether to disable this button
	 */
	setDisabled(disabled = true) {
		this.data.disabled = disabledValidator.parse(disabled);
		return this;
	}
	/**
	 * Sets the label for this button.
	 *
	 * @param label - The label to use
	 */
	setLabel(label) {
		this.data.label = buttonLabelValidator.parse(label);
		return this;
	}
	/**
	 * {@inheritDoc ComponentBuilder.toJSON}
	 */
	toJSON() {
		validateRequiredButtonParameters(this.data.style, this.data.label, this.data.emoji, this.data.custom_id, this.data.sku_id, this.data.url);
		return { ...this.data };
	}
};
__export(
	{},
	{
		checkboxGroupOptionPredicate: () => checkboxGroupOptionPredicate,
		checkboxGroupPredicate: () => checkboxGroupPredicate,
		checkboxPredicate: () => checkboxPredicate,
		radioGroupOptionPredicate: () => radioGroupOptionPredicate,
		radioGroupPredicate: () => radioGroupPredicate
	}
);
var checkboxPredicate = s3
	.object({
		type: s3.literal(ComponentType.Checkbox),
		custom_id: customIdValidator,
		id: idValidator.optional(),
		default: s3.boolean().optional()
	})
	.setValidationEnabled(isValidationEnabled);
var checkboxGroupOptionPredicate = s3
	.object({
		label: s3.string().lengthGreaterThanOrEqual(1).lengthLessThanOrEqual(100),
		value: s3.string().lengthGreaterThanOrEqual(1).lengthLessThanOrEqual(100),
		description: s3.string().lengthLessThanOrEqual(100).optional(),
		default: s3.boolean().optional()
	})
	.setValidationEnabled(isValidationEnabled);
var checkboxGroupPredicate = s3
	.object({
		type: s3.literal(ComponentType.CheckboxGroup),
		custom_id: customIdValidator,
		id: idValidator.optional(),
		options: s3.array(checkboxGroupOptionPredicate).lengthGreaterThanOrEqual(1).lengthLessThanOrEqual(10),
		min_values: s3.number().int().greaterThanOrEqual(0).lessThanOrEqual(10).optional(),
		max_values: s3.number().int().greaterThanOrEqual(1).lessThanOrEqual(10).optional(),
		required: s3.boolean().optional()
	})
	.reshape((data) => {
		if (data.min_values !== void 0 && data.max_values !== void 0 && data.min_values > data.max_values)
			return Result.err(/* @__PURE__ */ new RangeError('min_values cannot be greater than max_values'));
		if (data.max_values !== void 0 && data.max_values > data.options.length)
			return Result.err(/* @__PURE__ */ new RangeError('max_values cannot be greater than the number of options'));
		if (data.min_values !== void 0 && data.min_values > data.options.length)
			return Result.err(/* @__PURE__ */ new RangeError('min_values cannot be greater than the number of options'));
		if (data.required === true && data.min_values === 0)
			return Result.err(/* @__PURE__ */ new RangeError('If required is true, min_values must be at least 1'));
		const defaultCount = data.options.filter((option) => option.default === true).length;
		if (data.max_values !== void 0 && defaultCount > data.max_values)
			return Result.err(/* @__PURE__ */ new RangeError('The number of default options cannot be greater than max_values'));
		const values = data.options.map((option) => option.value);
		if (new Set(values).size !== values.length)
			return Result.err(/* @__PURE__ */ new RangeError('Each option in a checkbox group must have a unique value'));
		return Result.ok(data);
	})
	.setValidationEnabled(isValidationEnabled);
var radioGroupOptionPredicate = checkboxGroupOptionPredicate;
var radioGroupPredicate = s3
	.object({
		type: s3.literal(ComponentType.RadioGroup),
		custom_id: customIdValidator,
		id: idValidator.optional(),
		options: s3.array(radioGroupOptionPredicate).lengthGreaterThanOrEqual(2).lengthLessThanOrEqual(10),
		required: s3.boolean().optional()
	})
	.reshape((data) => {
		if (data.options.filter((option) => option.default === true).length > 1)
			return Result.err(/* @__PURE__ */ new RangeError('There can be at most one default option in a radio group'));
		const values = data.options.map((option) => option.value);
		if (new Set(values).size !== values.length)
			return Result.err(/* @__PURE__ */ new RangeError('Each option in a radio group must have a unique value'));
		return Result.ok(data);
	})
	.setValidationEnabled(isValidationEnabled);
var CheckboxBuilder = class extends ComponentBuilder {
	static {
		__name(this, 'CheckboxBuilder');
	}
	/**
	 * Creates a new checkbox from API data.
	 *
	 * @param data - The API data to create this checkbox with
	 * @example
	 * Creating a checkbox from an API data object:
	 * ```ts
	 * const checkbox = new CheckboxBuilder({
	 * 	custom_id: 'accept_terms',
	 * 	default: false,
	 * });
	 * ```
	 * @example
	 * Creating a checkbox using setters and API data:
	 * ```ts
	 * const checkbox = new CheckboxBuilder()
	 * 	.setCustomId('subscribe_newsletter')
	 * 	.setDefault(true);
	 * ```
	 */
	constructor(data) {
		super({
			type: ComponentType.Checkbox,
			...data
		});
	}
	/**
	 * Sets the custom id of this checkbox.
	 *
	 * @param customId - The custom id to use
	 */
	setCustomId(customId) {
		this.data.custom_id = customId;
		return this;
	}
	/**
	 * Sets whether this checkbox is checked by default.
	 *
	 * @param isDefault - Whether the checkbox should be checked by default
	 */
	setDefault(isDefault) {
		this.data.default = isDefault;
		return this;
	}
	/**
	 * {@inheritDoc ComponentBuilder.toJSON}
	 */
	toJSON() {
		checkboxPredicate.parse(this.data);
		return { ...this.data };
	}
};
var CheckboxGroupOptionBuilder = class {
	/**
	 * Creates a new checkbox group option from API data.
	 *
	 * @param data - The API data to create this checkbox group option with
	 * @example
	 * Creating a checkbox group option from an API data object:
	 * ```ts
	 * const option = new CheckboxGroupOptionBuilder({
	 * 	label: 'Option 1',
	 * 	value: 'option_1',
	 * });
	 * ```
	 * @example
	 * Creating a checkbox group option using setters and API data:
	 * ```ts
	 * const option = new CheckboxGroupOptionBuilder()
	 * 	.setLabel('Option 2')
	 * 	.setValue('option_2');
	 * ```
	 */
	constructor(data = {}) {
		this.data = data;
	}
	static {
		__name(this, 'CheckboxGroupOptionBuilder');
	}
	/**
	 * Sets the label for this option.
	 *
	 * @param label - The label to use
	 */
	setLabel(label) {
		this.data.label = label;
		return this;
	}
	/**
	 * Sets the value for this option.
	 *
	 * @param value - The value to use
	 */
	setValue(value) {
		this.data.value = value;
		return this;
	}
	/**
	 * Sets the description for this option.
	 *
	 * @param description - The description to use
	 */
	setDescription(description) {
		this.data.description = description;
		return this;
	}
	/**
	 * Sets whether this option is selected by default.
	 *
	 * @param isDefault - Whether the option should be selected by default
	 */
	setDefault(isDefault) {
		this.data.default = isDefault;
		return this;
	}
	/**
	 * {@inheritDoc ComponentBuilder.toJSON}
	 */
	toJSON() {
		checkboxGroupOptionPredicate.parse(this.data);
		return { ...this.data };
	}
};
var CheckboxGroupBuilder = class extends ComponentBuilder {
	static {
		__name(this, 'CheckboxGroupBuilder');
	}
	/**
	 * The options within this checkbox group.
	 */
	options;
	/**
	 * Creates a new checkbox group from API data.
	 *
	 * @param data - The API data to create this checkbox group with
	 * @example
	 * Creating a checkbox group from an API data object:
	 * ```ts
	 * const checkboxGroup = new CheckboxGroupBuilder({
	 * 	custom_id: 'select_options',
	 * 	options: [
	 * 		{ label: 'Option 1', value: 'option_1' },
	 * 		{ label: 'Option 2', value: 'option_2' },
	 * 	],
	 * });
	 * ```
	 * @example
	 * Creating a checkbox group using setters and API data:
	 * ```ts
	 * const checkboxGroup = new CheckboxGroupBuilder()
	 * 	.setCustomId('choose_items')
	 * 	.setOptions([
	 * 		{ label: 'Item A', value: 'item_a' },
	 * 		{ label: 'Item B', value: 'item_b' },
	 * 	])
	 * 	.setMinValues(1)
	 * 	.setMaxValues(2);
	 * ```
	 */
	constructor(data) {
		const { options, ...initData } = data ?? {};
		super({
			...initData,
			type: ComponentType.CheckboxGroup
		});
		this.options = options?.map((option) => new CheckboxGroupOptionBuilder(option)) ?? [];
	}
	/**
	 * Sets the custom id of this checkbox group.
	 *
	 * @param customId - The custom id to use
	 */
	setCustomId(customId) {
		this.data.custom_id = customId;
		return this;
	}
	/**
	 * Adds options to this checkbox group.
	 *
	 * @param options - The options to add
	 */
	addOptions(...options) {
		const normalizedOptions = normalizeArray(options);
		this.options.push(
			...normalizedOptions.map((normalizedOption) => {
				const option = new CheckboxGroupOptionBuilder('toJSON' in normalizedOption ? normalizedOption.toJSON() : normalizedOption);
				checkboxGroupOptionPredicate.parse(option.toJSON());
				return option;
			})
		);
		return this;
	}
	/**
	 * Sets the options for this checkbox group.
	 *
	 * @param options - The options to use
	 */
	setOptions(...options) {
		return this.spliceOptions(0, this.options.length, ...options);
	}
	/**
	 * Removes, replaces, or inserts options for this checkbox group.
	 *
	 * @remarks
	 * This method behaves similarly
	 * to {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/splice | Array.prototype.splice()}.
	 * It's useful for modifying and adjusting the order of existing options.
	 * @param index - The index to start at
	 * @param deleteCount - The number of options to remove
	 * @param options - The replacing option objects or builders
	 */
	spliceOptions(index, deleteCount, ...options) {
		const normalizedOptions = normalizeArray(options);
		const clone = [...this.options];
		clone.splice(
			index,
			deleteCount,
			...normalizedOptions.map((normalizedOption) => {
				const option = new CheckboxGroupOptionBuilder('toJSON' in normalizedOption ? normalizedOption.toJSON() : normalizedOption);
				checkboxGroupOptionPredicate.parse(option.toJSON());
				return option;
			})
		);
		this.options.splice(0, this.options.length, ...clone);
		return this;
	}
	/**
	 * Sets the minimum number of options that must be selected.
	 *
	 * @param minValues - The minimum number of options that must be selected
	 */
	setMinValues(minValues) {
		this.data.min_values = minValues;
		return this;
	}
	/**
	 * Sets the maximum number of options that can be selected.
	 *
	 * @param maxValues - The maximum number of options that can be selected
	 */
	setMaxValues(maxValues) {
		this.data.max_values = maxValues;
		return this;
	}
	/**
	 * Sets whether selecting options is required.
	 *
	 * @param required - Whether selecting options is required
	 */
	setRequired(required) {
		this.data.required = required;
		return this;
	}
	/**
	 * {@inheritDoc ComponentBuilder.toJSON}
	 */
	toJSON() {
		const data = {
			...this.data,
			options: this.options.map((option) => option.toJSON())
		};
		checkboxGroupPredicate.parse(data);
		return data;
	}
};
var RadioGroupOptionBuilder = class {
	/**
	 * Creates a new radio group option from API data.
	 *
	 * @param data - The API data to create this radio group option with
	 * @example
	 * Creating a radio group option from an API data object:
	 * ```ts
	 * const option = new RadioGroupOptionBuilder({
	 * 	label: 'Option 1',
	 * 	value: 'option_1',
	 * });
	 * ```
	 * @example
	 * Creating a radio group option using setters and API data:
	 * ```ts
	 * const option = new RadioGroupOptionBuilder()
	 * 	.setLabel('Option 2')
	 * 	.setValue('option_2');
	 * ```
	 */
	constructor(data = {}) {
		this.data = data;
	}
	static {
		__name(this, 'RadioGroupOptionBuilder');
	}
	/**
	 * Sets the label for this option.
	 *
	 * @param label - The label to use
	 */
	setLabel(label) {
		this.data.label = label;
		return this;
	}
	/**
	 * Sets the value for this option.
	 *
	 * @param value - The value to use
	 */
	setValue(value) {
		this.data.value = value;
		return this;
	}
	/**
	 * Sets the description for this option.
	 *
	 * @param description - The description to use
	 */
	setDescription(description) {
		this.data.description = description;
		return this;
	}
	/**
	 * Sets whether this option is selected by default.
	 *
	 * @param isDefault - Whether the option should be selected by default
	 */
	setDefault(isDefault) {
		this.data.default = isDefault;
		return this;
	}
	/**
	 * {@inheritDoc ComponentBuilder.toJSON}
	 */
	toJSON() {
		radioGroupOptionPredicate.parse(this.data);
		return { ...this.data };
	}
};
var RadioGroupBuilder = class extends ComponentBuilder {
	static {
		__name(this, 'RadioGroupBuilder');
	}
	/**
	 * The options within this radio group.
	 */
	options;
	/**
	 * Creates a new radio group from API data.
	 *
	 * @param data - The API data to create this radio group with
	 * @example
	 * Creating a radio group from an API data object:
	 * ```ts
	 * const radioGroup = new RadioGroupBuilder({
	 * 	custom_id: 'select_options',
	 * 	options: [
	 * 		{ label: 'Option 1', value: 'option_1' },
	 * 		{ label: 'Option 2', value: 'option_2' },
	 * 	],
	 * });
	 * ```
	 * @example
	 * Creating a radio group using setters and API data:
	 * ```ts
	 * const radioGroup = new RadioGroupBuilder()
	 * 	.setCustomId('choose_items')
	 * 	.setOptions([
	 * 		{ label: 'Item A', value: 'item_a' },
	 * 		{ label: 'Item B', value: 'item_b' },
	 * 	])
	 * ```
	 */
	constructor(data) {
		const { options, ...initData } = data ?? {};
		super({
			...initData,
			type: ComponentType.RadioGroup
		});
		this.options = options?.map((option) => new RadioGroupOptionBuilder(option)) ?? [];
	}
	/**
	 * Sets the custom id of this radio group.
	 *
	 * @param customId - The custom id to use
	 */
	setCustomId(customId) {
		this.data.custom_id = customId;
		return this;
	}
	/**
	 * Adds options to this radio group.
	 *
	 * @param options - The options to add
	 */
	addOptions(...options) {
		const normalizedOptions = normalizeArray(options);
		this.options.push(
			...normalizedOptions.map((normalizedOption) => {
				const option = new RadioGroupOptionBuilder('toJSON' in normalizedOption ? normalizedOption.toJSON() : normalizedOption);
				radioGroupOptionPredicate.parse(option.toJSON());
				return option;
			})
		);
		return this;
	}
	/**
	 * Sets the options for this radio group.
	 *
	 * @param options - The options to use
	 */
	setOptions(...options) {
		return this.spliceOptions(0, this.options.length, ...options);
	}
	/**
	 * Removes, replaces, or inserts options for this radio group.
	 *
	 * @remarks
	 * This method behaves similarly
	 * to {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/splice | Array.prototype.splice()}.
	 * It's useful for modifying and adjusting the order of existing options.
	 * @param index - The index to start at
	 * @param deleteCount - The number of options to remove
	 * @param options - The replacing option objects or builders
	 */
	spliceOptions(index, deleteCount, ...options) {
		const normalizedOptions = normalizeArray(options);
		const clone = [...this.options];
		clone.splice(
			index,
			deleteCount,
			...normalizedOptions.map((normalizedOption) => {
				const option = new RadioGroupOptionBuilder('toJSON' in normalizedOption ? normalizedOption.toJSON() : normalizedOption);
				radioGroupOptionPredicate.parse(option.toJSON());
				return option;
			})
		);
		this.options.splice(0, this.options.length, ...clone);
		return this;
	}
	/**
	 * Sets whether selecting options is required.
	 *
	 * @param required - Whether selecting options is required
	 */
	setRequired(required) {
		this.data.required = required;
		return this;
	}
	/**
	 * {@inheritDoc ComponentBuilder.toJSON}
	 */
	toJSON() {
		const data = {
			...this.data,
			options: this.options.map((option) => option.toJSON())
		};
		radioGroupPredicate.parse(data);
		return data;
	}
};
__export({}, { fileUploadPredicate: () => fileUploadPredicate });
var fileUploadPredicate = s3.object({
	type: s3.literal(ComponentType.FileUpload),
	id: idValidator.optional(),
	custom_id: customIdValidator,
	min_values: s3.number().greaterThanOrEqual(0).lessThanOrEqual(10).optional(),
	max_values: s3.number().greaterThanOrEqual(1).lessThanOrEqual(10).optional(),
	required: s3.boolean().optional()
});
var FileUploadBuilder = class extends ComponentBuilder {
	static {
		__name(this, 'FileUploadBuilder');
	}
	/**
	 * Creates a new file upload.
	 *
	 * @param data - The API data to create this file upload with
	 * @example
	 * Creating a file upload from an API data object:
	 * ```ts
	 * const fileUpload = new FileUploadBuilder({
	 * 	custom_id: "file_upload",
	 *  min_values: 2,
	 *  max_values: 5,
	 * });
	 * ```
	 * @example
	 * Creating a file upload using setters and API data:
	 * ```ts
	 * const fileUpload = new FileUploadBuilder({
	 * 	custom_id: "file_upload",
	 *  min_values: 2,
	 *  max_values: 5,
	 * }).setRequired();
	 * ```
	 */
	constructor(data = {}) {
		super({
			type: ComponentType.FileUpload,
			...data
		});
	}
	/**
	 * Sets the custom id for this file upload.
	 *
	 * @param customId - The custom id to use
	 */
	setCustomId(customId) {
		this.data.custom_id = customId;
		return this;
	}
	/**
	 * Sets the minimum number of file uploads required.
	 *
	 * @param minValues - The minimum values that must be uploaded
	 */
	setMinValues(minValues) {
		this.data.min_values = minValues;
		return this;
	}
	/**
	 * Clears the minimum values.
	 */
	clearMinValues() {
		this.data.min_values = void 0;
		return this;
	}
	/**
	 * Sets the maximum number of file uploads required.
	 *
	 * @param maxValues - The maximum values that can be uploaded
	 */
	setMaxValues(maxValues) {
		this.data.max_values = maxValues;
		return this;
	}
	/**
	 * Clears the maximum values.
	 */
	clearMaxValues() {
		this.data.max_values = void 0;
		return this;
	}
	/**
	 * Sets whether this file upload is required.
	 *
	 * @param required - Whether this file upload is required
	 */
	setRequired(required = true) {
		this.data.required = required;
		return this;
	}
	/**
	 * {@inheritDoc ComponentBuilder.toJSON}
	 */
	toJSON() {
		fileUploadPredicate.parse(this.data);
		return this.data;
	}
};
__export(
	{},
	{
		labelValidator: () => labelValidator,
		maxLengthValidator: () => maxLengthValidator,
		minLengthValidator: () => minLengthValidator,
		placeholderValidator: () => placeholderValidator2,
		requiredValidator: () => requiredValidator,
		textInputPredicate: () => textInputPredicate,
		textInputStyleValidator: () => textInputStyleValidator,
		validateRequiredParameters: () => validateRequiredParameters,
		valueValidator: () => valueValidator
	}
);
var textInputStyleValidator = s3.nativeEnum(TextInputStyle).setValidationEnabled(isValidationEnabled);
var minLengthValidator = s3.number().int().greaterThanOrEqual(0).lessThanOrEqual(4e3).setValidationEnabled(isValidationEnabled);
var maxLengthValidator = s3.number().int().greaterThanOrEqual(1).lessThanOrEqual(4e3).setValidationEnabled(isValidationEnabled);
var requiredValidator = s3.boolean().setValidationEnabled(isValidationEnabled);
var valueValidator = s3.string().lengthLessThanOrEqual(4e3).setValidationEnabled(isValidationEnabled);
var placeholderValidator2 = s3.string().lengthLessThanOrEqual(100).setValidationEnabled(isValidationEnabled);
var labelValidator = s3.string().lengthGreaterThanOrEqual(1).lengthLessThanOrEqual(45).setValidationEnabled(isValidationEnabled);
var textInputPredicate = s3
	.object({
		type: s3.literal(ComponentType.TextInput),
		custom_id: customIdValidator,
		style: textInputStyleValidator,
		id: idValidator.optional(),
		min_length: minLengthValidator.optional(),
		max_length: maxLengthValidator.optional(),
		placeholder: placeholderValidator2.optional(),
		value: valueValidator.optional(),
		required: requiredValidator.optional()
	})
	.setValidationEnabled(isValidationEnabled);
function validateRequiredParameters(customId, style) {
	customIdValidator.parse(customId);
	textInputStyleValidator.parse(style);
}
__name(validateRequiredParameters, 'validateRequiredParameters');
var BaseSelectMenuBuilder = class extends ComponentBuilder {
	static {
		__name(this, 'BaseSelectMenuBuilder');
	}
	/**
	 * Sets the placeholder for this select menu.
	 *
	 * @param placeholder - The placeholder to use
	 */
	setPlaceholder(placeholder) {
		this.data.placeholder = placeholderValidator.parse(placeholder);
		return this;
	}
	/**
	 * Sets the minimum values that must be selected in the select menu.
	 *
	 * @param minValues - The minimum values that must be selected
	 */
	setMinValues(minValues) {
		this.data.min_values = minMaxValidator.parse(minValues);
		return this;
	}
	/**
	 * Sets the maximum values that can be selected in the select menu.
	 *
	 * @param maxValues - The maximum values that can be selected
	 */
	setMaxValues(maxValues) {
		this.data.max_values = minMaxValidator.parse(maxValues);
		return this;
	}
	/**
	 * Sets the custom id for this select menu.
	 *
	 * @param customId - The custom id to use
	 */
	setCustomId(customId) {
		this.data.custom_id = customIdValidator.parse(customId);
		return this;
	}
	/**
	 * Sets whether this select menu is disabled.
	 *
	 * @param disabled - Whether this select menu is disabled
	 */
	setDisabled(disabled = true) {
		this.data.disabled = disabledValidator.parse(disabled);
		return this;
	}
	/**
	 * Sets whether this select menu is required.
	 *
	 * @remarks Only for use in modals.
	 * @param required - Whether this select menu is required
	 */
	setRequired(required = true) {
		this.data.required = requiredValidator.parse(required);
		return this;
	}
	/**
	 * {@inheritDoc ComponentBuilder.toJSON}
	 */
	toJSON() {
		customIdValidator.parse(this.data.custom_id);
		return { ...this.data };
	}
};
var ChannelSelectMenuBuilder = class extends BaseSelectMenuBuilder {
	static {
		__name(this, 'ChannelSelectMenuBuilder');
	}
	/**
	 * Creates a new select menu from API data.
	 *
	 * @param data - The API data to create this select menu with
	 * @example
	 * Creating a select menu from an API data object:
	 * ```ts
	 * const selectMenu = new ChannelSelectMenuBuilder({
	 * 	custom_id: 'a cool select menu',
	 * 	placeholder: 'select an option',
	 * 	max_values: 2,
	 * });
	 * ```
	 * @example
	 * Creating a select menu using setters and API data:
	 * ```ts
	 * const selectMenu = new ChannelSelectMenuBuilder({
	 * 	custom_id: 'a cool select menu',
	 * })
	 * 	.addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
	 * 	.setMinValues(2);
	 * ```
	 */
	constructor(data) {
		super({
			...data,
			type: ComponentType.ChannelSelect
		});
	}
	/**
	 * Adds channel types to this select menu.
	 *
	 * @param types - The channel types to use
	 */
	addChannelTypes(...types) {
		const normalizedTypes = normalizeArray(types);
		this.data.channel_types ??= [];
		this.data.channel_types.push(...channelTypesValidator.parse(normalizedTypes));
		return this;
	}
	/**
	 * Sets channel types for this select menu.
	 *
	 * @param types - The channel types to use
	 */
	setChannelTypes(...types) {
		const normalizedTypes = normalizeArray(types);
		this.data.channel_types ??= [];
		this.data.channel_types.splice(0, this.data.channel_types.length, ...channelTypesValidator.parse(normalizedTypes));
		return this;
	}
	/**
	 * Adds default channels to this auto populated select menu.
	 *
	 * @param channels - The channels to add
	 */
	addDefaultChannels(...channels) {
		const normalizedValues = normalizeArray(channels);
		optionsLengthValidator.parse((this.data.default_values?.length ?? 0) + normalizedValues.length);
		this.data.default_values ??= [];
		this.data.default_values.push(
			...normalizedValues.map((id) => ({
				id,
				type: SelectMenuDefaultValueType.Channel
			}))
		);
		return this;
	}
	/**
	 * Sets default channels for this auto populated select menu.
	 *
	 * @param channels - The channels to set
	 */
	setDefaultChannels(...channels) {
		const normalizedValues = normalizeArray(channels);
		optionsLengthValidator.parse(normalizedValues.length);
		this.data.default_values = normalizedValues.map((id) => ({
			id,
			type: SelectMenuDefaultValueType.Channel
		}));
		return this;
	}
	/**
	 * {@inheritDoc BaseSelectMenuBuilder.toJSON}
	 */
	toJSON() {
		customIdValidator.parse(this.data.custom_id);
		return { ...this.data };
	}
};
var MentionableSelectMenuBuilder = class extends BaseSelectMenuBuilder {
	static {
		__name(this, 'MentionableSelectMenuBuilder');
	}
	/**
	 * Creates a new select menu from API data.
	 *
	 * @param data - The API data to create this select menu with
	 * @example
	 * Creating a select menu from an API data object:
	 * ```ts
	 * const selectMenu = new MentionableSelectMenuBuilder({
	 * 	custom_id: 'a cool select menu',
	 * 	placeholder: 'select an option',
	 * 	max_values: 2,
	 * });
	 * ```
	 * @example
	 * Creating a select menu using setters and API data:
	 * ```ts
	 * const selectMenu = new MentionableSelectMenuBuilder({
	 * 	custom_id: 'a cool select menu',
	 * })
	 * 	.setMinValues(1);
	 * ```
	 */
	constructor(data) {
		super({
			...data,
			type: ComponentType.MentionableSelect
		});
	}
	/**
	 * Adds default roles to this auto populated select menu.
	 *
	 * @param roles - The roles to add
	 */
	addDefaultRoles(...roles) {
		const normalizedValues = normalizeArray(roles);
		optionsLengthValidator.parse((this.data.default_values?.length ?? 0) + normalizedValues.length);
		this.data.default_values ??= [];
		this.data.default_values.push(
			...normalizedValues.map((id) => ({
				id,
				type: SelectMenuDefaultValueType.Role
			}))
		);
		return this;
	}
	/**
	 * Adds default users to this auto populated select menu.
	 *
	 * @param users - The users to add
	 */
	addDefaultUsers(...users) {
		const normalizedValues = normalizeArray(users);
		optionsLengthValidator.parse((this.data.default_values?.length ?? 0) + normalizedValues.length);
		this.data.default_values ??= [];
		this.data.default_values.push(
			...normalizedValues.map((id) => ({
				id,
				type: SelectMenuDefaultValueType.User
			}))
		);
		return this;
	}
	/**
	 * Adds default values to this auto populated select menu.
	 *
	 * @param values - The values to add
	 */
	addDefaultValues(...values) {
		const normalizedValues = normalizeArray(values);
		optionsLengthValidator.parse((this.data.default_values?.length ?? 0) + normalizedValues.length);
		this.data.default_values ??= [];
		this.data.default_values.push(...normalizedValues);
		return this;
	}
	/**
	 * Sets default values for this auto populated select menu.
	 *
	 * @param values - The values to set
	 */
	setDefaultValues(...values) {
		const normalizedValues = normalizeArray(values);
		optionsLengthValidator.parse(normalizedValues.length);
		this.data.default_values = normalizedValues;
		return this;
	}
};
var RoleSelectMenuBuilder = class extends BaseSelectMenuBuilder {
	static {
		__name(this, 'RoleSelectMenuBuilder');
	}
	/**
	 * Creates a new select menu from API data.
	 *
	 * @param data - The API data to create this select menu with
	 * @example
	 * Creating a select menu from an API data object:
	 * ```ts
	 * const selectMenu = new RoleSelectMenuBuilder({
	 * 	custom_id: 'a cool select menu',
	 * 	placeholder: 'select an option',
	 * 	max_values: 2,
	 * });
	 * ```
	 * @example
	 * Creating a select menu using setters and API data:
	 * ```ts
	 * const selectMenu = new RoleSelectMenuBuilder({
	 * 	custom_id: 'a cool select menu',
	 * })
	 * 	.setMinValues(1);
	 * ```
	 */
	constructor(data) {
		super({
			...data,
			type: ComponentType.RoleSelect
		});
	}
	/**
	 * Adds default roles to this auto populated select menu.
	 *
	 * @param roles - The roles to add
	 */
	addDefaultRoles(...roles) {
		const normalizedValues = normalizeArray(roles);
		optionsLengthValidator.parse((this.data.default_values?.length ?? 0) + normalizedValues.length);
		this.data.default_values ??= [];
		this.data.default_values.push(
			...normalizedValues.map((id) => ({
				id,
				type: SelectMenuDefaultValueType.Role
			}))
		);
		return this;
	}
	/**
	 * Sets default roles for this auto populated select menu.
	 *
	 * @param roles - The roles to set
	 */
	setDefaultRoles(...roles) {
		const normalizedValues = normalizeArray(roles);
		optionsLengthValidator.parse(normalizedValues.length);
		this.data.default_values = normalizedValues.map((id) => ({
			id,
			type: SelectMenuDefaultValueType.Role
		}));
		return this;
	}
};
__export(
	{},
	{
		selectMenuChannelPredicate: () => selectMenuChannelPredicate,
		selectMenuMentionablePredicate: () => selectMenuMentionablePredicate,
		selectMenuRolePredicate: () => selectMenuRolePredicate,
		selectMenuStringOptionPredicate: () => selectMenuStringOptionPredicate,
		selectMenuStringPredicate: () => selectMenuStringPredicate,
		selectMenuUserPredicate: () => selectMenuUserPredicate
	}
);
var selectMenuBasePredicate = s3.object({
	id: idValidator.optional(),
	placeholder: s3.string().lengthLessThanOrEqual(150).optional(),
	min_values: s3.number().greaterThanOrEqual(0).lessThanOrEqual(25).optional(),
	max_values: s3.number().greaterThanOrEqual(0).lessThanOrEqual(25).optional(),
	custom_id: customIdValidator,
	disabled: s3.boolean().optional()
});
var selectMenuChannelPredicate = selectMenuBasePredicate
	.extend({
		type: s3.literal(ComponentType.ChannelSelect),
		channel_types: s3.nativeEnum(ChannelType).array().optional(),
		default_values: s3
			.object({
				id: s3.string(),
				type: s3.literal(SelectMenuDefaultValueType.Channel)
			})
			.array()
			.lengthLessThanOrEqual(25)
			.optional()
	})
	.setValidationEnabled(isValidationEnabled);
var selectMenuMentionablePredicate = selectMenuBasePredicate
	.extend({
		type: s3.literal(ComponentType.MentionableSelect),
		default_values: s3
			.object({
				id: s3.string(),
				type: s3.union([s3.literal(SelectMenuDefaultValueType.Role), s3.literal(SelectMenuDefaultValueType.User)])
			})
			.array()
			.lengthLessThanOrEqual(25)
			.optional()
	})
	.setValidationEnabled(isValidationEnabled);
var selectMenuRolePredicate = selectMenuBasePredicate
	.extend({
		type: s3.literal(ComponentType.RoleSelect),
		default_values: s3
			.object({
				id: s3.string(),
				type: s3.literal(SelectMenuDefaultValueType.Role)
			})
			.array()
			.lengthLessThanOrEqual(25)
			.optional()
	})
	.setValidationEnabled(isValidationEnabled);
var selectMenuUserPredicate = selectMenuBasePredicate
	.extend({
		type: s3.literal(ComponentType.UserSelect),
		default_values: s3
			.object({
				id: s3.string(),
				type: s3.literal(SelectMenuDefaultValueType.User)
			})
			.array()
			.lengthLessThanOrEqual(25)
			.optional()
	})
	.setValidationEnabled(isValidationEnabled);
var selectMenuStringOptionPredicate = s3
	.object({
		label: s3.string().lengthGreaterThanOrEqual(1).lengthLessThanOrEqual(100),
		value: s3.string().lengthGreaterThanOrEqual(1).lengthLessThanOrEqual(100),
		description: s3.string().lengthGreaterThanOrEqual(1).lengthLessThanOrEqual(100).optional(),
		emoji: emojiValidator.optional(),
		default: s3.boolean().optional()
	})
	.setValidationEnabled(isValidationEnabled);
var selectMenuStringPredicate = selectMenuBasePredicate
	.extend({
		type: s3.literal(ComponentType.StringSelect),
		options: selectMenuStringOptionPredicate.array().lengthGreaterThanOrEqual(1).lengthLessThanOrEqual(25)
	})
	.reshape((value) => {
		if (value.min_values !== void 0 && value.options.length < value.min_values)
			return Result.err(/* @__PURE__ */ new RangeError(`The number of options must be greater than or equal to min_values`));
		if (value.min_values !== void 0 && value.max_values !== void 0 && value.min_values > value.max_values)
			return Result.err(
				/* @__PURE__ */ new RangeError(`The maximum amount of options must be greater than or equal to the minimum amount of options`)
			);
		return Result.ok(value);
	})
	.setValidationEnabled(isValidationEnabled);
var StringSelectMenuBuilder = class extends BaseSelectMenuBuilder {
	static {
		__name(this, 'StringSelectMenuBuilder');
	}
	/**
	 * The options within this select menu.
	 */
	options;
	/**
	 * Creates a new select menu from API data.
	 *
	 * @param data - The API data to create this select menu with
	 * @example
	 * Creating a select menu from an API data object:
	 * ```ts
	 * const selectMenu = new StringSelectMenuBuilder({
	 * 	custom_id: 'a cool select menu',
	 * 	placeholder: 'select an option',
	 * 	max_values: 2,
	 * 	options: [
	 * 		{ label: 'option 1', value: '1' },
	 * 		{ label: 'option 2', value: '2' },
	 * 		{ label: 'option 3', value: '3' },
	 * 	],
	 * });
	 * ```
	 * @example
	 * Creating a select menu using setters and API data:
	 * ```ts
	 * const selectMenu = new StringSelectMenuBuilder({
	 * 	custom_id: 'a cool select menu',
	 * })
	 * 	.setMinValues(1)
	 * 	.addOptions({
	 * 		label: 'Catchy',
	 * 		value: 'catch',
	 * 	});
	 * ```
	 */
	constructor(data) {
		const { options, ...initData } = data ?? {};
		super({
			...initData,
			type: ComponentType.StringSelect
		});
		this.options = options?.map((option) => new StringSelectMenuOptionBuilder(option)) ?? [];
	}
	/**
	 * Adds options to this select menu.
	 *
	 * @param options - The options to add
	 */
	addOptions(...options) {
		const normalizedOptions = normalizeArray(options);
		optionsLengthValidator.parse(this.options.length + normalizedOptions.length);
		this.options.push(
			...normalizedOptions.map((normalizedOption) =>
				normalizedOption instanceof StringSelectMenuOptionBuilder
					? normalizedOption
					: new StringSelectMenuOptionBuilder(selectMenuStringOptionPredicate.parse(normalizedOption))
			)
		);
		return this;
	}
	/**
	 * Sets the options for this select menu.
	 *
	 * @param options - The options to set
	 */
	setOptions(...options) {
		return this.spliceOptions(0, this.options.length, ...options);
	}
	/**
	 * Removes, replaces, or inserts options for this select menu.
	 *
	 * @remarks
	 * This method behaves similarly
	 * to {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/splice | Array.prototype.splice()}.
	 * It's useful for modifying and adjusting the order of existing options.
	 * @example
	 * Remove the first option:
	 * ```ts
	 * selectMenu.spliceOptions(0, 1);
	 * ```
	 * @example
	 * Remove the first n option:
	 * ```ts
	 * const n = 4;
	 * selectMenu.spliceOptions(0, n);
	 * ```
	 * @example
	 * Remove the last option:
	 * ```ts
	 * selectMenu.spliceOptions(-1, 1);
	 * ```
	 * @param index - The index to start at
	 * @param deleteCount - The number of options to remove
	 * @param options - The replacing option objects or builders
	 */
	spliceOptions(index, deleteCount, ...options) {
		const normalizedOptions = normalizeArray(options);
		const clone = [...this.options];
		clone.splice(
			index,
			deleteCount,
			...normalizedOptions.map((normalizedOption) =>
				normalizedOption instanceof StringSelectMenuOptionBuilder
					? normalizedOption
					: new StringSelectMenuOptionBuilder(selectMenuStringOptionPredicate.parse(normalizedOption))
			)
		);
		optionsLengthValidator.parse(clone.length);
		this.options.splice(0, this.options.length, ...clone);
		return this;
	}
	/**
	 * {@inheritDoc BaseSelectMenuBuilder.toJSON}
	 */
	toJSON() {
		validateRequiredSelectMenuParameters(this.options, this.data.custom_id);
		return {
			...this.data,
			options: this.options.map((option) => option.toJSON())
		};
	}
};
var UserSelectMenuBuilder = class extends BaseSelectMenuBuilder {
	static {
		__name(this, 'UserSelectMenuBuilder');
	}
	/**
	 * Creates a new select menu from API data.
	 *
	 * @param data - The API data to create this select menu with
	 * @example
	 * Creating a select menu from an API data object:
	 * ```ts
	 * const selectMenu = new UserSelectMenuBuilder({
	 * 	custom_id: 'a cool select menu',
	 * 	placeholder: 'select an option',
	 * 	max_values: 2,
	 * });
	 * ```
	 * @example
	 * Creating a select menu using setters and API data:
	 * ```ts
	 * const selectMenu = new UserSelectMenuBuilder({
	 * 	custom_id: 'a cool select menu',
	 * })
	 * 	.setMinValues(1);
	 * ```
	 */
	constructor(data) {
		super({
			...data,
			type: ComponentType.UserSelect
		});
	}
	/**
	 * Adds default users to this auto populated select menu.
	 *
	 * @param users - The users to add
	 */
	addDefaultUsers(...users) {
		const normalizedValues = normalizeArray(users);
		optionsLengthValidator.parse((this.data.default_values?.length ?? 0) + normalizedValues.length);
		this.data.default_values ??= [];
		this.data.default_values.push(
			...normalizedValues.map((id) => ({
				id,
				type: SelectMenuDefaultValueType.User
			}))
		);
		return this;
	}
	/**
	 * Sets default users for this auto populated select menu.
	 *
	 * @param users - The users to set
	 */
	setDefaultUsers(...users) {
		const normalizedValues = normalizeArray(users);
		optionsLengthValidator.parse(normalizedValues.length);
		this.data.default_values = normalizedValues.map((id) => ({
			id,
			type: SelectMenuDefaultValueType.User
		}));
		return this;
	}
};
var TextInputBuilder = class extends ComponentBuilder {
	static {
		__name(this, 'TextInputBuilder');
	}
	/**
	 * Creates a new text input from API data.
	 *
	 * @param data - The API data to create this text input with
	 * @example
	 * Creating a text input from an API data object:
	 * ```ts
	 * const textInput = new TextInputBuilder({
	 * 	custom_id: 'a cool text input',
	 * 	placeholder: 'Type something',
	 * 	style: TextInputStyle.Short,
	 * });
	 * ```
	 * @example
	 * Creating a text input using setters and API data:
	 * ```ts
	 * const textInput = new TextInputBuilder({
	 * 	placeholder: 'Type something else',
	 * })
	 * 	.setCustomId('woah')
	 * 	.setStyle(TextInputStyle.Paragraph);
	 * ```
	 */
	constructor(data) {
		super({
			type: ComponentType.TextInput,
			...data
		});
	}
	/**
	 * Sets the custom id for this text input.
	 *
	 * @param customId - The custom id to use
	 */
	setCustomId(customId) {
		this.data.custom_id = customIdValidator.parse(customId);
		return this;
	}
	/**
	 * Sets the label for this text input.
	 *
	 * @param label - The label to use
	 * @deprecated Use a label builder to create a label (and optionally a description) instead.
	 */
	setLabel(label) {
		this.data.label = labelValidator.parse(label);
		return this;
	}
	/**
	 * Sets the style for this text input.
	 *
	 * @param style - The style to use
	 */
	setStyle(style) {
		this.data.style = textInputStyleValidator.parse(style);
		return this;
	}
	/**
	 * Sets the minimum length of text for this text input.
	 *
	 * @param minLength - The minimum length of text for this text input
	 */
	setMinLength(minLength) {
		this.data.min_length = minLengthValidator.parse(minLength);
		return this;
	}
	/**
	 * Sets the maximum length of text for this text input.
	 *
	 * @param maxLength - The maximum length of text for this text input
	 */
	setMaxLength(maxLength) {
		this.data.max_length = maxLengthValidator.parse(maxLength);
		return this;
	}
	/**
	 * Sets the placeholder for this text input.
	 *
	 * @param placeholder - The placeholder to use
	 */
	setPlaceholder(placeholder) {
		this.data.placeholder = placeholderValidator2.parse(placeholder);
		return this;
	}
	/**
	 * Sets the value for this text input.
	 *
	 * @param value - The value to use
	 */
	setValue(value) {
		this.data.value = valueValidator.parse(value);
		return this;
	}
	/**
	 * Sets whether this text input is required.
	 *
	 * @param required - Whether this text input is required
	 */
	setRequired(required = true) {
		this.data.required = requiredValidator.parse(required);
		return this;
	}
	/**
	 * {@inheritDoc ComponentBuilder.toJSON}
	 */
	toJSON() {
		validateRequiredParameters(this.data.custom_id, this.data.style);
		return { ...this.data };
	}
	/**
	 * Whether this is equal to another structure.
	 */
	equals(other) {
		if (isJSONEncodable(other)) return (0, import_fast_deep_equal.default)(other.toJSON(), this.data);
		return (0, import_fast_deep_equal.default)(other, this.data);
	}
};
__export({}, { labelPredicate: () => labelPredicate });
var labelPredicate = s3
	.object({
		id: idValidator.optional(),
		type: s3.literal(ComponentType.Label),
		label: s3.string().lengthGreaterThanOrEqual(1).lengthLessThanOrEqual(45),
		description: s3.string().lengthGreaterThanOrEqual(1).lengthLessThanOrEqual(100).optional(),
		component: s3.union([
			textInputPredicate,
			selectMenuUserPredicate,
			selectMenuRolePredicate,
			selectMenuMentionablePredicate,
			selectMenuChannelPredicate,
			selectMenuStringPredicate,
			fileUploadPredicate,
			checkboxPredicate,
			checkboxGroupPredicate,
			radioGroupPredicate
		])
	})
	.setValidationEnabled(isValidationEnabled);
var LabelBuilder = class extends ComponentBuilder {
	static {
		__name(this, 'LabelBuilder');
	}
	/**
	 * @internal
	 */
	data;
	/**
	 * Creates a new label.
	 *
	 * @param data - The API data to create this label with
	 * @example
	 * Creating a label from an API data object:
	 * ```ts
	 * const label = new LabelBuilder({
	 * 	label: "label",
	 * 	component,
	 * });
	 * ```
	 * @example
	 * Creating a label using setters and API data:
	 * ```ts
	 * const label = new LabelBuilder({
	 * 	label: 'label',
	 * 	component,
	 * }).setLabel('new text');
	 * ```
	 */
	constructor(data = {}) {
		super({ type: ComponentType.Label });
		const { component, ...rest } = data;
		this.data = {
			...rest,
			component: component ? createComponentBuilder(component) : void 0,
			type: ComponentType.Label
		};
	}
	/**
	 * Sets the label for this label.
	 *
	 * @param label - The label to use
	 */
	setLabel(label) {
		this.data.label = label;
		return this;
	}
	/**
	 * Sets the description for this label.
	 *
	 * @param description - The description to use
	 */
	setDescription(description) {
		this.data.description = description;
		return this;
	}
	/**
	 * Clears the description for this label.
	 */
	clearDescription() {
		this.data.description = void 0;
		return this;
	}
	/**
	 * Sets a string select menu component to this label.
	 *
	 * @param input - A function that returns a component builder or an already built builder
	 */
	setStringSelectMenuComponent(input) {
		this.data.component = resolveBuilder(input, StringSelectMenuBuilder);
		return this;
	}
	/**
	 * Sets a user select menu component to this label.
	 *
	 * @param input - A function that returns a component builder or an already built builder
	 */
	setUserSelectMenuComponent(input) {
		this.data.component = resolveBuilder(input, UserSelectMenuBuilder);
		return this;
	}
	/**
	 * Sets a role select menu component to this label.
	 *
	 * @param input - A function that returns a component builder or an already built builder
	 */
	setRoleSelectMenuComponent(input) {
		this.data.component = resolveBuilder(input, RoleSelectMenuBuilder);
		return this;
	}
	/**
	 * Sets a mentionable select menu component to this label.
	 *
	 * @param input - A function that returns a component builder or an already built builder
	 */
	setMentionableSelectMenuComponent(input) {
		this.data.component = resolveBuilder(input, MentionableSelectMenuBuilder);
		return this;
	}
	/**
	 * Sets a channel select menu component to this label.
	 *
	 * @param input - A function that returns a component builder or an already built builder
	 */
	setChannelSelectMenuComponent(input) {
		this.data.component = resolveBuilder(input, ChannelSelectMenuBuilder);
		return this;
	}
	/**
	 * Sets a text input component to this label.
	 *
	 * @param input - A function that returns a component builder or an already built builder
	 */
	setTextInputComponent(input) {
		this.data.component = resolveBuilder(input, TextInputBuilder);
		return this;
	}
	/**
	 * Sets a file upload component to this label.
	 *
	 * @param input - A function that returns a component builder or an already built builder
	 */
	setFileUploadComponent(input) {
		this.data.component = resolveBuilder(input, FileUploadBuilder);
		return this;
	}
	/**
	 * Sets a checkbox component to this label.
	 *
	 * @param input - A function that returns a component builder or an already built builder
	 */
	setCheckboxComponent(input) {
		this.data.component = resolveBuilder(input, CheckboxBuilder);
		return this;
	}
	/**
	 * Sets a checkbox group component to this label.
	 *
	 * @param input - A function that returns a component builder or an already built builder
	 */
	setCheckboxGroupComponent(input) {
		this.data.component = resolveBuilder(input, CheckboxGroupBuilder);
		return this;
	}
	/**
	 * Sets a radio group component to this label.
	 *
	 * @param input - A function that returns a component builder or an already built builder
	 */
	setRadioGroupComponent(input) {
		this.data.component = resolveBuilder(input, RadioGroupBuilder);
		return this;
	}
	/**
	 * {@inheritDoc ComponentBuilder.toJSON}
	 */
	toJSON() {
		const { component, ...rest } = this.data;
		const data = {
			...rest,
			component: component?.toJSON()
		};
		labelPredicate.parse(data);
		return data;
	}
};
__export(
	{},
	{
		accessoryPredicate: () => accessoryPredicate,
		assertReturnOfBuilder: () => assertReturnOfBuilder,
		containerColorPredicate: () => containerColorPredicate,
		descriptionPredicate: () => descriptionPredicate2,
		dividerPredicate: () => dividerPredicate,
		filePredicate: () => filePredicate,
		spacingPredicate: () => spacingPredicate,
		spoilerPredicate: () => spoilerPredicate,
		textDisplayContentPredicate: () => textDisplayContentPredicate,
		unfurledMediaItemPredicate: () => unfurledMediaItemPredicate,
		validateComponentArray: () => validateComponentArray
	}
);
var ThumbnailBuilder = class extends ComponentBuilder {
	static {
		__name(this, 'ThumbnailBuilder');
	}
	/**
	 * Creates a new thumbnail from API data.
	 *
	 * @param data - The API data to create this thumbnail with
	 * @example
	 * Creating a thumbnail from an API data object:
	 * ```ts
	 * const thumbnail = new ThumbnailBuilder({
	 * 	description: 'some text',
	 *  media: {
	 *      url: 'https://cdn.discordapp.com/embed/avatars/4.png',
	 *  },
	 * });
	 * ```
	 * @example
	 * Creating a thumbnail using setters and API data:
	 * ```ts
	 * const thumbnail = new ThumbnailBuilder({
	 * 	media: {
	 *      url: 'attachment://image.png',
	 *  },
	 * })
	 * 	.setDescription('alt text');
	 * ```
	 */
	constructor(data = {}) {
		super({
			type: ComponentType.Thumbnail,
			...data,
			media: data.media ? { url: data.media.url } : void 0
		});
	}
	/**
	 * Sets the description of this thumbnail.
	 *
	 * @param description - The description to use
	 */
	setDescription(description) {
		this.data.description = descriptionPredicate2.parse(description);
		return this;
	}
	/**
	 * Clears the description of this thumbnail.
	 */
	clearDescription() {
		this.data.description = void 0;
		return this;
	}
	/**
	 * Sets the spoiler status of this thumbnail.
	 *
	 * @param spoiler - The spoiler status to use
	 */
	setSpoiler(spoiler = true) {
		this.data.spoiler = spoilerPredicate.parse(spoiler);
		return this;
	}
	/**
	 * Sets the media URL of this thumbnail.
	 *
	 * @param url - The URL to use
	 */
	setURL(url) {
		this.data.media = unfurledMediaItemPredicate.parse({ url });
		return this;
	}
	/**
	 * {@inheritdoc ComponentBuilder.toJSON}
	 */
	toJSON() {
		unfurledMediaItemPredicate.parse(this.data.media);
		return { ...this.data };
	}
};
var unfurledMediaItemPredicate = s3
	.object({
		url: s3
			.string()
			.url(
				{ allowedProtocols: ['http:', 'https:', 'attachment:'] },
				{ message: 'Invalid protocol for media URL. Must be http:, https:, or attachment:' }
			)
	})
	.setValidationEnabled(isValidationEnabled);
var descriptionPredicate2 = s3.string().lengthGreaterThanOrEqual(1).lengthLessThanOrEqual(1024).setValidationEnabled(isValidationEnabled);
var filePredicate = s3
	.object({ url: s3.string().url({ allowedProtocols: ['attachment:'] }, { message: 'Invalid protocol for file URL. Must be attachment:' }) })
	.setValidationEnabled(isValidationEnabled);
var spoilerPredicate = s3.boolean();
var dividerPredicate = s3.boolean();
var spacingPredicate = s3.nativeEnum(SeparatorSpacingSize);
var textDisplayContentPredicate = s3.string().lengthGreaterThanOrEqual(1).lengthLessThanOrEqual(4e3).setValidationEnabled(isValidationEnabled);
var accessoryPredicate = s3.instance(ButtonBuilder).or(s3.instance(ThumbnailBuilder)).setValidationEnabled(isValidationEnabled);
var containerColorPredicate = colorPredicate.nullish();
function assertReturnOfBuilder(input, ExpectedInstanceOf) {
	s3.instance(ExpectedInstanceOf).setValidationEnabled(isValidationEnabled).parse(input);
}
__name(assertReturnOfBuilder, 'assertReturnOfBuilder');
function validateComponentArray(input, min, max, ExpectedInstanceOf) {
	(ExpectedInstanceOf ? s3.instance(ExpectedInstanceOf) : s3.instance(ComponentBuilder))
		.array()
		.lengthGreaterThanOrEqual(min)
		.lengthLessThanOrEqual(max)
		.setValidationEnabled(isValidationEnabled)
		.parse(input);
}
__name(validateComponentArray, 'validateComponentArray');
var FileBuilder = class extends ComponentBuilder {
	static {
		__name(this, 'FileBuilder');
	}
	/**
	 * Creates a new file from API data.
	 *
	 * @param data - The API data to create this file with
	 * @example
	 * Creating a file from an API data object:
	 * ```ts
	 * const file = new FileBuilder({
	 * 	spoiler: true,
	 * 	file: {
	 * 		url: 'attachment://file.png',
	 * 	},
	 * });
	 * ```
	 * @example
	 * Creating a file using setters and API data:
	 * ```ts
	 * const file = new FileBuilder({
	 * 	file: {
	 * 		url: 'attachment://image.jpg',
	 * 	},
	 * })
	 * 	.setSpoiler(false);
	 * ```
	 */
	constructor(data = {}) {
		super({
			type: ComponentType.File,
			...data,
			file: data.file ? { url: data.file.url } : void 0
		});
	}
	/**
	 * Sets the spoiler status of this file.
	 *
	 * @param spoiler - The spoiler status to use
	 */
	setSpoiler(spoiler = true) {
		this.data.spoiler = spoilerPredicate.parse(spoiler);
		return this;
	}
	/**
	 * Sets the media URL of this file.
	 *
	 * @param url - The URL to use
	 */
	setURL(url) {
		this.data.file = filePredicate.parse({ url });
		return this;
	}
	/**
	 * {@inheritDoc ComponentBuilder.toJSON}
	 */
	toJSON() {
		filePredicate.parse(this.data.file);
		return {
			...this.data,
			file: { ...this.data.file }
		};
	}
};
var SeparatorBuilder = class extends ComponentBuilder {
	static {
		__name(this, 'SeparatorBuilder');
	}
	/**
	 * Creates a new separator from API data.
	 *
	 * @param data - The API data to create this separator with
	 * @example
	 * Creating a separator from an API data object:
	 * ```ts
	 * const separator = new SeparatorBuilder({
	 * 	spacing: SeparatorSpacingSize.Small,
	 *  divider: true,
	 * });
	 * ```
	 * @example
	 * Creating a separator using setters and API data:
	 * ```ts
	 * const separator = new SeparatorBuilder({
	 * 	spacing: SeparatorSpacingSize.Large,
	 * })
	 * 	.setDivider(false);
	 * ```
	 */
	constructor(data = {}) {
		super({
			type: ComponentType.Separator,
			...data
		});
	}
	/**
	 * Sets whether this separator should show a divider line.
	 *
	 * @param divider - Whether to show a divider line
	 */
	setDivider(divider = true) {
		this.data.divider = dividerPredicate.parse(divider);
		return this;
	}
	/**
	 * Sets the spacing of this separator.
	 *
	 * @param spacing - The spacing to use
	 */
	setSpacing(spacing) {
		this.data.spacing = spacingPredicate.parse(spacing);
		return this;
	}
	/**
	 * Clears the spacing of this separator.
	 */
	clearSpacing() {
		this.data.spacing = void 0;
		return this;
	}
	/**
	 * {@inheritDoc ComponentBuilder.toJSON}
	 */
	toJSON() {
		return { ...this.data };
	}
};
var TextDisplayBuilder = class extends ComponentBuilder {
	static {
		__name(this, 'TextDisplayBuilder');
	}
	/**
	 * Creates a new text display from API data.
	 *
	 * @param data - The API data to create this text display with
	 * @example
	 * Creating a text display from an API data object:
	 * ```ts
	 * const textDisplay = new TextDisplayBuilder({
	 * 	content: 'some text',
	 * });
	 * ```
	 * @example
	 * Creating a text display using setters and API data:
	 * ```ts
	 * const textDisplay = new TextDisplayBuilder({
	 * 	content: 'old text',
	 * })
	 * 	.setContent('new text');
	 * ```
	 */
	constructor(data = {}) {
		super({
			type: ComponentType.TextDisplay,
			...data
		});
	}
	/**
	 * Sets the text of this text display.
	 *
	 * @param content - The text to use
	 */
	setContent(content) {
		this.data.content = textDisplayContentPredicate.parse(content);
		return this;
	}
	/**
	 * {@inheritDoc ComponentBuilder.toJSON}
	 */
	toJSON() {
		textDisplayContentPredicate.parse(this.data.content);
		return { ...this.data };
	}
};
var ContainerBuilder = class extends ComponentBuilder {
	static {
		__name(this, 'ContainerBuilder');
	}
	/**
	 * The components within this container.
	 */
	components;
	/**
	 * Creates a new container from API data.
	 *
	 * @param data - The API data to create this container with
	 * @example
	 * Creating a container from an API data object:
	 * ```ts
	 * const container = new ContainerBuilder({
	 * 	components: [
	 * 		{
	 * 			content: "Some text here",
	 * 			type: ComponentType.TextDisplay,
	 * 		},
	 * 	],
	 * });
	 * ```
	 * @example
	 * Creating a container using setters and API data:
	 * ```ts
	 * const container = new ContainerBuilder({
	 * 	components: [
	 * 		{
	 * 			content: "# Heading",
	 * 			type: ComponentType.TextDisplay,
	 * 		},
	 * 	],
	 * })
	 *  .addSeparatorComponents(separator)
	 *  .addSectionComponents(section);
	 * ```
	 */
	constructor({ components, ...data } = {}) {
		super({
			type: ComponentType.Container,
			...data
		});
		this.components = components?.map((component) => createComponentBuilder(component)) ?? [];
	}
	/**
	 * Sets the accent color of this container.
	 *
	 * @param color - The color to use
	 */
	setAccentColor(color) {
		containerColorPredicate.parse(color);
		if (Array.isArray(color)) {
			const [red, green, blue] = color;
			this.data.accent_color = (red << 16) + (green << 8) + blue;
			return this;
		}
		this.data.accent_color = color;
		return this;
	}
	/**
	 * Clears the accent color of this container.
	 */
	clearAccentColor() {
		this.data.accent_color = void 0;
		return this;
	}
	/**
	 * Adds action row components to this container.
	 *
	 * @param components - The action row components to add
	 */
	addActionRowComponents(...components) {
		this.components.push(...normalizeArray(components).map((component) => resolveBuilder(component, ActionRowBuilder)));
		return this;
	}
	/**
	 * Adds file components to this container.
	 *
	 * @param components - The file components to add
	 */
	addFileComponents(...components) {
		this.components.push(...normalizeArray(components).map((component) => resolveBuilder(component, FileBuilder)));
		return this;
	}
	/**
	 * Adds media gallery components to this container.
	 *
	 * @param components - The media gallery components to add
	 */
	addMediaGalleryComponents(...components) {
		this.components.push(...normalizeArray(components).map((component) => resolveBuilder(component, MediaGalleryBuilder)));
		return this;
	}
	/**
	 * Adds section components to this container.
	 *
	 * @param components - The section components to add
	 */
	addSectionComponents(...components) {
		this.components.push(...normalizeArray(components).map((component) => resolveBuilder(component, SectionBuilder)));
		return this;
	}
	/**
	 * Adds separator components to this container.
	 *
	 * @param components - The separator components to add
	 */
	addSeparatorComponents(...components) {
		this.components.push(...normalizeArray(components).map((component) => resolveBuilder(component, SeparatorBuilder)));
		return this;
	}
	/**
	 * Adds text display components to this container.
	 *
	 * @param components - The text display components to add
	 */
	addTextDisplayComponents(...components) {
		this.components.push(...normalizeArray(components).map((component) => resolveBuilder(component, TextDisplayBuilder)));
		return this;
	}
	/**
	 * Removes, replaces, or inserts components for this container.
	 *
	 * @param index - The index to start removing, replacing or inserting components
	 * @param deleteCount - The amount of components to remove
	 * @param components - The components to set
	 */
	spliceComponents(index, deleteCount, ...components) {
		this.components.splice(
			index,
			deleteCount,
			...normalizeArray(components).map((component) => (component instanceof ComponentBuilder ? component : createComponentBuilder(component)))
		);
		return this;
	}
	/**
	 * Sets the spoiler status of this container.
	 *
	 * @param spoiler - The spoiler status to use
	 */
	setSpoiler(spoiler = true) {
		this.data.spoiler = spoilerPredicate.parse(spoiler);
		return this;
	}
	/**
	 * {@inheritDoc ComponentBuilder.toJSON}
	 */
	toJSON() {
		return {
			...this.data,
			components: this.components.map((component) => component.toJSON())
		};
	}
};
var MediaGalleryItemBuilder = class {
	static {
		__name(this, 'MediaGalleryItemBuilder');
	}
	/**
	 * The API data associated with this media gallery item.
	 */
	data;
	/**
	 * Creates a new media gallery item from API data.
	 *
	 * @param data - The API data to create this media gallery item with
	 * @example
	 * Creating a media gallery item from an API data object:
	 * ```ts
	 * const item = new MediaGalleryItemBuilder({
	 * 	description: "Some text here",
	 * 	media: {
	 * 		url: 'https://cdn.discordapp.com/embed/avatars/2.png',
	 * 	},
	 * });
	 * ```
	 * @example
	 * Creating a media gallery item using setters and API data:
	 * ```ts
	 * const item = new MediaGalleryItemBuilder({
	 * 	media: {
	 * 		url: 'https://cdn.discordapp.com/embed/avatars/5.png',
	 * 	},
	 * })
	 * 	.setDescription("alt text");
	 * ```
	 */
	constructor(data = {}) {
		this.data = data;
	}
	/**
	 * Sets the description of this media gallery item.
	 *
	 * @param description - The description to use
	 */
	setDescription(description) {
		this.data.description = descriptionPredicate2.parse(description);
		return this;
	}
	/**
	 * Clears the description of this media gallery item.
	 */
	clearDescription() {
		this.data.description = void 0;
		return this;
	}
	/**
	 * Sets the spoiler status of this media gallery item.
	 *
	 * @param spoiler - The spoiler status to use
	 */
	setSpoiler(spoiler = true) {
		this.data.spoiler = spoilerPredicate.parse(spoiler);
		return this;
	}
	/**
	 * Sets the media URL of this media gallery item.
	 *
	 * @param url - The URL to use
	 */
	setURL(url) {
		this.data.media = unfurledMediaItemPredicate.parse({ url });
		return this;
	}
	/**
	 * Serializes this builder to API-compatible JSON data.
	 *
	 * @remarks
	 * This method runs validations on the data before serializing it.
	 * As such, it may throw an error if the data is invalid.
	 */
	toJSON() {
		unfurledMediaItemPredicate.parse(this.data.media);
		return { ...this.data };
	}
};
var MediaGalleryBuilder = class extends ComponentBuilder {
	static {
		__name(this, 'MediaGalleryBuilder');
	}
	/**
	 * The components within this container.
	 */
	items;
	/**
	 * Creates a new media gallery from API data.
	 *
	 * @param data - The API data to create this media gallery with
	 * @example
	 * Creating a media gallery from an API data object:
	 * ```ts
	 * const mediaGallery = new MediaGalleryBuilder({
	 * 	items: [
	 * 		{
	 * 			description: "Some text here",
	 * 			media: {
	 * 				url: 'https://cdn.discordapp.com/embed/avatars/2.png',
	 * 			},
	 * 		},
	 * 	],
	 * });
	 * ```
	 * @example
	 * Creating a media gallery using setters and API data:
	 * ```ts
	 * const mediaGallery = new MediaGalleryBuilder({
	 * 	items: [
	 * 		{
	 * 			description: "alt text",
	 * 			media: {
	 * 				url: 'https://cdn.discordapp.com/embed/avatars/5.png',
	 * 			},
	 * 		},
	 * 	],
	 * })
	 * 	.addItems(item2, item3);
	 * ```
	 */
	constructor({ items, ...data } = {}) {
		super({
			type: ComponentType.MediaGallery,
			...data
		});
		this.items = items?.map((item) => new MediaGalleryItemBuilder(item)) ?? [];
	}
	/**
	 * Adds items to this media gallery.
	 *
	 * @param items - The items to add
	 */
	addItems(...items) {
		this.items.push(
			...normalizeArray(items).map((input) => {
				const result = resolveBuilder(input, MediaGalleryItemBuilder);
				assertReturnOfBuilder(result, MediaGalleryItemBuilder);
				return result;
			})
		);
		return this;
	}
	/**
	 * Removes, replaces, or inserts media gallery items for this media gallery.
	 *
	 * @param index - The index to start removing, replacing or inserting items
	 * @param deleteCount - The amount of items to remove
	 * @param items - The items to insert
	 */
	spliceItems(index, deleteCount, ...items) {
		this.items.splice(
			index,
			deleteCount,
			...normalizeArray(items).map((input) => {
				const result = resolveBuilder(input, MediaGalleryItemBuilder);
				assertReturnOfBuilder(result, MediaGalleryItemBuilder);
				return result;
			})
		);
		return this;
	}
	/**
	 * {@inheritDoc ComponentBuilder.toJSON}
	 */
	toJSON() {
		validateComponentArray(this.items, 1, 10, MediaGalleryItemBuilder);
		return {
			...this.data,
			items: this.items.map((item) => item.toJSON())
		};
	}
};
var SectionBuilder = class extends ComponentBuilder {
	static {
		__name(this, 'SectionBuilder');
	}
	/**
	 * The components within this section.
	 */
	components;
	/**
	 * The accessory of this section.
	 */
	accessory;
	/**
	 * Creates a new section from API data.
	 *
	 * @param data - The API data to create this section with
	 * @example
	 * Creating a section from an API data object:
	 * ```ts
	 * const section = new SectionBuilder({
	 * 	components: [
	 * 		{
	 * 			content: "Some text here",
	 * 			type: ComponentType.TextDisplay,
	 * 		},
	 * 	],
	 *  accessory: {
	 *      media: {
	 *          url: 'https://cdn.discordapp.com/embed/avatars/3.png',
	 *      },
	 *  }
	 * });
	 * ```
	 * @example
	 * Creating a section using setters and API data:
	 * ```ts
	 * const section = new SectionBuilder({
	 * 	components: [
	 * 		{
	 * 			content: "# Heading",
	 * 			type: ComponentType.TextDisplay,
	 * 		},
	 * 	],
	 * })
	 * 	.setPrimaryButtonAccessory(button);
	 * ```
	 */
	constructor({ components, accessory, ...data } = {}) {
		super({
			type: ComponentType.Section,
			...data
		});
		this.components = components?.map((component) => createComponentBuilder(component)) ?? [];
		this.accessory = accessory ? createComponentBuilder(accessory) : void 0;
	}
	/**
	 * Sets the accessory of this section to a button.
	 *
	 * @param accessory - The accessory to use
	 */
	setButtonAccessory(accessory) {
		Reflect.set(this, 'accessory', accessoryPredicate.parse(resolveBuilder(accessory, ButtonBuilder)));
		return this;
	}
	/**
	 * Sets the accessory of this section to a thumbnail.
	 *
	 * @param accessory - The accessory to use
	 */
	setThumbnailAccessory(accessory) {
		Reflect.set(this, 'accessory', accessoryPredicate.parse(resolveBuilder(accessory, ThumbnailBuilder)));
		return this;
	}
	/**
	 * Adds text display components to this section.
	 *
	 * @param components - The text display components to add
	 */
	addTextDisplayComponents(...components) {
		this.components.push(
			...normalizeArray(components).map((input) => {
				const result = resolveBuilder(input, TextDisplayBuilder);
				assertReturnOfBuilder(result, TextDisplayBuilder);
				return result;
			})
		);
		return this;
	}
	/**
	 * Removes, replaces, or inserts text display components for this section.
	 *
	 * @param index - The index to start removing, replacing or inserting text display components
	 * @param deleteCount - The amount of text display components to remove
	 * @param components - The text display components to insert
	 */
	spliceTextDisplayComponents(index, deleteCount, ...components) {
		this.components.splice(
			index,
			deleteCount,
			...normalizeArray(components).map((input) => {
				const result = resolveBuilder(input, TextDisplayBuilder);
				assertReturnOfBuilder(result, TextDisplayBuilder);
				return result;
			})
		);
		return this;
	}
	/**
	 * {@inheritDoc ComponentBuilder.toJSON}
	 */
	toJSON() {
		validateComponentArray(this.components, 1, 3, TextDisplayBuilder);
		return {
			...this.data,
			components: this.components.map((component) => component.toJSON()),
			accessory: accessoryPredicate.parse(this.accessory).toJSON()
		};
	}
};
function createComponentBuilder(data) {
	if (data instanceof ComponentBuilder) return data;
	switch (data.type) {
		case ComponentType.ActionRow:
			return new ActionRowBuilder(data);
		case ComponentType.Button:
			return new ButtonBuilder(data);
		case ComponentType.StringSelect:
			return new StringSelectMenuBuilder(data);
		case ComponentType.TextInput:
			return new TextInputBuilder(data);
		case ComponentType.UserSelect:
			return new UserSelectMenuBuilder(data);
		case ComponentType.RoleSelect:
			return new RoleSelectMenuBuilder(data);
		case ComponentType.MentionableSelect:
			return new MentionableSelectMenuBuilder(data);
		case ComponentType.ChannelSelect:
			return new ChannelSelectMenuBuilder(data);
		case ComponentType.File:
			return new FileBuilder(data);
		case ComponentType.Container:
			return new ContainerBuilder(data);
		case ComponentType.Section:
			return new SectionBuilder(data);
		case ComponentType.Separator:
			return new SeparatorBuilder(data);
		case ComponentType.TextDisplay:
			return new TextDisplayBuilder(data);
		case ComponentType.Thumbnail:
			return new ThumbnailBuilder(data);
		case ComponentType.MediaGallery:
			return new MediaGalleryBuilder(data);
		case ComponentType.Label:
			return new LabelBuilder(data);
		case ComponentType.FileUpload:
			return new FileUploadBuilder(data);
		case ComponentType.Checkbox:
			return new CheckboxBuilder(data);
		case ComponentType.CheckboxGroup:
			return new CheckboxGroupBuilder(data);
		case ComponentType.RadioGroup:
			return new RadioGroupBuilder(data);
		default:
			throw new Error(`Cannot properly serialize component type: ${data.type}`);
	}
}
__name(createComponentBuilder, 'createComponentBuilder');
function isBuilder(builder, Constructor) {
	return builder instanceof Constructor;
}
__name(isBuilder, 'isBuilder');
function resolveBuilder(builder, Constructor) {
	if (isBuilder(builder, Constructor)) return builder;
	if (typeof builder === 'function') return builder(new Constructor());
	return new Constructor(builder);
}
__name(resolveBuilder, 'resolveBuilder');
var ActionRowBuilder = class extends ComponentBuilder {
	static {
		__name(this, 'ActionRowBuilder');
	}
	/**
	 * The components within this action row.
	 */
	components;
	/**
	 * Creates a new action row from API data.
	 *
	 * @param data - The API data to create this action row with
	 * @example
	 * Creating an action row from an API data object:
	 * ```ts
	 * const actionRow = new ActionRowBuilder({
	 * 	components: [
	 * 		{
	 * 			custom_id: "custom id",
	 * 			label: "Type something",
	 * 			style: TextInputStyle.Short,
	 * 			type: ComponentType.TextInput,
	 * 		},
	 * 	],
	 * });
	 * ```
	 * @example
	 * Creating an action row using setters and API data:
	 * ```ts
	 * const actionRow = new ActionRowBuilder({
	 * 	components: [
	 * 		{
	 * 			custom_id: "custom id",
	 * 			label: "Click me",
	 * 			style: ButtonStyle.Primary,
	 * 			type: ComponentType.Button,
	 * 		},
	 * 	],
	 * })
	 * 	.addComponents(button2, button3);
	 * ```
	 */
	constructor({ components, ...data } = {}) {
		super({
			type: ComponentType.ActionRow,
			...data
		});
		this.components = components?.map((component) => createComponentBuilder(component)) ?? [];
	}
	/**
	 * Adds components to this action row.
	 *
	 * @param components - The components to add
	 */
	addComponents(...components) {
		this.components.push(...normalizeArray(components));
		return this;
	}
	/**
	 * Sets components for this action row.
	 *
	 * @param components - The components to set
	 */
	setComponents(...components) {
		this.components.splice(0, this.components.length, ...normalizeArray(components));
		return this;
	}
	/**
	 * {@inheritDoc ComponentBuilder.toJSON}
	 */
	toJSON() {
		return {
			...this.data,
			components: this.components.map((component) => component.toJSON())
		};
	}
};
__export(
	{},
	{
		componentsValidator: () => componentsValidator,
		titleValidator: () => titleValidator,
		validateRequiredParameters: () => validateRequiredParameters2
	}
);
var titleValidator = s3.string().lengthGreaterThanOrEqual(1).lengthLessThanOrEqual(45).setValidationEnabled(isValidationEnabled);
var componentsValidator = s3
	.union([s3.instance(ActionRowBuilder), s3.instance(LabelBuilder), s3.instance(TextDisplayBuilder)])
	.array()
	.lengthGreaterThanOrEqual(1)
	.setValidationEnabled(isValidationEnabled);
function validateRequiredParameters2(customId, title, components) {
	customIdValidator.parse(customId);
	titleValidator.parse(title);
	componentsValidator.parse(components);
}
__name(validateRequiredParameters2, 'validateRequiredParameters');
var ModalBuilder = class {
	static {
		__name(this, 'ModalBuilder');
	}
	/**
	 * The API data associated with this modal.
	 */
	data;
	/**
	 * The components within this modal.
	 */
	components = [];
	/**
	 * Creates a new modal from API data.
	 *
	 * @param data - The API data to create this modal with
	 */
	constructor({ components, ...data } = {}) {
		this.data = { ...data };
		this.components = components?.map((component) => createComponentBuilder(component)) ?? [];
	}
	/**
	 * Sets the title of this modal.
	 *
	 * @param title - The title to use
	 */
	setTitle(title) {
		this.data.title = titleValidator.parse(title);
		return this;
	}
	/**
	 * Sets the custom id of this modal.
	 *
	 * @param customId - The custom id to use
	 */
	setCustomId(customId) {
		this.data.custom_id = customIdValidator.parse(customId);
		return this;
	}
	/**
	 * Adds components to this modal.
	 *
	 * @param components - The components to add
	 * @deprecated Use {@link ModalBuilder.addLabelComponents} or {@link ModalBuilder.addTextDisplayComponents} instead
	 */
	addComponents(...components) {
		this.components.push(
			...normalizeArray(components).map((component, idx) => {
				if (component instanceof ActionRowBuilder || component instanceof LabelBuilder || component instanceof TextDisplayBuilder)
					return component;
				if (component instanceof TextInputBuilder) return new ActionRowBuilder().addComponents(component);
				if ('type' in component) {
					if (component.type === ComponentType.ActionRow) return new ActionRowBuilder(component);
					if (component.type === ComponentType.Label) return new LabelBuilder(component);
					if (component.type === ComponentType.TextDisplay) return new TextDisplayBuilder(component);
					if (component.type === ComponentType.TextInput) return new ActionRowBuilder().addComponents(new TextInputBuilder(component));
				}
				throw new TypeError(`Invalid component passed in ModalBuilder.addComponents at index ${idx}!`);
			})
		);
		return this;
	}
	/**
	 * Adds label components to this modal.
	 *
	 * @param components - The components to add
	 */
	addLabelComponents(...components) {
		const resolved = normalizeArray(components).map((label) => resolveBuilder(label, LabelBuilder));
		this.components.push(...resolved);
		return this;
	}
	/**
	 * Adds text display components to this modal.
	 *
	 * @param components - The components to add
	 */
	addTextDisplayComponents(...components) {
		const resolved = normalizeArray(components).map((row) => resolveBuilder(row, TextDisplayBuilder));
		this.components.push(...resolved);
		return this;
	}
	/**
	 * Adds action rows to this modal.
	 *
	 * @param components - The components to add
	 * @deprecated Use {@link ModalBuilder.addLabelComponents} instead
	 */
	addActionRowComponents(...components) {
		const resolved = normalizeArray(components).map((row) => resolveBuilder(row, ActionRowBuilder));
		this.components.push(...resolved);
		return this;
	}
	/**
	 * Sets the labels for this modal.
	 *
	 * @param components - The components to set
	 */
	setLabelComponents(...components) {
		const normalized = normalizeArray(components);
		this.spliceLabelComponents(0, this.components.length, ...normalized);
		return this;
	}
	/**
	 * Removes, replaces, or inserts labels for this modal.
	 *
	 * @remarks
	 * This method behaves similarly
	 * to {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/splice | Array.prototype.splice()}.
	 * The maximum amount of labels that can be added is 5.
	 *
	 * It's useful for modifying and adjusting order of the already-existing labels of a modal.
	 * @example
	 * Remove the first label:
	 * ```ts
	 * modal.spliceLabelComponents(0, 1);
	 * ```
	 * @example
	 * Remove the first n labels:
	 * ```ts
	 * const n = 4;
	 * modal.spliceLabelComponents(0, n);
	 * ```
	 * @example
	 * Remove the last label:
	 * ```ts
	 * modal.spliceLabelComponents(-1, 1);
	 * ```
	 * @param index - The index to start at
	 * @param deleteCount - The number of labels to remove
	 * @param labels - The replacing label objects
	 */
	spliceLabelComponents(index, deleteCount, ...labels) {
		const resolved = labels.map((label) => resolveBuilder(label, LabelBuilder));
		this.components.splice(index, deleteCount, ...resolved);
		return this;
	}
	/**
	 * Sets components for this modal.
	 *
	 * @param components - The components to set
	 * @deprecated Use {@link ModalBuilder.setLabelComponents} instead
	 */
	setComponents(...components) {
		this.components.splice(0, this.components.length, ...normalizeArray(components));
		return this;
	}
	/**
	 * {@inheritDoc ComponentBuilder.toJSON}
	 */
	toJSON() {
		validateRequiredParameters2(this.data.custom_id, this.data.title, this.components);
		return {
			...this.data,
			components: this.components.map((component) => component.toJSON())
		};
	}
};
__export(
	{},
	{
		assertReturnOfBuilder: () => assertReturnOfBuilder2,
		contextsPredicate: () => contextsPredicate,
		integrationTypesPredicate: () => integrationTypesPredicate,
		localizationMapPredicate: () => localizationMapPredicate,
		validateChoicesLength: () => validateChoicesLength,
		validateDMPermission: () => validateDMPermission,
		validateDefaultMemberPermissions: () => validateDefaultMemberPermissions,
		validateDefaultPermission: () => validateDefaultPermission,
		validateDescription: () => validateDescription,
		validateLocale: () => validateLocale,
		validateLocalizationMap: () => validateLocalizationMap,
		validateMaxOptionsLength: () => validateMaxOptionsLength,
		validateNSFW: () => validateNSFW,
		validateName: () => validateName,
		validateRequired: () => validateRequired,
		validateRequiredParameters: () => validateRequiredParameters3
	}
);
var namePredicate = s3
	.string()
	.lengthGreaterThanOrEqual(1)
	.lengthLessThanOrEqual(32)
	.regex(/^[\p{Ll}\p{Lm}\p{Lo}\p{N}\p{sc=Devanagari}\p{sc=Thai}_-]+$/u)
	.setValidationEnabled(isValidationEnabled);
function validateName(name) {
	namePredicate.parse(name);
}
__name(validateName, 'validateName');
var descriptionPredicate3 = s3.string().lengthGreaterThanOrEqual(1).lengthLessThanOrEqual(100).setValidationEnabled(isValidationEnabled);
var localePredicate = s3.nativeEnum(Locale);
function validateDescription(description) {
	descriptionPredicate3.parse(description);
}
__name(validateDescription, 'validateDescription');
var maxArrayLengthPredicate = s3.unknown().array().lengthLessThanOrEqual(25).setValidationEnabled(isValidationEnabled);
function validateLocale(locale) {
	return localePredicate.parse(locale);
}
__name(validateLocale, 'validateLocale');
function validateMaxOptionsLength(options) {
	maxArrayLengthPredicate.parse(options);
}
__name(validateMaxOptionsLength, 'validateMaxOptionsLength');
function validateRequiredParameters3(name, description, options) {
	validateName(name);
	validateDescription(description);
	validateMaxOptionsLength(options);
}
__name(validateRequiredParameters3, 'validateRequiredParameters');
var booleanPredicate = s3.boolean();
function validateDefaultPermission(value) {
	booleanPredicate.parse(value);
}
__name(validateDefaultPermission, 'validateDefaultPermission');
function validateRequired(required) {
	booleanPredicate.parse(required);
}
__name(validateRequired, 'validateRequired');
var choicesLengthPredicate = s3.number().lessThanOrEqual(25).setValidationEnabled(isValidationEnabled);
function validateChoicesLength(amountAdding, choices) {
	choicesLengthPredicate.parse((choices?.length ?? 0) + amountAdding);
}
__name(validateChoicesLength, 'validateChoicesLength');
function assertReturnOfBuilder2(input, ExpectedInstanceOf) {
	s3.instance(ExpectedInstanceOf).parse(input);
}
__name(assertReturnOfBuilder2, 'assertReturnOfBuilder');
var localizationMapPredicate = s3
	.object(Object.fromEntries(Object.values(Locale).map((locale) => [locale, s3.string().nullish()])))
	.strict()
	.nullish()
	.setValidationEnabled(isValidationEnabled);
function validateLocalizationMap(value) {
	localizationMapPredicate.parse(value);
}
__name(validateLocalizationMap, 'validateLocalizationMap');
var dmPermissionPredicate = s3.boolean().nullish();
function validateDMPermission(value) {
	dmPermissionPredicate.parse(value);
}
__name(validateDMPermission, 'validateDMPermission');
var memberPermissionPredicate = s3
	.union([
		s3.bigint().transform((value) => value.toString()),
		s3
			.number()
			.safeInt()
			.transform((value) => value.toString()),
		s3.string().regex(/^\d+$/)
	])
	.nullish();
function validateDefaultMemberPermissions(permissions) {
	return memberPermissionPredicate.parse(permissions);
}
__name(validateDefaultMemberPermissions, 'validateDefaultMemberPermissions');
function validateNSFW(value) {
	booleanPredicate.parse(value);
}
__name(validateNSFW, 'validateNSFW');
var contextsPredicate = s3.array(s3.nativeEnum(InteractionContextType).setValidationEnabled(isValidationEnabled));
var integrationTypesPredicate = s3.array(s3.nativeEnum(ApplicationIntegrationType).setValidationEnabled(isValidationEnabled));
var SharedNameAndDescription = class {
	static {
		__name(this, 'SharedNameAndDescription');
	}
	/**
	 * The name of this command.
	 */
	name;
	/**
	 * The name localizations of this command.
	 */
	name_localizations;
	/**
	 * The description of this command.
	 */
	description;
	/**
	 * The description localizations of this command.
	 */
	description_localizations;
	/**
	 * Sets the name of this command.
	 *
	 * @param name - The name to use
	 */
	setName(name) {
		validateName(name);
		Reflect.set(this, 'name', name);
		return this;
	}
	/**
	 * Sets the description of this command.
	 *
	 * @param description - The description to use
	 */
	setDescription(description) {
		validateDescription(description);
		Reflect.set(this, 'description', description);
		return this;
	}
	/**
	 * Sets a name localization for this command.
	 *
	 * @param locale - The locale to set
	 * @param localizedName - The localized name for the given `locale`
	 */
	setNameLocalization(locale, localizedName) {
		if (!this.name_localizations) Reflect.set(this, 'name_localizations', {});
		const parsedLocale = validateLocale(locale);
		if (localizedName === null) {
			this.name_localizations[parsedLocale] = null;
			return this;
		}
		validateName(localizedName);
		this.name_localizations[parsedLocale] = localizedName;
		return this;
	}
	/**
	 * Sets the name localizations for this command.
	 *
	 * @param localizedNames - The object of localized names to set
	 */
	setNameLocalizations(localizedNames) {
		if (localizedNames === null) {
			Reflect.set(this, 'name_localizations', null);
			return this;
		}
		Reflect.set(this, 'name_localizations', {});
		for (const args of Object.entries(localizedNames)) this.setNameLocalization(...args);
		return this;
	}
	/**
	 * Sets a description localization for this command.
	 *
	 * @param locale - The locale to set
	 * @param localizedDescription - The localized description for the given locale
	 */
	setDescriptionLocalization(locale, localizedDescription) {
		if (!this.description_localizations) Reflect.set(this, 'description_localizations', {});
		const parsedLocale = validateLocale(locale);
		if (localizedDescription === null) {
			this.description_localizations[parsedLocale] = null;
			return this;
		}
		validateDescription(localizedDescription);
		this.description_localizations[parsedLocale] = localizedDescription;
		return this;
	}
	/**
	 * Sets the description localizations for this command.
	 *
	 * @param localizedDescriptions - The object of localized descriptions to set
	 */
	setDescriptionLocalizations(localizedDescriptions) {
		if (localizedDescriptions === null) {
			Reflect.set(this, 'description_localizations', null);
			return this;
		}
		Reflect.set(this, 'description_localizations', {});
		for (const args of Object.entries(localizedDescriptions)) this.setDescriptionLocalization(...args);
		return this;
	}
};
var SharedSlashCommand = class {
	static {
		__name(this, 'SharedSlashCommand');
	}
	name = void 0;
	name_localizations;
	description = void 0;
	description_localizations;
	options = [];
	contexts;
	/**
	 * @deprecated Use {@link SharedSlashCommand.setDefaultMemberPermissions} or {@link SharedSlashCommand.setDMPermission} instead.
	 */
	default_permission = void 0;
	default_member_permissions = void 0;
	/**
	 * @deprecated Use {@link SharedSlashCommand.contexts} instead.
	 */
	dm_permission = void 0;
	integration_types;
	nsfw = void 0;
	/**
	 * Sets the contexts of this command.
	 *
	 * @param contexts - The contexts
	 */
	setContexts(...contexts) {
		Reflect.set(this, 'contexts', contextsPredicate.parse(normalizeArray(contexts)));
		return this;
	}
	/**
	 * Sets the integration types of this command.
	 *
	 * @param integrationTypes - The integration types
	 */
	setIntegrationTypes(...integrationTypes) {
		Reflect.set(this, 'integration_types', integrationTypesPredicate.parse(normalizeArray(integrationTypes)));
		return this;
	}
	/**
	 * Sets whether the command is enabled by default when the application is added to a guild.
	 *
	 * @remarks
	 * If set to `false`, you will have to later `PUT` the permissions for this command.
	 * @param value - Whether or not to enable this command by default
	 * @see {@link https://discord.com/developers/docs/interactions/application-commands#permissions}
	 * @deprecated Use {@link SharedSlashCommand.setDefaultMemberPermissions} or {@link SharedSlashCommand.setDMPermission} instead.
	 */
	setDefaultPermission(value) {
		validateDefaultPermission(value);
		Reflect.set(this, 'default_permission', value);
		return this;
	}
	/**
	 * Sets the default permissions a member should have in order to run the command.
	 *
	 * @remarks
	 * You can set this to `'0'` to disable the command by default.
	 * @param permissions - The permissions bit field to set
	 * @see {@link https://discord.com/developers/docs/interactions/application-commands#permissions}
	 */
	setDefaultMemberPermissions(permissions) {
		const permissionValue = validateDefaultMemberPermissions(permissions);
		Reflect.set(this, 'default_member_permissions', permissionValue);
		return this;
	}
	/**
	 * Sets if the command is available in direct messages with the application.
	 *
	 * @remarks
	 * By default, commands are visible. This method is only for global commands.
	 * @param enabled - Whether the command should be enabled in direct messages
	 * @see {@link https://discord.com/developers/docs/interactions/application-commands#permissions}
	 * @deprecated
	 * Use {@link SharedSlashCommand.setContexts} instead.
	 */
	setDMPermission(enabled) {
		validateDMPermission(enabled);
		Reflect.set(this, 'dm_permission', enabled);
		return this;
	}
	/**
	 * Sets whether this command is NSFW.
	 *
	 * @param nsfw - Whether this command is NSFW
	 */
	setNSFW(nsfw = true) {
		validateNSFW(nsfw);
		Reflect.set(this, 'nsfw', nsfw);
		return this;
	}
	/**
	 * Serializes this builder to API-compatible JSON data.
	 *
	 * @remarks
	 * This method runs validations on the data before serializing it.
	 * As such, it may throw an error if the data is invalid.
	 */
	toJSON() {
		validateRequiredParameters3(this.name, this.description, this.options);
		validateLocalizationMap(this.name_localizations);
		validateLocalizationMap(this.description_localizations);
		return {
			...this,
			type: ApplicationCommandType.ChatInput,
			options: this.options.map((option) => option.toJSON())
		};
	}
};
var ApplicationCommandOptionBase = class extends SharedNameAndDescription {
	static {
		__name(this, 'ApplicationCommandOptionBase');
	}
	/**
	 * Whether this option is required.
	 *
	 * @defaultValue `false`
	 */
	required = false;
	/**
	 * Sets whether this option is required.
	 *
	 * @param required - Whether this option should be required
	 */
	setRequired(required) {
		validateRequired(required);
		Reflect.set(this, 'required', required);
		return this;
	}
	/**
	 * This method runs required validators on this builder.
	 */
	runRequiredValidations() {
		validateRequiredParameters3(this.name, this.description, []);
		validateLocalizationMap(this.name_localizations);
		validateLocalizationMap(this.description_localizations);
		validateRequired(this.required);
	}
};
var SlashCommandAttachmentOption = class extends ApplicationCommandOptionBase {
	static {
		__name(this, 'SlashCommandAttachmentOption');
	}
	/**
	 * The type of this option.
	 */
	type = ApplicationCommandOptionType.Attachment;
	/**
	 * {@inheritDoc ApplicationCommandOptionBase.toJSON}
	 */
	toJSON() {
		this.runRequiredValidations();
		return { ...this };
	}
};
var SlashCommandBooleanOption = class extends ApplicationCommandOptionBase {
	static {
		__name(this, 'SlashCommandBooleanOption');
	}
	/**
	 * The type of this option.
	 */
	type = ApplicationCommandOptionType.Boolean;
	/**
	 * {@inheritDoc ApplicationCommandOptionBase.toJSON}
	 */
	toJSON() {
		this.runRequiredValidations();
		return { ...this };
	}
};
var allowedChannelTypes = [
	ChannelType.GuildText,
	ChannelType.GuildVoice,
	ChannelType.GuildCategory,
	ChannelType.GuildAnnouncement,
	ChannelType.AnnouncementThread,
	ChannelType.PublicThread,
	ChannelType.PrivateThread,
	ChannelType.GuildStageVoice,
	ChannelType.GuildForum,
	ChannelType.GuildMedia
];
var channelTypesPredicate = s3.array(s3.union(allowedChannelTypes.map((type) => s3.literal(type))));
var ApplicationCommandOptionChannelTypesMixin = class {
	static {
		__name(this, 'ApplicationCommandOptionChannelTypesMixin');
	}
	/**
	 * The channel types of this option.
	 */
	channel_types;
	/**
	 * Adds channel types to this option.
	 *
	 * @param channelTypes - The channel types
	 */
	addChannelTypes(...channelTypes) {
		if (this.channel_types === void 0) Reflect.set(this, 'channel_types', []);
		this.channel_types.push(...channelTypesPredicate.parse(normalizeArray(channelTypes)));
		return this;
	}
};
var SlashCommandChannelOption = class extends ApplicationCommandOptionBase {
	/**
	 * The type of this option.
	 */
	type = ApplicationCommandOptionType.Channel;
	/**
	 * {@inheritDoc ApplicationCommandOptionBase.toJSON}
	 */
	toJSON() {
		this.runRequiredValidations();
		return { ...this };
	}
};
__name(SlashCommandChannelOption, 'SlashCommandChannelOption');
SlashCommandChannelOption = __decorateClass([mix(ApplicationCommandOptionChannelTypesMixin)], SlashCommandChannelOption);
var ApplicationCommandNumericOptionMinMaxValueMixin = class {
	static {
		__name(this, 'ApplicationCommandNumericOptionMinMaxValueMixin');
	}
	/**
	 * The maximum value of this option.
	 */
	max_value;
	/**
	 * The minimum value of this option.
	 */
	min_value;
};
var booleanPredicate2 = s3.boolean();
var ApplicationCommandOptionWithAutocompleteMixin = class {
	static {
		__name(this, 'ApplicationCommandOptionWithAutocompleteMixin');
	}
	/**
	 * Whether this option utilizes autocomplete.
	 */
	autocomplete;
	/**
	 * The type of this option.
	 *
	 * @privateRemarks Since this is present and this is a mixin, this is needed.
	 */
	type;
	/**
	 * Whether this option uses autocomplete.
	 *
	 * @param autocomplete - Whether this option should use autocomplete
	 */
	setAutocomplete(autocomplete) {
		booleanPredicate2.parse(autocomplete);
		if (autocomplete && 'choices' in this && Array.isArray(this.choices) && this.choices.length > 0)
			throw new RangeError('Autocomplete and choices are mutually exclusive to each other.');
		Reflect.set(this, 'autocomplete', autocomplete);
		return this;
	}
};
var stringPredicate = s3.string().lengthGreaterThanOrEqual(1).lengthLessThanOrEqual(100);
var numberPredicate = s3.number().greaterThan(Number.NEGATIVE_INFINITY).lessThan(Number.POSITIVE_INFINITY);
var choicesPredicate = s3
	.object({
		name: stringPredicate,
		name_localizations: localizationMapPredicate,
		value: s3.union([stringPredicate, numberPredicate])
	})
	.array();
var ApplicationCommandOptionWithChoicesMixin = class {
	static {
		__name(this, 'ApplicationCommandOptionWithChoicesMixin');
	}
	/**
	 * The choices of this option.
	 */
	choices;
	/**
	 * The type of this option.
	 *
	 * @privateRemarks Since this is present and this is a mixin, this is needed.
	 */
	type;
	/**
	 * Adds multiple choices to this option.
	 *
	 * @param choices - The choices to add
	 */
	addChoices(...choices) {
		const normalizedChoices = normalizeArray(choices);
		if (normalizedChoices.length > 0 && 'autocomplete' in this && this.autocomplete)
			throw new RangeError('Autocomplete and choices are mutually exclusive to each other.');
		choicesPredicate.parse(normalizedChoices);
		if (this.choices === void 0) Reflect.set(this, 'choices', []);
		validateChoicesLength(normalizedChoices.length, this.choices);
		for (const { name, name_localizations, value } of normalizedChoices) {
			if (this.type === ApplicationCommandOptionType.String) stringPredicate.parse(value);
			else numberPredicate.parse(value);
			this.choices.push({
				name,
				name_localizations,
				value
			});
		}
		return this;
	}
	/**
	 * Sets multiple choices for this option.
	 *
	 * @param choices - The choices to set
	 */
	setChoices(...choices) {
		const normalizedChoices = normalizeArray(choices);
		if (normalizedChoices.length > 0 && 'autocomplete' in this && this.autocomplete)
			throw new RangeError('Autocomplete and choices are mutually exclusive to each other.');
		choicesPredicate.parse(normalizedChoices);
		Reflect.set(this, 'choices', []);
		this.addChoices(normalizedChoices);
		return this;
	}
};
var numberValidator = s3.number().int();
var SlashCommandIntegerOption = class extends ApplicationCommandOptionBase {
	/**
	 * The type of this option.
	 */
	type = ApplicationCommandOptionType.Integer;
	/**
	 * {@inheritDoc ApplicationCommandNumericOptionMinMaxValueMixin.setMaxValue}
	 */
	setMaxValue(max) {
		numberValidator.parse(max);
		Reflect.set(this, 'max_value', max);
		return this;
	}
	/**
	 * {@inheritDoc ApplicationCommandNumericOptionMinMaxValueMixin.setMinValue}
	 */
	setMinValue(min) {
		numberValidator.parse(min);
		Reflect.set(this, 'min_value', min);
		return this;
	}
	/**
	 * {@inheritDoc ApplicationCommandOptionBase.toJSON}
	 */
	toJSON() {
		this.runRequiredValidations();
		if (this.autocomplete && Array.isArray(this.choices) && this.choices.length > 0)
			throw new RangeError('Autocomplete and choices are mutually exclusive to each other.');
		return { ...this };
	}
};
__name(SlashCommandIntegerOption, 'SlashCommandIntegerOption');
SlashCommandIntegerOption = __decorateClass(
	[mix(ApplicationCommandNumericOptionMinMaxValueMixin, ApplicationCommandOptionWithAutocompleteMixin, ApplicationCommandOptionWithChoicesMixin)],
	SlashCommandIntegerOption
);
var SlashCommandMentionableOption = class extends ApplicationCommandOptionBase {
	static {
		__name(this, 'SlashCommandMentionableOption');
	}
	/**
	 * The type of this option.
	 */
	type = ApplicationCommandOptionType.Mentionable;
	/**
	 * {@inheritDoc ApplicationCommandOptionBase.toJSON}
	 */
	toJSON() {
		this.runRequiredValidations();
		return { ...this };
	}
};
var numberValidator2 = s3.number();
var SlashCommandNumberOption = class extends ApplicationCommandOptionBase {
	/**
	 * The type of this option.
	 */
	type = ApplicationCommandOptionType.Number;
	/**
	 * {@inheritDoc ApplicationCommandNumericOptionMinMaxValueMixin.setMaxValue}
	 */
	setMaxValue(max) {
		numberValidator2.parse(max);
		Reflect.set(this, 'max_value', max);
		return this;
	}
	/**
	 * {@inheritDoc ApplicationCommandNumericOptionMinMaxValueMixin.setMinValue}
	 */
	setMinValue(min) {
		numberValidator2.parse(min);
		Reflect.set(this, 'min_value', min);
		return this;
	}
	/**
	 * {@inheritDoc ApplicationCommandOptionBase.toJSON}
	 */
	toJSON() {
		this.runRequiredValidations();
		if (this.autocomplete && Array.isArray(this.choices) && this.choices.length > 0)
			throw new RangeError('Autocomplete and choices are mutually exclusive to each other.');
		return { ...this };
	}
};
__name(SlashCommandNumberOption, 'SlashCommandNumberOption');
SlashCommandNumberOption = __decorateClass(
	[mix(ApplicationCommandNumericOptionMinMaxValueMixin, ApplicationCommandOptionWithAutocompleteMixin, ApplicationCommandOptionWithChoicesMixin)],
	SlashCommandNumberOption
);
var SlashCommandRoleOption = class extends ApplicationCommandOptionBase {
	static {
		__name(this, 'SlashCommandRoleOption');
	}
	/**
	 * The type of this option.
	 */
	type = ApplicationCommandOptionType.Role;
	/**
	 * {@inheritDoc ApplicationCommandOptionBase.toJSON}
	 */
	toJSON() {
		this.runRequiredValidations();
		return { ...this };
	}
};
var minLengthValidator2 = s3.number().greaterThanOrEqual(0).lessThanOrEqual(6e3);
var maxLengthValidator2 = s3.number().greaterThanOrEqual(1).lessThanOrEqual(6e3);
var SlashCommandStringOption = class extends ApplicationCommandOptionBase {
	/**
	 * The type of this option.
	 */
	type = ApplicationCommandOptionType.String;
	/**
	 * The maximum length of this option.
	 */
	max_length;
	/**
	 * The minimum length of this option.
	 */
	min_length;
	/**
	 * Sets the maximum length of this string option.
	 *
	 * @param max - The maximum length this option can be
	 */
	setMaxLength(max) {
		maxLengthValidator2.parse(max);
		Reflect.set(this, 'max_length', max);
		return this;
	}
	/**
	 * Sets the minimum length of this string option.
	 *
	 * @param min - The minimum length this option can be
	 */
	setMinLength(min) {
		minLengthValidator2.parse(min);
		Reflect.set(this, 'min_length', min);
		return this;
	}
	/**
	 * {@inheritDoc ApplicationCommandOptionBase.toJSON}
	 */
	toJSON() {
		this.runRequiredValidations();
		if (this.autocomplete && Array.isArray(this.choices) && this.choices.length > 0)
			throw new RangeError('Autocomplete and choices are mutually exclusive to each other.');
		return { ...this };
	}
};
__name(SlashCommandStringOption, 'SlashCommandStringOption');
SlashCommandStringOption = __decorateClass(
	[mix(ApplicationCommandOptionWithAutocompleteMixin, ApplicationCommandOptionWithChoicesMixin)],
	SlashCommandStringOption
);
var SlashCommandUserOption = class extends ApplicationCommandOptionBase {
	static {
		__name(this, 'SlashCommandUserOption');
	}
	/**
	 * The type of this option.
	 */
	type = ApplicationCommandOptionType.User;
	/**
	 * {@inheritDoc ApplicationCommandOptionBase.toJSON}
	 */
	toJSON() {
		this.runRequiredValidations();
		return { ...this };
	}
};
var SharedSlashCommandOptions = class {
	static {
		__name(this, 'SharedSlashCommandOptions');
	}
	options;
	/**
	 * Adds a boolean option.
	 *
	 * @param input - A function that returns an option builder or an already built builder
	 */
	addBooleanOption(input) {
		return this._sharedAddOptionMethod(input, SlashCommandBooleanOption);
	}
	/**
	 * Adds a user option.
	 *
	 * @param input - A function that returns an option builder or an already built builder
	 */
	addUserOption(input) {
		return this._sharedAddOptionMethod(input, SlashCommandUserOption);
	}
	/**
	 * Adds a channel option.
	 *
	 * @param input - A function that returns an option builder or an already built builder
	 */
	addChannelOption(input) {
		return this._sharedAddOptionMethod(input, SlashCommandChannelOption);
	}
	/**
	 * Adds a role option.
	 *
	 * @param input - A function that returns an option builder or an already built builder
	 */
	addRoleOption(input) {
		return this._sharedAddOptionMethod(input, SlashCommandRoleOption);
	}
	/**
	 * Adds an attachment option.
	 *
	 * @param input - A function that returns an option builder or an already built builder
	 */
	addAttachmentOption(input) {
		return this._sharedAddOptionMethod(input, SlashCommandAttachmentOption);
	}
	/**
	 * Adds a mentionable option.
	 *
	 * @param input - A function that returns an option builder or an already built builder
	 */
	addMentionableOption(input) {
		return this._sharedAddOptionMethod(input, SlashCommandMentionableOption);
	}
	/**
	 * Adds a string option.
	 *
	 * @param input - A function that returns an option builder or an already built builder
	 */
	addStringOption(input) {
		return this._sharedAddOptionMethod(input, SlashCommandStringOption);
	}
	/**
	 * Adds an integer option.
	 *
	 * @param input - A function that returns an option builder or an already built builder
	 */
	addIntegerOption(input) {
		return this._sharedAddOptionMethod(input, SlashCommandIntegerOption);
	}
	/**
	 * Adds a number option.
	 *
	 * @param input - A function that returns an option builder or an already built builder
	 */
	addNumberOption(input) {
		return this._sharedAddOptionMethod(input, SlashCommandNumberOption);
	}
	/**
	 * Where the actual adding magic happens. ✨
	 *
	 * @param input - The input. What else?
	 * @param Instance - The instance of whatever is being added
	 * @internal
	 */
	_sharedAddOptionMethod(input, Instance) {
		const { options } = this;
		validateMaxOptionsLength(options);
		const result = typeof input === 'function' ? input(new Instance()) : input;
		assertReturnOfBuilder2(result, Instance);
		options.push(result);
		return this;
	}
};
var SlashCommandSubcommandGroupBuilder = class {
	/**
	 * The name of this subcommand group.
	 */
	name = void 0;
	/**
	 * The description of this subcommand group.
	 */
	description = void 0;
	/**
	 * The subcommands within this subcommand group.
	 */
	options = [];
	/**
	 * Adds a new subcommand to this group.
	 *
	 * @param input - A function that returns a subcommand builder or an already built builder
	 */
	addSubcommand(input) {
		const { options } = this;
		validateMaxOptionsLength(options);
		const result = typeof input === 'function' ? input(new SlashCommandSubcommandBuilder()) : input;
		assertReturnOfBuilder2(result, SlashCommandSubcommandBuilder);
		options.push(result);
		return this;
	}
	/**
	 * Serializes this builder to API-compatible JSON data.
	 *
	 * @remarks
	 * This method runs validations on the data before serializing it.
	 * As such, it may throw an error if the data is invalid.
	 */
	toJSON() {
		validateRequiredParameters3(this.name, this.description, this.options);
		return {
			type: ApplicationCommandOptionType.SubcommandGroup,
			name: this.name,
			name_localizations: this.name_localizations,
			description: this.description,
			description_localizations: this.description_localizations,
			options: this.options.map((option) => option.toJSON())
		};
	}
};
__name(SlashCommandSubcommandGroupBuilder, 'SlashCommandSubcommandGroupBuilder');
SlashCommandSubcommandGroupBuilder = __decorateClass([mix(SharedNameAndDescription)], SlashCommandSubcommandGroupBuilder);
var SlashCommandSubcommandBuilder = class {
	/**
	 * The name of this subcommand.
	 */
	name = void 0;
	/**
	 * The description of this subcommand.
	 */
	description = void 0;
	/**
	 * The options within this subcommand.
	 */
	options = [];
	/**
	 * Serializes this builder to API-compatible JSON data.
	 *
	 * @remarks
	 * This method runs validations on the data before serializing it.
	 * As such, it may throw an error if the data is invalid.
	 */
	toJSON() {
		validateRequiredParameters3(this.name, this.description, this.options);
		return {
			type: ApplicationCommandOptionType.Subcommand,
			name: this.name,
			name_localizations: this.name_localizations,
			description: this.description,
			description_localizations: this.description_localizations,
			options: this.options.map((option) => option.toJSON())
		};
	}
};
__name(SlashCommandSubcommandBuilder, 'SlashCommandSubcommandBuilder');
SlashCommandSubcommandBuilder = __decorateClass([mix(SharedNameAndDescription, SharedSlashCommandOptions)], SlashCommandSubcommandBuilder);
var SharedSlashCommandSubcommands = class {
	static {
		__name(this, 'SharedSlashCommandSubcommands');
	}
	options = [];
	/**
	 * Adds a new subcommand group to this command.
	 *
	 * @param input - A function that returns a subcommand group builder or an already built builder
	 */
	addSubcommandGroup(input) {
		const { options } = this;
		validateMaxOptionsLength(options);
		const result = typeof input === 'function' ? input(new SlashCommandSubcommandGroupBuilder()) : input;
		assertReturnOfBuilder2(result, SlashCommandSubcommandGroupBuilder);
		options.push(result);
		return this;
	}
	/**
	 * Adds a new subcommand to this command.
	 *
	 * @param input - A function that returns a subcommand builder or an already built builder
	 */
	addSubcommand(input) {
		const { options } = this;
		validateMaxOptionsLength(options);
		const result = typeof input === 'function' ? input(new SlashCommandSubcommandBuilder()) : input;
		assertReturnOfBuilder2(result, SlashCommandSubcommandBuilder);
		options.push(result);
		return this;
	}
};
var SlashCommandBuilder = class {
	/**
	 * The name of this command.
	 */
	name = void 0;
	/**
	 * The name localizations of this command.
	 */
	name_localizations;
	/**
	 * The description of this command.
	 */
	description = void 0;
	/**
	 * The description localizations of this command.
	 */
	description_localizations;
	/**
	 * The options of this command.
	 */
	options = [];
	/**
	 * The contexts for this command.
	 */
	contexts;
	/**
	 * Whether this command is enabled by default when the application is added to a guild.
	 *
	 * @deprecated Use {@link SharedSlashCommand.setDefaultMemberPermissions} or {@link SharedSlashCommand.setDMPermission} instead.
	 */
	default_permission = void 0;
	/**
	 * The set of permissions represented as a bit set for the command.
	 */
	default_member_permissions = void 0;
	/**
	 * Indicates whether the command is available in direct messages with the application.
	 *
	 * @remarks
	 * By default, commands are visible. This property is only for global commands.
	 * @deprecated
	 * Use {@link SlashCommandBuilder.contexts} instead.
	 */
	dm_permission = void 0;
	/**
	 * The integration types for this command.
	 */
	integration_types;
	/**
	 * Whether this command is NSFW.
	 */
	nsfw = void 0;
};
__name(SlashCommandBuilder, 'SlashCommandBuilder');
SlashCommandBuilder = __decorateClass(
	[mix(SharedSlashCommandOptions, SharedNameAndDescription, SharedSlashCommandSubcommands, SharedSlashCommand)],
	SlashCommandBuilder
);
__export(
	{},
	{
		contextsPredicate: () => contextsPredicate2,
		integrationTypesPredicate: () => integrationTypesPredicate2,
		validateDMPermission: () => validateDMPermission2,
		validateDefaultMemberPermissions: () => validateDefaultMemberPermissions2,
		validateDefaultPermission: () => validateDefaultPermission2,
		validateName: () => validateName2,
		validateRequiredParameters: () => validateRequiredParameters4,
		validateType: () => validateType
	}
);
var namePredicate2 = s3.string().lengthGreaterThanOrEqual(1).lengthLessThanOrEqual(32).regex(/\S/).setValidationEnabled(isValidationEnabled);
var typePredicate = s3
	.union([s3.literal(ApplicationCommandType.User), s3.literal(ApplicationCommandType.Message)])
	.setValidationEnabled(isValidationEnabled);
var booleanPredicate3 = s3.boolean();
function validateDefaultPermission2(value) {
	booleanPredicate3.parse(value);
}
__name(validateDefaultPermission2, 'validateDefaultPermission');
function validateName2(name) {
	namePredicate2.parse(name);
}
__name(validateName2, 'validateName');
function validateType(type) {
	typePredicate.parse(type);
}
__name(validateType, 'validateType');
function validateRequiredParameters4(name, type) {
	validateName2(name);
	validateType(type);
}
__name(validateRequiredParameters4, 'validateRequiredParameters');
var dmPermissionPredicate2 = s3.boolean().nullish();
function validateDMPermission2(value) {
	dmPermissionPredicate2.parse(value);
}
__name(validateDMPermission2, 'validateDMPermission');
var memberPermissionPredicate2 = s3
	.union([
		s3.bigint().transform((value) => value.toString()),
		s3
			.number()
			.safeInt()
			.transform((value) => value.toString()),
		s3.string().regex(/^\d+$/)
	])
	.nullish();
function validateDefaultMemberPermissions2(permissions) {
	return memberPermissionPredicate2.parse(permissions);
}
__name(validateDefaultMemberPermissions2, 'validateDefaultMemberPermissions');
var contextsPredicate2 = s3.array(s3.nativeEnum(InteractionContextType).setValidationEnabled(isValidationEnabled));
var integrationTypesPredicate2 = s3.array(s3.nativeEnum(ApplicationIntegrationType).setValidationEnabled(isValidationEnabled));
var ContextMenuCommandBuilder = class {
	static {
		__name(this, 'ContextMenuCommandBuilder');
	}
	/**
	 * The name of this command.
	 */
	name = void 0;
	/**
	 * The name localizations of this command.
	 */
	name_localizations;
	/**
	 * The type of this command.
	 */
	type = void 0;
	/**
	 * The contexts for this command.
	 */
	contexts;
	/**
	 * Whether this command is enabled by default when the application is added to a guild.
	 *
	 * @deprecated Use {@link ContextMenuCommandBuilder.setDefaultMemberPermissions} or {@link ContextMenuCommandBuilder.setDMPermission} instead.
	 */
	default_permission = void 0;
	/**
	 * The set of permissions represented as a bit set for the command.
	 */
	default_member_permissions = void 0;
	/**
	 * Indicates whether the command is available in direct messages with the application.
	 *
	 * @remarks
	 * By default, commands are visible. This property is only for global commands.
	 * @deprecated
	 * Use {@link ContextMenuCommandBuilder.contexts} instead.
	 */
	dm_permission = void 0;
	/**
	 * The integration types for this command.
	 */
	integration_types;
	/**
	 * Sets the contexts of this command.
	 *
	 * @param contexts - The contexts
	 */
	setContexts(...contexts) {
		Reflect.set(this, 'contexts', contextsPredicate2.parse(normalizeArray(contexts)));
		return this;
	}
	/**
	 * Sets integration types of this command.
	 *
	 * @param integrationTypes - The integration types
	 */
	setIntegrationTypes(...integrationTypes) {
		Reflect.set(this, 'integration_types', integrationTypesPredicate2.parse(normalizeArray(integrationTypes)));
		return this;
	}
	/**
	 * Sets the name of this command.
	 *
	 * @param name - The name to use
	 */
	setName(name) {
		validateName2(name);
		Reflect.set(this, 'name', name);
		return this;
	}
	/**
	 * Sets the type of this command.
	 *
	 * @param type - The type to use
	 */
	setType(type) {
		validateType(type);
		Reflect.set(this, 'type', type);
		return this;
	}
	/**
	 * Sets whether the command is enabled by default when the application is added to a guild.
	 *
	 * @remarks
	 * If set to `false`, you will have to later `PUT` the permissions for this command.
	 * @param value - Whether to enable this command by default
	 * @see {@link https://discord.com/developers/docs/interactions/application-commands#permissions}
	 * @deprecated Use {@link ContextMenuCommandBuilder.setDefaultMemberPermissions} or {@link ContextMenuCommandBuilder.setDMPermission} instead.
	 */
	setDefaultPermission(value) {
		validateDefaultPermission2(value);
		Reflect.set(this, 'default_permission', value);
		return this;
	}
	/**
	 * Sets the default permissions a member should have in order to run this command.
	 *
	 * @remarks
	 * You can set this to `'0'` to disable the command by default.
	 * @param permissions - The permissions bit field to set
	 * @see {@link https://discord.com/developers/docs/interactions/application-commands#permissions}
	 */
	setDefaultMemberPermissions(permissions) {
		const permissionValue = validateDefaultMemberPermissions2(permissions);
		Reflect.set(this, 'default_member_permissions', permissionValue);
		return this;
	}
	/**
	 * Sets if the command is available in direct messages with the application.
	 *
	 * @remarks
	 * By default, commands are visible. This method is only for global commands.
	 * @param enabled - Whether the command should be enabled in direct messages
	 * @see {@link https://discord.com/developers/docs/interactions/application-commands#permissions}
	 * @deprecated Use {@link ContextMenuCommandBuilder.setContexts} instead.
	 */
	setDMPermission(enabled) {
		validateDMPermission2(enabled);
		Reflect.set(this, 'dm_permission', enabled);
		return this;
	}
	/**
	 * Sets a name localization for this command.
	 *
	 * @param locale - The locale to set
	 * @param localizedName - The localized name for the given `locale`
	 */
	setNameLocalization(locale, localizedName) {
		if (!this.name_localizations) Reflect.set(this, 'name_localizations', {});
		const parsedLocale = validateLocale(locale);
		if (localizedName === null) {
			this.name_localizations[parsedLocale] = null;
			return this;
		}
		validateName2(localizedName);
		this.name_localizations[parsedLocale] = localizedName;
		return this;
	}
	/**
	 * Sets the name localizations for this command.
	 *
	 * @param localizedNames - The object of localized names to set
	 */
	setNameLocalizations(localizedNames) {
		if (localizedNames === null) {
			Reflect.set(this, 'name_localizations', null);
			return this;
		}
		Reflect.set(this, 'name_localizations', {});
		for (const args of Object.entries(localizedNames)) this.setNameLocalization(...args);
		return this;
	}
	/**
	 * Serializes this builder to API-compatible JSON data.
	 *
	 * @remarks
	 * This method runs validations on the data before serializing it.
	 * As such, it may throw an error if the data is invalid.
	 */
	toJSON() {
		validateRequiredParameters4(this.name, this.type);
		validateLocalizationMap(this.name_localizations);
		return { ...this };
	}
};
function embedLength(data) {
	return (
		(data.title?.length ?? 0) +
		(data.description?.length ?? 0) +
		(data.fields?.reduce((prev, curr) => prev + curr.name.length + curr.value.length, 0) ?? 0) +
		(data.footer?.text.length ?? 0) +
		(data.author?.name.length ?? 0)
	);
}
__name(embedLength, 'embedLength');
//#endregion
export {
	APIVersion,
	ApplicationCommandOptionType,
	ApplicationCommandType,
	ApplicationIntegrationType,
	CDNRoutes,
	ComponentType,
	ContextMenuCommandBuilder,
	InteractionContextType,
	InteractionResponseType,
	InteractionType,
	MessageFlags,
	Routes,
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
	SlashCommandSubcommandGroupBuilder,
	getUserAgentAppendix,
	isJSONEncodable,
	shouldUseGlobalFetchAndWebSocket
};
