import { type SettingDescriptor } from "shared-ui-components/modularTool/services/settingsStore";

export { CompactModeSettingDescriptor, DisableCopySettingDescriptor } from "shared-ui-components/modularTool/services/globalSettings";

// These are all "global" settings that aren't produced/owned by a specific service,
// so we just add them by default directly in the SettingsService.

export const UseDegreesSettingDescriptor: SettingDescriptor<boolean> = {
    key: "UseDegrees",
    defaultValue: true,
};

export const UseEulerSettingDescriptor: SettingDescriptor<boolean> = {
    key: "UseEuler",
    defaultValue: true,
};
