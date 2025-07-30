import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISelectionService } from "../../selectionService";
import type { IPropertiesService } from "./propertiesService";

import { Node } from "core/node";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { AbstractMeshAdvancedProperties, AbstractMeshGeneralProperties, AbstractMeshOutlineOverlayProperties } from "../../../components/properties/nodes/abstractMeshProperties";
import { SelectionServiceIdentity } from "../../selectionService";
import { PropertiesServiceIdentity } from "./propertiesService";
import { NodeGeneralProperties } from "../../../components/properties/nodes/nodeProperties";

export const NodePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "Mesh Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService, selectionService) => {
        const nodeContentRegistration = propertiesService.addSectionContent({
            key: "Node Properties",
            predicate: (entity: unknown) => entity instanceof Node,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <NodeGeneralProperties node={context} setSelectedEntity={(entity) => (selectionService.selectedEntity = entity)} />,
                },
            ],
        });

        const abstractMeshContentRegistration = propertiesService.addSectionContent({
            key: "Abstract Mesh Properties",
            // Meshes without vertices are effectively TransformNodes, so don't add mesh properties for them.
            predicate: (entity: unknown): entity is AbstractMesh => entity instanceof AbstractMesh && entity.getTotalVertices() > 0,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <AbstractMeshGeneralProperties mesh={context} selectionService={selectionService} />,
                },

                {
                    section: "Advanced",
                    component: ({ context }) => <AbstractMeshAdvancedProperties mesh={context} />,
                },
                {
                    section: "Outlines & Overlays",
                    component: ({ context }) => <AbstractMeshOutlineOverlayProperties mesh={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                nodeContentRegistration.dispose();
                abstractMeshContentRegistration.dispose();
            },
        };
    },
};
