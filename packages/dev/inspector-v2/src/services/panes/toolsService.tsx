import type { ServiceDefinition } from "../../modularity/serviceDefinition";
import type { IShellService } from "../shellService";

import { WrenchRegular } from "@fluentui/react-icons";

import { ShellServiceIdentity } from "../shellService";

export const ToolsServiceDefinition: ServiceDefinition<[], [IShellService]> = {
    friendlyName: "Tools",
    consumes: [ShellServiceIdentity],
    factory: (shellService) => {
        const registration = shellService.addToRightPane({
            key: "Tools",
            title: "Tools",
            icon: WrenchRegular,
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
