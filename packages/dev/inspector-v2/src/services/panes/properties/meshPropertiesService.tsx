import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISelectionService } from "../../selectionService";
import type { IPropertiesService } from "./propertiesService";

import { Mesh } from "core/Meshes";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { MeshAdvancedProperties } from "../../../components/properties/mesh/meshAdvancedProperties";
import { MeshGeneralProperties } from "../../../components/properties/mesh/meshGeneralProperties";
import { MeshOutlineOverlayProperties } from "../../../components/properties/mesh/meshOutlineOverlayProperties";
import { SelectionServiceIdentity } from "../../selectionService";
import { PropertiesServiceIdentity } from "./propertiesService";

export const MeshPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "Mesh Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService, selectionService) => {
        const abstractMeshContentRegistration = propertiesService.addSectionContent({
            key: "Abstract Mesh Properties",
            // Meshes without vertices are effectively TransformNodes, so don't add mesh properties for them.
            predicate: (entity: unknown): entity is AbstractMesh => entity instanceof AbstractMesh && entity.getTotalVertices() > 0,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <MeshGeneralProperties mesh={context} selectionService={selectionService} />,
                },

                {
                    section: "Advanced",
                    component: ({ context }) => <MeshAdvancedProperties mesh={context} />,
                },
            ],
        });

        const meshPropertiesContentRegistration = propertiesService.addSectionContent({
            key: "Mesh Properties",
            predicate: (entity: unknown): entity is Mesh => entity instanceof Mesh && entity.getTotalVertices() > 0,
            content: [
                {
                    section: "Outlines & Overlays",
                    component: ({ context }) => <MeshOutlineOverlayProperties mesh={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                abstractMeshContentRegistration.dispose();
                meshPropertiesContentRegistration.dispose();
            },
        };
    },
};
