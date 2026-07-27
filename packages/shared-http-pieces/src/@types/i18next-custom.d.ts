import 'i18next';

declare module 'i18next' {
	// Merges into the generated `CustomResources` interface (see `i18next.d.ts`) instead of redeclaring
	// `CustomTypeOptions.resources`. `infoEmbedDescription` has no entry in this package's locale JSON
	// because its translation is provided at runtime by the consuming application, so it is declared by
	// hand here rather than emitted by the generator.
	interface CustomResources {
		'commands/shared': {
			infoEmbedDescription: string;
		};
	}
}
