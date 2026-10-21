import { displayPath, type ResolvedStarsConfig } from '@wolfstar/schema';
import { applyEnvOptions, loadProject, withProjectEnv } from '../utils/hooks.js';
import { defineCommand } from 'citty';
import { createColors } from 'colorette';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { collectFlag, projectArgs, resolveCwd, type ProjectArgs } from '../utils/args.js';
import type { CommandSnapshot } from '../dev/bridge.js';
import { generateCommandTypes } from '../utils/command-types.js';
import { cliDiagnostics } from '../utils/diagnostics.js';
import { shouldUseColor } from '../utils/output-mode.js';
import { readLocalCommands } from '../utils/local-commands.js';
import { resolveFromProject } from '../utils/project.js';

/** The generators `stars codegen` can run, in the order it runs them. */
export const CODEGEN_GENERATORS = ['i18n', 'commands'] as const;

export type CodegenGenerator = (typeof CODEGEN_GENERATORS)[number];

export interface CodegenTaskOptions extends ProjectArgs {
	/** Runs only these generators, each value possibly a comma-separated list. Every one of them has to be enabled. */
	only?: readonly string[];
	check?: boolean;
	json?: boolean;
	stdout?: NodeJS.WritableStream;
	/** Overrides the commands read from the built bot, for tests. */
	commands?: CommandSnapshot;
}

export interface CodegenResult {
	generator: CodegenGenerator;
	output: string;
	status: 'written' | 'up-to-date' | 'outdated';
}

export async function runCodegen(options: CodegenTaskOptions): Promise<void> {
	const stdout = options.stdout ?? process.stdout;
	const colors = createColors({ useColor: shouldUseColor() && !options.json });
	const only = parseOnly(options.only);
	const project = await loadProject({ cwd: resolveCwd(options), configFile: options.config });
	const { config } = project;
	const results: CodegenResult[] = [];

	// A job that asks for one generator must not pass because that generator is off and nothing ran.
	for (const generator of only ?? []) {
		if (!config.codegen[generator]) throw cliDiagnostics.CODEGEN_GENERATOR_DISABLED({ generator });
	}

	const selected = (generator: CodegenGenerator) => !only || only.includes(generator);

	if (selected('i18n') && config.codegen.i18n) results.push(await runI18n(config, Boolean(options.check)));
	if (selected('commands') && config.codegen.commands) {
		// What the bot is started with: `env:options` (and varlock) may pick other env files than the defaults.
		const botConfig = withProjectEnv(await applyEnvOptions(config, project.hooks));
		results.push(await runCommands(botConfig, Boolean(options.check), options.commands));
	}

	if (options.json) {
		stdout.write(`${JSON.stringify({ check: Boolean(options.check), results }, null, 2)}\n`);
	} else if (results.length === 0) {
		stdout.write(`${colors.dim('stars')} nothing to generate (no code generators are configured)\n`);
	} else {
		for (const result of results) {
			const paint = result.status === 'outdated' ? colors.red : colors.green;
			stdout.write(`${colors.dim('stars')} ${result.generator}: ${paint(result.status)} ${displayPath(config.root, result.output)}\n`);
		}
	}

	if (results.some((result) => result.status === 'outdated')) {
		throw cliDiagnostics.CODEGEN_OUTDATED({});
	}
}

/** The generators `--only` names, or `undefined` when it was not given. */
function parseOnly(values: readonly string[] | undefined): CodegenGenerator[] | undefined {
	if (!values || values.length === 0) return undefined;

	return values
		.flatMap((value) => value.split(','))
		.map((value) => {
			const name = value.trim();
			if (!(CODEGEN_GENERATORS as readonly string[]).includes(name)) {
				throw cliDiagnostics.INVALID_OPTION({ option: '--only', value: name, allowed: CODEGEN_GENERATORS.join(', ') });
			}

			return name as CodegenGenerator;
		});
}

/**
 * Types the options of the commands the project registers. The commands are read from the built bot, the way
 * `stars commands diff` reads them: nothing connects to Discord, but the bot still runs its own env setup, so `--check`
 * in CI needs placeholders for the values it reads while starting (`DISCORD_CLIENT_ID`, `DISCORD_PUBLIC_KEY`, ...).
 */
async function runCommands(config: ResolvedStarsConfig, check: boolean, local?: CommandSnapshot): Promise<CodegenResult> {
	const { output } = config.codegen.commands!;
	const generated = generateCommandTypes(local ?? (await readLocalCommands(config)));

	if (!check) {
		await mkdir(dirname(output), { recursive: true });
		await writeFile(output, generated);
		return { generator: 'commands', output, status: 'written' };
	}

	const actual = await readFile(output, 'utf-8').catch(() => null);
	return { generator: 'commands', output, status: generated === actual ? 'up-to-date' : 'outdated' };
}

async function runI18n(config: ResolvedStarsConfig, check: boolean): Promise<CodegenResult> {
	const { locales, output } = config.codegen.i18n!;
	const cli = resolveFromProject(config.root, '@wolfstar/i18next-type-generator');
	if (!cli) {
		throw cliDiagnostics.DEPENDENCY_MISSING({
			name: '@wolfstar/i18next-type-generator',
			root: config.root,
			hint: 'Install it with `pnpm add -D @wolfstar/i18next-type-generator`, or set `codegen.i18n` to false.'
		});
	}

	if (!check) {
		await generate(config.root, cli, locales, output);
		return { generator: 'i18n', output, status: 'written' };
	}

	const directory = await mkdtemp(join(tmpdir(), 'stars-codegen-'));
	try {
		const candidate = join(directory, 'i18next.d.ts');
		await generate(config.root, cli, locales, candidate);
		const [expected, actual] = await Promise.all([readFile(candidate, 'utf-8'), readFile(output, 'utf-8').catch(() => null)]);
		return { generator: 'i18n', output, status: expected === actual ? 'up-to-date' : 'outdated' };
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
}

function generate(root: string, cli: string, locales: string, output: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const child = spawn(process.execPath, [cli, locales, output], { cwd: root, stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
		let stderr = '';
		child.stderr?.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
		child.once('error', reject);
		child.once('exit', (code) => {
			if (code === 0) resolve();
			else reject(cliDiagnostics.CODEGEN_FAILED({ code, stderr: stderr.trim() }));
		});
	});
}

export default defineCommand({
	meta: {
		name: 'codegen',
		description: 'Run the configured code generators (i18next types, command options)'
	},
	args: {
		...projectArgs,
		only: {
			type: 'string',
			description: `Run only these generators (repeatable, or comma-separated): ${CODEGEN_GENERATORS.join(', ')}`
		},
		check: {
			type: 'boolean',
			description: 'Fail when the generated files are out of date instead of writing them',
			default: false
		},
		json: {
			type: 'boolean',
			description: 'Print machine-readable JSON',
			default: false
		}
	},
	async run({ args, rawArgs }) {
		const only = collectFlag(rawArgs, 'only');
		await runCodegen({ config: args.config, cwd: args.cwd, only: only.length > 0 ? only : undefined, check: args.check, json: args.json });
	}
});
