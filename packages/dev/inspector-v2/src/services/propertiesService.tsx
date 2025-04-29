import type { ServiceDefinition } from "../modularity/serviceDefinition";

import { DocumentTextRegular } from "@fluentui/react-icons";
import { ShellService } from "./shellService";

export const PropertiesServiceDefinition: ServiceDefinition<[], [ShellService]> = {
    friendlyName: "Properties Editor",
    tags: ["diagnostics"],
    consumes: [ShellService],
    factory: (shellService) => {
        const registration = shellService.addToRightPane({
            key: "Properties",
            title: "Properties",
            icon: DocumentTextRegular,
            content: () => {
                return <></>;
            },
        });

        return {
            dispose: () => registration.dispose(),
        };
    },
};
