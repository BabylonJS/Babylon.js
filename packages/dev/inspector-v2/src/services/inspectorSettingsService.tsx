import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type ISettingsService, SettingsServiceIdentity } from "shared-ui-components/modularTool/services/settingsService";

import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { useSetting } from "shared-ui-components/modularTool/hooks/settingsHooks";
import { CompactModeSettingDescriptor, DisableCopySettingDescriptor, UseDegreesSettingDescriptor, UseEulerSettingDescriptor } from "./globalSettings";

export const InspectorSettingsServiceDefinition: ServiceDefinition<[], [ISettingsService]> = {
    friendlyName: "Inspector Settings",
    consumes: [SettingsServiceIdentity],
    factory: (settingsService) => {
        const settingRegistration = settingsService.addSectionContent({
            key: "Inspector Settings",
            section: "UI",
            component: () => {
                const [compactMode, setCompactMode] = useSetting(CompactModeSettingDescriptor);
                const [useDegrees, setUseDegrees] = useSetting(UseDegreesSettingDescriptor);
                const [useEuler, setUseEuler] = useSetting(UseEulerSettingDescriptor);
                const [disableCopy, setDisableCopy] = useSetting(DisableCopySettingDescriptor);

                return (
                    <>
                        <SwitchPropertyLine
                            label="Compact Mode"
                            description="Use a more compact UI with less spacing."
                            value={compactMode}
                            onChange={(checked) => {
                                setCompactMode(checked);
                            }}
                        />
                        <SwitchPropertyLine
                            label="Use Degrees"
                            description="Using degrees instead of radians."
                            value={useDegrees}
                            onChange={(checked) => {
                                setUseDegrees(checked);
                            }}
                        />
                        <SwitchPropertyLine
                            label="Only Show Euler Angles"
                            description="Only show Euler angles in rotation properties, rather than quaternions."
                            value={useEuler}
                            onChange={(checked) => {
                                setUseEuler(checked);
                            }}
                        />
                        <SwitchPropertyLine
                            label="Disable Copy Button"
                            description="Disables the copy to clipboard button on property lines. You can still Ctrl+Click on the label to copy."
                            value={disableCopy}
                            onChange={(checked) => {
                                setDisableCopy(checked);
                            }}
                        />
                    </>
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
