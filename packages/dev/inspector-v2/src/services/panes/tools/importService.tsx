import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import { ToolsServiceIdentity } from "./toolsService";
import type { IToolsService } from "./toolsService";
import { ImportAnimationsProperties } from "../../../components/tools/importAnimationsProperties";
import { Scene } from "core/scene";

export const SceneImportSectionIdentity = Symbol("Import Animations");

export const SceneImportServiceDefinition: ServiceDefinition<[], [IToolsService]> = {
    friendlyName: "Import Tool",
    consumes: [ToolsServiceIdentity],
    factory: (toolsService) => {
        const sceneImportSectionRegistration = toolsService.addSection({
            order: 4,
            identity: SceneImportSectionIdentity,
        });

        const contentRegistration = toolsService.addSectionContent({
            key: "SceneImport",
            predicate: (entity: unknown) => entity instanceof Scene,
            content: [
                {
                    section: SceneImportSectionIdentity,
                    order: 0,
                    component: ({ context }) => <ImportAnimationsProperties scene={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                contentRegistration.dispose();
                sceneImportSectionRegistration.dispose();
            },
        };
    },
};

export default {
    serviceDefinitions: [SceneImportServiceDefinition],
} as const;
