import type { ServiceDefinition } from "../../modularity/serviceDefinition";
import type { IShellService } from "../shellService";

import { SettingsRegular } from "@fluentui/react-icons";

import { ShellServiceIdentity } from "../shellService";

export const SettingsServiceDefinition: ServiceDefinition<[], [IShellService]> = {
    friendlyName: "Settings",
    consumes: [ShellServiceIdentity],
    factory: (shellService) => {
        const registration = shellService.addToRightPane({
            key: "Settings",
            title: "Settings",
            icon: SettingsRegular,
            suppressTeachingMoment: true,
            content: () => {
                return <></>;
            },
        });

        return {
            dispose: () => registration.dispose(),
        };
    },
};
