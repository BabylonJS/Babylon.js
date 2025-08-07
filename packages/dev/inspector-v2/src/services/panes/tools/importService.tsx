import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import { ToolsServiceIdentity } from "../toolsService";
import type { IToolsService } from "../toolsService";
import { ImportAnimationsTools } from "../../../components/tools/importTools";

export const SceneImportServiceDefinition: ServiceDefinition<[], [IToolsService]> = {
    friendlyName: "Import Tool",
    consumes: [ToolsServiceIdentity],
    factory: (toolsService) => {
        const contentRegistration = toolsService.addSectionContent({
            key: "AnimationImport",
            section: "Animation Import",
            component: ({ context }) => <ImportAnimationsTools scene={context} />,
        });

        return {
            dispose: () => {
                contentRegistration.dispose();
            },
        };
    },
};

export default {
    serviceDefinitions: [SceneImportServiceDefinition],
} as const;
