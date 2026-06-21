import { execFileSync } from 'node:child_process';

function fetchVersion(packageName: string): string {
	try {
		const result = execFileSync('npm', ['show', packageName, 'version'], { encoding: 'utf-8', stdio: 'pipe' });
		return result.trim();
	} catch {
		return 'latest';
	}
}

export interface DependencyVersions {
	httpFramework: string;
	httpFrameworkI18n: string;
	discordApiTypes: string;
	typescript: string;
	tsNode: string;
	typesNode: string;
	discordJsBuilders: string;
}

export function fetchDependencyVersions(): DependencyVersions {
	return {
		httpFramework: fetchVersion('@wolfstar/http-framework'),
		httpFrameworkI18n: fetchVersion('@wolfstar/http-framework-i18n'),
		discordApiTypes: fetchVersion('discord-api-types'),
		typescript: fetchVersion('typescript'),
		tsNode: fetchVersion('ts-node'),
		typesNode: fetchVersion('@types/node'),
		discordJsBuilders: fetchVersion('@discordjs/builders')
	};
}
