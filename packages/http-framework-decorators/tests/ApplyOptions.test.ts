import type { LoaderPieceContext, PieceOptions } from '@wolfstar/http-framework';
import { ApplyOptions } from '../src/index.js';

const context = { name: 'Ping', path: '/pieces/Ping.js', root: '/pieces', store: null } as unknown as LoaderPieceContext;

class FakePiece {
	public readonly context: LoaderPieceContext;
	public readonly options: PieceOptions;

	public constructor(pieceContext: LoaderPieceContext, options: PieceOptions = {}) {
		this.context = pieceContext;
		this.options = options;
	}
}

describe('ApplyOptions', () => {
	test('GIVEN a plain object THEN it is passed to the constructor', () => {
		@ApplyOptions<PieceOptions>({ name: 'ping', enabled: false })
		class UserPiece extends FakePiece {}

		expect(new UserPiece(context).options).toEqual({ name: 'ping', enabled: false });
	});

	test('GIVEN a function THEN it receives the loader context', () => {
		const factory = vi.fn(({ name }: LoaderPieceContext) => ({ name: name.toLowerCase() }));

		@ApplyOptions<PieceOptions>(factory)
		class UserPiece extends FakePiece {}

		expect(new UserPiece(context).options).toEqual({ name: 'ping' });
		expect(factory).toHaveBeenCalledExactlyOnceWith(context);
	});

	test('GIVEN options passed to the constructor THEN the decorator overrides the conflicting keys', () => {
		@ApplyOptions<PieceOptions>({ name: 'ping' })
		class UserPiece extends FakePiece {}

		expect(new UserPiece(context, { name: 'pong', enabled: true }).options).toEqual({ name: 'ping', enabled: true });
	});

	test('GIVEN a decorated piece THEN the loader context is forwarded untouched', () => {
		@ApplyOptions<PieceOptions>({ name: 'ping' })
		class UserPiece extends FakePiece {}

		expect(new UserPiece(context).context).toBe(context);
	});
});
