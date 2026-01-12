import type { ServiceDefinition } from "../../../../modularity/serviceDefinition";
import { ToolsServiceIdentity } from "../../toolsService";
import type { IToolsService } from "../../toolsService";
import { GLTFAnimationImport } from "../../../../components/tools/import/gltfAnimationImport";

export const GLTFAnimationImportServiceDefinition: ServiceDefinition<[], [IToolsService]> = {
    friendlyName: "Animation Import Tool",
    consumes: [ToolsServiceIdentity],
    factory: (toolsService) => {
        const contentRegistration = toolsService.addSectionContent({
            key: "AnimationImport",
            order: 40,
            section: "Animation Import",
            component: ({ context }) => <GLTFAnimationImport scene={context} />,
        });

        return {
            dispose: () => {
                contentRegistration.dispose();
            },
        };
    },
};
