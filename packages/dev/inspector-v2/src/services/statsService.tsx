import type { ServiceDefinition } from "../modularity/serviceDefinition";

import { DataBarHorizontalRegular } from "@fluentui/react-icons";
import { ShellService } from "./shellService";

export const StatsServiceDefinition: ServiceDefinition<[], [ShellService]> = {
    friendlyName: "Stats",
    tags: ["diagnostics"],
    consumes: [ShellService],
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
