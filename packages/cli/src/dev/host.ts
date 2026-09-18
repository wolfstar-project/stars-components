import { lookup } from 'node:dns/promises';

/**
 * Resolves `localhost` the way Vite's dev server does: Node's default DNS result order (`dns.lookup('localhost')`)
 * can disagree with the OS's own, "verbatim" resolution order — a well known source of a dev URL that prints fine
 * but is not the address the bot actually bound to (e.g. an IPv6-first system where the server listens on IPv4
 * only). When the two disagree this returns the OS's own address instead of the literal `localhost` hostname.
 */
export async function resolveLocalhost(): Promise<string> {
	try {
		const [ordered, verbatim] = await Promise.all([lookup('localhost'), lookup('localhost', { verbatim: true })]);
		return ordered.family === verbatim.family && ordered.address === verbatim.address ? 'localhost' : verbatim.address;
	} catch {
		return 'localhost';
	}
}

/**
 * Replaces a `localhost` hostname in `url` with {@link resolveLocalhost}'s result. Any other hostname (an explicit
 * `dev.url` override, a LAN address, …) is returned untouched.
 */
export async function withResolvedLocalhost(url: string): Promise<string> {
	const parsed = new URL(url);
	if (parsed.hostname !== 'localhost') return url;

	const host = await resolveLocalhost();
	if (host === 'localhost') return url;

	parsed.hostname = host.includes(':') ? `[${host}]` : host;
	return parsed.href;
}
