import type { CommandDef } from 'citty';

// citty types each command by its own arguments; the registry needs the erased form.
// oxlint-disable-next-line typescript/no-explicit-any
type AnyCommand = CommandDef<any>;

export const commands: Record<string, () => Promise<AnyCommand>> = {
	dev: () => import('./dev.js').then((module) => module.default),
	build: () => import('./build.js').then((module) => module.default),
	info: () => import('./info.js').then((module) => module.default),
	codegen: () => import('./codegen.js').then((module) => module.default),
	prepare: () => import('./prepare.js').then((module) => module.default),
	commands: () => import('./commands.js').then((module) => module.default)
};
