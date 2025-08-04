import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import { ToolsServiceIdentity } from "../toolsService";
import type { IToolsService } from "../toolsService";
import type { IDisposable } from "core/scene";
import { ExportBabylonProperties, ExportGltfProperties } from "../../../components/tools/exportTools";

export const ExportServiceDefinition: ServiceDefinition<[], [IToolsService]> = {
    friendlyName: "Export Tools",
    consumes: [ToolsServiceIdentity],
    factory: (toolsService) => {
        const contentRegistrations: IDisposable[] = [];

        // glTF export content
        contentRegistrations.push(
            toolsService.addSectionContent({
                key: "glTF Export",
                section: "glTF Export",
                component: ({ context }) => <ExportGltfProperties scene={context} />,
            })
        );

        // Babylon export content
        contentRegistrations.push(
            toolsService.addSectionContent({
                key: "Babylon Export",
                section: "Babylon Export",
                component: ({ context }) => <ExportBabylonProperties scene={context} />,
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
    serviceDefinitions: [ExportServiceDefinition],
} as const;
