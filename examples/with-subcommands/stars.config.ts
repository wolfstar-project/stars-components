import { defineConfig } from '@wolfstar/http-framework/config';

// Entry, build output, tsdown, auto imports, development mode, env registration, and src/locales are all conventional.
export default defineConfig({
	// `stars codegen` types the options of every command from its builder, into `src/@types/commands.d.ts`.
	// It reads the commands from the built bot, so run `pnpm build` first.
	codegen: { i18n: false, commands: true }
});
