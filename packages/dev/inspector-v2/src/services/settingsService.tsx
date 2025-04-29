import type { ServiceDefinition } from "../modularity/serviceDefinition";

import { SettingsRegular } from "@fluentui/react-icons";
import { ShellService } from "./shellService";

export const SettingsServiceDefinition: ServiceDefinition<[], [ShellService]> = {
    friendlyName: "Settings",
    tags: ["diagnostics"],
    consumes: [ShellService],
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
