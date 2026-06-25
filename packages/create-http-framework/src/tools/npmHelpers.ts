async function fetchVersion(packageName: string): Promise<string> {
	try {
		const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`);
		if (!response.ok) return 'latest';
		const data = (await response.json()) as { version: string };
		return data.version;
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

export async function fetchDependencyVersions(): Promise<DependencyVersions> {
	const [httpFramework, httpFrameworkI18n, discordApiTypes, typescript, tsNode, typesNode, discordJsBuilders] = await Promise.all([
		fetchVersion('@wolfstar/http-framework'),
		fetchVersion('@wolfstar/http-framework-i18n'),
		fetchVersion('discord-api-types'),
		fetchVersion('typescript'),
		fetchVersion('ts-node'),
		fetchVersion('@types/node'),
		fetchVersion('@discordjs/builders')
	]);

	return { httpFramework, httpFrameworkI18n, discordApiTypes, typescript, tsNode, typesNode, discordJsBuilders };
}
