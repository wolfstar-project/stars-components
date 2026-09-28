import { __require as __require$1 } from '../../_runtime.mjs';
import { Collection } from '../discordjs__collection.mjs';
import { existsSync, readFileSync } from 'fs';
import { basename, dirname, extname, join, relative, sep } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { opendir } from 'fs/promises';
//#region ../../node_modules/.pnpm/@sapphire+pieces@4.4.1/node_modules/@sapphire/pieces/dist/esm/chunk-KFLDEQ5J.mjs
var __defProp$2 = Object.defineProperty;
var __typeError = (msg) => {
	throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) =>
	key in obj
		? __defProp$2(obj, key, {
				enumerable: true,
				configurable: true,
				writable: true,
				value
			})
		: (obj[key] = value);
var __name$2 = (target, value) =>
	__defProp$2(target, 'name', {
		value,
		configurable: true
	});
var __require = /* @__PURE__ */ ((x) =>
	typeof __require$1 !== 'undefined'
		? __require$1
		: typeof Proxy !== 'undefined'
			? new Proxy(x, { get: (a, b) => (typeof __require$1 !== 'undefined' ? __require$1 : a)[b] })
			: x)(function (x) {
	if (typeof __require$1 !== 'undefined') return __require$1.apply(this, arguments);
	throw Error('Dynamic require of "' + x + '" is not supported');
});
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== 'symbol' ? key + '' : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError('Cannot ' + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, 'read from private field'), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) =>
	member.has(obj)
		? __typeError('Cannot add the same private member more than once')
		: member instanceof WeakSet
			? member.add(obj)
			: member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (
	__accessCheck(obj, member, 'write to private field'),
	setter ? setter.call(obj, value) : member.set(obj, value),
	value
);
//#endregion
//#region ../../node_modules/.pnpm/@sapphire+pieces@4.4.1/node_modules/@sapphire/pieces/dist/esm/lib/errors/LoaderError.mjs
var LoaderErrorType = /* @__PURE__ */ ((LoaderErrorType2) => {
	LoaderErrorType2['EmptyModule'] = 'EMPTY_MODULE';
	LoaderErrorType2['VirtualPiece'] = 'VIRTUAL_PIECE';
	LoaderErrorType2['UnloadedPiece'] = 'UNLOADED_PIECE';
	LoaderErrorType2['IncorrectType'] = 'INCORRECT_TYPE';
	LoaderErrorType2['UnknownStore'] = 'UNKNOWN_STORE';
	return LoaderErrorType2;
})(LoaderErrorType || {});
var _LoaderError = class _LoaderError extends Error {
	constructor(type, message) {
		super(message);
		/**
		 * The type of the error that was thrown.
		 */
		__publicField(this, 'type');
		this.type = type;
	}
	get name() {
		return `${super.name} [${this.type}]`;
	}
};
__name$2(_LoaderError, 'LoaderError');
var LoaderError = _LoaderError;
//#endregion
//#region ../../node_modules/.pnpm/@sapphire+pieces@4.4.1/node_modules/@sapphire/pieces/dist/esm/lib/errors/MissingExportsError.mjs
var _MissingExportsError = class _MissingExportsError extends LoaderError {
	constructor(path) {
		super(LoaderErrorType.EmptyModule, `A compatible class export was not found. [${path}]`);
		/**
		 * The path of the module that did not have exports.
		 */
		__publicField(this, 'path');
		this.path = path;
	}
};
__name$2(_MissingExportsError, 'MissingExportsError');
var MissingExportsError = _MissingExportsError;
//#endregion
//#region ../../node_modules/.pnpm/@sapphire+pieces@4.4.1/node_modules/@sapphire/pieces/dist/esm/lib/internal/RootScan.mjs
var data = null;
function dirnameWithPath(cwd, joinablePath) {
	return dirname(join(cwd, joinablePath));
}
__name$2(dirnameWithPath, 'dirnameWithPath');
function getRootData() {
	return (data ??= parseRootData());
}
__name$2(getRootData, 'getRootData');
function parseRootData() {
	const cwd = process.cwd();
	let file;
	try {
		file = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'));
	} catch (error) {
		const hasDenoConfigFile = existsSync(join(cwd, 'deno.json'));
		const hasBunConfigFile = existsSync(join(cwd, 'bunfig.toml'));
		return hasDenoConfigFile || hasBunConfigFile
			? {
					root: cwd,
					type: 'ESM'
				}
			: {
					root: cwd,
					type: 'CommonJS'
				};
	}
	const { main: packageMain, module: packageModule, type: packageType } = file;
	const lowerCasedType = packageType?.toLowerCase();
	if (lowerCasedType === 'commonjs') {
		if (packageMain)
			return {
				root: dirnameWithPath(cwd, packageMain),
				type: 'CommonJS'
			};
		if (packageModule)
			return {
				root: dirnameWithPath(cwd, packageModule),
				type: 'CommonJS'
			};
		return {
			root: cwd,
			type: 'CommonJS'
		};
	}
	if (lowerCasedType === 'module') {
		if (packageMain)
			return {
				root: dirnameWithPath(cwd, packageMain),
				type: 'ESM'
			};
		if (packageModule)
			return {
				root: dirnameWithPath(cwd, packageModule),
				type: 'ESM'
			};
		return {
			root: cwd,
			type: 'ESM'
		};
	}
	if (packageMain)
		return {
			root: dirnameWithPath(cwd, packageMain),
			type: 'CommonJS'
		};
	if (packageModule)
		return {
			root: dirnameWithPath(cwd, packageModule),
			type: 'ESM'
		};
	return {
		root: cwd,
		type: 'CommonJS'
	};
}
__name$2(parseRootData, 'parseRootData');
//#endregion
//#region ../../node_modules/.pnpm/@sapphire+pieces@4.4.1/node_modules/@sapphire/pieces/dist/esm/lib/internal/constants.mjs
var VirtualPath = '::virtual::';
var ManuallyRegisteredPiecesSymbol = Symbol('@sapphire/pieces:ManuallyRegisteredPieces');
//#endregion
//#region ../../node_modules/.pnpm/@sapphire+utilities@3.18.2/node_modules/@sapphire/utilities/dist/esm/chunk-PAWJFY3S.mjs
var __defProp$1 = Object.defineProperty;
var __name$1 = (target, value) =>
	__defProp$1(target, 'name', {
		value,
		configurable: true
	});
//#endregion
//#region ../../node_modules/.pnpm/@sapphire+utilities@3.18.2/node_modules/@sapphire/utilities/dist/esm/lib/classExtends.mjs
function classExtends$1(value, base) {
	let ctor = value;
	while (ctor !== null) {
		if (ctor === base) return true;
		ctor = Object.getPrototypeOf(ctor);
	}
	return false;
}
__name$1(classExtends$1, 'classExtends');
//#endregion
//#region ../../node_modules/.pnpm/@sapphire+utilities@3.18.2/node_modules/@sapphire/utilities/dist/esm/lib/isNullOrUndefined.mjs
function isNullOrUndefined(value) {
	return value === void 0 || value === null;
}
__name$1(isNullOrUndefined, 'isNullOrUndefined');
//#endregion
//#region ../../node_modules/.pnpm/@sapphire+utilities@3.18.2/node_modules/@sapphire/utilities/dist/esm/lib/isClass.mjs
function isClass$1(input) {
	return typeof input === 'function' && typeof input.prototype === 'object';
}
__name$1(isClass$1, 'isClass');
//#endregion
//#region ../../node_modules/.pnpm/@sapphire+pieces@4.4.1/node_modules/@sapphire/pieces/dist/esm/lib/internal/Path.mjs
function resolvePath(path) {
	if (typeof path === 'string') return path;
	return fileURLToPath(path);
}
__name$2(resolvePath, 'resolvePath');
//#endregion
//#region ../../node_modules/.pnpm/@sapphire+pieces@4.4.1/node_modules/@sapphire/pieces/dist/esm/lib/structures/StoreRegistry.mjs
var _pendingManuallyRegisteredPieces;
var _StoreRegistry = class _StoreRegistry extends Collection {
	constructor() {
		super(...arguments);
		/**
		 * The queue of pieces to load.
		 */
		__privateAdd(this, _pendingManuallyRegisteredPieces, new Collection());
	}
	/**
	 * Loads all the registered stores.
	 * @since 2.1.0
	 */
	async load() {
		const promises = [];
		for (const store of this.values()) promises.push(store.loadAll());
		await Promise.all(promises);
	}
	/**
	 * Registers all user directories from the process working directory, the default value is obtained by assuming
	 * CommonJS (high accuracy) but with fallback for ECMAScript Modules (reads package.json's `main` entry, fallbacks
	 * to `process.cwd()`).
	 *
	 * By default, if you have this folder structure:
	 * ```
	 * /home/me/my-bot
	 * ├─ src
	 * │  ├─ commands
	 * │  ├─ events
	 * │  └─ main.js
	 * └─ package.json
	 * ```
	 *
	 * And you run `node src/main.js`, the directories `/home/me/my-bot/src/commands` and `/home/me/my-bot/src/events` will
	 * be registered for the commands and events stores respectively, since both directories are located in the same
	 * directory as your main file.
	 *
	 * **Note**: this also registers directories for all other stores, even if they don't have a folder, this allows you
	 * to create new pieces and hot-load them later anytime.
	 * @since 2.1.0
	 * @param rootDirectory The root directory to register pieces at.
	 */
	registerPath(rootDirectory = getRootData().root) {
		const root = resolvePath(rootDirectory);
		for (const store of this.values()) store.registerPath(join(root, store.name));
	}
	/**
	 * Registers a store.
	 *
	 * @remarks
	 *
	 * - This method will allow {@linkcode StoreRegistry} to manage the store, meaning:
	 *   - {@linkcode StoreRegistry.registerPath()} will call the store's
	 *     {@linkcode Store.registerPath() registerPath()} method on call.
	 *   - {@linkcode StoreRegistry.load()} will call the store's {@linkcode Store.load() load()} method on call.
	 *   - {@linkcode StoreRegistry.loadPiece()} will call the store's {@linkcode Store.loadPiece() loadPiece()} method
	 *     on call.
	 * - This will also add all the manually registered pieces by {@linkcode StoreRegistry.loadPiece()} in the store.
	 *
	 * It is generally recommended to register a store as early as possible, before any of the aforementioned methods
	 * are called, otherwise you will have to manually call the aforementioned methods for the store to work properly.
	 *
	 * If there were manually registered pieces for this store with {@linkcode StoreRegistry.loadPiece()}, this method
	 * will add them to the store and delete the queue. Note, however, that this method will not call the store's
	 * {@linkcode Store.loadPiece() loadPiece()} method, and as such, the pieces will not be loaded until
	 * {@linkcode Store.loadAll()} is called.
	 *
	 * @since 2.1.0
	 * @param store The store to register.
	 */
	register(store) {
		this.set(store.name, store);
		const queue = __privateGet(this, _pendingManuallyRegisteredPieces).get(store.name);
		if (queue) {
			for (const entry of queue) store[ManuallyRegisteredPiecesSymbol].set(entry.name, entry);
			__privateGet(this, _pendingManuallyRegisteredPieces).delete(store.name);
		}
		return this;
	}
	/**
	 * Deregisters a store.
	 * @since 2.1.0
	 * @param store The store to deregister.
	 */
	deregister(store) {
		this.delete(store.name);
		return this;
	}
	/**
	 * If the store was {@link StoreRegistry.register registered}, this method will call the store's
	 * {@linkcode Store.loadPiece() loadPiece()} method.
	 *
	 * If it was called, the entry will be loaded immediately without queueing.
	 *
	 * @remarks
	 *
	 * - Pieces loaded this way will have their {@linkcode Piece.Context.root root} and
	 *   {@linkcode Piece.Context.path path} set to {@linkcode VirtualPath}, and as such, cannot be reloaded.
	 * - This method is useful in environments where file system access is limited or unavailable, such as when using
	 *   {@link https://en.wikipedia.org/wiki/Serverless_computing Serverless Computing}.
	 * - This method will not throw an error if a store with the given name does not exist, it will simply be queued
	 *   until it's registered.
	 * - This method will always throw a {@link TypeError} if `entry.piece` is not a class.
	 * - If the store is registered, this method will always throw a {@linkcode LoaderError} if the piece does not
	 *   extend the registered {@linkcode Store.Constructor store's piece constructor}.
	 * - This operation is atomic, if any of the above errors are thrown, the piece will not be loaded.
	 *
	 * @seealso {@linkcode Store.loadPiece()}
	 * @since 3.8.0
	 * @param entry The entry to load.
	 * @example
	 * ```typescript
	 * import { container } from '@sapphire/pieces';
	 *
	 * class PingCommand extends Command {
	 *   // ...
	 * }
	 *
	 * container.stores.loadPiece({
	 *   store: 'commands',
	 *   name: 'ping',
	 *   piece: PingCommand
	 * });
	 * ```
	 */
	async loadPiece(entry) {
		const store = this.get(entry.store);
		if (store) await store.loadPiece(entry);
		else {
			if (!isClass$1(entry.piece)) throw new TypeError(`The piece ${entry.name} is not a Class. ${String(entry.piece)}`);
			__privateGet(this, _pendingManuallyRegisteredPieces)
				.ensure(entry.store, () => [])
				.push({
					name: entry.name,
					piece: entry.piece
				});
		}
	}
};
_pendingManuallyRegisteredPieces = /* @__PURE__ */ new WeakMap();
__name$2(_StoreRegistry, 'StoreRegistry');
var StoreRegistry = _StoreRegistry;
//#endregion
//#region ../../node_modules/.pnpm/@sapphire+pieces@4.4.1/node_modules/@sapphire/pieces/dist/esm/lib/shared/Container.mjs
var container = { stores: new StoreRegistry() };
//#endregion
//#region ../../node_modules/.pnpm/@sapphire+pieces@4.4.1/node_modules/@sapphire/pieces/dist/esm/lib/internal/internal.mjs
var __defProp = Object.defineProperty;
var __name = (target, value) =>
	__defProp(target, 'name', {
		value,
		configurable: true
	});
function mjsImport(path) {
	return import(path);
}
__name(mjsImport, 'mjsImport');
//#endregion
//#region ../../node_modules/.pnpm/@sapphire+pieces@4.4.1/node_modules/@sapphire/pieces/dist/esm/lib/strategies/Shared.mjs
function isClass(value) {
	return typeof value === 'function' && typeof value.prototype === 'object';
}
__name$2(isClass, 'isClass');
function classExtends(value, base) {
	let ctor = value;
	while (ctor !== null) {
		if (ctor === base) return true;
		ctor = Object.getPrototypeOf(ctor);
	}
	return false;
}
__name$2(classExtends, 'classExtends');
//#endregion
//#region ../../node_modules/.pnpm/@sapphire+pieces@4.4.1/node_modules/@sapphire/pieces/dist/esm/lib/strategies/env.mjs
function checkProcessArgv(name) {
	return process.execArgv.some((arg) => arg.includes(name)) || process.argv.some((arg) => arg.includes(name));
}
__name$2(checkProcessArgv, 'checkProcessArgv');
function checkPreloadModules(name) {
	return '_preload_modules' in process && process._preload_modules.some((module) => module.includes(name));
}
__name$2(checkPreloadModules, 'checkPreloadModules');
function checkEnvVariable(name, value) {
	return value ? process.env[name] === value : !isNullOrUndefined(process.env[name]);
}
__name$2(checkEnvVariable, 'checkEnvVariable');
var CanLoadTypeScriptFiles =
	Reflect.has(globalThis, 'Deno') ||
	Reflect.has(globalThis, 'Bun') ||
	'bun' in process.versions ||
	Symbol.for('ts-node.register.instance') in process ||
	checkProcessArgv('ts-node/esm') ||
	!isNullOrUndefined(process.env.TS_NODE_DEV) ||
	checkProcessArgv('babel-node') ||
	checkEnvVariable('VITEST', 'true') ||
	checkEnvVariable('VITEST_WORKER_ID') ||
	checkEnvVariable('JEST_WORKER_ID') ||
	checkPreloadModules('@swc/register') ||
	checkPreloadModules('@swc-node/register') ||
	checkProcessArgv('.bin/swc-node') ||
	checkPreloadModules('tsm') ||
	checkPreloadModules('esbuild-register') ||
	checkPreloadModules('tsx');
//#endregion
//#region ../../node_modules/.pnpm/@sapphire+pieces@4.4.1/node_modules/@sapphire/pieces/dist/esm/lib/strategies/LoaderStrategy.mjs
var _LoaderStrategy = class _LoaderStrategy {
	constructor() {
		__publicField(this, 'clientUsesESModules', getRootData().type === 'ESM');
		__publicField(this, 'supportedExtensions', ['.js', '.cjs', '.mjs']);
		__publicField(this, 'filterDtsFiles', false);
		if (CanLoadTypeScriptFiles) {
			this.supportedExtensions.push('.ts', '.cts', '.mts');
			this.filterDtsFiles = true;
		}
	}
	filter(path) {
		const extension = extname(path);
		if (!this.supportedExtensions.includes(extension)) return null;
		if (this.filterDtsFiles && path.endsWith('.d.ts')) return null;
		const name = basename(path, extension);
		if (name === '' || name.startsWith('_')) return null;
		return {
			extension,
			path,
			name
		};
	}
	async preload(file) {
		if (['.mjs', '.mts'].includes(file.extension) || (['.js', '.ts'].includes(file.extension) && this.clientUsesESModules)) {
			const url = pathToFileURL(file.path);
			url.searchParams.append('d', Date.now().toString());
			url.searchParams.append('name', file.name);
			url.searchParams.append('extension', file.extension);
			return mjsImport(url);
		}
		const mod = __require(file.path);
		delete __require.cache[__require.resolve(file.path)];
		return mod;
	}
	async *load(store, file) {
		let yielded = false;
		const result = await this.preload(file);
		if (isClass(result) && classExtends(result, store.Constructor)) {
			yield result;
			yielded = true;
		}
		for (const value of Object.values(result))
			if (isClass(value) && classExtends(value, store.Constructor)) {
				yield value;
				yielded = true;
			}
		if (!yielded) throw new MissingExportsError(file.path);
	}
	onLoad() {}
	onLoadAll() {}
	onUnload() {}
	onUnloadAll() {}
	onError(error, path) {
		console.error(`Error when loading '${path}':`, error);
	}
	async *walk(store, path, logger) {
		logger?.(`[STORE => ${store.name}] [WALK] Loading all pieces from '${path}'.`);
		try {
			const dir = await opendir(path);
			for await (const item of dir)
				if (item.isFile()) yield join(dir.path, item.name);
				else if (item.isDirectory()) yield* this.walk(store, join(dir.path, item.name), logger);
		} catch (error) {
			if (error.code !== 'ENOENT') this.onError(error, path);
		}
	}
};
__name$2(_LoaderStrategy, 'LoaderStrategy');
var LoaderStrategy = _LoaderStrategy;
//#endregion
//#region ../../node_modules/.pnpm/@sapphire+pieces@4.4.1/node_modules/@sapphire/pieces/dist/esm/lib/structures/PieceLocation.mjs
var _PieceLocation = class _PieceLocation {
	/**
	 * @param full The full path to the file.
	 * @param root The root directory the file was found from.
	 */
	constructor(full, root) {
		/**
		 * The full path to the file.
		 */
		__publicField(this, 'full');
		/**
		 * The root directory the file was found from.
		 */
		__publicField(this, 'root');
		this.full = full;
		this.root = root;
	}
	/**
	 * Whether the file is virtual or not.
	 */
	get virtual() {
		return this.full === VirtualPath;
	}
	/**
	 * The relative path between {@link PieceLocation.root} and {@link PieceLocation.full}.
	 * @example
	 * ```typescript
	 * const location = new PieceLocation(
	 * 	'/usr/src/app/commands',
	 * 	'/usr/src/app/commands/general/ping.js'
	 * );
	 *
	 * console.log(location.relative);
	 * // → 'general/ping.js'
	 * ```
	 */
	get relative() {
		return this.virtual ? VirtualPath : relative(this.root, this.full);
	}
	/**
	 * The names of the directories that separate {@link PieceLocation.root} and {@link PieceLocation.full}.
	 * @example
	 * ```typescript
	 * const location = new PieceLocation(
	 * 	'/usr/src/app/commands',
	 * 	'/usr/src/app/commands/games/multiplayer/connect-four.js'
	 * );
	 *
	 * console.log(location.directories);
	 * // → ['games', 'multiplayer']
	 * ```
	 */
	get directories() {
		return this.virtual ? [] : this.relative.split(sep).slice(0, -1);
	}
	/**
	 * The name and extension of the file that was loaded, extracted from {@link PieceLocation.full}.
	 * @example
	 * ```typescript
	 * const location = new PieceLocation(
	 * 	'/usr/src/app/commands',
	 * 	'/usr/src/app/commands/games/multiplayer/connect-four.js'
	 * );
	 *
	 * console.log(location.name);
	 * // → 'connect-four.js'
	 * ```
	 */
	get name() {
		return this.virtual ? VirtualPath : basename(this.full);
	}
	/**
	 * Defines the `JSON.stringify` behavior of this structure.
	 */
	toJSON() {
		return {
			directories: this.directories,
			full: this.full,
			name: this.name,
			relative: this.relative,
			root: this.root
		};
	}
};
__name$2(_PieceLocation, 'PieceLocation');
var PieceLocation = _PieceLocation;
//#endregion
//#region ../../node_modules/.pnpm/@sapphire+pieces@4.4.1/node_modules/@sapphire/pieces/dist/esm/lib/structures/Piece.mjs
var _Piece = class _Piece {
	constructor(context, options = {}) {
		/**
		 * The store that contains the piece.
		 */
		__publicField(this, 'store');
		/**
		 * The location metadata for the piece's file.
		 */
		__publicField(this, 'location');
		/**
		 * The name of the piece.
		 */
		__publicField(this, 'name');
		/**
		 * Whether or not the piece is enabled.
		 */
		__publicField(this, 'enabled');
		/**
		 * The raw options passed to this {@link Piece}
		 */
		__publicField(this, 'options');
		this.store = context.store;
		this.location = new PieceLocation(context.path, context.root);
		this.name = options.name ?? context.name;
		this.enabled = options.enabled ?? true;
		this.options = options;
	}
	/**
	 * A reference to the {@link Container} object for ease of use.
	 * @see container
	 */
	get container() {
		return container;
	}
	/**
	 * Per-piece listener that is called when the piece is loaded into the store.
	 * Useful to set-up asynchronous initialization tasks.
	 */
	onLoad() {}
	/**
	 * Per-piece listener that is called when the piece is unloaded from the store.
	 * Useful to set-up clean-up tasks.
	 */
	onUnload() {}
	/**
	 * Unloads and disables the piece.
	 */
	async unload() {
		await this.store.unload(this.name);
		this.enabled = false;
	}
	/**
	 * Reloads the piece by loading the same path in the store.
	 */
	async reload() {
		await this.store.load(this.location.root, this.location.relative);
	}
	/**
	 * Defines the `JSON.stringify` behavior of this piece.
	 */
	toJSON() {
		return {
			location: this.location.toJSON(),
			name: this.name,
			enabled: this.enabled,
			options: this.options
		};
	}
};
__name$2(_Piece, 'Piece');
var Piece = _Piece;
((Piece2) => {
	Piece2.Location = PieceLocation;
})(Piece || (Piece = {}));
//#endregion
//#region ../../node_modules/.pnpm/@sapphire+pieces@4.4.1/node_modules/@sapphire/pieces/dist/esm/lib/structures/AliasPiece.mjs
var _AliasPiece = class _AliasPiece extends Piece {
	constructor(context, options = {}) {
		super(context, options);
		/**
		 * The aliases for the piece.
		 */
		__publicField(this, 'aliases');
		this.aliases = options.aliases ?? [];
	}
	/**
	 * Defines the `JSON.stringify` behavior of this alias piece.
	 */
	toJSON() {
		return {
			...super.toJSON(),
			aliases: this.aliases.slice()
		};
	}
};
__name$2(_AliasPiece, 'AliasPiece');
var AliasPiece = _AliasPiece;
((AliasPiece2) => {
	({ Location: AliasPiece2.Location } = Piece);
})(AliasPiece || (AliasPiece = {}));
//#endregion
//#region ../../node_modules/.pnpm/@sapphire+pieces@4.4.1/node_modules/@sapphire/pieces/dist/esm/lib/structures/Store.mjs
var defaultStrategy = new LoaderStrategy();
var _a;
var _b;
var _calledLoadAll;
var _walk;
var _Store = class _Store extends ((_b = Collection), (_a = ManuallyRegisteredPiecesSymbol), _b) {
	/**
	 * @param constructor The piece constructor this store loads.
	 * @param options The options for the store.
	 */
	constructor(constructor, options) {
		super();
		__publicField(this, 'Constructor');
		__publicField(this, 'name');
		__publicField(this, 'paths');
		__publicField(this, 'strategy');
		/**
		 * The queue of manually registered pieces to load.
		 */
		__publicField(this, _a, /* @__PURE__ */ new Map());
		/**
		 * Whether or not the store has called `loadAll` at least once.
		 */
		__privateAdd(this, _calledLoadAll, false);
		/**
		 * The walk function for the store.
		 */
		__privateAdd(this, _walk);
		this.Constructor = constructor;
		this.name = options.name;
		this.paths = new Set(options.paths ?? []);
		this.strategy = options.strategy ?? _Store.defaultStrategy;
		__privateSet(
			this,
			_walk,
			typeof this.strategy.walk === 'function' ? this.strategy.walk.bind(this.strategy) : defaultStrategy.walk.bind(defaultStrategy)
		);
	}
	/**
	 * A reference to the {@link Container} object for ease of use.
	 * @see container
	 */
	get container() {
		return container;
	}
	/**
	 * Registers a directory into the store.
	 * @param path The path to be added.
	 * @example
	 * ```typescript
	 * store
	 *   .registerPath(resolve('commands'))
	 *   .registerPath(resolve('third-party', 'commands'));
	 * ```
	 */
	registerPath(path) {
		const root = resolvePath(path);
		this.paths.add(root);
		_Store.logger?.(`[STORE => ${this.name}] [REGISTER] Registered path '${root}'.`);
		return this;
	}
	/**
	 * Adds a piece into the store's list of manually registered pieces. If {@linkcode Store.loadAll()} was called, the
	 * piece will be loaded immediately, otherwise it will be queued until {@linkcode Store.loadAll()} is called.
	 *
	 * All manually registered pieces will be kept even after they are loaded to ensure they can be loaded again if
	 * {@linkcode Store.loadAll()} is called again.
	 *
	 * @remarks
	 *
	 * - Pieces loaded this way will have their {@linkcode Piece.Context.root root} and
	 *   {@linkcode Piece.Context.path path} set to {@linkcode VirtualPath}, and as such, cannot be reloaded.
	 * - This method is useful in environments where file system access is limited or unavailable, such as when using
	 *   {@link https://en.wikipedia.org/wiki/Serverless_computing Serverless Computing}.
	 * - This method will always throw a {@link TypeError} if `entry.piece` is not a class.
	 * - This method will always throw a {@linkcode LoaderError} if the piece does not extend the
	 *   {@linkcode Store#Constructor store's piece constructor}.
	 * - This operation is atomic, if any of the above errors are thrown, the piece will not be loaded.
	 *
	 * @seealso {@linkcode StoreRegistry.loadPiece()}
	 * @since 3.8.0
	 * @param entry The entry to load.
	 * @example
	 * ```typescript
	 * import { container } from '@sapphire/pieces';
	 *
	 * class PingCommand extends Command {
	 *   // ...
	 * }
	 *
	 * container.stores.get('commands').loadPiece({
	 *   name: 'ping',
	 *   piece: PingCommand
	 * });
	 * ```
	 */
	async loadPiece(entry) {
		if (!isClass$1(entry.piece)) throw new TypeError(`The piece ${entry.name} is not a Class. ${String(entry.piece)}`);
		if (!classExtends$1(entry.piece, this.Constructor))
			throw new LoaderError(LoaderErrorType.IncorrectType, `The piece ${entry.name} does not extend ${this.name}`);
		this[ManuallyRegisteredPiecesSymbol].set(entry.name, entry);
		if (__privateGet(this, _calledLoadAll)) {
			const piece = this.construct(entry.piece, {
				name: entry.name,
				root: VirtualPath,
				path: VirtualPath,
				extension: VirtualPath
			});
			await this.insert(piece);
		}
	}
	/**
	 * Loads one or more pieces from a path.
	 * @param root The root directory the file is from.
	 * @param path The path of the file to load, relative to the `root`.
	 * @return All the loaded pieces.
	 */
	async load(root, path) {
		if (root === '::virtual::') throw new LoaderError(LoaderErrorType.VirtualPiece, `Cannot load a virtual file.`);
		const full = join(root, path);
		const data = this.strategy.filter(full);
		if (data === null) {
			_Store.logger?.(`[STORE => ${this.name}] [LOAD] Skipped piece '${full}' as 'LoaderStrategy#filter' returned 'null'.`);
			return [];
		}
		const promises = [];
		const finishedData = this.hydrateModuleData(root, data);
		for await (const Ctor of this.strategy.load(this, finishedData)) promises.push(this.insert(this.construct(Ctor, finishedData)));
		return Promise.all(promises);
	}
	/**
	 * Unloads a piece given its instance or its name.
	 * @param name The name of the file to load.
	 * @return Returns the piece that was unloaded.
	 */
	async unload(name) {
		const piece = this.resolve(name);
		this.strategy.onUnload(this, piece);
		await piece.onUnload();
		_Store.logger?.(`[STORE => ${this.name}] [UNLOAD] Unloaded piece '${piece.name}'.`);
		this.delete(piece.name);
		_Store.logger?.(`[STORE => ${this.name}] [UNLOAD] Removed piece '${piece.name}'.`);
		return piece;
	}
	/**
	 * Unloads all pieces from the store.
	 */
	async unloadAll() {
		const promises = [];
		for (const piece of this.values()) promises.push(this.unload(piece));
		const results = await Promise.all(promises);
		this.strategy.onUnloadAll(this);
		_Store.logger?.(`[STORE => ${this.name}] [UNLOAD-ALL] Removed all pieces.`);
		return results;
	}
	/**
	 * Loads all pieces from all directories specified by {@link paths}.
	 */
	async loadAll() {
		__privateSet(this, _calledLoadAll, true);
		const pieces = [];
		for (const entry of this[ManuallyRegisteredPiecesSymbol].values()) {
			const piece = this.construct(entry.piece, {
				name: entry.name,
				root: VirtualPath,
				path: VirtualPath,
				extension: VirtualPath
			});
			pieces.push(piece);
		}
		for (const path of this.paths) for await (const piece of this.loadPath(path)) pieces.push(piece);
		_Store.logger?.(`[STORE => ${this.name}] [LOAD-ALL] Found '${pieces.length}' pieces.`);
		await this.unloadAll();
		_Store.logger?.(`[STORE => ${this.name}] [LOAD-ALL] Cleared all pieces.`);
		for (const piece of pieces) await this.insert(piece);
		this.strategy.onLoadAll(this);
		_Store.logger?.(`[STORE => ${this.name}] [LOAD-ALL] Successfully loaded '${this.size}' pieces.`);
	}
	/**
	 * Resolves a piece by its name or its instance.
	 * @param name The name of the piece or the instance itself.
	 * @return The resolved piece.
	 */
	resolve(name) {
		if (typeof name === 'string') {
			const result = this.get(name);
			if (typeof result === 'undefined') throw new LoaderError(LoaderErrorType.UnloadedPiece, `The piece '${name}' does not exist.`);
			return result;
		}
		if (name instanceof this.Constructor) return name;
		throw new LoaderError(LoaderErrorType.IncorrectType, `The piece '${name.name}' is not an instance of '${this.Constructor.name}'.`);
	}
	/**
	 * Inserts a piece into the store.
	 * @param piece The piece to be inserted into the store.
	 * @return The inserted piece.
	 */
	async insert(piece) {
		if (!piece.enabled) return piece;
		this.strategy.onLoad(this, piece);
		await piece.onLoad();
		_Store.logger?.(`[STORE => ${this.name}] [INSERT] Loaded new piece '${piece.name}'.`);
		if (!piece.enabled) {
			this.strategy.onUnload(this, piece);
			await piece.onUnload();
			_Store.logger?.(`[STORE => ${this.name}] [INSERT] Unloaded new piece '${piece.name}' due to 'enabled' being 'false'.`);
			return piece;
		}
		const previous = super.get(piece.name);
		if (previous) {
			await this.unload(previous);
			_Store.logger?.(`[STORE => ${this.name}] [INSERT] Unloaded existing piece '${piece.name}' due to conflicting 'name'.`);
		}
		this.set(piece.name, piece);
		_Store.logger?.(`[STORE => ${this.name}] [INSERT] Inserted new piece '${piece.name}'.`);
		return piece;
	}
	/**
	 * Constructs a {@link Piece} instance.
	 * @param Ctor The {@link Piece}'s constructor used to build the instance.
	 * @param data The module's information
	 * @return An instance of the constructed piece.
	 */
	construct(Ctor, data) {
		return new Ctor(
			{
				store: this,
				root: data.root,
				path: data.path,
				name: data.name
			},
			{
				name: data.name,
				enabled: true
			}
		);
	}
	/**
	 * Adds the final module data properties.
	 * @param root The root directory to add.
	 * @param data The module data returned from {@link ILoaderStrategy.filter}.
	 * @returns The finished module data.
	 */
	hydrateModuleData(root, data) {
		return {
			root,
			...data
		};
	}
	/**
	 * Loads a directory into the store.
	 * @param root The directory to load the pieces from.
	 * @return An async iterator that yields the pieces to be loaded into the store.
	 */
	async *loadPath(root) {
		_Store.logger?.(`[STORE => ${this.name}] [WALK] Loading all pieces from '${root}'.`);
		for await (const child of __privateGet(this, _walk).call(this, this, root, _Store.logger)) {
			const data = this.strategy.filter(child);
			if (data === null) {
				_Store.logger?.(`[STORE => ${this.name}] [LOAD] Skipped piece '${child}' as 'LoaderStrategy#filter' returned 'null'.`);
				continue;
			}
			try {
				const finishedData = this.hydrateModuleData(root, data);
				for await (const Ctor of this.strategy.load(this, finishedData)) yield this.construct(Ctor, finishedData);
			} catch (error) {
				this.strategy.onError(error, data.path);
			}
		}
	}
};
_calledLoadAll = /* @__PURE__ */ new WeakMap();
_walk = /* @__PURE__ */ new WeakMap();
__name$2(_Store, 'Store');
/**
 * The default strategy, defaults to {@link LoaderStrategy}, which is constructed on demand when a store is constructed,
 * when none was set beforehand.
 */
__publicField(_Store, 'defaultStrategy', defaultStrategy);
/**
 * The default logger, defaults to `null`.
 */
__publicField(_Store, 'logger', null);
var Store = _Store;
((Store2) => {
	Store2.Registry = StoreRegistry;
})(Store || (Store = {}));
__name$2(
	class _AliasStore extends Store {
		constructor() {
			super(...arguments);
			/**
			 * The aliases referencing to pieces.
			 */
			__publicField(this, 'aliases', new Collection());
		}
		/**
		 * Looks up the name by the store, falling back to an alias lookup.
		 * @param key The key to look for.
		 */
		get(key) {
			return super.get(key) ?? this.aliases.get(key);
		}
		/**
		 * Checks whether a key is in the store, or is an alias
		 * @param key The key to check
		 */
		has(key) {
			return super.has(key) || this.aliases.has(key);
		}
		/**
		 * Unloads a piece given its instance or its name, and removes all the aliases.
		 * @param name The name of the file to load.
		 * @return Returns the piece that was unloaded.
		 */
		unload(name) {
			const piece = this.resolve(name);
			for (const alias of piece.aliases) if (this.aliases.get(alias) === piece) this.aliases.delete(alias);
			return super.unload(piece);
		}
		/**
		 * Inserts a piece into the store, and adds all the aliases.
		 * @param piece The piece to be inserted into the store.
		 * @return The inserted piece.
		 */
		async insert(piece) {
			for (const key of piece.aliases) this.aliases.set(key, piece);
			return super.insert(piece);
		}
	},
	'AliasStore'
);
//#endregion
export { LoaderStrategy, Piece, Store, __name$1 as __name, container, isNullOrUndefined };
