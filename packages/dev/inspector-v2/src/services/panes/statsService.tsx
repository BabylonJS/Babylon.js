import type { ServiceDefinition } from "../../modularity/serviceDefinition";
import type { IShellService } from "../shellService";

import { DataBarHorizontalRegular } from "@fluentui/react-icons";

import { ShellServiceIdentity } from "../shellService";

export const StatsServiceDefinition: ServiceDefinition<[], [IShellService]> = {
    friendlyName: "Stats",
    consumes: [ShellServiceIdentity],
    factory: (shellService) => {
        const registration = shellService.addSidePane({
            key: "Stats",
            title: "Stats",
            icon: DataBarHorizontalRegular,
            horizontalLocation: "right",
            suppressTeachingMoment: true,
            content: () => {
                return <>Not yet implemented.</>;
            },
        });

        return {
            dispose: () => registration.dispose(),
        };
    },
};
