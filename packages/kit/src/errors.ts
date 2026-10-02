import type { ModuleErrorCode } from './types.js';

/** Why a module could not be installed. `moduleName` is the module's `meta.name`, or the specifier it was listed by. */
export class ModuleError extends Error {
	public readonly code: ModuleErrorCode;
	public readonly moduleName: string;

	public constructor(code: ModuleErrorCode, moduleName: string, message: string, cause?: unknown) {
		super(message, cause === undefined ? undefined : { cause });
		this.name = 'ModuleError';
		this.code = code;
		this.moduleName = moduleName;
	}
}
