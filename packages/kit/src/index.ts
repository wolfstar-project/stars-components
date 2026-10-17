export { defineModule } from './define.js';
export { ModuleError } from './errors.js';
export { mergeOptions } from './options.js';
export { setupModules } from './setup.js';
export type { SetupModulesOptions } from './setup.js';
export type {
	ModuleContext,
	ModuleErrorCode,
	ModuleHookHost,
	ModuleInput,
	ModuleMeta,
	ModuleOptions,
	ModulePluginSource,
	ModuleVersions,
	StarsModule
} from './types.js';
export type { InstalledModule, ModulesRuntime, PiecesDirRegistration, RuntimePluginRegistration } from '@wolfstar/schema';
