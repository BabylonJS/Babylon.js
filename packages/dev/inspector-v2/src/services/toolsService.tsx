import type { ServiceDefinition } from "../modularity/serviceDefinition";

import { WrenchRegular } from "@fluentui/react-icons";
import { ShellService } from "./shellService";

export const ToolsServiceDefinition: ServiceDefinition<[], [ShellService]> = {
    friendlyName: "Tools",
    tags: ["diagnostics"],
    consumes: [ShellService],
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
