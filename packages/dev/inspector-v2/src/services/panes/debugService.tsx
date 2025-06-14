import type { ServiceDefinition } from "../../modularity/serviceDefinition";
import type { IShellService } from "../shellService";

import { BugRegular } from "@fluentui/react-icons";

import { ShellServiceIdentity } from "../shellService";

export const DebugServiceDefinition: ServiceDefinition<[], [IShellService]> = {
    friendlyName: "Debug",
    consumes: [ShellServiceIdentity],
    factory: (shellService) => {
        const registration = shellService.addSidePane({
            key: "Debug",
            title: "Debug",
            icon: BugRegular,
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
