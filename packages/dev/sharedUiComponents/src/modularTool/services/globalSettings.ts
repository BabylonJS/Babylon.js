import { type SettingDescriptor } from "./settingsStore";

export const CompactModeSettingDescriptor: SettingDescriptor<boolean> = {
    key: "CompactMode",
    defaultValue: !matchMedia("(pointer: coarse)").matches,
};

export const DisableCopySettingDescriptor: SettingDescriptor<boolean> = {
    key: "DisableCopy",
    defaultValue: false,
};
