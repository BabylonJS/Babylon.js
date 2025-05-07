import type { ServiceDefinition } from "../../modularity/serviceDefinition";
import type { IShellService } from "../shellService";

import { DataBarHorizontalRegular } from "@fluentui/react-icons";

import { ShellServiceIdentity } from "../shellService";

export const StatsServiceDefinition: ServiceDefinition<[], [IShellService]> = {
    friendlyName: "Stats",
    consumes: [ShellServiceIdentity],
    factory: (shellService) => {
        const registration = shellService.addToRightPane({
            key: "Stats",
            title: "Stats",
            icon: DataBarHorizontalRegular,
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
