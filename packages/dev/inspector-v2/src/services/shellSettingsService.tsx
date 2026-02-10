import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { ISettingsService } from "./panes/settingsService";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { useSetting } from "../hooks/settingsHooks";
import { SettingsServiceIdentity } from "./panes/settingsService";
import { SidePaneDockOverridesSettingDescriptor } from "./shellService";

export const ShellSettingsServiceDefinition: ServiceDefinition<[], [ISettingsService]> = {
    friendlyName: "Shell Settings Service",
    consumes: [SettingsServiceIdentity],
    factory: (settingsService) => {
        const settingRegistration = settingsService.addSectionContent({
            key: "Shell Settings",
            section: "UI",
            component: () => {
                const [, , resetSidePaneDockOverrides] = useSetting(SidePaneDockOverridesSettingDescriptor);
                return <ButtonLine label="Reset Layout" onClick={resetSidePaneDockOverrides} />;
            },
        });

        return {
            dispose: () => {
                settingRegistration.dispose();
            },
        };
    },
};
