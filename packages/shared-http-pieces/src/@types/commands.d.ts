import '@wolfstar/http-framework';

declare module '@wolfstar/http-framework' {
	// Merges into the framework's `CommandOptionsRegistry` (what `stars codegen` writes for an application, see the
	// `codegen.commands` option) with the commands this package registers, so `Command.OptionsOf<'info'>` resolves
	// without the consuming application having to regenerate its own file. It is the same entry that file gets:
	// `/info` has no options.
	interface CommandOptionsRegistry {
		info: {};
	}
}
