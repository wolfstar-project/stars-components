import { FT, T } from '@wolfstar/http-framework-i18n';

export const RootName = T('commands/math:name');
export const RootDescription = T('commands/math:description');

export const AddName = T('commands/math:addName');
export const AddDescription = T('commands/math:addDescription');
export const SubtractName = T('commands/math:subtractName');
export const SubtractDescription = T('commands/math:subtractDescription');

export const OptionsLeft = 'commands/math:optionsLeft';
export const OptionsRight = 'commands/math:optionsRight';

export const Result = FT<{ left: number; right: number; result: number }>('commands/math:result');
