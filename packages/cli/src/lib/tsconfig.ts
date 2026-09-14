import type { ResolvedStarsConfig } from '@wolfstar/http-framework/config';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const sapphireOptions = Object.assign(
	{},
	...['@sapphire/ts-config', '@sapphire/ts-config/extra-strict', '@sapphire/ts-config/decorators'].map(
		(id) => (require(id) as { compilerOptions: Record<string, unknown> }).compilerOptions
	)
) as Record<string, unknown>;

/** Generates an extendable config without changing the project's own tsconfig. */
export async function prepareTsconfig(config: ResolvedStarsConfig, check = false) {
	const path = join(config.root, '.stars', 'tsconfig.json');
	const fromGenerated = (target: string) => `./${relative(dirname(path), target).replaceAll('\\', '/')}`;
	const paths: Record<string, string[]> = {};
	if (config.build.tool === 'tsdown') {
		const source = dirname(config.entry);
		const defaults = config.build.configFile === null ? { '~': source, '@': source, '~~': config.root, '@@': config.root } : {};
		const aliases = { ...defaults, ...(config.tsdown.alias as Record<string, unknown> | undefined) };
		for (const [alias, target] of Object.entries(aliases)) {
			// Module redirects belong to the bundler; only filesystem targets become TypeScript paths.
			if (typeof target !== 'string' || (!isAbsolute(target) && !/^\.\.?[/\\]/.test(target))) continue;
			const resolved = fromGenerated(resolve(config.root, target));
			paths[alias] = [resolved];
			paths[`${alias}/*`] = [`${resolved}/*`];
		}
	}
	const content = `${JSON.stringify(
		{
			compilerOptions: {
				...sapphireOptions,
				// Bundlers emit the application; TypeScript only checks it. Keep Node16 emit for tsc.
				...(config.build.tool === 'tsdown' || config.build.tool === 'vite'
					? { module: 'ESNext', moduleResolution: 'Bundler', noEmit: true }
					: {}),
				target: 'ES2022',
				skipLibCheck: true,
				tsBuildInfoFile: './tsconfig.tsbuildinfo',
				paths
			},
			include: [`${fromGenerated(dirname(config.entry))}/**/*`, ...(config.imports.enabled ? [fromGenerated(config.imports.dts)] : [])],
			exclude: [fromGenerated(join(config.root, 'node_modules')), fromGenerated(config.build.outDir)]
		},
		null,
		2
	)}\n`;
	if (check) {
		const existing = await readFile(path, 'utf-8').catch(() => null);
		return { path, status: existing === content ? ('up-to-date' as const) : ('outdated' as const) };
	}
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, content);
	return { path, status: 'written' as const };
}
