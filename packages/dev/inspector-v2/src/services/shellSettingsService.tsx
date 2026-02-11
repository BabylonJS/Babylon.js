import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { ISettingsService } from "./panes/settingsService";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { useSetting } from "../hooks/settingsHooks";
import { SettingsServiceIdentity } from "./panes/settingsService";
import {
    SidePaneDockOverridesSettingDescriptor,
    LeftSidePaneWidthAdjustSettingDescriptor,
    LeftSidePaneHeightAdjustSettingDescriptor,
    RightSidePaneHeightAdjustSettingDescriptor,
    RightSidePaneWidthAdjustSettingDescriptor,
} from "./shellService";

export const ShellSettingsServiceDefinition: ServiceDefinition<[], [ISettingsService]> = {
    friendlyName: "Shell Settings Service",
    consumes: [SettingsServiceIdentity],
    factory: (settingsService) => {
        const settingRegistration = settingsService.addSectionContent({
            key: "Shell Settings",
            section: "UI",
            component: () => {
                const [, , resetSidePaneDockOverrides] = useSetting(SidePaneDockOverridesSettingDescriptor);
                const [, , resetLeftPaneWidthAdjust] = useSetting(LeftSidePaneWidthAdjustSettingDescriptor);
                const [, , resetLeftPaneHeightAdjust] = useSetting(LeftSidePaneHeightAdjustSettingDescriptor);
                const [, , resetRightPaneWidthAdjust] = useSetting(RightSidePaneWidthAdjustSettingDescriptor);
                const [, , resetRightPaneHeightAdjust] = useSetting(RightSidePaneHeightAdjustSettingDescriptor);
                return (
                    <ButtonLine
                        label="Reset Layout"
                        onClick={() => {
                            resetSidePaneDockOverrides();
                            resetLeftPaneWidthAdjust();
                            resetLeftPaneHeightAdjust();
                            resetRightPaneWidthAdjust();
                            resetRightPaneHeightAdjust();
                        }}
                    />
                );
            },
        });

        return {
            dispose: () => {
                settingRegistration.dispose();
            },
        };
    },
};
