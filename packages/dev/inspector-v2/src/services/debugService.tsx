import type { ServiceDefinition } from "../modularity/serviceDefinition";

import { BugRegular } from "@fluentui/react-icons";
import { ShellService } from "./shellService";

export const DebugServiceDefinition: ServiceDefinition<[], [ShellService]> = {
    friendlyName: "Debug",
    tags: ["diagnostics"],
    consumes: [ShellService],
    factory: (shellService) => {
        const registration = shellService.addToRightPane({
            key: "Debug",
            title: "Debug",
            icon: BugRegular,
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
