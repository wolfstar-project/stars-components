import { displayPath, type ResolvedStarsConfig, type StarsEnvSetupOptions } from '@wolfstar/schema';
import { defineCommand } from 'citty';
import { createColors } from 'colorette';
import { arch, platform } from 'node:os';
import { relative } from 'node:path';
import { describeQuickTunnel } from '../dev/tunnel.js';
import { projectArgs, resolveCwd, type ProjectArgs } from '../utils/args.js';
import { applyEnvOptions, loadProject } from '../utils/hooks.js';
import { modulesPreloadWarning } from '../utils/modules.js';
import { varlockWarning } from '../utils/varlock.js';
import { resolveOutputMode, shouldUseColor } from '../utils/output-mode.js';
import { findInstalledVersion } from '../utils/project.js';
import { readOwnPackageJson } from '../utils/version.js';

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
	future: ResolvedStarsConfig['future'];
	env: ResolvedStarsConfig['env'];
	/** The names of the hooks registered in `stars.config`, flattened (`build:done`). */
	hooks: string[];
	/** The installed modules, and the runtime plugins they registered (`module → export from package`). */
	modules: { installed: string[]; plugins: string[] };
	/** Non-fatal configuration diagnostics, as `CODE: message`. */
	warnings: string[];
	/**
	 * The option names set in the `tsdown`/`vite` blocks. Only the names: the values hold plugins and callbacks,
	 * which neither serialize to JSON nor read usefully on a terminal.
	 */
	options: { tsdown: string[]; vite: string[] };
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
		experimental: config.experimental,
		future: config.future,
		env: config.env,
		hooks: Object.keys(config.hooks),
		modules: {
			installed: (config.runtime?.modules ?? []).map((module) => module.name),
			plugins: (config.runtime?.plugins ?? []).map((plugin) => `${plugin.module} → ${plugin.export} from ${plugin.from}`)
		},
		warnings: [...config.warnings, modulesPreloadWarning(config), varlockWarning(config)]
			.filter((warning) => warning !== null)
			.map((warning) => `${warning.code}: ${warning.message}`),
		options: { tsdown: Object.keys(config.tsdown), vite: Object.keys(config.vite) }
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
			// Which file the build tool is configured from: its own, or this project's `stars.config`.
			row('config', info.build.configFile ? show(info.build.configFile) : colors.dim('stars.config')),
			row('options', describeOptions(info, colors)),
			row('outDir', show(info.build.outDir)),
			row('tsconfig', show(info.build.tsconfig)),
			// Everything `stars typecheck` checks: the generated app and node projects from compatibility version 6 (a `tsc`
			// or `none` project keeps its own tsconfig for the bot and gets the node one on top).
			row('typechecks', info.dev.typecheck.projects.length > 0 ? info.dev.typecheck.projects.map(show).join(', ') : colors.dim('none')),
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
			row('log file', info.dev.logFile ? show(info.dev.logFile) : colors.dim('disabled')),
			row('log dir', info.dev.logs.dir ? `${show(info.dev.logs.dir)} (keeps ${info.dev.logs.keep})` : colors.dim('disabled')),
			row('layout', info.dev.layout),
			row('mouse', info.dev.mouse ? 'clickable dashboard' : colors.dim('left to the terminal')),
			row('channels', info.dev.logs.channels?.join(', ') ?? colors.dim('all')),
			row('levels', info.dev.logs.levels.join(', ')),
			row('commands', `refresh: ${info.dev.commands.refresh}`),
			row('hmr', info.dev.hmr ? 'left to the bot when it hot reloads' : colors.dim('always restart'))
		]),
		section('Codegen', [
			row('i18n', info.codegen.i18n ? `${show(info.codegen.i18n.locales)} → ${show(info.codegen.i18n.output)}` : colors.dim('disabled')),
			row('commands', info.codegen.commands ? show(info.codegen.commands.output) : colors.dim('disabled'))
		]),
		section('Future', [
			row('compat', `v${info.future.compatibilityVersion} defaults`),
			...info.warnings.map((warning) => row('warning', colors.yellow(warning)))
		]),
		section('Env', [row('register', info.env.enabled ? colors.green(describeEnvOptions(info.env.options)) : colors.dim('disabled'))]),
		section('Hooks', [row('registered', info.hooks.join(', ') || colors.dim('none'))]),
		section('Modules', [
			row('installed', info.modules.installed.join(', ') || colors.dim('none')),
			...info.modules.plugins.map((plugin) => row('plugin', plugin))
		]),
		section('Experimental', [
			row('vite', flag(info.experimental.enableVite, colors)),
			row('nitro', flag(info.experimental.enableNitro, colors)),
			...(info.experimental.enableNitro ? [row('nitro preset', info.experimental.nitro.preset)] : []),
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

function describeOptions(info: ProjectInfo, colors: ReturnType<typeof createColors>): string {
	const names = info.build.tool === 'vite' ? info.options.vite : info.options.tsdown;
	return names.length > 0 ? names.join(', ') : colors.dim('none');
}

function describeEnvOptions(options: Readonly<StarsEnvSetupOptions>): string {
	const entries = Object.entries(options).map(([key, value]) => `${key} ${String(value)}`);
	return entries.length > 0 ? `enabled (${entries.join(', ')})` : 'enabled';
}

function flag(enabled: boolean, colors: ReturnType<typeof createColors>): string {
	return enabled ? colors.green('enabled') : colors.dim('disabled');
}

function describeTunnel(tunnel: ResolvedStarsConfig['dev']['tunnel'], colors: ReturnType<typeof createColors>): string {
	switch (tunnel.mode) {
		case 'quick':
			return describeQuickTunnel(tunnel);
		case 'url':
			return tunnel.url;
		default:
			return colors.dim('disabled');
	}
}

export async function runInfo(options: InfoOptions): Promise<void> {
	const stdout = options.stdout ?? process.stdout;
	const project = await loadProject({ cwd: resolveCwd(options), configFile: options.config });
	// What the build would use: `env:options` may change the env files.
	const config = await applyEnvOptions(project.config, project.hooks);
	const info = collectInfo(config);
	stdout.write(`${options.json ? JSON.stringify(info, null, 2) : formatInfo(info, shouldUseColor())}\n`);
}

export default defineCommand({
	meta: {
		name: 'info',
		description: 'Print the resolved project configuration and environment'
	},
	args: {
		...projectArgs,
		json: {
			type: 'boolean',
			description: 'Print machine-readable JSON',
			default: false
		}
	},
	async run({ args }) {
		await runInfo({ config: args.config, cwd: args.cwd, json: args.json });
	}
});
