import type { ServiceDefinition } from "../../../../modularity/serviceDefinition";
import { ToolsServiceIdentity } from "../../toolsService";
import type { IToolsService } from "../../toolsService";
import { GLTFAnimationImportTool } from "../../../../components/tools/import/gltfAnimationImportTool";

export const GLTFAnimationImportServiceDefinition: ServiceDefinition<[], [IToolsService]> = {
    friendlyName: "GLTF Animation Import",
    consumes: [ToolsServiceIdentity],
    factory: (toolsService) => {
        const contentRegistration = toolsService.addSectionContent({
            key: "AnimationImport",
            order: 40,
            section: "GLTF Animation Import",
            component: ({ context }) => <GLTFAnimationImportTool scene={context} />,
        });

        return {
            dispose: () => {
                contentRegistration.dispose();
            },
        };
    },
};
