import { createColors } from 'colorette';
import { arch, platform } from 'node:os';
import { relative } from 'node:path';
import type { ProjectArgs } from '../args.js';
import { resolveCwd } from '../args.js';
import { loadStarsConfig } from '@wolfstar/http-framework/config';
import { displayPath, type ResolvedStarsConfig } from '@wolfstar/http-framework/config';
import { resolveOutputMode, shouldUseColor } from '../output-mode.js';
import { findInstalledVersion } from '../project.js';
import { readOwnPackageJson } from '../version.js';

export interface InfoOptions extends ProjectArgs {
	json?: boolean;
	stdout?: NodeJS.WritableStream;
}

export interface ProjectInfo {
	cli: { version: string; node: string; platform: string; outputMode: 'tui' | 'plain' };
	project: {
		cwd: string;
		root: string;
		configFile: string | null;
		name: string | null;
		version: string | null;
		entry: string;
		frameworkVersion: string | null;
	};
	build: ResolvedStarsConfig['build'];
	dev: ResolvedStarsConfig['dev'];
	codegen: ResolvedStarsConfig['codegen'];
	imports: ResolvedStarsConfig['imports'];
	experimental: ResolvedStarsConfig['experimental'];
}

export function collectInfo(config: ResolvedStarsConfig): ProjectInfo {
	return {
		cli: {
			version: readOwnPackageJson().version,
			node: process.version,
			platform: `${platform()} ${arch()}`,
			outputMode: resolveOutputMode()
		},
		project: {
			cwd: config.cwd,
			root: config.root,
			configFile: config.configFile,
			name: config.packageJson?.name ?? null,
			version: config.packageJson?.version ?? null,
			entry: config.entry,
			frameworkVersion: findInstalledVersion(config.root, '@wolfstar/http-framework')
		},
		build: config.build,
		dev: config.dev,
		codegen: config.codegen,
		imports: config.imports,
		experimental: config.experimental
	};
}

export function formatInfo(info: ProjectInfo, useColor: boolean): string {
	const colors = createColors({ useColor });
	const { root } = info.project;
	const show = (path: string | null) => (path === null ? colors.dim('none') : displayPath(root, path));
	const row = (label: string, value: string) => `  ${colors.dim(label.padEnd(12))}${value}`;
	const section = (title: string, rows: string[]) => [colors.bold(title), ...rows].join('\n');

	return [
		section(`stars ${colors.green(`v${info.cli.version}`)}`, [
			row('node', info.cli.node),
			row('platform', info.cli.platform),
			row('output', info.cli.outputMode),
			row(
				'framework',
				info.project.frameworkVersion
					? `@wolfstar/http-framework v${info.project.frameworkVersion}`
					: colors.yellow('@wolfstar/http-framework not installed')
			)
		]),
		section('Project', [
			row(
				'name',
				info.project.name
					? `${info.project.name}${info.project.version ? colors.dim(` v${info.project.version}`) : ''}`
					: colors.dim('unnamed')
			),
			row('root', root),
			row(
				'config',
				info.project.configFile ? relative(root, info.project.configFile) || info.project.configFile : colors.dim('none (defaults)')
			),
			row('entry', show(info.project.entry))
		]),
		section('Build', [
			row('tool', info.build.tool),
			row('outDir', show(info.build.outDir)),
			row('tsconfig', show(info.build.tsconfig)),
			row('runs', show(info.build.output))
		]),
		section('Dev', [
			row('watch', info.dev.watch.map(show).join(', ')),
			row('debounce', `${info.dev.debounce}ms`),
			row('node args', info.dev.nodeArgs.join(' ') || colors.dim('none')),
			row('args', info.dev.args.join(' ') || colors.dim('none')),
			row('url', info.dev.url ?? colors.dim('unknown, set dev.url or HTTP_PORT')),
			row('health', info.dev.health ?? colors.dim('none')),
			row(
				'typecheck',
				info.dev.typecheck.enabled ? `${info.dev.typecheck.checker} → ${show(info.dev.typecheck.tsconfig)}` : colors.dim('disabled')
			),
			row('tunnel', describeTunnel(info.dev.tunnel, colors)),
			row('log file', info.dev.logFile ? show(info.dev.logFile) : colors.dim('disabled'))
		]),
		section('Codegen', [
			row('i18n', info.codegen.i18n ? `${show(info.codegen.i18n.locales)} → ${show(info.codegen.i18n.output)}` : colors.dim('disabled'))
		]),
		section('Experimental', [
			row('vite', flag(info.experimental.enableVite, colors)),
			row('nitro', flag(info.experimental.enableNitro, colors)),
			row('external', flag(info.experimental.enableExternalVite, colors))
		]),
		section('Imports', [
			row('auto', info.imports.enabled ? colors.green('enabled') : colors.dim('disabled')),
			row('dirs', info.imports.dirs.map(show).join(', ')),
			row('presets', info.imports.presets.join(', ') || colors.dim('none')),
			row('dts', show(info.imports.dts))
		])
	].join('\n\n');
}

function flag(enabled: boolean, colors: ReturnType<typeof createColors>): string {
	return enabled ? colors.green('enabled') : colors.dim('disabled');
}

function describeTunnel(tunnel: ResolvedStarsConfig['dev']['tunnel'], colors: ReturnType<typeof createColors>): string {
	switch (tunnel.mode) {
		case 'quick':
			return 'cloudflared quick tunnel';
		case 'url':
			return tunnel.url;
		default:
			return colors.dim('disabled');
	}
}

export async function runInfo(options: InfoOptions): Promise<void> {
	const stdout = options.stdout ?? process.stdout;
	const config = await loadStarsConfig({ cwd: resolveCwd(options), configFile: options.config });
	const info = collectInfo(config);
	stdout.write(`${options.json ? JSON.stringify(info, null, 2) : formatInfo(info, shouldUseColor())}\n`);
}
