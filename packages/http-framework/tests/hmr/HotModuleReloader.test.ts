import { TestableClient } from '@wolfstar/http-framework-test-utils';
import { container, HotModuleReloader, type Piece, type Store } from '../../src/index.js';

const watcherMocks: MockWatcher[] = [];

vi.mock('chokidar', () => ({
	watch: (paths: string[]) => {
		const watcher: MockWatcher = {
			paths,
			handlers: new Map(),
			closed: false,
			on(event: string, handler: (path: string) => unknown) {
				this.handlers.set(event, handler);
				return this;
			},
			close() {
				this.closed = true;
				return Promise.resolve();
			},
			getWatched: () => Object.fromEntries(paths.map((path) => [path, []]))
		};

		watcherMocks.push(watcher);
		return watcher;
	}
}));

interface MockWatcher {
	paths: string[];
	handlers: Map<string, (path: string) => unknown>;
	closed: boolean;
	on(event: string, handler: (path: string) => unknown): MockWatcher;
	close(): Promise<void>;
	getWatched(): Record<string, string[]>;
}

class ExposedHotModuleReloader extends HotModuleReloader {
	public override handlePieceUpdate(store: Store<Piece>, path: string) {
		return super.handlePieceUpdate(store, path);
	}

	public override handlePieceDelete(store: Store<Piece>, path: string) {
		return super.handlePieceDelete(store, path);
	}
}

const root = '/srv/commands';
const path = '/srv/commands/ping.js';

function makePiece(name: string, full: string) {
	return {
		name,
		location: { full },
		reload: vi.fn(() => Promise.resolve()),
		unload: vi.fn(() => Promise.resolve())
	};
}

function makeStore(pieces: ReturnType<typeof makePiece>[], { filter = true }: { filter?: boolean } = {}) {
	return {
		name: 'commands',
		paths: new Set([root]),
		strategy: { filter: vi.fn(() => (filter ? { path, name: 'ping', extension: '.js' } : null)) },
		find: (predicate: (piece: unknown) => boolean) => pieces.find((piece) => predicate(piece)),
		load: vi.fn(() => Promise.resolve(pieces))
	} as unknown as Store<Piece>;
}

let client: TestableClient;

beforeEach(() => {
	watcherMocks.length = 0;
	client = new TestableClient();
	vi.spyOn(console, 'info').mockImplementation(() => undefined);
	vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('HotModuleReloader', () => {
	describe('handlePieceUpdate', () => {
		test('GIVEN a file the strategy rejects THEN it does not touch the store', async () => {
			const piece = makePiece('ping', path);
			const store = makeStore([piece], { filter: false });
			const listener = vi.fn();
			client.on('hmrPieceReloaded', listener);

			await new ExposedHotModuleReloader().handlePieceUpdate(store, path);

			expect(piece.reload).not.toHaveBeenCalled();
			expect(listener).not.toHaveBeenCalled();
		});

		test('GIVEN a file of a loaded piece THEN it reloads it and emits hmrPieceReloaded', async () => {
			const piece = makePiece('ping', path);
			const store = makeStore([piece]);
			const listener = vi.fn();
			client.on('hmrPieceReloaded', listener);

			await new ExposedHotModuleReloader().handlePieceUpdate(store, path);

			expect(piece.reload).toHaveBeenCalledOnce();
			expect(listener).toHaveBeenCalledWith(piece, path);
		});

		test('GIVEN a file with no loaded piece THEN it loads it relative to its root and emits hmrPiecesLoaded', async () => {
			const piece = makePiece('ping', path);
			const store = makeStore([]);
			(store.load as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([piece]);
			const listener = vi.fn();
			client.on('hmrPiecesLoaded', listener);

			await new ExposedHotModuleReloader().handlePieceUpdate(store, path);

			expect(store.load).toHaveBeenCalledWith(root, 'ping.js');
			expect(listener).toHaveBeenCalledWith([piece], path);
		});

		test('GIVEN a file outside of every store path THEN it emits hmrError', async () => {
			const store = makeStore([]);
			const listener = vi.fn();
			client.on('hmrError', listener);

			await new ExposedHotModuleReloader().handlePieceUpdate(store, '/elsewhere/ping.js');

			expect(store.load).not.toHaveBeenCalled();
			expect(listener).toHaveBeenCalledWith(expect.any(Error), '/elsewhere/ping.js');
		});

		test('GIVEN a piece that throws on reload THEN it emits hmrError without rejecting', async () => {
			const error = new Error('boom');
			const piece = makePiece('ping', path);
			piece.reload.mockRejectedValue(error);
			const store = makeStore([piece]);
			const listener = vi.fn();
			client.on('hmrError', listener);

			await expect(new ExposedHotModuleReloader().handlePieceUpdate(store, path)).resolves.toBeUndefined();

			expect(listener).toHaveBeenCalledWith(error, path);
			expect(console.error).toHaveBeenCalled();
		});

		test('GIVEN silent THEN it does not write to the console', async () => {
			const piece = makePiece('ping', path);
			const store = makeStore([piece]);

			await new ExposedHotModuleReloader({ silent: true }).handlePieceUpdate(store, path);

			expect(console.info).not.toHaveBeenCalled();
		});
	});

	describe('handlePieceDelete', () => {
		test('GIVEN the file of a loaded piece THEN it unloads it and emits hmrPieceUnloaded', async () => {
			const piece = makePiece('ping', path);
			const store = makeStore([piece]);
			const listener = vi.fn();
			client.on('hmrPieceUnloaded', listener);

			await new ExposedHotModuleReloader().handlePieceDelete(store, path);

			expect(piece.unload).toHaveBeenCalledOnce();
			expect(listener).toHaveBeenCalledWith(piece, path);
		});

		test('GIVEN a file with no loaded piece THEN it does nothing', async () => {
			const store = makeStore([]);
			const listener = vi.fn();
			client.on('hmrPieceUnloaded', listener);

			await new ExposedHotModuleReloader().handlePieceDelete(store, path);

			expect(listener).not.toHaveBeenCalled();
		});

		test('GIVEN a piece that throws on unload THEN it emits hmrError without rejecting', async () => {
			const error = new Error('boom');
			const piece = makePiece('ping', path);
			piece.unload.mockRejectedValue(error);
			const store = makeStore([piece]);
			const listener = vi.fn();
			client.on('hmrError', listener);

			await expect(new ExposedHotModuleReloader().handlePieceDelete(store, path)).resolves.toBeUndefined();

			expect(listener).toHaveBeenCalledWith(error, path);
		});
	});

	describe('lifecycle', () => {
		beforeEach(() => {
			for (const store of container.stores.values()) store.paths.add(root);
		});

		afterEach(() => {
			for (const store of container.stores.values()) store.paths.clear();
		});

		test('GIVEN enabled: false THEN start does not watch anything', async () => {
			const reloader = await new HotModuleReloader({ enabled: false }).start();

			expect(reloader.running).toBe(false);
			expect(watcherMocks).toHaveLength(0);
		});

		test('GIVEN registered store paths THEN start watches each store and emits hmrStart', async () => {
			const listener = vi.fn();
			client.on('hmrStart', listener);

			const reloader = await new HotModuleReloader().start();

			expect(reloader.running).toBe(true);
			expect(watcherMocks).toHaveLength(container.stores.size);
			expect(watcherMocks[0].paths).toEqual([root]);
			expect(reloader.paths).toEqual(Array.from({ length: container.stores.size }, () => root));
			expect(listener).toHaveBeenCalledWith(Array.from({ length: container.stores.size }, () => root));

			await reloader.stop();
		});

		test('GIVEN a running reloader THEN start is idempotent', async () => {
			const reloader = await new HotModuleReloader().start();
			await reloader.start();

			expect(watcherMocks).toHaveLength(container.stores.size);

			await reloader.stop();
		});

		test('GIVEN a running reloader THEN stop closes every watcher and emits hmrStop', async () => {
			const listener = vi.fn();
			client.on('hmrStop', listener);

			const reloader = await new HotModuleReloader().start();
			await reloader.stop();

			expect(reloader.running).toBe(false);
			expect(reloader.paths).toEqual([]);
			expect(watcherMocks.every((watcher) => watcher.closed)).toBe(true);
			expect(listener).toHaveBeenCalledOnce();
		});

		test('GIVEN a stopped reloader THEN stop is a no-op', async () => {
			const listener = vi.fn();
			client.on('hmrStop', listener);

			await new HotModuleReloader().stop();

			expect(listener).not.toHaveBeenCalled();
		});

		test('GIVEN a watched file event THEN it is routed to the matching handler', async () => {
			const reloader = await new HotModuleReloader({ silent: true }).start();
			const spied = reloader as unknown as { handlePieceUpdate: (store: unknown, path: string) => Promise<void> };
			const spy = vi.spyOn(spied, 'handlePieceUpdate').mockResolvedValue(undefined);

			watcherMocks[0].handlers.get('change')!(path);

			expect(spy).toHaveBeenCalledWith(expect.anything(), path);

			await reloader.stop();
		});
	});

	describe('Client integration', () => {
		test('GIVEN no hmr options THEN load does not create a reloader', async () => {
			await client.load({ baseUserDirectory: null });

			expect(client.hmr).toBeNull();
		});

		test('GIVEN hmr options THEN load creates and starts a reloader', async () => {
			const hmrClient = new TestableClient({ hmr: { silent: true } });
			await hmrClient.load({ baseUserDirectory: null });

			expect(hmrClient.hmr).toBeInstanceOf(HotModuleReloader);
			expect(hmrClient.hmr!.running).toBe(true);

			await hmrClient.hmr!.stop();
		});

		test('GIVEN hmr options with enabled: false THEN load does not create a reloader', async () => {
			const hmrClient = new TestableClient({ hmr: { enabled: false } });
			await hmrClient.load({ baseUserDirectory: null });

			expect(hmrClient.hmr).toBeNull();
		});
	});
});
