import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import { ToolsServiceIdentity } from "./toolsService";
import type { IToolsService } from "./toolsService";
import { ExportGltfProperties } from "../../../components/tools/export/exportGltfProperties";
import { ExportBabylonProperties } from "../../../components/tools/export/exportBabylonProperties";
import { Scene } from "core/scene";
import type { IDisposable } from "core/scene";

export const ExportGltfSectionIdentity = Symbol("Export .gltf");
export const ExportBabylonSectionIdentity = Symbol("Export .babylon");

export const ExportServiceDefinition: ServiceDefinition<[], [IToolsService]> = {
    friendlyName: "Export Tools",
    consumes: [ToolsServiceIdentity],
    // TODO: Linter wants async factory() to be named factoryAsync()
    // eslint-disable-next-line @typescript-eslint/naming-convention
    factory: async (toolsService) => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { GLTF2Export } = await import("serializers/glTF/2.0/glTFSerializer");

        // Create sections for each export tool
        const gltfSectionRegistration = toolsService.addSection({
            order: 0,
            identity: ExportGltfSectionIdentity,
        });

        const babylonSectionRegistration = toolsService.addSection({
            order: 1,
            identity: ExportBabylonSectionIdentity,
        });

        const contentRegistrations: IDisposable[] = [];

        // glTF export content
        contentRegistrations.push(
            toolsService.addSectionContent({
                key: "glTF Export",
                predicate: (entity: unknown) => entity instanceof Scene,
                content: [
                    {
                        section: ExportGltfSectionIdentity,
                        order: 0,
                        component: ({ context }) => <ExportGltfProperties scene={context} exporterClass={GLTF2Export} />,
                    },
                ],
            })
        );

        // Babylon export content
        contentRegistrations.push(
            toolsService.addSectionContent({
                key: "Babylon Export",
                predicate: (entity: unknown) => entity instanceof Scene,
                content: [
                    {
                        section: ExportBabylonSectionIdentity,
                        order: 0,
                        component: ({ context }) => <ExportBabylonProperties scene={context} />,
                    },
                ],
            })
        );

        return {
            dispose: () => {
                contentRegistrations.forEach((registration) => registration.dispose());
                gltfSectionRegistration.dispose();
                babylonSectionRegistration.dispose();
            },
        };
    },
};

export default {
    serviceDefinitions: [ExportServiceDefinition],
} as const;
