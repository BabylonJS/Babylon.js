import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import { ToolsServiceIdentity } from "../toolsService";
import type { IToolsService } from "../toolsService";
import type { IDisposable } from "core/scene";
import { ReflectorTools } from "../../../components/tools/reflectorTools";

export const ReflectorServiceDefinition: ServiceDefinition<[], [IToolsService]> = {
    friendlyName: "Reflector Tools",
    consumes: [ToolsServiceIdentity],
    factory: (toolsService) => {
        const contentRegistrations: IDisposable[] = [];

        // Reflector content
        contentRegistrations.push(
            toolsService.addSectionContent({
                key: "Reflector",
                section: "Reflector",
                component: ({ context }) => <ReflectorTools scene={context} />,
            })
        );

        return {
            dispose: () => {
                contentRegistrations.forEach((registration) => registration.dispose());
            },
        };
    },
};

export default {
    serviceDefinitions: [ReflectorServiceDefinition],
} as const;
