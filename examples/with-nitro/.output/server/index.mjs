globalThis.__nitro_main__ = import.meta.url;
import { H3Core, HTTPError, NodeResponse, defineHandler, serve, toEventHandler } from './_libs/h3+rou3+srvx.mjs';
import { HookableCore } from './_libs/hookable.mjs';
import { LoaderStrategy, Piece, Store, container, isNullOrUndefined } from './_libs/@sapphire/pieces+[...].mjs';
import { Collection } from './_libs/discordjs__collection.mjs';
import { isFunction, isNullOrUndefinedOrEmpty } from './_libs/sapphire__utilities.mjs';
import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	ApplicationIntegrationType,
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
	isJSONEncodable
} from './_libs/@discordjs/builders+[...].mjs';
import { AsyncEventEmitter, REST, makeURLSearchParams } from './_libs/@discordjs/rest+[...].mjs';
import { Result, err, ok } from './_libs/sapphire__result.mjs';
import { decodePath, joinURL, withLeadingSlash, withoutTrailingSlash } from './_libs/ufo.mjs';
import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { TextDecoder } from 'node:util';
import { EventEmitter } from 'node:events';
import { webcrypto } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, relative, resolve } from 'node:path';
import { promises } from 'node:fs';
//#region ../../packages/http-framework/dist/esm/index.js
function _typeof(o) {
	'@babel/helpers - typeof';
	return (
		(_typeof =
			'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
				? function (o) {
						return typeof o;
					}
				: function (o) {
						return o && 'function' == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? 'symbol' : typeof o;
					}),
		_typeof(o)
	);
}
function toPrimitive(t, r) {
	if ('object' != _typeof(t) || !t) return t;
	var e = t[Symbol.toPrimitive];
	if (void 0 !== e) {
		var i = e.call(t, r || 'default');
		if ('object' != _typeof(i)) return i;
		throw new TypeError('@@toPrimitive must return a primitive value.');
	}
	return ('string' === r ? String : Number)(t);
}
function toPropertyKey(t) {
	var i = toPrimitive(t, 'string');
	return 'symbol' == _typeof(i) ? i : i + '';
}
function _defineProperty(e, r, t) {
	return (
		(r = toPropertyKey(r)) in e
			? Object.defineProperty(e, r, {
					value: t,
					enumerable: !0,
					configurable: !0,
					writable: !0
				})
			: (e[r] = t),
		e
	);
}
function _checkPrivateRedeclaration(e, t) {
	if (t.has(e)) throw new TypeError('Cannot initialize the same private elements twice on an object');
}
function _classPrivateFieldInitSpec(e, t, a) {
	(_checkPrivateRedeclaration(e, t), t.set(e, a));
}
function _assertClassBrand(e, t, n) {
	if ('function' == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n;
	throw new TypeError('Private element is not present on this object');
}
function _classPrivateFieldGet2(s, a) {
	return s.get(_assertClassBrand(s, a));
}
function _classPrivateFieldSet2(s, a, r) {
	return (s.set(_assertClassBrand(s, a), r), r);
}
var _watchers = /* @__PURE__ */ new WeakMap();
var _running = /* @__PURE__ */ new WeakMap();
/**
 * Hot Module Reloading for every {@link Store} registered in {@link container.stores}.
 *
 * @remarks The reloader watches each store's registered paths and reacts to file system events by loading, reloading,
 * and unloading the affected pieces in place, without restarting the process. It is a development-only utility: watching
 * the file system in production adds overhead and reloads code that is not supposed to change, which is why it is
 * opt-in.
 * @since 3.3.0
 * @example
 * ```typescript
 * const client = new Client({ hmr: { enabled: process.env.NODE_ENV !== 'production' } });
 * await client.load();
 * ```
 */
var HotModuleReloader = class {
	constructor(options = {}) {
		_defineProperty(this, 'options', void 0);
		_classPrivateFieldInitSpec(this, _watchers, []);
		_classPrivateFieldInitSpec(this, _running, false);
		this.options = options;
	}
	/**
	 * Whether the reloader is currently watching for changes.
	 *
	 * @since 3.3.0
	 */
	get running() {
		return _classPrivateFieldGet2(_running, this);
	}
	/**
	 * The paths currently being watched, one entry per store path.
	 *
	 * @since 3.3.0
	 */
	get paths() {
		return _classPrivateFieldGet2(_watchers, this).flatMap((watcher) => Object.keys(watcher.getWatched()));
	}
	/**
	 * Starts watching every path registered in every store.
	 *
	 * @remarks This is a no-op when {@link HotModuleReloader.Options.enabled} is `false`, when the reloader is already
	 * running, or when no store has registered paths. `chokidar` is imported lazily, so applications that never enable
	 * HMR do not pay for loading it.
	 * @since 3.3.0
	 * @returns This instance, for chaining.
	 */
	async start() {
		if (_classPrivateFieldGet2(_running, this)) return this;
		const { enabled = true, silent = false, ...chokidarOptions } = this.options;
		if (!enabled) return this;
		const { watch } = await import('./_libs/_.mjs');
		const watchedPaths = [];
		for (const store of container.stores.values()) {
			const paths = [...store.paths];
			if (paths.length === 0) continue;
			watchedPaths.push(...paths);
			_classPrivateFieldGet2(_watchers, this).push(
				watch(paths, {
					ignoreInitial: true,
					...chokidarOptions
				})
					.on('add', (path) => void this.handlePieceUpdate(store, path))
					.on('change', (path) => void this.handlePieceUpdate(store, path))
					.on('unlink', (path) => void this.handlePieceDelete(store, path))
			);
		}
		_classPrivateFieldSet2(_running, this, true);
		if (!silent) container.logger.info(`[HMR]: Enabled, watching ${watchedPaths.length} path(s) for piece changes.`);
		container.client?.emit('hmrStart', watchedPaths);
		return this;
	}
	/**
	 * Stops watching for changes and closes every watcher.
	 *
	 * @remarks Calling this on a reloader that is not running is a no-op. Already loaded pieces are left untouched.
	 * @since 3.3.0
	 */
	async stop() {
		if (!_classPrivateFieldGet2(_running, this)) return;
		const watchers = _classPrivateFieldGet2(_watchers, this);
		_classPrivateFieldSet2(_watchers, this, []);
		_classPrivateFieldSet2(_running, this, false);
		await Promise.all(watchers.map((watcher) => watcher.close()));
		if (!this.options.silent) container.logger.info('[HMR]: Disabled, no longer watching for piece changes.');
		container.client?.emit('hmrStop');
	}
	/**
	 * Handles a file being added to, or modified in, one of the store's paths, reloading the piece it defines when it is
	 * already loaded, and loading it otherwise.
	 *
	 * @since 3.3.0
	 * @param store - The store the path belongs to.
	 * @param path - The full path of the file that changed.
	 */
	async handlePieceUpdate(store, path) {
		if (!store.strategy.filter(path)) return;
		const piece = store.find((entry) => entry.location.full === path);
		(
			await Result.fromAsync(async () => {
				if (piece) {
					await piece.reload();
					if (!this.options.silent) container.logger.info(`[HMR]: Reloaded '${piece.name}' from the '${store.name}' store.`);
					container.client?.emit('hmrPieceReloaded', piece, path);
					return;
				}
				const root = [...store.paths].find((storePath) => path.startsWith(storePath));
				if (!root) throw new Error(`Could not find the root path for '${path}'.`);
				const pieces = await store.load(root, relative(root, path));
				if (!this.options.silent) {
					const names = pieces.map((entry) => `'${entry.name}'`).join(', ');
					container.logger.info(`[HMR]: Loaded ${pieces.length} piece(s) into the '${store.name}' store: ${names}.`);
				}
				container.client?.emit('hmrPiecesLoaded', pieces, path);
			})
		).inspectErr((error) => this.handleError(error, path));
	}
	/**
	 * Handles a file being removed from one of the store's paths, unloading the piece it defined.
	 *
	 * @since 3.3.0
	 * @param store - The store the path belongs to.
	 * @param path - The full path of the file that was deleted.
	 */
	async handlePieceDelete(store, path) {
		if (!store.strategy.filter(path)) return;
		const piece = store.find((entry) => entry.location.full === path);
		if (!piece) return;
		(
			await Result.fromAsync(async () => {
				await piece.unload();
				if (!this.options.silent) container.logger.info(`[HMR]: Unloaded '${piece.name}' from the '${store.name}' store.`);
				container.client?.emit('hmrPieceUnloaded', piece, path);
			})
		).inspectErr((error) => this.handleError(error, path));
	}
	/**
	 * Handles an error thrown while (re)loading or unloading a piece.
	 *
	 * @remarks Errors are never rethrown: a broken file must not take the process down, the user is expected to fix it
	 * and save again, which triggers a new reload.
	 * @since 3.3.0
	 * @param error - The error that was thrown.
	 * @param path - The full path of the file that was being processed.
	 */
	handleError(error, path) {
		if (!this.options.silent) container.logger.error(`[HMR]: Failed to process '${path}'.`, error);
		container.client?.emit('hmrError', error, path);
	}
};
var StringIdParser = class {
	run(customId) {
		if (customId.length === 0) return null;
		const index = customId.indexOf('.');
		if (index === -1)
			return {
				name: customId,
				content: null
			};
		return {
			name: customId.slice(0, index),
			content: customId
				.slice(index + 1)
				.split('.')
				.map((contentEntry) => contentEntry || null)
		};
	}
};
var preGenericsInitialization = Symbol('HttpFrameworkPluginsPreGenericsInitialization');
var preInitialization = Symbol('HttpFrameworkPluginsPreInitialization');
var postInitialization = Symbol('HttpFrameworkPluginsPostInitialization');
var preLoad = Symbol('HttpFrameworkPluginsPreLoad');
var postListen = Symbol('HttpFrameworkPluginsPostListen');
var PluginManager = class {
	constructor() {
		_defineProperty(this, 'registry', /* @__PURE__ */ new Set());
	}
	registerHook(hook, type, name) {
		if (typeof hook !== 'function') throw new TypeError(`The provided hook ${name ? `(${name}) ` : ''}is not a function`);
		this.registry.add({
			hook,
			type,
			name
		});
		return this;
	}
	registerPreGenericsInitializationHook(hook, name) {
		return this.registerHook(hook, 'preGenericsInitialization', name);
	}
	registerPreInitializationHook(hook, name) {
		return this.registerHook(hook, 'preInitialization', name);
	}
	registerPostInitializationHook(hook, name) {
		return this.registerHook(hook, 'postInitialization', name);
	}
	registerPreLoadHook(hook, name) {
		return this.registerHook(hook, 'preLoad', name);
	}
	registerPostListenHook(hook, name) {
		return this.registerHook(hook, 'postListen', name);
	}
	use(plugin) {
		const possibleSymbolHooks = [
			[preGenericsInitialization, 'preGenericsInitialization'],
			[preInitialization, 'preInitialization'],
			[postInitialization, 'postInitialization'],
			[preLoad, 'preLoad'],
			[postListen, 'postListen']
		];
		for (const [hookSymbol, hookType] of possibleSymbolHooks) {
			const hook = Reflect.get(plugin, hookSymbol);
			if (typeof hook !== 'function') continue;
			this.registerHook(hook, hookType, plugin.name);
		}
		return this;
	}
	*values(hook) {
		for (const plugin of this.registry) {
			if (hook && plugin.type !== hook) continue;
			yield plugin;
		}
	}
};
function ensureChatInputCommandResolver(target) {
	return container.applicationCommandRegistry.ensure(target).makeChatInput();
}
function ensureContextMenuCommandResolver(target) {
	return container.applicationCommandRegistry.ensure(target).makeContextMenu();
}
var restrictedGuildIdRegistry = new Collection();
function transformInteraction(resolved, options) {
	const extracted = extractTopLevelOptions(options);
	return {
		subCommand: extracted.subCommand?.name ?? null,
		subCommandGroup: extracted.subCommandGroup?.name ?? null,
		...transformArguments(resolved, extracted.options)
	};
}
function transformAutocompleteInteraction(resolved, options) {
	const extracted = extractTopLevelOptions(options);
	const focused = extracted.options.find((option) => option.focused);
	return {
		subCommand: extracted.subCommand?.name ?? null,
		subCommandGroup: extracted.subCommandGroup?.name ?? null,
		focused: typeof focused === 'undefined' ? null : focused.name,
		...transformArguments(resolved, extracted.options)
	};
}
function extractTopLevelOptions(options) {
	if (options.length) {
		const [firstOption] = options;
		if (firstOption.type === ApplicationCommandOptionType.SubcommandGroup) {
			const subCommand = firstOption.options[0];
			return {
				subCommandGroup: firstOption,
				subCommand,
				options: subCommand.options ?? []
			};
		}
		if (firstOption.type === ApplicationCommandOptionType.Subcommand)
			return {
				subCommandGroup: null,
				subCommand: firstOption,
				options: firstOption.options ?? []
			};
	}
	return {
		subCommandGroup: null,
		subCommand: null,
		options
	};
}
function transformArguments(resolved, options) {
	return Object.fromEntries(options.map((option) => [option.name, transformArgument(resolved, option)]));
}
function transformArgument(resolved, option) {
	switch (option.type) {
		case ApplicationCommandOptionType.Attachment:
			return resolved.attachments?.[option.value] ?? { id: option.value };
		case ApplicationCommandOptionType.Channel:
			return resolved.channels?.[option.value] ?? { id: option.value };
		case ApplicationCommandOptionType.Mentionable:
			return transformMentionable(resolved, option);
		case ApplicationCommandOptionType.Role:
			return resolved.roles?.[option.value] ?? { id: option.value };
		case ApplicationCommandOptionType.User:
			return {
				id: option.value,
				user: resolved.users?.[option.value] ?? null,
				member: resolved.members?.[option.value] ?? null
			};
		default:
			return option.value;
	}
}
function transformMentionable(resolved, option) {
	const id = option.value;
	const user = resolved.users?.[id];
	if (user)
		return {
			id,
			user,
			member: resolved.members?.[id] ?? null
		};
	const channel = resolved.channels?.[id];
	if (channel)
		return {
			id,
			channel
		};
	const role = resolved.roles?.[id];
	if (role)
		return {
			id,
			role
		};
	return { id };
}
function transformUserInteraction(data) {
	return {
		id: data.target_id,
		user: data.resolved.users[data.target_id],
		member: data.resolved.members?.[data.target_id] ?? null
	};
}
function transformMessageInteraction(data) {
	return {
		id: data.target_id,
		message: data.resolved.messages[data.target_id]
	};
}
var linkSymbol = Symbol('decorated-command.method.link');
/**
 * Links the specified object with a name.
 *
 * @template T - The type of the object.
 * @param object - The object to link.
 * @param name - The name to link the object with.
 * @returns The linked object.
 * @internal
 */
function linkMethod(object, name) {
	Object.defineProperty(object, linkSymbol, { value: name });
	return object;
}
/**
 * Retrieves the linked method from the given object.
 *
 * @param object - The object from which to retrieve the method.
 * @returns The name of the linked method as a string, or `null` if not found.
 * @internal
 */
function getLinkedMethod(object) {
	return Reflect.get(object, linkSymbol) ?? null;
}
function _classPrivateMethodInitSpec(e, a) {
	(_checkPrivateRedeclaration(e, a), a.add(e));
}
var _data$1 = /* @__PURE__ */ new WeakMap();
var _commandData$1 = /* @__PURE__ */ new WeakMap();
var _subcommandGroupData = /* @__PURE__ */ new WeakMap();
var _subcommandData = /* @__PURE__ */ new WeakMap();
var _ChatInputCommandResolver_brand = /* @__PURE__ */ new WeakSet();
/**
 * The command resolver for chat input commands.
 * @internal
 */
var ChatInputCommandResolver = class {
	constructor() {
		_classPrivateMethodInitSpec(this, _ChatInputCommandResolver_brand);
		_classPrivateFieldInitSpec(this, _data$1, null);
		_classPrivateFieldInitSpec(this, _commandData$1, null);
		_classPrivateFieldInitSpec(this, _subcommandGroupData, []);
		_classPrivateFieldInitSpec(this, _subcommandData, []);
	}
	/**
	 * Sets the command data for the ChatInputCommandResolver.
	 *
	 * @param data - The command data to set.
	 * @returns The instance of ChatInputCommandResolver.
	 */
	setCommand(data) {
		_classPrivateFieldSet2(_commandData$1, this, data);
		return this;
	}
	/**
	 * Adds a subcommand group to the ChatInputCommandResolver.
	 *
	 * @param data - The data of the subcommand group.
	 * @param method - The method associated with the subcommand group (optional).
	 * @returns The updated ChatInputCommandResolver instance.
	 */
	addSubcommandGroup(data, method) {
		_classPrivateFieldGet2(_subcommandGroupData, this).push([method ?? null, data]);
		return this;
	}
	/**
	 * Adds a subcommand to the ChatInputCommandResolver.
	 *
	 * @param data - The data of the subcommand.
	 * @param method - The method of the subcommand (optional).
	 * @param groupName - The group name of the subcommand (optional).
	 * @returns The updated ChatInputCommandResolver instance.
	 */
	addSubcommand(data, method, groupName) {
		_classPrivateFieldGet2(_subcommandData, this).push([method ?? null, groupName ?? null, data]);
		return this;
	}
	/**
	 * Converts the ChatInputCommandResolver instance to a JSON representation.
	 *
	 * @returns The JSON representation of the ChatInputCommandResolver instance.
	 */
	toJSON() {
		return (
			_classPrivateFieldGet2(_data$1, this) ??
			_classPrivateFieldSet2(_data$1, this, _assertClassBrand(_ChatInputCommandResolver_brand, this, _resolve$1).call(this))
		);
	}
};
/**
 * Resolves the chat input command.
 *
 * @returns The resolved command.
 */
function _resolve$1() {
	const command = _assertClassBrand(_ChatInputCommandResolver_brand, this, _normalizeCommand).call(
		this,
		_classPrivateFieldGet2(_commandData$1, this)
	);
	_assertClassBrand(_ChatInputCommandResolver_brand, this, _resolveSubcommandGroups).call(this, command);
	_assertClassBrand(_ChatInputCommandResolver_brand, this, _resolveSubcommands).call(this, command);
	return command;
}
/**
 * Resolves the subcommand groups for the given command.
 *
 * @param command The resolved command.
 */
function _resolveSubcommandGroups(command) {
	if (_classPrivateFieldGet2(_subcommandGroupData, this).length === 0) return;
	command.options ??= [];
	for (const [method, entry] of _classPrivateFieldGet2(_subcommandGroupData, this)) {
		let data = _assertClassBrand(_ChatInputCommandResolver_brand, this, _normalizeSubcommandGroup).call(this, entry);
		const index = command.options.findIndex((option) => option.name === data.name);
		if (index === -1) command.options.push(data);
		else {
			data = _assertClassBrand(_ChatInputCommandResolver_brand, this, _mergeOption).call(this, command.options[index], data);
			command.options[index] = data;
		}
		if (method) linkMethod(data, method);
	}
}
/**
 * Resolves the subcommands for a given command.
 *
 * @param command - The resolved command object.
 */
function _resolveSubcommands(command) {
	if (_classPrivateFieldGet2(_subcommandData, this).length === 0) return;
	command.options ??= [];
	for (const [method, groupName, entry] of _classPrivateFieldGet2(_subcommandData, this)) {
		let data = _assertClassBrand(_ChatInputCommandResolver_brand, this, _normalizeSubcommand).call(this, entry);
		let parent;
		if (groupName === null) parent = command;
		else {
			const group = command.options.find((option) => option.name === groupName);
			if (group === void 0) throw new Error(`The command '${command.name}' has no subcommand group named '${groupName}'`);
			if (group.type !== ApplicationCommandOptionType.SubcommandGroup)
				throw new Error(`The command '${command.name}' has an option named '${groupName}' that is not a group`);
			parent = group;
		}
		parent.options ??= [];
		const index = parent.options.findIndex((option) => option.name === data.name);
		if (index === -1) parent.options.push(data);
		else {
			data = _assertClassBrand(_ChatInputCommandResolver_brand, this, _mergeOption).call(this, parent.options[index], data);
			parent.options[index] = data;
		}
		if (!method) continue;
		const dataMethod = getLinkedMethod(data);
		if (dataMethod) {
			if (dataMethod !== method)
				throw new Error(`The command '${command.name}' has a subcommand named '${data.name}' that was already linked to '${dataMethod}'`);
		} else linkMethod(data, method);
	}
}
/**
 * Normalizes the command data and returns the resolved command.
 *
 * @param data The command data to be normalized.
 * @returns The resolved command.
 * @throws An `Error` if the command data is null or undefined.
 */
function _normalizeCommand(data) {
	if (isNullOrUndefined(data)) throw new Error('Could not normalize command data');
	if (isFunction(data)) {
		const builder = new SlashCommandBuilder();
		data = data(builder) ?? builder;
	}
	return {
		type: ApplicationCommandType.ChatInput,
		...(isJSONEncodable(data) ? data.toJSON() : data)
	};
}
/**
 * Normalizes the subcommand group data and returns the resolved subcommand group.
 *
 * @param data - The subcommand group data to be normalized.
 * @returns The normalized subcommand group.
 */
function _normalizeSubcommandGroup(data) {
	if (isFunction(data)) {
		const builder = new SlashCommandSubcommandGroupBuilder();
		data = data(builder) ?? builder;
	}
	return {
		type: ApplicationCommandOptionType.SubcommandGroup,
		...(isJSONEncodable(data) ? data.toJSON() : data)
	};
}
/**
 * Normalizes the subcommand data and returns the resolved subcommand.
 *
 * @param data - The subcommand data to be normalized.
 * @returns The resolved subcommand.
 */
function _normalizeSubcommand(data) {
	if (isFunction(data)) {
		const builder = new SlashCommandSubcommandBuilder();
		data = data(builder) ?? builder;
	}
	return {
		type: ApplicationCommandOptionType.Subcommand,
		...(isJSONEncodable(data) ? data.toJSON() : data)
	};
}
/**
 * Merges two arrays of {@linkcode APIApplicationCommandOption} objects.
 *
 * - If the 'existing' array is empty or undefined, the 'data' array is returned.
 * - If the 'data' array is empty or undefined, the 'existing' array is returned.
 * - If both arrays have elements, the options with the same name are merged.
 *
 * @param existing The existing array of {@linkcode APIApplicationCommandOption} objects.
 * @param data The data array of {@linkcode APIApplicationCommandOption} objects.
 * @returns The merged array of {@linkcode APIApplicationCommandOption} objects.
 */
function _mergeOptions(existing, data) {
	if (!existing?.length) return data ?? [];
	if (!data?.length) return existing;
	const entries = new Map(existing.map((option) => [option.name, option]));
	for (const option of data)
		entries.set(option.name, _assertClassBrand(_ChatInputCommandResolver_brand, this, _mergeOption).call(this, entries.get(option.name), option));
	return [...entries.values()];
}
/**
 * Merges two {@linkcode APIApplicationCommandOption} objects.
 *
 * - If the `existing` option is not provided, the `data` option is returned.
 * - If the types of the existing and data options do not match, a {@link TypeError} is thrown.
 * - If both existing and data options have 'options' property, the options are recursively merged.
 * - Otherwise, the options are shallow merged.
 * - If a method is present in either the data or existing option, it is linked to the merged option.
 *
 * @param existing - The existing {@linkcode APIApplicationCommandOption} object.
 * @param data - The data {@linkcode APIApplicationCommandOption} object.
 * @returns The merged {@linkcode APIApplicationCommandOption} object.
 */
function _mergeOption(existing, data) {
	if (!existing) return data;
	if (existing.type !== data.type) {
		const existingType = ApplicationCommandOptionType[existing.type];
		const dataType = ApplicationCommandOptionType[data.type];
		throw new TypeError(`Mismatching types, expected '${existingType}', but received '${dataType}'`);
	}
	const merged =
		'options' in existing && 'options' in data
			? {
					...existing,
					...data,
					options: _assertClassBrand(_ChatInputCommandResolver_brand, this, _mergeOptions).call(this, existing.options, data.options)
				}
			: {
					...existing,
					...data
				};
	const method = getLinkedMethod(data) ?? getLinkedMethod(existing);
	return method ? linkMethod(merged, method) : merged;
}
var _data = /* @__PURE__ */ new WeakMap();
var _commandData = /* @__PURE__ */ new WeakMap();
var _commandType = /* @__PURE__ */ new WeakMap();
var _commandMethod = /* @__PURE__ */ new WeakMap();
var _ContextMenuCommandResolver_brand = /* @__PURE__ */ new WeakSet();
/**
 * The command resolver for context menu commands.
 * @internal
 */
var ContextMenuCommandResolver = class {
	constructor() {
		_classPrivateMethodInitSpec(this, _ContextMenuCommandResolver_brand);
		_classPrivateFieldInitSpec(this, _data, null);
		_classPrivateFieldInitSpec(this, _commandData, null);
		_classPrivateFieldInitSpec(this, _commandType, null);
		_classPrivateFieldInitSpec(this, _commandMethod, null);
	}
	/**
	 * Sets the command data, type, and method for the context menu command resolver.
	 *
	 * @param data - The command data.
	 * @param type - The command type.
	 * @param method - The command method (optional).
	 * @returns The updated context menu command resolver.
	 */
	setCommand(data, type, method) {
		_classPrivateFieldSet2(_commandData, this, data);
		_classPrivateFieldSet2(_commandType, this, type);
		_classPrivateFieldSet2(_commandMethod, this, method ?? null);
		return this;
	}
	/**
	 * Converts the {@linkcode ContextMenuCommandResolver} instance to a JSON representation.
	 *
	 * @returns The JSON representation of the {@linkcode ContextMenuCommandResolver} instance.
	 */
	toJSON() {
		return (
			_classPrivateFieldGet2(_data, this) ??
			_classPrivateFieldSet2(_data, this, _assertClassBrand(_ContextMenuCommandResolver_brand, this, _resolve).call(this))
		);
	}
};
/**
 * Resolves the context menu command.
 *
 * @returns The resolved command.
 */
function _resolve() {
	const data = _classPrivateFieldGet2(_commandData, this);
	const type = _classPrivateFieldGet2(_commandType, this);
	if (isNullOrUndefined(data) || isNullOrUndefined(type)) throw new Error('Could not normalize command data');
	const resolved = _assertClassBrand(_ContextMenuCommandResolver_brand, this, _normalizeContextMenuCommand).call(this, data, type);
	return _classPrivateFieldGet2(_commandMethod, this) ? linkMethod(resolved, _classPrivateFieldGet2(_commandMethod, this)) : resolved;
}
/**
 * Normalizes the context menu command.
 *
 * @param data - The command data.
 * @param type - The command type.
 * @returns The normalized context menu command.
 */
function _normalizeContextMenuCommand(data, type) {
	if (isFunction(data)) {
		const builder = new ContextMenuCommandBuilder().setType(type);
		data = data(builder) ?? builder;
	}
	return {
		type,
		...(isJSONEncodable(data) ? data.toJSON() : data)
	};
}
var _chatInput = /* @__PURE__ */ new WeakMap();
var _contextMenu = /* @__PURE__ */ new WeakMap();
var _ids = /* @__PURE__ */ new WeakMap();
/**
 * Represents an entry in the application command registry.
 *
 * This class provides methods to manage and manipulate application command data.
 *
 * @since 2.0.0
 */
var ApplicationCommandRegistryEntry = class {
	constructor() {
		_classPrivateFieldInitSpec(this, _chatInput, null);
		_classPrivateFieldInitSpec(this, _contextMenu, []);
		_classPrivateFieldInitSpec(this, _ids, new Collection());
	}
	/**
	 * Retrieves the loaded global ID of the {@linkcode ApplicationCommandRegistryEntry}.
	 *
	 * @since 2.0.0
	 * @returns The loaded global ID of the {@linkcode ApplicationCommandRegistryEntry}, or `null` if it's not set.
	 */
	getGlobalId() {
		return _classPrivateFieldGet2(_ids, this).get(null) ?? null;
	}
	/**
	 * Sets the loaded global ID for the {@linkcode ApplicationCommandRegistryEntry}.
	 *
	 * @since 2.0.0
	 * @param value - The Snowflake value to set as the global ID.
	 * @returns The updated {@linkcode ApplicationCommandRegistryEntry} instance.
	 */
	setGlobalId(value) {
		_classPrivateFieldGet2(_ids, this).set(null, value);
		return this;
	}
	/**
	 * Retrieves the loaded guild ID associated with the given guild ID.
	 *
	 * @since 2.0.0
	 * @param guildId The guild ID to retrieve.
	 * @returns The associated guild ID, or null if not found.
	 */
	getGuildId(guildId) {
		return _classPrivateFieldGet2(_ids, this).get(guildId) ?? null;
	}
	/**
	 * Sets the loaded guild ID for the registry entry.
	 *
	 * @since 2.0.0
	 * @param guildId - The guild ID to set.
	 * @param value - The value to associate with the guild ID.
	 * @returns The updated registry entry.
	 */
	setGuildId(guildId, value) {
		_classPrivateFieldGet2(_ids, this).set(guildId, value);
		return this;
	}
	/**
	 * Gets the chat input command resolver.
	 *
	 * @since 2.0.0
	 * @returns The chat input command resolver or `null` if not set.
	 */
	get chatInput() {
		return _classPrivateFieldGet2(_chatInput, this);
	}
	/**
	 * Gets the context menu commands associated with this registry entry.
	 *
	 * @since 2.0.0
	 * @returns An array of {@linkcode ContextMenuCommandResolver} objects representing the context menu commands.
	 */
	get contextMenu() {
		return _classPrivateFieldGet2(_contextMenu, this);
	}
	/**
	 * Converts the {@linkcode ApplicationCommandRegistryEntry} to a JSON representation.
	 *
	 * @since 2.0.0
	 * @returns An array of Command objects in JSON format.
	 */
	toJSON() {
		return _classPrivateFieldGet2(_chatInput, this) === null
			? _classPrivateFieldGet2(_contextMenu, this).map((command) => command.toJSON())
			: [_classPrivateFieldGet2(_chatInput, this).toJSON(), ..._classPrivateFieldGet2(_contextMenu, this).map((command) => command.toJSON())];
	}
	/**
	 * Creates a chat input command resolver.
	 * If the resolver has already been created, it returns the existing instance.
	 *
	 * @since 2.0.0
	 * @returns The chat input command resolver.
	 * @internal
	 */
	makeChatInput() {
		return _classPrivateFieldGet2(_chatInput, this) ?? _classPrivateFieldSet2(_chatInput, this, new ChatInputCommandResolver());
	}
	/**
	 * Creates a context menu command resolver and adds it to the context menu.
	 *
	 * @since 2.0.0
	 * @returns The created context menu command resolver.
	 * @internal
	 */
	makeContextMenu() {
		const resolver = new ContextMenuCommandResolver();
		_classPrivateFieldGet2(_contextMenu, this).push(resolver);
		return resolver;
	}
};
var _entries = /* @__PURE__ */ new WeakMap();
var _rest = /* @__PURE__ */ new WeakMap();
var _clientId = /* @__PURE__ */ new WeakMap();
var _authPrefix = /* @__PURE__ */ new WeakMap();
var _ApplicationCommandRegistry_brand = /* @__PURE__ */ new WeakSet();
/**
 * Represents a registry for application commands.
 *
 * @remarks This registry is globally available through {@linkcode container.applicationCommandRegistry}.
 * @since 2.0.0
 */
var ApplicationCommandRegistry = class {
	constructor() {
		_classPrivateMethodInitSpec(this, _ApplicationCommandRegistry_brand);
		_classPrivateFieldInitSpec(this, _entries, new Collection());
		_classPrivateFieldInitSpec(this, _rest, null);
		_classPrivateFieldInitSpec(this, _clientId, null);
		_classPrivateFieldInitSpec(this, _authPrefix, 'Bot');
	}
	get store() {
		return container.stores.get('commands');
	}
	/**
	 * Sets up the application command registry with the provided options.
	 *
	 * @since 2.0.0
	 * @param options - The setup options for the application command registry.
	 * @returns The updated instance of the application command registry.
	 */
	setup(options) {
		_classPrivateFieldSet2(_rest, this, options.rest);
		_classPrivateFieldSet2(_clientId, this, options.clientId);
		_classPrivateFieldSet2(_authPrefix, this, options.authPrefix ?? 'Bot');
		return this;
	}
	/**
	 * Retrieves the {@linkcode ApplicationCommandRegistryEntry} associated with the specified command class.
	 *
	 * @since 2.0.0
	 * @template Options - The options type of the command class.
	 * @param target - The command class to retrieve the entry for.
	 * @returns The {@linkcode ApplicationCommandRegistryEntry} associated with the command class, or null if not found.
	 */
	get(target) {
		return _classPrivateFieldGet2(_entries, this).get(target) ?? null;
	}
	/**
	 * Deletes a command from the registry.
	 *
	 * @since 2.0.0
	 * @template Options - The options type for the command.
	 * @param target - The command to delete.
	 * @returns True if the command was successfully deleted, false otherwise.
	 */
	delete(target) {
		return _classPrivateFieldGet2(_entries, this).delete(target);
	}
	/**
	 * Retrieves or creates an {@linkcode ApplicationCommandRegistryEntry} for the specified command class.
	 *
	 * @since 2.0.0
	 * @template Options - The options type for the command.
	 * @param target - The command class to ensure registration for.
	 * @returns The application command registry entry for the command.
	 */
	ensure(target) {
		return _classPrivateFieldGet2(_entries, this).ensure(target, () => new ApplicationCommandRegistryEntry());
	}
	/**
	 * Converts the {@linkcode ApplicationCommandRegistryEntry} objects to an array of command objects in JSON format.
	 *
	 * @since 2.0.0
	 * @returns An array of Command objects in JSON format.
	 */
	toJSON() {
		return _classPrivateFieldGet2(_entries, this)
			.map((entry) => entry.toJSON())
			.flat(1);
	}
	/**
	 * Loads the commands from the specified base user directory.
	 *
	 * @since 2.0.0
	 * @param baseUserDirectory - The base user directory to load the commands from, define it as `null` to not register
	 * a path for the file system loader.
	 * @returns A promise that resolves when all the commands are loaded.
	 */
	loadCommands(baseUserDirectory) {
		if (baseUserDirectory !== null) container.stores.registerPath(baseUserDirectory);
		return this.store.loadAll();
	}
	/**
	 * Retrieves the loaded chat input commands from the application command registry.
	 *
	 * @since 2.0.0
	 * @returns A collection of chat input commands.
	 */
	getLoadedChatInputCommands() {
		const collection = new Collection();
		for (const registryEntry of _classPrivateFieldGet2(_entries, this).values())
			if (registryEntry.chatInput) collection.set(registryEntry.chatInput.toJSON().name, registryEntry);
		return collection;
	}
	/**
	 * Retrieves the loaded context menu commands.
	 *
	 * @since 2.0.0
	 * @returns A collection of context menu commands.
	 */
	getLoadedContextMenuCommands() {
		const collection = new Collection();
		for (const registryEntry of _classPrivateFieldGet2(_entries, this).values())
			for (const entry of registryEntry.contextMenu) collection.set(entry.toJSON().name, registryEntry);
		return collection;
	}
	/**
	 * Retrieves the loaded global commands from the application command registry.
	 *
	 * @since 2.0.0
	 * @returns An array of loaded global commands.
	 */
	getLoadedGlobalCommands() {
		return _classPrivateFieldGet2(_entries, this)
			.filter((_, command) => !restrictedGuildIdRegistry.get(command)?.length)
			.map((entry) => entry.toJSON())
			.flat(1);
	}
	/**
	 * Retrieves the loaded guild commands from the application command registry.
	 *
	 * @since 2.0.0
	 * @returns A collection of guild commands, where the key is the guild ID and the value is an array of commands.
	 */
	getLoadedGuildCommands() {
		const collection = new Collection();
		for (const [command, guildIds] of restrictedGuildIdRegistry) {
			if (guildIds.length === 0) continue;
			const entry = _classPrivateFieldGet2(_entries, this).get(command);
			if (!entry) continue;
			const commands = entry.toJSON();
			for (const guildId of guildIds) collection.ensure(guildId, () => []).push(...commands);
		}
		return collection;
	}
	/**
	 * Registers all the non guild-restricted commands globally.
	 *
	 * @since 2.0.0
	 * @returns The raw result from registering the commands globally.
	 */
	pushGlobalCommands() {
		return _assertClassBrand(_ApplicationCommandRegistry_brand, this, _push).call(
			this,
			Routes.applicationCommands(this.clientId),
			this.getLoadedGlobalCommands(),
			null
		);
	}
	/**
	 * Registers all the non guild-restricted commands in a single guild.
	 *
	 * @since 2.0.0
	 * @param guildId The guild to register the commands at.
	 * @returns The raw result from registering the commands in the specified guild.
	 */
	pushGlobalCommandsInGuild(guildId) {
		return _assertClassBrand(_ApplicationCommandRegistry_brand, this, _push).call(
			this,
			Routes.applicationGuildCommands(this.clientId, guildId),
			this.getLoadedGlobalCommands(),
			guildId
		);
	}
	/**
	 * Registers all the commands including guild-restricted ones in a single guild.
	 *
	 * @param guildId The guild to register the commands at.
	 * @returns The raw result from registering the commands in the specified guild.
	 */
	pushAllCommandsInGuild(guildId) {
		return _assertClassBrand(_ApplicationCommandRegistry_brand, this, _push).call(
			this,
			Routes.applicationGuildCommands(this.clientId, guildId),
			this.toJSON(),
			guildId
		);
	}
	/**
	 * Registers all the guild-restricted commands in their respective guilds.
	 *
	 * @returns The settled promises from all the guild command registrations.
	 */
	pushGuildRestrictedCommands() {
		const promises = this.getLoadedGuildCommands().map((commands, guildId) =>
			_assertClassBrand(_ApplicationCommandRegistry_brand, this, _push).call(
				this,
				Routes.applicationGuildCommands(this.clientId, guildId),
				commands,
				guildId
			)
		);
		return Promise.allSettled(promises);
	}
	get clientId() {
		if (_classPrivateFieldGet2(_clientId, this) === null) throw new Error('The ApplicationCommandRegistry has not been setup yet.');
		return _classPrivateFieldGet2(_clientId, this);
	}
};
async function _push(route, body, guildId) {
	if (_classPrivateFieldGet2(_rest, this) === null) throw new Error('The ApplicationCommandRegistry has not been setup yet.');
	const entries = await _classPrivateFieldGet2(_rest, this).put(route, {
		body,
		authPrefix: _classPrivateFieldGet2(_authPrefix, this)
	});
	if (entries.length === 0) return entries;
	const { router } = this.store;
	for (const entry of entries) {
		const registry = (entry.type === ApplicationCommandType.ChatInput ? router.getChatInput(entry.name) : router.getContextMenu(entry.name))
			?.registry;
		if (!registry) continue;
		if (guildId === null) registry.setGlobalId(entry.id);
		else registry.setGuildId(guildId, entry.id);
	}
	return entries;
}
var applicationCommandRegistry = new ApplicationCommandRegistry();
container.applicationCommandRegistry = applicationCommandRegistry;
var _target = /* @__PURE__ */ new WeakMap();
/**
 * A per-command registry passed to {@linkcode Command.registerApplicationCommands}, allowing commands to be
 * registered imperatively, without relying on decorators.
 *
 * @remarks This is the decorator-free equivalent of {@link RegisterCommand}, {@link RegisterSubcommand},
 * {@link RegisterSubcommandGroup}, {@link RegisterMessageCommand}, {@link RegisterUserCommand}, and
 * {@link RestrictGuildIds}; both approaches can be used interchangeably as they share the same underlying
 * {@linkcode ApplicationCommandRegistryEntry}.
 * @since 3.1.0
 */
var CommandRegistry = class {
	constructor(target) {
		_classPrivateFieldInitSpec(this, _target, void 0);
		_classPrivateFieldSet2(_target, this, target);
	}
	/**
	 * Registers the chat input (slash) command for this command.
	 *
	 * @since 3.1.0
	 * @param data - The command data.
	 * @returns This registry, for chaining.
	 * @example
	 * ```typescript
	 * public override registerApplicationCommands(registry: Command.Registry) {
	 * 	registry.registerChatInputCommand((builder) =>
	 * 		builder.setName('ping').setDescription('A simple ping pong command')
	 * 	);
	 * }
	 * ```
	 */
	registerChatInputCommand(data) {
		ensureChatInputCommandResolver(_classPrivateFieldGet2(_target, this)).setCommand(data);
		return this;
	}
	/**
	 * Registers a subcommand for the chat input command of this command.
	 *
	 * @since 3.1.0
	 * @param data - The subcommand data.
	 * @param method - The name of the method that handles this subcommand.
	 * @param groupName - The name of the subcommand group this subcommand belongs to, if any.
	 * @returns This registry, for chaining.
	 */
	registerSubcommand(data, method, groupName) {
		ensureChatInputCommandResolver(_classPrivateFieldGet2(_target, this)).addSubcommand(data, method, groupName);
		return this;
	}
	/**
	 * Registers a subcommand group for the chat input command of this command.
	 *
	 * @since 3.1.0
	 * @param data - The subcommand group data.
	 * @param method - The name of the method that handles this subcommand group, if any.
	 * @returns This registry, for chaining.
	 */
	registerSubcommandGroup(data, method) {
		ensureChatInputCommandResolver(_classPrivateFieldGet2(_target, this)).addSubcommandGroup(data, method);
		return this;
	}
	/**
	 * Registers a context menu command for this command.
	 *
	 * @since 3.1.0
	 * @param data - The command data.
	 * @param type - The type of context menu command to register.
	 * @param method - The name of the method that handles this context menu command, if any.
	 * @returns This registry, for chaining.
	 */
	registerContextMenuCommand(data, type, method) {
		ensureContextMenuCommandResolver(_classPrivateFieldGet2(_target, this)).setCommand(data, type, method);
		return this;
	}
	/**
	 * Registers a "Message" context menu command for this command.
	 *
	 * @since 3.1.0
	 * @param data - The command data.
	 * @param method - The name of the method that handles this context menu command, if any.
	 * @returns This registry, for chaining.
	 */
	registerMessageCommand(data, method) {
		return this.registerContextMenuCommand(data, ApplicationCommandType.Message, method);
	}
	/**
	 * Registers a "User" context menu command for this command.
	 *
	 * @since 3.1.0
	 * @param data - The command data.
	 * @param method - The name of the method that handles this context menu command, if any.
	 * @returns This registry, for chaining.
	 */
	registerUserCommand(data, method) {
		return this.registerContextMenuCommand(data, ApplicationCommandType.User, method);
	}
	/**
	 * Restricts this command to the given guild IDs, so it is only registered there instead of globally.
	 *
	 * @since 3.1.0
	 * @param guildIds - The guild IDs to restrict this command to.
	 * @returns This registry, for chaining.
	 */
	setGuildIds(guildIds) {
		restrictedGuildIdRegistry.set(_classPrivateFieldGet2(_target, this), guildIds);
		return this;
	}
};
var ErrorMessages = {
	InternalError: JSON.stringify({ message: 'Received an internal error' }),
	InvalidBodySize: JSON.stringify({ message: 'Request body exceeds maximum body size' }),
	InvalidContentLengthInteger: JSON.stringify({ message: 'Content-Length is not an integer number' }),
	InvalidContentLengthNegative: JSON.stringify({ message: 'Content-Length must not be zero or negative' }),
	InvalidContentLengthTooBig: JSON.stringify({ message: "Content-Length is superior to the server's body size limit" }),
	InvalidCustomId: JSON.stringify({ message: 'Could not parse the `custom_id` field' }),
	InvalidSignature: JSON.stringify({ message: 'Received invalid signature' }),
	MissingBodyData: JSON.stringify({ message: 'Missing body data' }),
	MissingCommandName: JSON.stringify({ message: 'Missing command name' }),
	MissingSignatureInformation: JSON.stringify({ message: 'Missing signature information' }),
	NotFound: JSON.stringify({ message: 'Not found' }),
	UnknownCommandHandler: JSON.stringify({ message: 'Unknown command handler' }),
	UnknownCommandName: JSON.stringify({ message: 'Unknown command name' }),
	UnknownHandlerName: JSON.stringify({ message: 'Unknown handler name' }),
	UnknownInteractionType: JSON.stringify({ message: 'Received unknown interaction type' }),
	UnsupportedHttpMethod: JSON.stringify({ message: 'Unsupported HTTP method' })
};
var Payloads = { Pong: JSON.stringify({ type: InteractionResponseType.Pong }) };
var Data = Symbol('data');
var Response$1 = Symbol('response');
var BaseInteraction = class {
	constructor(response, data) {
		_defineProperty(this, Data, void 0);
		_defineProperty(this, Response$1, void 0);
		this[Data] = data;
		this[Response$1] = response;
	}
	get replied() {
		return this[Response$1].writableEnded;
	}
	/**
	 * The ID of the interaction.
	 */
	get id() {
		return this[Data].id;
	}
	/**
	 * The type of the interaction.
	 */
	get type() {
		return this[Data].type;
	}
	/**
	 * Bitwise set of permissions the app or bot has within the channel the interaction was sent from.
	 */
	get app_permissions() {
		return this[Data].app_permissions;
	}
	/**
	 * Bitwise set of permissions the app or bot has within the channel the interaction was sent from.
	 *
	 * @seealso {@link app_permissions} for the raw data.
	 */
	get applicationPermissions() {
		return typeof this.app_permissions === 'string' ? BigInt(this.app_permissions) : void 0;
	}
	/**
	 * The ID of the application the interaction is for.
	 */
	get application_id() {
		return this[Data].application_id;
	}
	/**
	 * The ID of the application the interaction is for.
	 *
	 * @seealso {@link application_id} for the raw data.
	 */
	get applicationId() {
		return this.application_id;
	}
	/**
	 * Mapping of installation contexts that the interaction was authorized for
	 * to related user or guild IDs.
	 */
	get authorizing_integration_owners() {
		return this[Data].authorizing_integration_owners;
	}
	/**
	 * Mapping of installation contexts that the interaction was authorized for
	 * to related user or guild IDs.
	 *
	 * @seealso {@link authorizing_integration_owners} for the raw data.
	 */
	get authorizingIntegrationOwners() {
		return this.authorizing_integration_owners;
	}
	/**
	 * The channel of the interaction.
	 */
	get channel() {
		return this[Data].channel;
	}
	/**
	 * The channel the interaction was sent from.
	 * @deprecated Use {@link channel}.id instead.
	 */
	get channel_id() {
		return this.channel?.id;
	}
	/**
	 * The channel the interaction was sent from.
	 * @deprecated Use {@link channel}.id instead.
	 *
	 * @seealso {@link channel_id} for the raw data.
	 */
	get channelId() {
		return this.channel?.id;
	}
	/**
	 * Context where the interaction was triggered from.
	 */
	get context() {
		return this[Data].context;
	}
	/**
	 * The command data payload.
	 */
	get data() {
		return this[Data].data;
	}
	/**
	 * For monetized apps, any entitlements for the invoking user, representing
	 * access to premium SKUs.
	 */
	get entitlements() {
		return this[Data].entitlements;
	}
	/**
	 * The guild the interaction was sent from.
	 */
	get guild_id() {
		return this[Data].guild_id;
	}
	/**
	 * The guild the interaction was sent from.
	 *
	 * @seealso {@link guild_id} for the raw data.
	 */
	get guildId() {
		return this.guild_id;
	}
	/**
	 * The guild's preferred locale, if invoked in a guild.
	 */
	get guild_locale() {
		return this[Data].guild_locale;
	}
	/**
	 * The guild's preferred locale, if invoked in a guild.
	 *
	 * @seealso {@link guild_locale} for the raw data.
	 */
	get guildLocale() {
		return this.guild_locale;
	}
	/**
	 * The selected language of the invoking user.
	 */
	get locale() {
		return this[Data].locale;
	}
	/**
	 * Guild member data for the invoking user, including permissions.
	 *
	 * **This is only sent when an interaction is invoked in a guild**.
	 */
	get member() {
		return this[Data].member;
	}
	/**
	 * A continuation token for responding to the interaction.
	 */
	get token() {
		return this[Data].token;
	}
	/**
	 * User object for the invoking user.
	 */
	get user() {
		return this[Data].member?.user ?? this[Data].user;
	}
	/**
	 * Read-only property, always `1`.
	 */
	get version() {
		return this[Data].version;
	}
	/**
	 * Determines whether or not the interaction was sent from a guild.
	 * @returns The casted interaction type.
	 */
	inGuild() {
		return !isNullOrUndefined(this.guild_id);
	}
	/**
	 * Fetches the channel the interaction was sent from.
	 * @returns The fetched channel.
	 * @remarks **This requires REST to have a token.**
	 * @seealso {@link channel}.
	 */
	async fetchChannel() {
		if (isNullOrUndefinedOrEmpty(this.channel)) return err(/* @__PURE__ */ new Error('The interaction was not sent from a channel'));
		return resultFromDiscord(container.rest.get(Routes.channel(this.channel.id)));
	}
	/**
	 * Fetches the channel the interaction was sent from.
	 * @returns The fetched channel.
	 * @remarks **This requires REST to have a token.**
	 */
	async fetchGuild() {
		if (isNullOrUndefinedOrEmpty(this.guildId)) return err(/* @__PURE__ */ new Error('The interaction was not sent from a guild'));
		return resultFromDiscord(container.rest.get(Routes.guild(this.guildId)));
	}
	_sendReply(data) {
		const response = this[Response$1];
		if (response.writableEnded) throw new Error('Cannot send response, the request has already been replied.');
		response.statusCode = 200;
		return new Promise((resolve) => {
			response.on('close', () => {
				resolve();
			});
			response.end(JSON.stringify(data));
		});
	}
};
var AutocompleteInteraction = class extends BaseInteraction {
	/**
	 * Responds to the interaction with an autocomplete result.
	 * @param data The data to be sent.
	 */
	reply(data) {
		const body = {
			type: InteractionResponseType.ApplicationCommandAutocompleteResult,
			data
		};
		return this._sendReply(body);
	}
	/**
	 * Responds to the interaction with an empty autocomplete result.
	 */
	replyEmpty() {
		return this.reply({ choices: [] });
	}
};
var CommandInteraction = class extends BaseInteraction {
	/**
	 * Responds to the interaction with a message.
	 * @param data The data to be sent.
	 */
	async reply(data) {
		const body = {
			type: InteractionResponseType.ChannelMessageWithSource,
			data
		};
		await this._sendReply(body);
		return new PartialMessage(this);
	}
	/**
	 * ACK an interaction and edit a response later. The user sees a loading state.
	 * @param data The data to be sent, if any.
	 */
	async defer(data) {
		const body = {
			type: InteractionResponseType.DeferredChannelMessageWithSource,
			data
		};
		await this._sendReply(body);
		return new PartialMessage(this);
	}
	/**
	 * Responds to the interaction with a popup modal.
	 * @param data The data to be sent.
	 */
	showModal(data) {
		const body = {
			type: InteractionResponseType.Modal,
			data
		};
		return this._sendReply(body);
	}
	/**
	 * Sends a follow-up message.
	 * @param data The data to be sent.
	 */
	async followup({ files, ...body }) {
		return (
			await resultFromDiscord(
				container.rest.post(Routes.webhook(this.applicationId, this.token), {
					body,
					files,
					auth: false
				})
			)
		).map((message) => new Message(this, message));
	}
};
var MessageComponentInteraction = class extends BaseInteraction {
	/**
	 * The message the interaction was attached to.
	 */
	get message() {
		return this[Data].message;
	}
	/**
	 * ACK a button interaction and update it to a loading state.
	 */
	async deferUpdate() {
		const body = { type: InteractionResponseType.DeferredMessageUpdate };
		await this._sendReply(body);
		return new PartialMessage(this);
	}
	/**
	 * ACK an interaction and edit a response later. The user sees a loading state.
	 * @param data The data to be sent, if any.
	 */
	async update(data) {
		const body = {
			type: InteractionResponseType.UpdateMessage,
			data
		};
		await this._sendReply(body);
		return new PartialMessage(this);
	}
	/**
	 * Responds to the interaction with a message.
	 * @param data The data to be sent.
	 */
	async reply(data) {
		const body = {
			type: InteractionResponseType.ChannelMessageWithSource,
			data
		};
		await this._sendReply(body);
		return new PartialMessage(this);
	}
	/**
	 * ACK an interaction and edit a response later. The user sees a loading state.
	 * @param data The data to be sent, if any.
	 */
	async defer(data) {
		const body = {
			type: InteractionResponseType.DeferredChannelMessageWithSource,
			data
		};
		await this._sendReply(body);
		return new PartialMessage(this);
	}
	/**
	 * Responds to the interaction with a popup modal.
	 * @param data The data to be sent.
	 */
	showModal(data) {
		const body = {
			type: InteractionResponseType.Modal,
			data
		};
		return this._sendReply(body);
	}
	/**
	 * Sends a follow-up message.
	 * @param data The data to be sent.
	 */
	async followup({ files, ...body }) {
		return (
			await resultFromDiscord(
				container.rest.post(Routes.webhook(this.applicationId, this.token), {
					body,
					files,
					auth: false
				})
			)
		).map((message) => new Message(this, message));
	}
};
var ChatInputCommandInteraction = class extends CommandInteraction {};
var MessageComponentButtonInteraction = class extends MessageComponentInteraction {};
var MessageComponentChannelSelectInteraction = class extends MessageComponentInteraction {
	/**
	 * Gets the IDs of the selected channels.
	 */
	get ids() {
		return this.data.values;
	}
	/**
	 * Creates a collection with all the selected channels.
	 *
	 * @seealso {@link MessageComponentChannelSelectInteraction.keys}.
	 * @seealso {@link MessageComponentChannelSelectInteraction.values}.
	 * @seealso {@link MessageComponentChannelSelectInteraction.entries}.
	 */
	get channels() {
		return new Collection(this.entries());
	}
	/**
	 * Returns an iterator of the selected channel IDs.
	 *
	 * @seealso {@link MessageComponentChannelSelectInteraction.ids}.
	 */
	*keys() {
		yield* this.ids;
	}
	/**
	 * Returns an iterator of the selected channels.
	 *
	 * @seealso {@link MessageComponentChannelSelectInteraction.channels}.
	 * @seealso {@link MessageComponentChannelSelectInteraction.keys}.
	 * @seealso {@link MessageComponentChannelSelectInteraction.entries}.
	 */
	*values() {
		const { resolved } = this.data;
		for (const id of this.ids) yield resolved.channels[id];
	}
	/**
	 * Returns an iterator of [ID, Channel] pairs.
	 *
	 * @seealso {@link MessageComponentChannelSelectInteraction.channels}.
	 * @seealso {@link MessageComponentChannelSelectInteraction.keys}.
	 * @seealso {@link MessageComponentChannelSelectInteraction.values}.
	 */
	*entries() {
		for (const value of this.values()) yield [value.id, value];
	}
};
var MessageComponentMentionableSelectInteraction = class extends MessageComponentInteraction {
	/**
	 * Gets the IDs of the selected users and roles.
	 */
	get ids() {
		return this.data.values;
	}
	/**
	 * Creates a collection with all the selected users.
	 *
	 * @seealso {@link MessageComponentMentionableSelectInteraction.keys}.
	 * @seealso {@link MessageComponentMentionableSelectInteraction.values}.
	 * @seealso {@link MessageComponentMentionableSelectInteraction.entries}.
	 */
	get users() {
		const output = new Collection();
		const { users, members } = this.data.resolved;
		if (users)
			for (const user of Object.values(users))
				output.set(user.id, {
					id: user.id,
					user,
					member: members?.[user.id] ?? null
				});
		return output;
	}
	/**
	 * Creates a collection with all the selected roles.
	 *
	 * @note The collection will always be empty if the interaction came from direct messages.
	 * @seealso {@link MessageComponentMentionableSelectInteraction.keys}.
	 * @seealso {@link MessageComponentMentionableSelectInteraction.values}.
	 * @seealso {@link MessageComponentMentionableSelectInteraction.entries}.
	 */
	get roles() {
		const output = new Collection();
		const { roles } = this.data.resolved;
		if (roles) for (const role of Object.values(roles)) output.set(role.id, role);
		return output;
	}
	/**
	 * Creates a collection with all the selected users, members, and roles.
	 *
	 * @note The collection will always be empty if the interaction came from direct messages.
	 * @seealso {@link MessageComponentMentionableSelectInteraction.keys}.
	 * @seealso {@link MessageComponentMentionableSelectInteraction.values}.
	 * @seealso {@link MessageComponentMentionableSelectInteraction.entries}.
	 */
	get mentionables() {
		return new Collection(this.entries());
	}
	/**
	 * Returns an iterator of the selected users and roles IDs.
	 *
	 * @seealso {@link MessageComponentMentionableSelectInteraction.ids}.
	 */
	*keys() {
		yield* this.ids;
	}
	/**
	 * Returns an iterator of the selected users, members, and roles.
	 *
	 * @seealso {@link MessageComponentMentionableSelectInteraction.users}.
	 * @seealso {@link MessageComponentMentionableSelectInteraction.roles}.
	 * @seealso {@link MessageComponentMentionableSelectInteraction.keys}.
	 * @seealso {@link MessageComponentMentionableSelectInteraction.entries}.
	 */
	*values() {
		const { resolved } = this.data;
		for (const id of this.ids) {
			const user = resolved.users?.[id];
			if (user) {
				yield {
					id,
					user,
					member: resolved.members?.[id] ?? null
				};
				continue;
			}
			const role = resolved.roles?.[id];
			if (role) {
				yield {
					id,
					role
				};
				continue;
			}
			yield { id };
		}
	}
	/**
	 * Returns an iterator of [ID, Mentionable] pairs.
	 *
	 * @seealso {@link MessageComponentMentionableSelectInteraction.users}.
	 * @seealso {@link MessageComponentMentionableSelectInteraction.roles}.
	 * @seealso {@link MessageComponentMentionableSelectInteraction.keys}.
	 * @seealso {@link MessageComponentMentionableSelectInteraction.values}.
	 */
	*entries() {
		for (const value of this.values()) yield [value.id, value];
	}
};
var MessageComponentRoleSelectInteraction = class extends MessageComponentInteraction {
	/**
	 * Gets the IDs of the selected roles.
	 */
	get ids() {
		return this.data.values;
	}
	/**
	 * Creates a collection with all the selected roles.
	 *
	 * @seealso {@link MessageComponentRoleSelectInteraction.keys}.
	 * @seealso {@link MessageComponentRoleSelectInteraction.values}.
	 * @seealso {@link MessageComponentRoleSelectInteraction.entries}.
	 */
	get roles() {
		return new Collection(this.entries());
	}
	/**
	 * Returns an iterator of the selected role IDs.
	 *
	 * @seealso {@link MessageComponentRoleSelectInteraction.ids}.
	 */
	*keys() {
		yield* this.ids;
	}
	/**
	 * Returns an iterator of the selected channels.
	 *
	 * @seealso {@link MessageComponentRoleSelectInteraction.roles}.
	 * @seealso {@link MessageComponentRoleSelectInteraction.keys}.
	 * @seealso {@link MessageComponentRoleSelectInteraction.entries}.
	 */
	*values() {
		const { resolved } = this.data;
		for (const id of this.ids) yield resolved.roles[id];
	}
	/**
	 * Returns an iterator of [ID, Role] pairs.
	 *
	 * @seealso {@link MessageComponentRoleSelectInteraction.roles}.
	 * @seealso {@link MessageComponentRoleSelectInteraction.keys}.
	 * @seealso {@link MessageComponentRoleSelectInteraction.values}.
	 */
	*entries() {
		for (const value of this.values()) yield [value.id, value];
	}
};
var MessageComponentStringSelectInteraction = class extends MessageComponentInteraction {
	get values() {
		return this.data.values ?? [];
	}
};
var MessageComponentUserSelectInteraction = class extends MessageComponentInteraction {
	/**
	 * Gets the IDs of the selected users.
	 */
	get ids() {
		return this.data.values;
	}
	/**
	 * Creates a collection with all the selected users.
	 *
	 * @seealso {@link MessageComponentChannelSelectInteraction.keys}.
	 * @seealso {@link MessageComponentChannelSelectInteraction.values}.
	 * @seealso {@link MessageComponentChannelSelectInteraction.entries}.
	 */
	get users() {
		return new Collection(this.entries());
	}
	/**
	 * Returns an iterator of the selected user IDs.
	 *
	 * @seealso {@link MessageComponentUserSelectInteraction.ids}.
	 */
	*keys() {
		yield* this.ids;
	}
	/**
	 * Returns an iterator of the selected users.
	 *
	 * @seealso {@link MessageComponentUserSelectInteraction.users}.
	 * @seealso {@link MessageComponentUserSelectInteraction.keys}.
	 * @seealso {@link MessageComponentUserSelectInteraction.entries}.
	 */
	*values() {
		const { resolved } = this.data;
		for (const id of this.ids)
			yield {
				id,
				user: resolved.users[id],
				member: resolved.members?.[id] ?? null
			};
	}
	/**
	 * Returns an iterator of [ID, User] pairs.
	 *
	 * @seealso {@link MessageComponentUserSelectInteraction.channels}.
	 * @seealso {@link MessageComponentUserSelectInteraction.keys}.
	 * @seealso {@link MessageComponentUserSelectInteraction.values}.
	 */
	*entries() {
		for (const value of this.values()) yield [value.user.id, value];
	}
};
var MessageContextMenuCommandInteraction = class extends CommandInteraction {};
var ModalSubmitInteraction = class extends BaseInteraction {
	/**
	 * The message the interaction was attached to, if any.
	 */
	get message() {
		return this[Data].message;
	}
	/**
	 * ACK a button interaction and update it to a loading state.
	 */
	async deferUpdate() {
		const body = { type: InteractionResponseType.DeferredMessageUpdate };
		await this._sendReply(body);
		return new PartialMessage(this);
	}
	/**
	 * ACK an interaction and edit a response later. The user sees a loading state.
	 * @param data The data to be sent, if any.
	 */
	async update(data) {
		const body = {
			type: InteractionResponseType.UpdateMessage,
			data
		};
		await this._sendReply(body);
		return new PartialMessage(this);
	}
	/**
	 * Responds to the interaction with a message.
	 * @param data The data to be sent.
	 */
	async reply(data) {
		const body = {
			type: InteractionResponseType.ChannelMessageWithSource,
			data
		};
		await this._sendReply(body);
		return new PartialMessage(this);
	}
	/**
	 * ACK an interaction and edit a response later. The user sees a loading state.
	 * @param data The data to be sent, if any.
	 */
	async defer(data) {
		const body = {
			type: InteractionResponseType.DeferredChannelMessageWithSource,
			data
		};
		await this._sendReply(body);
		return new PartialMessage(this);
	}
	/**
	 * Sends a follow-up message.
	 * @param data The data to be sent.
	 */
	async followup({ files, ...body }) {
		return (
			await resultFromDiscord(
				container.rest.post(Routes.webhook(this.applicationId, this.token), {
					body,
					files,
					auth: false
				})
			)
		).map((message) => new Message(this, message));
	}
};
var UserContextMenuCommandInteraction = class extends CommandInteraction {};
function makeInteraction(response, interaction) {
	switch (interaction.type) {
		case InteractionType.ApplicationCommand:
			switch (interaction.data.type) {
				case ApplicationCommandType.ChatInput:
					return new ChatInputCommandInteraction(response, interaction);
				case ApplicationCommandType.User:
					return new UserContextMenuCommandInteraction(response, interaction);
				case ApplicationCommandType.Message:
					return new MessageContextMenuCommandInteraction(response, interaction);
				case ApplicationCommandType.PrimaryEntryPoint:
					throw new Error('PrimaryEntryPoint is not supported');
			}
		case InteractionType.MessageComponent:
			switch (interaction.data.component_type) {
				case ComponentType.Button:
					return new MessageComponentButtonInteraction(response, interaction);
				case ComponentType.ChannelSelect:
					return new MessageComponentChannelSelectInteraction(response, interaction);
				case ComponentType.MentionableSelect:
					return new MessageComponentMentionableSelectInteraction(response, interaction);
				case ComponentType.RoleSelect:
					return new MessageComponentRoleSelectInteraction(response, interaction);
				case ComponentType.StringSelect:
					return new MessageComponentStringSelectInteraction(response, interaction);
				case ComponentType.UserSelect:
					return new MessageComponentUserSelectInteraction(response, interaction);
			}
		case InteractionType.ApplicationCommandAutocomplete:
			return new AutocompleteInteraction(response, interaction);
		case InteractionType.ModalSubmit:
			return new ModalSubmitInteraction(response, interaction);
	}
}
/**
 * Handles a received error. This function must only be called if the HTTP
 * interaction was not replied to.
 *
 * This function has a special case for string errors, which are translated to a
 * regular message with content as the error.
 *
 * When an error is thrown, the error is emitted in client, and a generic error
 * message is sent back to Discord.
 * @param response The HTTP request we can response to.
 * @param error The error to handle.
 * @returns The response object.
 */
function handleError(response, error) {
	container.client.emit('error', error);
	if (!container.client.httpReplyOnError || response.closed) return response;
	response.statusCode = 500;
	return response.end(ErrorMessages.InternalError);
}
function resultFromDiscord(promise) {
	return Result.fromAsync(promise);
}
var PartialMessage = class {
	constructor(interaction) {
		_defineProperty(this, 'interaction', void 0);
		this.interaction = interaction;
	}
	/**
	 * The ID of the message.
	 */
	get id() {
		return '@original';
	}
	/**
	 * The thread, if the message started one.
	 */
	get thread() {}
	/**
	 * Retrieves the message from Discord, returns a clone of the instance.
	 */
	async get() {
		return (
			await resultFromDiscord(
				container.rest.get(Routes.webhookMessage(this.interaction.applicationId, this.interaction.token, this.id), {
					auth: false,
					query: makeURLSearchParams({ thread_id: this.thread?.id })
				})
			)
		).map((data) => new Message(this.interaction, data));
	}
	/**
	 * Updates the message, returns a clone of the instance.
	 * @param data The data to be sent.
	 */
	async update({ files, ...body }) {
		return (
			await resultFromDiscord(
				container.rest.patch(Routes.webhookMessage(this.interaction.applicationId, this.interaction.token, this.id), {
					body,
					files,
					auth: false,
					query: makeURLSearchParams({ thread_id: this.thread?.id })
				})
			)
		).map((data) => new Message(this.interaction, data));
	}
	/**
	 * Deletes the message.
	 */
	async delete() {
		return (
			await resultFromDiscord(
				container.rest.delete(Routes.webhookMessage(this.interaction.applicationId, this.interaction.token, this.id), {
					auth: false,
					query: makeURLSearchParams({ thread_id: this.thread?.id })
				})
			)
		).map(() => this);
	}
};
var Message = class extends PartialMessage {
	constructor(interaction, data) {
		super(interaction);
		_defineProperty(this, Data, void 0);
		this[Data] = data;
	}
	/**
	 * The ID of the message.
	 *
	 * @raw
	 */
	get id() {
		return this[Data].id;
	}
	/**
	 * The ID of the channel the message is from.
	 *
	 * @raw
	 * @seealso {@link channelId} for the camelCase property.
	 */
	get channel_id() {
		return this[Data].channel_id;
	}
	/**
	 * The ID of the channel the message is from.
	 */
	get channelId() {
		return this.channel_id;
	}
	/**
	 * The author of this message (only a valid user in the case where the message is generated by a user or bot user)
	 *
	 * If the message is generated by a webhook, the author object corresponds to the webhook's id,
	 * username, and avatar. You can tell if a message is generated by a webhook by checking for the {@link webhookId} property
	 *
	 * @raw
	 * @seealso {@link https://discord.com/developers/docs/resources/user#user-object}
	 */
	get author() {
		return this[Data].author;
	}
	/**
	 * The contents of the message.
	 *
	 * @raw
	 */
	get content() {
		return this[Data].content;
	}
	/**
	 * The timestamp the message was sent at.
	 *
	 * @raw
	 * @seealso {@link createdTimestamp} for the parsed timestamp.
	 * @seealso {@link createdAt} for the Date instance created from the parsed timestamp.
	 */
	get timestamp() {
		return this[Data].timestamp;
	}
	/**
	 * The timestamp the message was sent at.
	 *
	 * @seealso {@link timestamp} for the raw data.
	 */
	get createdTimestamp() {
		return Date.parse(this.timestamp);
	}
	/**
	 * The {@link Date} version of {@link createdTimestamp}.
	 */
	get createdAt() {
		return new Date(this.createdTimestamp);
	}
	/**
	 * The timestamp the message was edited at, `null` if it was never edited.
	 *
	 * @raw
	 * @seealso {@link editedTimestamp} for the parsed timestamp.
	 * @seealso {@link editedAt} for the Date instance created from the parsed timestamp.
	 */
	get edited_timestamp() {
		return this[Data].edited_timestamp;
	}
	/**
	 * The timestamp the message was edited at, `null` if it was never edited.
	 */
	get editedTimestamp() {
		const value = this.edited_timestamp;
		return isNullOrUndefinedOrEmpty(value) ? null : Date.parse(value);
	}
	/**
	 * The {@link Date} version of {@link editedTimestamp}.
	 */
	get editedAt() {
		const value = this.editedTimestamp;
		return isNullOrUndefinedOrEmpty(value) ? null : new Date(value);
	}
	/**
	 * Whether or not the message is a TTS message.
	 *
	 * @raw
	 */
	get tts() {
		return this[Data].tts;
	}
	/**
	 * Whether or not the message mentioned everyone.
	 *
	 * @raw
	 * @seealso {@link mention_everyone} for the camelCase property.
	 */
	get mention_everyone() {
		return this[Data].mention_everyone;
	}
	/**
	 * Whether or not the message mentioned everyone.
	 *
	 * @seealso {@link mention_everyone} for the raw data.
	 */
	get mentionEveryone() {
		return this.mention_everyone;
	}
	/**
	 * The users specifically mentioned in the message.
	 *
	 * @raw
	 * @seealso {@link https://discord.com/developers/docs/resources/user#user-object}
	 */
	get mentions() {
		return this[Data].mentions;
	}
	/**
	 * The roles specifically mentioned in the message.
	 *
	 * @raw
	 * @seealso {@link https://discord.com/developers/docs/topics/permissions#role-object}
	 */
	get mention_roles() {
		return this[Data].mention_roles;
	}
	/**
	 * The roles specifically mentioned in the message.
	 *
	 * @seealso {@link https://discord.com/developers/docs/topics/permissions#role-object}
	 * @seealso {@link mention_roles} for the raw data.
	 */
	get mentionRoles() {
		return this.mention_roles;
	}
	/**
	 * The channels specifically mentioned in this message.
	 *
	 * Not all channel mentions in a message will appear in {@link mentionChannels}:
	 * - Only textual channels that are visible to everyone in a lurkable guild will ever be included.
	 * - Only crossposted messages (via Channel Following) currently include {@link mentionChannels} at all.
	 *
	 * @raw
	 * @seealso {@link mentionChannels} for the camelCase property with an empty array default.
	 * @seealso {@link https://discord.com/developers/docs/resources/channel#channel-mention-object}
	 */
	get mention_channels() {
		return this[Data].mention_channels;
	}
	/**
	 * The channels specifically mentioned in this message.
	 *
	 * Not all channel mentions in a message will appear in {@link mentionChannels}:
	 * - Only textual channels that are visible to everyone in a lurkable guild will ever be included.
	 * - Only crossposted messages (via Channel Following) currently include {@link mentionChannels} at all.
	 *
	 * @seealso {@link https://discord.com/developers/docs/resources/channel#channel-mention-object}
	 */
	get mentionChannels() {
		return this[Data].mention_channels ?? [];
	}
	/**
	 * A nonce that can be used for optimistic message sending (up to 25 characters).
	 *
	 * @raw
	 */
	get nonce() {
		return this[Data].nonce;
	}
	/**
	 * Whether or not the message is pinned.
	 *
	 * @raw
	 */
	get pinned() {
		return this[Data].pinned;
	}
	/**
	 * The attached files.
	 *
	 * @seealso {@link https://discord.com/developers/docs/resources/channel#attachment-object}
	 */
	get attachments() {
		return this[Data].attachments;
	}
	/**
	 * The embedded content.
	 *
	 * @seealso {@link https://discord.com/developers/docs/resources/channel#embed-object}
	 */
	get embeds() {
		return this[Data].embeds;
	}
	/**
	 * The reactions the message has.
	 *
	 * @seealso {@link https://discord.com/developers/docs/resources/channel#reaction-object}
	 */
	get reactions() {
		return this[Data].reactions ?? [];
	}
	/**
	 * The webhook ID.
	 */
	get webhook_id() {
		return this[Data].webhook_id;
	}
	/**
	 * The webhook ID.
	 *
	 * @seealso {@link webhook_id} for the raw data.
	 */
	get webhookId() {
		return this.webhook_id ?? null;
	}
	/**
	 * The message's type.
	 *
	 * @seealso {@link https://discord.com/developers/docs/resources/channel#message-object-message-types}
	 */
	get type() {
		return this[Data].type;
	}
	/**
	 * The thread, if the message started one.
	 */
	get thread() {
		return this[Data].thread;
	}
	/**
	 * The message flags combined as a bitfield.
	 *
	 * @seealso {@link https://discord.com/developers/docs/resources/channel#message-object-message-flags}
	 * @seealso {@link https://en.wikipedia.org/wiki/Bit_field}
	 */
	get flags() {
		return this[Data].flags;
	}
	/**
	 * The message's components, such as buttons, action rows, or other interactive components.
	 */
	get components() {
		return this[Data].components ?? [];
	}
	/**
	 * The stickers the message contains, if any.
	 */
	get sticker_items() {
		return this[Data].sticker_items;
	}
	/**
	 * The stickers the message contains, if any.
	 *
	 * @seealso {@link sticker_items} for the raw data.
	 */
	get stickerItems() {
		return this.sticker_items ?? [];
	}
};
/**
 * The identifiers of the errors the framework may throw, useful to localize them.
 * @since 3.2.0
 */
var Identifiers = /* @__PURE__ */ (function (Identifiers) {
	Identifiers['ArgumentMissing'] = 'argumentMissing';
	Identifiers['ArgumentUnavailable'] = 'argumentUnavailable';
	Identifiers['ArgumentAttachmentError'] = 'attachmentError';
	Identifiers['ArgumentBooleanError'] = 'booleanError';
	Identifiers['ArgumentChannelError'] = 'channelError';
	Identifiers['ArgumentEnumEmptyError'] = 'enumEmptyError';
	Identifiers['ArgumentEnumError'] = 'enumError';
	Identifiers['ArgumentIntegerError'] = 'integerError';
	Identifiers['ArgumentIntegerTooLarge'] = 'integerTooLarge';
	Identifiers['ArgumentIntegerTooSmall'] = 'integerTooSmall';
	Identifiers['ArgumentMemberError'] = 'memberError';
	Identifiers['ArgumentMentionableError'] = 'mentionableError';
	Identifiers['ArgumentMessageError'] = 'messageError';
	Identifiers['ArgumentNumberError'] = 'numberError';
	Identifiers['ArgumentNumberTooLarge'] = 'numberTooLarge';
	Identifiers['ArgumentNumberTooSmall'] = 'numberTooSmall';
	Identifiers['ArgumentRoleError'] = 'roleError';
	Identifiers['ArgumentStringTooLong'] = 'stringTooLong';
	Identifiers['ArgumentStringTooShort'] = 'stringTooShort';
	Identifiers['ArgumentUserError'] = 'userError';
	Identifiers['CommandDisabled'] = 'commandDisabled';
	Identifiers['CommandNameMissing'] = 'commandNameMissing';
	Identifiers['CommandNameUnknown'] = 'commandNameUnknown';
	Identifiers['CommandMethodUnknown'] = 'commandMethodUnknown';
	Identifiers['InteractionHandlerNameInvalid'] = 'interactionHandlerNameInvalid';
	Identifiers['InteractionHandlerNameUnknown'] = 'interactionHandlerNameUnknown';
	Identifiers['PreconditionClientPermissions'] = 'preconditionClientPermissions';
	Identifiers['PreconditionClientPermissionsNoPermissions'] = 'preconditionClientPermissionsNoPermissions';
	Identifiers['PreconditionCooldown'] = 'preconditionCooldown';
	Identifiers['PreconditionGuildIds'] = 'preconditionGuildIds';
	Identifiers['PreconditionNSFW'] = 'preconditionNsfw';
	Identifiers['PreconditionRunIn'] = 'preconditionRunIn';
	Identifiers['PreconditionUnavailable'] = 'preconditionUnavailable';
	Identifiers['PreconditionUserPermissions'] = 'preconditionUserPermissions';
	Identifiers['PreconditionUserPermissionsNoPermissions'] = 'preconditionUserPermissionsNoPermissions';
	Identifiers['ChatInputRouterDuplicatedSubcommand'] = 'chatInputRouterDuplicatedSubcommand';
	Identifiers['ChatInputRouterDuplicatedSubcommandGroup'] = 'chatInputRouterDuplicatedSubcommandGroup';
	Identifiers['ChatInputRouterSubcommandGroupLinkInvalid'] = 'chatInputRouterSubcommandGroupLinkInvalid';
	Identifiers['ChatInputRouterSubcommandLinkInvalid'] = 'chatInputRouterSubcommandLinkInvalid';
	return Identifiers;
})({});
/**
 * The UserError class to be thrown and emitted by the pieces of the framework.
 *
 * @remarks
 * This class is the root of every framework-thrown error, allowing consumers to distinguish
 * errors that are meant to be shown to the user from unexpected, internal ones.
 *
 * @property name This will be `'UserError'` and can be used to distinguish the type of error when any error gets thrown.
 * @since 3.2.0
 * @example
 * ```typescript
 * throw new UserError({
 * 	identifier: Identifiers.ArgumentIntegerTooSmall,
 * 	message: 'The number you provided is too small.',
 * 	context: { received: 2, minimum: 3 }
 * });
 * ```
 */
var UserError = class extends Error {
	/**
	 * Constructs an UserError.
	 * @param options The UserError options
	 */
	constructor(options) {
		super(options.message);
		_defineProperty(this, 'identifier', void 0);
		_defineProperty(this, 'context', void 0);
		this.identifier = options.identifier;
		this.context = options.context ?? null;
	}
	get name() {
		return 'UserError';
	}
};
/**
 * Represents an error that is thrown when a {@link ChatInputRouter} encounters an error.
 * @since 2.0.0
 */
var ChatInputRouterError = class extends UserError {
	constructor(key, command, group, subcommand) {
		super({
			identifier: Identifiers[`ChatInputRouter${key}`],
			message: ChatInputRouterErrors[key](command.name, group?.name ?? '', subcommand?.name ?? ''),
			context: {
				command,
				group: group ?? null,
				subcommand: subcommand ?? null
			}
		});
		_defineProperty(this, 'key', void 0);
		_defineProperty(this, 'command', void 0);
		_defineProperty(this, 'group', void 0);
		_defineProperty(this, 'subcommand', void 0);
		this.key = key;
		this.command = command;
		this.group = group ?? null;
		this.subcommand = subcommand ?? null;
	}
	/**
	 * The path of the command that was being processed when the error was thrown.
	 * @since 2.0.0
	 */
	get path() {
		return `${this.command.name}${this.group ? `/${this.group.name}` : ''}${this.subcommand ? `/${this.subcommand.name}` : ''}`;
	}
	get name() {
		return 'ChatInputRouterError';
	}
};
var ChatInputRouterErrors = {
	DuplicatedSubcommandGroup: (command, subcommandGroup) => `Duplicated subcommand group named '${subcommandGroup}' in command '${command}'`,
	DuplicatedSubcommand: (command, subcommandGroup, subcommand) =>
		`Duplicated subcommand named '${subcommand}' in subcommand group '${subcommandGroup}' in command '${command}'`,
	SubcommandGroupLinkInvalid: (command, subcommandGroup) =>
		`Subcommand group named '${subcommandGroup}' in command '${command}' is not linked to a method`,
	SubcommandLinkInvalid: (command, subcommandGroup, subcommand) =>
		`Subcommand named '${subcommand}' ${subcommandGroup ? `in subcommand group '${subcommandGroup}' ` : ''}in command '${command}' is not linked to a method`
};
var _subcommandMapping$1 = /* @__PURE__ */ new WeakMap();
/**
 * Represents a subcommand in a command router.
 *
 * @template Options - The options type for the command.
 * @internal
 */
var CommandRouterSubcommand = class {
	constructor() {
		_classPrivateFieldInitSpec(this, _subcommandMapping$1, null);
	}
	/**
	 * Checks if the subcommand is a subcommand group.
	 *
	 * @returns True if the subcommand is a subcommand group, false otherwise.
	 */
	isSubcommandGroup() {
		return false;
	}
	/**
	 * Checks if the subcommand is a subcommand.
	 *
	 * @returns True if the subcommand is a subcommand, false otherwise.
	 */
	isSubcommand() {
		return true;
	}
	/**
	 * Throws an error indicating that the subcommand is a subcommand group.
	 *
	 * @throws Error - Cannot assert subcommand on a subcommand group.
	 */
	assertSubcommandGroup() {
		throw new Error('Cannot assert subcommand on a subcommand group');
	}
	/**
	 * Asserts that the subcommand is a subcommand.
	 *
	 * @returns The current subcommand instance.
	 */
	assertSubcommand() {
		return this;
	}
	/**
	 * Gets the subcommand mapping.
	 *
	 * @returns The subcommand mapping.
	 */
	getSubcommandMapping() {
		return _classPrivateFieldGet2(_subcommandMapping$1, this);
	}
	/**
	 * Sets the subcommand mapping.
	 *
	 * @param command - The command instance.
	 * @param subcommand - The subcommand option.
	 * @param method - The method name.
	 * @returns The current subcommand instance.
	 * @throws ChatInputRouterError - Throws an error if the method is not a function.
	 */
	setSubcommandMapping(command, subcommand, method) {
		if (!isFunction(Reflect.get(command, method))) throw new ChatInputRouterError('SubcommandLinkInvalid', command, null, subcommand);
		_classPrivateFieldSet2(_subcommandMapping$1, this, method);
		return this;
	}
};
var _subcommandGroupMapping = /* @__PURE__ */ new WeakMap();
var _subcommandMapping = /* @__PURE__ */ new WeakMap();
/**
 * Represents a subcommand group in a command router.
 *
 * @template Options - The options type for the command.
 * @internal
 */
var CommandRouterSubcommandGroup = class {
	constructor() {
		_classPrivateFieldInitSpec(this, _subcommandGroupMapping, null);
		_classPrivateFieldInitSpec(this, _subcommandMapping, new Collection());
	}
	/**
	 * Checks if this instance is a subcommand group.
	 *
	 * @returns True if this instance is a subcommand group, false otherwise.
	 */
	isSubcommandGroup() {
		return true;
	}
	/**
	 * Checks if this instance is a subcommand.
	 *
	 * @returns True if this instance is a subcommand, false otherwise.
	 */
	isSubcommand() {
		return false;
	}
	/**
	 * Asserts that this instance is a subcommand group.
	 *
	 * @returns The current instance.
	 */
	assertSubcommandGroup() {
		return this;
	}
	/**
	 * Throws an error indicating that this instance cannot be asserted as a subcommand.
	 * @throws Error - An error indicating that subcommand cannot be asserted on a subcommand group.
	 */
	assertSubcommand() {
		throw new Error('Cannot assert subcommand on a subcommand group');
	}
	/**
	 * Gets the subcommand group mapping.
	 *
	 * @returns The subcommand group mapping.
	 */
	getSubcommandGroupMapping() {
		return _classPrivateFieldGet2(_subcommandGroupMapping, this);
	}
	/**
	 * Gets the subcommand mapping for the specified subcommand.
	 *
	 * @param subcommand - The name of the subcommand.
	 * @returns The subcommand mapping.
	 */
	getSubcommandMapping(subcommand) {
		return _classPrivateFieldGet2(_subcommandMapping, this).get(subcommand) ?? null;
	}
	/**
	 * Sets the subcommand group mapping.
	 *
	 * @param command - The command instance.
	 * @param group - The subcommand group option.
	 * @param method - The method name.
	 * @returns The current instance.
	 * @throws ChatInputRouterError - If the method is not a function on the command instance.
	 */
	setSubcommandGroupMapping(command, group, method) {
		if (!isFunction(Reflect.get(command, method))) throw new ChatInputRouterError('SubcommandGroupLinkInvalid', command, group, null);
		_classPrivateFieldSet2(_subcommandGroupMapping, this, method);
		return this;
	}
	/**
	 * Sets the subcommand mapping.
	 *
	 * @param command - The command instance.
	 * @param group - The subcommand group option.
	 * @param subcommand - The subcommand option.
	 * @param method - The method name.
	 * @returns The current instance.
	 * @throws ChatInputRouterError - If the method is not a function on the command instance.
	 */
	setSubcommandMapping(command, group, subcommand, method) {
		if (!isFunction(Reflect.get(command, method))) throw new ChatInputRouterError('SubcommandLinkInvalid', command, group, subcommand);
		_classPrivateFieldGet2(_subcommandMapping, this).set(subcommand.name, method);
		return this;
	}
};
var _command = /* @__PURE__ */ new WeakMap();
var _chatInputName = /* @__PURE__ */ new WeakMap();
var _chatInputRouter = /* @__PURE__ */ new WeakMap();
var _messageContextMenuRouter = /* @__PURE__ */ new WeakMap();
var _userContextMenuRouter = /* @__PURE__ */ new WeakMap();
var _CommandRouter_brand = /* @__PURE__ */ new WeakSet();
/**
 * Represents a command router that handles routing of interactions for a specific command.
 *
 * @since 2.0.0
 * @template Options - The options type for the command.
 */
var CommandRouter = class {
	constructor(command) {
		_classPrivateMethodInitSpec(this, _CommandRouter_brand);
		_classPrivateFieldInitSpec(this, _command, void 0);
		_classPrivateFieldInitSpec(this, _chatInputName, null);
		_classPrivateFieldInitSpec(this, _chatInputRouter, new Collection());
		_classPrivateFieldInitSpec(this, _messageContextMenuRouter, new Collection());
		_classPrivateFieldInitSpec(this, _userContextMenuRouter, new Collection());
		_classPrivateFieldSet2(_command, this, command);
		const entry = container.applicationCommandRegistry.get(command.constructor);
		if (entry === null) container.logger.warn(`CommandRouter: No entry found for command '${command.name}'`);
		else {
			_assertClassBrand(_CommandRouter_brand, this, _populateChatInputRouter).call(this, entry.chatInput);
			_assertClassBrand(_CommandRouter_brand, this, _populateContextMenuRouter).call(this, entry.contextMenu);
		}
	}
	/**
	 * The name of the registered chat input command for this command, if any.
	 *
	 * @since 2.0.0
	 */
	get chatInputName() {
		return _classPrivateFieldGet2(_chatInputName, this);
	}
	/**
	 * The names of the registered context menu commands for this command, if any.
	 *
	 * @since 2.0.0
	 */
	get contextMenuNames() {
		return [..._classPrivateFieldGet2(_messageContextMenuRouter, this).keys(), ..._classPrivateFieldGet2(_userContextMenuRouter, this).keys()];
	}
	/**
	 * Routes a chat input interaction based on the provided data.
	 *
	 * @since 2.0.0
	 * @param data - The data of the chat input interaction.
	 * @returns The mapped command name or `null` if no mapping is found.
	 */
	routeChatInputInteraction(data) {
		if (!data.options?.length) return 'chatInputRun';
		const [firstOption] = data.options;
		if (firstOption.type === ApplicationCommandOptionType.Subcommand) {
			const entry = _classPrivateFieldGet2(_chatInputRouter, this).get(firstOption.name);
			return entry?.isSubcommand() ? entry.getSubcommandMapping() : null;
		}
		if (firstOption.type === ApplicationCommandOptionType.SubcommandGroup) {
			const entry = _classPrivateFieldGet2(_chatInputRouter, this).get(firstOption.name);
			return entry?.isSubcommandGroup() ? (entry.getSubcommandMapping(firstOption.options[0].name) ?? entry.getSubcommandGroupMapping()) : null;
		}
		return 'chatInputRun';
	}
	/**
	 * Routes a context menu interaction based on the provided data.
	 *
	 * @since 2.0.0
	 * @param data - The data for the context menu interaction.
	 * @returns The result of the context menu interaction, or null if no result is found.
	 */
	routeContextMenuInteraction(data) {
		return _assertClassBrand(_CommandRouter_brand, this, _getContextMenuCollection).call(this, data.type)?.get(data.name) ?? null;
	}
};
function _populateChatInputRouter(entry) {
	if (entry === null) return;
	const data = entry.toJSON();
	_classPrivateFieldSet2(_chatInputName, this, data.name);
	if (!data.options?.length) return;
	const command = _classPrivateFieldGet2(_command, this);
	const chatInputRouter = _classPrivateFieldGet2(_chatInputRouter, this);
	for (const option of data.options)
		if (option.type === ApplicationCommandOptionType.SubcommandGroup) {
			const entry = chatInputRouter.ensure(option.name, () => new CommandRouterSubcommandGroup()).assertSubcommandGroup();
			const subcommandGroupMethod = getLinkedMethod(option);
			if (subcommandGroupMethod) entry.setSubcommandGroupMapping(command, option, subcommandGroupMethod);
			for (const subOption of option.options ?? []) {
				const subcommandMethod = getLinkedMethod(subOption);
				if (subcommandMethod) entry.setSubcommandMapping(command, option, subOption, subcommandMethod);
			}
		} else if (option.type === ApplicationCommandOptionType.Subcommand) {
			const entry = chatInputRouter.ensure(option.name, () => new CommandRouterSubcommand()).assertSubcommand();
			const subcommandMethod = getLinkedMethod(option);
			if (subcommandMethod) entry.setSubcommandMapping(command, option, subcommandMethod);
		}
}
function _populateContextMenuRouter(entries) {
	const command = _classPrivateFieldGet2(_command, this);
	for (const entry of entries) {
		const data = entry.toJSON();
		const method = getLinkedMethod(data);
		if (!method) continue;
		if (isFunction(Reflect.get(command, method)))
			_assertClassBrand(_CommandRouter_brand, this, _getContextMenuCollection).call(this, data.type)?.set(data.name, method);
		else throw new Error(`Context menu command named "${data.name}" is not linked to a method`);
	}
}
function _getContextMenuCollection(type) {
	switch (type) {
		case ApplicationCommandType.Message:
			return _classPrivateFieldGet2(_messageContextMenuRouter, this);
		case ApplicationCommandType.User:
			return _classPrivateFieldGet2(_userContextMenuRouter, this);
		default:
			return null;
	}
}
var Command = class extends Piece {
	constructor(context, options = {}) {
		super(context, options);
		_defineProperty(this, 'router', void 0);
		this.registerApplicationCommands?.(new CommandRegistry(this.constructor));
		this.router = new CommandRouter(this);
	}
	/**
	 * Gets the registry for this command.
	 *
	 * @returns The registry for this command, or `null` if it is not registered.
	 */
	get registry() {
		return this.container.applicationCommandRegistry.get(this.constructor) ?? null;
	}
	chatInputRun() {
		throw new Error(`The method 'chatInputRun' has not been implemented in ${this.name}.`);
	}
	autocompleteRun() {
		throw new Error(`The method 'autocompleteRun' has not been implemented in ${this.name}.`);
	}
};
/**
 * Represents a strategy for loading and unloading commands.
 *
 * @since 2.0.0
 */
var CommandLoaderStrategy = class extends LoaderStrategy {
	/**
	 * Called when a command is loaded.
	 *
	 * @since 2.0.0
	 * @param store - The command store.
	 * @param piece - The command being loaded.
	 * @returns The loaded command.
	 */
	onLoad(store, piece) {
		if (piece.router.chatInputName) store.router.addChatInputMapping(piece.router.chatInputName, piece);
		for (const name of piece.router.contextMenuNames) store.router.addContextMenuMapping(name, piece);
		return piece;
	}
	/**
	 * Called when a command is unloaded.
	 *
	 * @remarks This also drops the command's {@link ApplicationCommandRegistryEntry} from the
	 * {@link ApplicationCommandRegistry}. The registry is keyed by command class, and reloading a command evaluates its
	 * module again, producing a brand new class: without this, the entry of the previous class would linger and the
	 * command would be pushed to Discord twice.
	 * @since 2.0.0
	 * @param store - The command store.
	 * @param piece - The command being unloaded.
	 * @returns The unloaded command.
	 */
	onUnload(store, piece) {
		if (piece.router.chatInputName) store.router.removeChatInputMapping(piece.router.chatInputName);
		for (const name of piece.router.contextMenuNames) store.router.removeContextMenuMapping(name);
		container.applicationCommandRegistry.delete(piece.constructor);
		return piece;
	}
};
var _chatInputMappings = /* @__PURE__ */ new WeakMap();
var _contextMenuMappings = /* @__PURE__ */ new WeakMap();
/**
 * Represents a router for mapping commands to chat inputs and context menus.
 *
 * @since 2.0.0
 */
var CommandStoreRouter = class {
	constructor() {
		_classPrivateFieldInitSpec(this, _chatInputMappings, new Collection());
		_classPrivateFieldInitSpec(this, _contextMenuMappings, new Collection());
	}
	/**
	 * Gets the command associated with the given interaction.
	 *
	 * @since 2.0.0
	 * @param interaction - The interaction object.
	 * @returns The command associated with the interaction, or null if not found.
	 */
	get(interaction) {
		return interaction.data.type === ApplicationCommandType.ChatInput
			? this.getChatInput(interaction.data.name)
			: this.getContextMenu(interaction.data.name);
	}
	/**
	 * Gets the chat input command with the specified name.
	 *
	 * @since 2.0.0
	 * @param name - The name of the chat input command.
	 * @returns The chat input command with the specified name, or null if not found.
	 */
	getChatInput(name) {
		return _classPrivateFieldGet2(_chatInputMappings, this).get(name) ?? null;
	}
	/**
	 * Gets the context menu command with the specified name.
	 *
	 * @since 2.0.0
	 * @param name - The name of the context menu command.
	 * @returns The context menu command with the specified name, or null if not found.
	 */
	getContextMenu(name) {
		return _classPrivateFieldGet2(_contextMenuMappings, this).get(name) ?? null;
	}
	/**
	 * Adds a chat input mapping.
	 *
	 * @since 2.0.0
	 * @param name - The name of the mapping.
	 * @param command - The command to be mapped.
	 * @internal
	 */
	addChatInputMapping(name, command) {
		_classPrivateFieldGet2(_chatInputMappings, this).set(name, command);
	}
	/**
	 * Adds a context menu mapping.
	 *
	 * @since 2.0.0
	 * @param name - The name of the mapping.
	 * @param command - The command to be mapped.
	 * @internal
	 */
	addContextMenuMapping(name, command) {
		_classPrivateFieldGet2(_contextMenuMappings, this).set(name, command);
	}
	/**
	 * Removes a chat input mapping.
	 *
	 * @since 2.0.0
	 * @param name - The name of the mapping to be removed.
	 * @returns True if the mapping was successfully removed, false otherwise.
	 * @internal
	 */
	removeChatInputMapping(name) {
		return _classPrivateFieldGet2(_chatInputMappings, this).delete(name);
	}
	/**
	 * Removes a context menu mapping.
	 *
	 * @since 2.0.0
	 * @param name - The name of the mapping to be removed.
	 * @returns True if the mapping was successfully removed, false otherwise.
	 * @internal
	 */
	removeContextMenuMapping(name) {
		return _classPrivateFieldGet2(_contextMenuMappings, this).delete(name);
	}
};
var _CommandStore_brand = /* @__PURE__ */ new WeakSet();
var CommandStore = class extends Store {
	constructor() {
		super(Command, {
			name: 'commands',
			strategy: new CommandLoaderStrategy()
		});
		_classPrivateMethodInitSpec(this, _CommandStore_brand);
		_defineProperty(this, 'router', new CommandStoreRouter());
	}
	/**
	 * Runs an application command.
	 *
	 * @since 1.0.0
	 * @param response - The server response object.
	 * @param interaction - The API application command interaction object.
	 * @returns A promise that resolves to the server response.
	 */
	async runApplicationCommand(response, interaction) {
		const command = this.router.get(interaction);
		if (!command) {
			container.client.emit('commandNameUnknown', interaction, response);
			response.statusCode = 501;
			return response.end(ErrorMessages.UnknownCommandName);
		}
		const context = {
			command,
			interaction,
			response
		};
		const method = _assertClassBrand(_CommandStore_brand, this, _routeCommandMethodName).call(this, command, interaction.data);
		if (!method) {
			container.client.emit('commandMethodUnknown', context);
			response.statusCode = 501;
			return response.end(ErrorMessages.UnknownCommandHandler);
		}
		container.client.emit('commandRun', context);
		(
			await Result.fromAsync(() =>
				_assertClassBrand(_CommandStore_brand, this, _runCommandMethod).call(this, command, method, makeInteraction(response, interaction))
			)
		)
			.inspect((value) => container.client.emit('commandSuccess', context, value))
			.inspectErr((error) => (container.client.emit('commandError', error, context), handleError(response, error)));
		container.client.emit('commandFinish', context);
		return response;
	}
	/**
	 * Runs the application command autocomplete.
	 *
	 * @since 1.0.0
	 * @param response - The server response object.
	 * @param interaction - The API application command autocomplete interaction object.
	 * @returns A promise that resolves to the server response.
	 */
	async runApplicationCommandAutocomplete(response, interaction) {
		if (!interaction.data?.name) {
			container.client.emit('commandNameMissing', interaction, response);
			response.statusCode = 400;
			return response.end(ErrorMessages.MissingCommandName);
		}
		const command = this.router.getChatInput(interaction.data.name);
		if (!command) {
			container.client.emit('commandNameUnknown', interaction, response);
			response.statusCode = 501;
			return response.end(ErrorMessages.UnknownCommandName);
		}
		const context = {
			command,
			interaction,
			response
		};
		const options = transformAutocompleteInteraction(interaction.data.resolved ?? {}, interaction.data.options);
		container.client.emit('autocompleteRun', context);
		(await Result.fromAsync(() => command.autocompleteRun(makeInteraction(response, interaction), options)))
			.inspect((value) => container.client.emit('autocompleteSuccess', context, value))
			.inspectErr((error) => (container.client.emit('autocompleteError', error, context), handleError(response, error)));
		container.client.emit('autocompleteFinish', context);
		return response;
	}
};
/**
 * Executes a command method on a command object.
 *
 * @since 1.0.0
 * @param command - The command object.
 * @param method - The name of the method to execute.
 * @param interaction - The application command interaction.
 * @returns A promise that resolves to the result of the method execution.
 */
function _runCommandMethod(command, method, interaction) {
	return Reflect.apply(Reflect.get(command, method), command, [
		interaction,
		_assertClassBrand(_CommandStore_brand, this, _createArguments).call(this, interaction.data)
	]);
}
/**
 * Determines the method name to route a command based on the type of interaction data.
 *
 * @since 1.0.0
 * @param command - The command object.
 * @param data - The interaction data.
 * @returns The method name to route the command, or null if no method is found.
 * @throws Error - If the interaction data type is not recognized.
 */
function _routeCommandMethodName(command, data) {
	switch (data.type) {
		case ApplicationCommandType.ChatInput:
			return command.router.routeChatInputInteraction(data);
		case ApplicationCommandType.User:
		case ApplicationCommandType.Message:
			return command.router.routeContextMenuInteraction(data);
		default:
			throw new Error('Unreachable');
	}
}
/**
 * Creates arguments based on the provided {@linkcode APIApplicationCommandInteractionData}.
 *
 * @since 1.0.0
 * @param data The {@linkcode APIApplicationCommandInteractionData} object.
 * @returns The transformed arguments based on the interaction data.
 * @throws Error - If the {@linkcode ApplicationCommandType} is unsupported.
 */
function _createArguments(data) {
	switch (data.type) {
		case ApplicationCommandType.ChatInput:
			return transformInteraction(data.resolved ?? {}, data.options ?? []);
		case ApplicationCommandType.User:
			return transformUserInteraction(data);
		case ApplicationCommandType.Message:
			return transformMessageInteraction(data);
		default:
			throw new Error('Unknown ApplicationCommandType');
	}
}
var InteractionHandler = class extends Piece {
	constructor(context, options = {}) {
		super(context, options);
	}
};
var InteractionHandlerStore = class extends Store {
	constructor() {
		super(InteractionHandler, { name: 'interaction-handlers' });
	}
	async runHandler(response, interaction) {
		const parsed = container.idParser.run(interaction.data.custom_id);
		if (parsed === null) {
			container.client.emit('interactionHandlerNameInvalid', interaction, response);
			response.statusCode = 400;
			return response.end(ErrorMessages.InvalidCustomId);
		}
		const handler = this.get(parsed.name);
		if (!handler) {
			container.client.emit('interactionHandlerNameUnknown', interaction, response);
			response.statusCode = 501;
			return response.end(ErrorMessages.UnknownHandlerName);
		}
		const context = {
			handler,
			interaction,
			response
		};
		container.client.emit('interactionHandlerRun', context);
		(await Result.fromAsync(() => handler.run(makeInteraction(response, interaction), parsed.content)))
			.inspect((value) => container.client.emit('interactionHandlerSuccess', context, value))
			.inspectErr((error) => (container.client.emit('interactionHandlerError', error, context), handleError(response, error)));
		container.client.emit('interactionHandlerFinish', context);
		return response;
	}
};
var Listener = class extends Piece {
	constructor(context, options) {
		super(context, options);
		_defineProperty(this, 'emitter', void 0);
		_defineProperty(this, 'event', void 0);
		_defineProperty(this, '_listener', void 0);
		this.emitter = typeof options.emitter === 'string' ? this.container[options.emitter] : (options.emitter ?? this.container.client);
		this.event = options.event ?? this.name;
		this._listener = this.run.bind(this);
	}
};
/**
 * Represents a strategy for loading and unloading listeners.
 *
 * @since 2.1.0
 */
var ListenerLoaderStrategy = class extends LoaderStrategy {
	/**
	 * Called when a listener is loaded.
	 *
	 * @since 2.1.0
	 * @param store - The listener store.
	 * @param piece - The listener being loaded.
	 * @returns The loaded listener.
	 */
	onLoad(_store, piece) {
		const emitter = piece.emitter;
		const maxListeners = emitter.getMaxListeners();
		if (maxListeners !== 0) emitter.setMaxListeners(maxListeners + 1);
		emitter.on(piece.event, piece['_listener']);
	}
	/**
	 * Called when a listener is unloaded.
	 *
	 * @since 2.1.0
	 * @param store - The listener store.
	 * @param piece - The listener being unloaded.
	 * @returns The unloaded listener.
	 */
	onUnload(_store, piece) {
		const emitter = piece.emitter;
		const maxListeners = emitter.getMaxListeners();
		if (maxListeners !== 0) emitter.setMaxListeners(maxListeners - 1);
		emitter.off(piece.event, piece['_listener']);
	}
};
var ListenerStore = class extends Store {
	constructor() {
		super(Listener, {
			name: 'listeners',
			strategy: new ListenerLoaderStrategy()
		});
	}
};
function toIncomingMessage(request) {
	const headers = {};
	request.headers.forEach((value, name) => {
		headers[name] = value;
	});
	const body = request.body ? Readable.fromWeb(request.body) : Readable.from([]);
	return Object.assign(body, {
		url: new URL(request.url).pathname,
		method: request.method,
		headers
	});
}
var _headers = /* @__PURE__ */ new WeakMap();
var _body = /* @__PURE__ */ new WeakMap();
/**
 * The minimum of `http.ServerResponse` `Client`'s dispatch touches: `setHeader`, `statusCode`, `end`,
 * `writableEnded`, and a `'close'` event once the response is done (`BaseInteraction`'s `_sendReply` awaits it
 * before resolving, so a caller here has to fire it too, or every reply would hang forever).
 */
var FetchServerResponse = class extends EventEmitter {
	constructor(..._args) {
		super(..._args);
		_defineProperty(this, 'statusCode', 200);
		_defineProperty(this, 'writableEnded', false);
		_defineProperty(this, 'closed', false);
		_classPrivateFieldInitSpec(this, _headers, new Headers());
		_classPrivateFieldInitSpec(this, _body, void 0);
	}
	setHeader(name, value) {
		_classPrivateFieldGet2(_headers, this).set(name, value);
	}
	end(chunk) {
		_classPrivateFieldSet2(_body, this, chunk);
		this.writableEnded = true;
		this.closed = true;
		queueMicrotask(() => this.emit('close'));
		return this;
	}
	toResponse() {
		return new Response(_classPrivateFieldGet2(_body, this) ?? null, {
			status: this.statusCode,
			headers: _classPrivateFieldGet2(_headers, this)
		});
	}
};
/**
 * The default {@link ILogger} implementation, writing every entry to the matching `console` method.
 *
 * It is intentionally minimal: it only filters by {@link Logger.level} and forwards the values as-is, leaving
 * timestamps, colours, and transports to a logger plugin that replaces `container.logger` through
 * {@link ClientLoggerOptions.instance}.
 *
 * @since 3.4.0
 */
var Logger = class Logger {
	/**
	 * @param level The lowest level the logger writes.
	 */
	constructor(level = 30) {
		_defineProperty(this, 'level', void 0);
		this.level = level;
	}
	has(level) {
		return level >= this.level;
	}
	trace(...values) {
		this.write(10, ...values);
	}
	debug(...values) {
		this.write(20, ...values);
	}
	info(...values) {
		this.write(30, ...values);
	}
	warn(...values) {
		this.write(40, ...values);
	}
	error(...values) {
		this.write(50, ...values);
	}
	fatal(...values) {
		this.write(60, ...values);
	}
	write(level, ...values) {
		if (!this.has(level)) return;
		const method = Logger.levels.get(level);
		if (method) console[method](...values);
	}
};
_defineProperty(
	Logger,
	'levels',
	/* @__PURE__ */ new Map([
		[10, 'trace'],
		[20, 'debug'],
		[30, 'info'],
		[40, 'warn'],
		[50, 'error'],
		[60, 'error']
	])
);
var AlgorithmName = 'Ed25519';
function headerToString(header) {
	return typeof header === 'string' ? header : header[0];
}
function makeKey(key) {
	return webcrypto.subtle.importKey('raw', Buffer.from(key, 'hex'), { name: AlgorithmName }, true, ['verify']);
}
/**
 * Validates a payload from Discord against its signature and key.
 * @param body The request body.
 * @param signature The value of the `x-signature-ed25519` header.
 * @param signature The value of the `x-signature-timestamp` header.
 * @param key The public key from the Discord developer dashboard, generated by {@link makeKey}
 */
async function verifyBody(body, signature, timestamp, key) {
	const signatureData = Buffer.from(headerToString(signature), 'hex');
	const data = Buffer.isBuffer(body)
		? Buffer.concat([Buffer.from(headerToString(timestamp)), body])
		: Buffer.from(`${headerToString(timestamp)}${body}`);
	return webcrypto.subtle.verify(AlgorithmName, key, signatureData, Buffer.from(data));
}
/**
 * Safely reads the {@link IncomingMessage incoming message}'s body as a string.
 * @param request The incoming message to get the data from.
 * @returns The string, if it's within the body size limit.
 */
async function getSafeTextBody(request) {
	let limit = container.client.bodySizeLimit;
	if (!isNullOrUndefinedOrEmpty(request.headers['content-length'])) {
		const parsed = Number(request.headers['content-length']);
		if (!Number.isSafeInteger(parsed)) return err(ErrorMessages.InvalidContentLengthInteger);
		if (parsed <= 0) return err(ErrorMessages.InvalidContentLengthNegative);
		if (parsed > limit) return err(ErrorMessages.InvalidContentLengthTooBig);
		limit = parsed;
	}
	const decoder = new TextDecoder();
	let output = '';
	for await (const chunk of request) {
		const part = typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
		if (part.length + output.length > limit) return err(ErrorMessages.InvalidBodySize);
		output += part;
	}
	const part = decoder.decode(void 0, { stream: false });
	if (part.length + output.length > limit) return err(ErrorMessages.InvalidBodySize);
	output += part;
	return ok(output);
}
container.stores.register(new CommandStore());
container.stores.register(new InteractionHandlerStore());
container.stores.register(new ListenerStore());
container.logger ??= new Logger();
var _discordPublicKey = /* @__PURE__ */ new WeakMap();
var _fetchKey = /* @__PURE__ */ new WeakMap();
var Client = class Client extends AsyncEventEmitter {
	constructor(options = {}) {
		super();
		_defineProperty(this, 'server', void 0);
		_defineProperty(this, 'hmr', null);
		_defineProperty(this, 'logger', void 0);
		_defineProperty(this, 'id', void 0);
		_defineProperty(this, 'options', void 0);
		_defineProperty(this, 'bodySizeLimit', void 0);
		_defineProperty(this, 'httpReplyOnError', void 0);
		_classPrivateFieldInitSpec(this, _discordPublicKey, void 0);
		_classPrivateFieldInitSpec(this, _fetchKey, null);
		this.options = {
			...options,
			discordToken: void 0,
			discordPublicKey: void 0
		};
		for (const plugin of Client.plugins.values('preGenericsInitialization')) {
			plugin.hook.call(this, this.options);
			this.emit('pluginLoaded', plugin.type, plugin.name);
		}
		this.logger = this.options.logger?.instance ?? new Logger(this.options.logger?.level ?? 30);
		container.logger = this.logger;
		for (const plugin of Client.plugins.values('preInitialization')) {
			plugin.hook.call(this, this.options);
			this.emit('pluginLoaded', plugin.type, plugin.name);
		}
		this.bodySizeLimit = options.bodySizeLimit ?? 1048576;
		this.httpReplyOnError = options.httpReplyOnError ?? true;
		const discordPublicKey = options.discordPublicKey ?? process.env.DISCORD_PUBLIC_KEY;
		if (!discordPublicKey) throw new Error('The discordPublicKey cannot be empty');
		_classPrivateFieldSet2(_discordPublicKey, this, discordPublicKey);
		container.rest = new REST(options.restOptions);
		const token = options.discordToken ?? process.env.DISCORD_TOKEN;
		if (!token) throw new Error('The discordToken cannot be empty');
		this.id = options.clientId ?? process.env.DISCORD_CLIENT_ID ?? Buffer.from(token.split('.')[0], 'base64').toString();
		container.client = this;
		container.rest.setToken(token);
		container.idParser ??= new StringIdParser();
		container.applicationCommandRegistry.setup({
			clientId: this.id,
			rest: container.rest,
			authPrefix: options.authPrefix
		});
		for (const plugin of Client.plugins.values('postInitialization')) {
			plugin.hook.call(this, this.options);
			this.emit('pluginLoaded', plugin.type, plugin.name);
		}
	}
	/**
	 * Registers a plugin onto the {@link Client}, applying all of its hooks.
	 *
	 * @since 2.4.0
	 * @param plugin The plugin to register.
	 */
	static use(plugin) {
		this.plugins.use(plugin);
		return this;
	}
	/**
	 * Gets the application command registry.
	 *
	 * @since 2.0.0
	 * @returns The application command registry.
	 */
	get registry() {
		return container.applicationCommandRegistry;
	}
	/**
	 * Loads all the commands.
	 * @param options The load options.
	 */
	async load(options = {}) {
		for (const plugin of Client.plugins.values('preLoad')) {
			await plugin.hook.call(this, this.options);
			this.emit('pluginLoaded', plugin.type, plugin.name);
		}
		if (options.baseUserDirectory !== null) container.stores.registerPath(options.baseUserDirectory);
		await container.stores.load();
		if (this.options.hmr && (this.options.hmr.enabled ?? true)) {
			this.hmr = new HotModuleReloader(this.options.hmr);
			await this.hmr.start();
		}
	}
	/**
	 * Starts the HTTP server, listening for HTTP interactions.
	 * @param options The listen options.
	 */
	async listen({ serverOptions, postPath, port, address, ...listenOptions }) {
		const key = await makeKey(_classPrivateFieldGet2(_discordPublicKey, this));
		const path = postPath ?? process.env.HTTP_POST_PATH ?? '/';
		this.server = createServer(serverOptions ?? {});
		this.server.on('request', (request, response) => void this.handleRawHttpMessage(request, response, path, key));
		await new Promise((resolve) =>
			this.server.listen(
				{
					...listenOptions,
					port,
					host: address
				},
				resolve
			)
		);
		try {
			for (const plugin of Client.plugins.values('postListen')) {
				await plugin.hook.call(this, this.options);
				this.emit('pluginLoaded', plugin.type, plugin.name);
			}
		} catch (error) {
			await new Promise((resolve) => this.server.close(() => resolve()));
			throw error;
		}
	}
	/**
	 * Handles a single Web `Request`/`Response` interaction — the exact same signature verification, routing and
	 * replies `listen()`'s `node:http` server runs, `handleRawHttpMessage` called exactly the way it calls it on
	 * every request — without binding a port. This is `node:http`'s replacement whenever something else (Nitro, a
	 * Worker, `Bun.serve`) owns the actual listener instead of `Client`: build a `Request` from whatever that
	 * transport gives you and hand it here.
	 *
	 * The Discord public key given at construction is imported once and reused across every call, the same lifetime
	 * `listen()` gives its own signing key.
	 * @param request The interaction request.
	 * @param options The fetch options.
	 */
	async fetch(request, options = {}) {
		_classPrivateFieldGet2(_fetchKey, this) ?? _classPrivateFieldSet2(_fetchKey, this, makeKey(_classPrivateFieldGet2(_discordPublicKey, this)));
		const key = await _classPrivateFieldGet2(_fetchKey, this);
		const path = options.postPath ?? process.env.HTTP_POST_PATH ?? '/';
		const incoming = toIncomingMessage(request);
		const outgoing = new FetchServerResponse();
		await this.handleRawHttpMessage(incoming, outgoing, path, key);
		return outgoing.toResponse();
	}
	async handleRawHttpMessage(request, response, path, key) {
		response.setHeader('Content-Type', 'application/json');
		if (request.url !== path) {
			response.statusCode = 404;
			return response.end(ErrorMessages.NotFound);
		}
		if (request.method !== 'POST') {
			response.statusCode = 405;
			return response.end(ErrorMessages.UnsupportedHttpMethod);
		}
		const signature = request.headers['x-signature-ed25519'];
		const timestamp = request.headers['x-signature-timestamp'];
		if (isNullOrUndefinedOrEmpty(signature) || isNullOrUndefinedOrEmpty(timestamp)) {
			response.statusCode = 401;
			return response.end(ErrorMessages.MissingSignatureInformation);
		}
		const result = await getSafeTextBody(request);
		if (result.isErr()) {
			response.statusCode = 400;
			return response.end(result.unwrapErr());
		}
		const body = result.unwrap();
		if (!(await verifyBody(body, signature, timestamp, key))) {
			response.statusCode = 401;
			return response.end(ErrorMessages.InvalidSignature);
		}
		return this.handleHttpMessage(JSON.parse(body), response);
	}
	async handleHttpMessage(interaction, response) {
		if (interaction.type === InteractionType.Ping) {
			response.statusCode = 200;
			return response.end(Payloads.Pong);
		}
		switch (interaction.type) {
			case InteractionType.ApplicationCommand:
				return container.stores.get('commands').runApplicationCommand(response, interaction);
			case InteractionType.ApplicationCommandAutocomplete:
				return container.stores.get('commands').runApplicationCommandAutocomplete(response, interaction);
			case InteractionType.MessageComponent:
			case InteractionType.ModalSubmit:
				return container.stores.get('interaction-handlers').runHandler(response, interaction);
			default:
				response.statusCode = 501;
				return response.end(ErrorMessages.UnknownInteractionType);
		}
	}
};
_defineProperty(Client, 'plugins', new PluginManager());
/**
 * The base class for all plugins. Plugins hook into the {@link Client}'s lifecycle by defining static
 * methods keyed by the plugin symbols. Use {@link PluginManager.use} (via `Client.use`) to register a plugin.
 *
 * @since 2.4.0
 */
var Plugin = class {};
_defineProperty(Plugin, preGenericsInitialization, void 0);
_defineProperty(Plugin, preInitialization, void 0);
_defineProperty(Plugin, postInitialization, void 0);
_defineProperty(Plugin, preLoad, void 0);
_defineProperty(Plugin, postListen, void 0);
//#endregion
//#region src/commands/ping.ts
/**
 * Registered through `registerApplicationCommands` rather than `@RegisterCommand`: the bundler compiles this file
 * without the legacy decorator transform `tsdown` applies.
 */
var PingCommand = class extends Command {
	registerApplicationCommands(registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('ping')
				.setDescription('Run a network connection test with me')
				.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
				.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
		);
	}
	chatInputRun(interaction) {
		return interaction.reply({
			content: 'Pong! Served by Nitro.',
			flags: MessageFlags.Ephemeral
		});
	}
};
//#endregion
//#region src/main.ts
var client = new Client();
await container.stores.loadPiece({
	name: 'ping',
	piece: PingCommand,
	store: 'commands'
});
await client.load({ baseUserDirectory: null });
var guildId = process.env.REGISTRY_GUILD_ID;
guildId ? container.applicationCommandRegistry.pushAllCommandsInGuild(guildId) : container.applicationCommandRegistry.pushGlobalCommands();
//#endregion
//#region #stars/nitro-entry
if (typeof client?.fetch !== 'function') throw new TypeError('The Stars Nitro entry must default-export an object with fetch(request).');
var nitro_entry_default = { fetch: (request) => client.fetch(request) };
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {};
//#endregion
//#region #nitro/virtual/public-assets-node
function readAsset(id) {
	const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
	return promises.readFile(resolve(serverDir, public_assets_data_default[id].path));
}
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = '') {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
function getAsset(id) {
	return public_assets_data_default[id];
}
//#endregion
//#region ../../node_modules/.pnpm/nitro@3.0.260903-beta/node_modules/nitro/dist/runtime/internal/static.mjs
var METHODS = /* @__PURE__ */ new Set(['HEAD', 'GET']);
var EncodingMap = {
	gzip: '.gz',
	br: '.br',
	zstd: '.zst'
};
var static_default = defineHandler((event) => {
	if (event.req.method && !METHODS.has(event.req.method)) return;
	let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
	let asset;
	const encodings = [
		...(event.req.headers.get('accept-encoding') || '')
			.split(',')
			.map((e) => EncodingMap[e.trim()])
			.filter(Boolean)
			.sort(),
		''
	];
	for (const encoding of encodings)
		for (const _id of [id + encoding, joinURL(id, 'index.html' + encoding)]) {
			const _asset = getAsset(_id);
			if (_asset) {
				asset = _asset;
				id = _id;
				break;
			}
		}
	if (!asset) {
		if (isPublicAssetURL(id)) {
			event.res.headers.delete('Cache-Control');
			throw new HTTPError({ status: 404 });
		}
		return;
	}
	if (encodings.length > 1) event.res.headers.append('Vary', 'Accept-Encoding');
	if (event.req.headers.get('if-none-match') === asset.etag) {
		event.res.status = 304;
		event.res.statusText = 'Not Modified';
		return '';
	}
	const ifModifiedSinceH = event.req.headers.get('if-modified-since');
	const mtimeDate = new Date(asset.mtime);
	if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
		event.res.status = 304;
		event.res.statusText = 'Not Modified';
		return '';
	}
	if (asset.type) event.res.headers.set('Content-Type', asset.type);
	if (asset.etag && !event.res.headers.has('ETag')) event.res.headers.set('ETag', asset.etag);
	if (asset.mtime && !event.res.headers.has('Last-Modified')) event.res.headers.set('Last-Modified', mtimeDate.toUTCString());
	if (asset.encoding && !event.res.headers.has('Content-Encoding')) event.res.headers.set('Content-Encoding', asset.encoding);
	if (asset.size > 0 && !event.res.headers.has('Content-Length')) event.res.headers.set('Content-Length', asset.size.toString());
	return readAsset(id);
});
//#endregion
//#region #nitro/virtual/routing
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: '/**',
		handler: toEventHandler(nitro_entry_default)
	};
	return (_m, p) => {
		return {
			data,
			params: { _: p.slice(1) }
		};
	};
})();
var globalMiddleware = [toEventHandler(static_default)].filter(Boolean);
//#endregion
//#region #stars/nitro-error-handler
async function starsErrorHandler(error, event, { defaultHandler }) {
	const result = await defaultHandler(error, event, { json: true });
	const status = result.status ?? error.status ?? 500;
	const body =
		typeof result.body === 'string'
			? result.body
			: JSON.stringify(
					result.body ?? {
						message: error.message,
						status
					}
				);
	return new Response(body, {
		status,
		statusText: result.statusText,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			...result.headers
		}
	});
}
//#endregion
//#region ../../node_modules/.pnpm/nitro@3.0.260903-beta/node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new NodeResponse(typeof res.body === 'string' ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = '' } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = '/';
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL))
			return {
				status: 302,
				headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
			};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set('content-type', 'application/json; charset=utf-8');
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...(unhandled
				? {
						status,
						unhandled: true
					}
				: typeof error.toJSON === 'function'
					? error.toJSON()
					: {
							status,
							statusText,
							message: error.message
						})
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [starsErrorHandler, errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers)
		try {
			const response = await handler(error, event, { defaultHandler });
			if (response) return response;
		} catch (error) {
			console.error(error);
		}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors)
				errors.push({
					error,
					context: errorCtx
				});
		}
	};
	const h3App = createH3App({
		onError(error, event) {
			return error_handler_default(error, event);
		}
	});
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App['~findRoute'] = (event) => {
		return findRoute(event.req.method, event.url.pathname);
	};
	h3App['~middleware'].push(...globalMiddleware);
	return h3App;
}
//#endregion
//#region ../../node_modules/.pnpm/nitro@3.0.260903-beta/node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = 'default';
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function useNitroHooks() {
	const nitroApp = useNitroApp();
	const hooks = nitroApp.hooks;
	if (hooks) return hooks;
	return (nitroApp.hooks = new HookableCore());
}
//#endregion
//#region ../../node_modules/.pnpm/nitro@3.0.260903-beta/node_modules/nitro/dist/runtime/internal/error/hooks.mjs
function _captureError(error, type) {
	console.error(`[${type}]`, error);
	useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
	process.on('unhandledRejection', (error) => _captureError(error, 'unhandledRejection'));
	process.on('uncaughtException', (error) => _captureError(error, 'uncaughtException'));
}
//#endregion
//#region #nitro/virtual/tracing
var tracingSrvxPlugins = [];
//#endregion
//#region ../../node_modules/.pnpm/nitro@3.0.260903-beta/node_modules/nitro/dist/runtime/internal/shutdown.mjs
function setupCloseHooks(server) {
	const closeServer = server.close.bind(server);
	let closeHooks;
	server.close = (closeActiveConnections) => closeServer(closeActiveConnections).finally(() => (closeHooks ??= callCloseHooks()));
}
async function callCloseHooks() {
	try {
		await useNitroHooks().callHook('close');
	} catch (error) {
		console.error('[nitro] Error while calling `close` hooks:', error);
	}
}
//#endregion
//#region ../../node_modules/.pnpm/nitro@3.0.260903-beta/node_modules/nitro/dist/presets/node/runtime/node-server.mjs
var _parsedPort = Number.parseInt(process.env.NITRO_PORT ?? process.env.PORT ?? '');
var port = Number.isNaN(_parsedPort) ? 3e3 : _parsedPort;
var host = process.env.NITRO_HOST || process.env.HOST;
var cert = process.env.NITRO_SSL_CERT;
var key = process.env.NITRO_SSL_KEY;
var nitroApp = useNitroApp();
setupCloseHooks(
	serve({
		port,
		hostname: host,
		tls:
			cert && key
				? {
						cert,
						key
					}
				: void 0,
		fetch: nitroApp.fetch,
		plugins: [...tracingSrvxPlugins]
	})
);
trapUnhandledErrors();
var node_server_default = {};
//#endregion
export { node_server_default as default };
