import { createColors } from 'colorette';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ProjectArgs } from '../args.js';
import { resolveCwd } from '../args.js';
import { loadStarsConfig } from '@wolfstar/http-framework/config';
import { displayPath, type ResolvedStarsConfig } from '@wolfstar/http-framework/config';
import { CliError, ExitCode } from '../errors.js';
import { shouldUseColor } from '../output-mode.js';
import { resolveFromProject } from '../project.js';

export interface CodegenTaskOptions extends ProjectArgs {
	check?: boolean;
	json?: boolean;
	stdout?: NodeJS.WritableStream;
}

export interface CodegenResult {
	generator: 'i18n';
	output: string;
	status: 'written' | 'up-to-date' | 'outdated';
}

export async function runCodegen(options: CodegenTaskOptions): Promise<void> {
	const stdout = options.stdout ?? process.stdout;
	const colors = createColors({ useColor: shouldUseColor() && !options.json });
	const config = await loadStarsConfig({ cwd: resolveCwd(options), configFile: options.config });
	const results: CodegenResult[] = [];

	if (config.codegen.i18n) results.push(await runI18n(config, Boolean(options.check)));

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
		throw new CliError('Generated files are out of date, run `stars codegen` to update them.', {
			code: 'CODEGEN_OUTDATED',
			exitCode: ExitCode.Error
		});
	}
}

async function runI18n(config: ResolvedStarsConfig, check: boolean): Promise<CodegenResult> {
	const { locales, output } = config.codegen.i18n!;
	const cli = resolveFromProject(config.root, '@wolfstar/i18next-type-generator');
	if (!cli) {
		throw new CliError(`"@wolfstar/i18next-type-generator" is not installed in ${config.root}`, {
			code: 'DEPENDENCY_MISSING',
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
			else
				reject(
					new CliError(`i18next-type-generator exited with code ${code}${stderr ? `: ${stderr.trim()}` : ''}`, { code: 'CODEGEN_FAILED' })
				);
		});
	});
}
