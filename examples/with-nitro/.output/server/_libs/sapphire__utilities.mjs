import { __name, isNullOrUndefined } from './@sapphire/pieces+[...].mjs';
//#region ../../node_modules/.pnpm/@sapphire+utilities@3.18.2/node_modules/@sapphire/utilities/dist/esm/lib/isNullOrUndefinedOrEmpty.mjs
function isNullOrUndefinedOrEmpty(value) {
	return isNullOrUndefined(value) || value.length === 0;
}
__name(isNullOrUndefinedOrEmpty, 'isNullOrUndefinedOrEmpty');
//#endregion
//#region ../../node_modules/.pnpm/@sapphire+utilities@3.18.2/node_modules/@sapphire/utilities/dist/esm/lib/isFunction.mjs
function isFunction(input) {
	return typeof input === 'function';
}
__name(isFunction, 'isFunction');
//#endregion
export { isFunction, isNullOrUndefinedOrEmpty };
