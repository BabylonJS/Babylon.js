import type { SettingDescriptor } from "./settingsStore";

// These are all "global" settings that aren't produced/owned by a specific service,
// so we just add them by default directly in the SettingsService.

export const CompactModeSettingDescriptor: SettingDescriptor<boolean> = {
    key: "CompactMode",
    defaultValue: !matchMedia("(pointer: coarse)").matches,
};

export const UseDegreesSettingDescriptor: SettingDescriptor<boolean> = {
    key: "UseDegrees",
    defaultValue: true,
};

export const UseEulerSettingDescriptor: SettingDescriptor<boolean> = {
    key: "UseEuler",
    defaultValue: true,
};

export const DisableCopySettingDescriptor: SettingDescriptor<boolean> = {
    key: "DisableCopy",
    defaultValue: false,
};
