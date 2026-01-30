import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISelectionService } from "../../selectionService";
import type { IPropertiesService } from "./propertiesService";

import { AbstractMesh } from "core/Meshes/abstractMesh";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { Mesh } from "core/Meshes/mesh";
import { Node } from "core/node";
import {
    AbstractMeshAdvancedProperties,
    AbstractMeshDebugProperties,
    AbstractMeshDisplayProperties,
    AbstractMeshEdgeRenderingProperties,
    AbstractMeshGeneralProperties,
    AbstractMeshOcclusionsProperties,
    AbstractMeshOutlineOverlayProperties,
} from "../../../components/properties/nodes/abstractMeshProperties";
import { GaussianSplattingDisplayProperties } from "../../../components/properties/nodes/gaussianSplattingProperties";
import { MeshDisplayProperties, MeshGeneralProperties, MeshMorphTargetsProperties } from "../../../components/properties/nodes/meshProperties";
import { NodeGeneralProperties } from "../../../components/properties/nodes/nodeProperties";
import { SelectionServiceIdentity } from "../../selectionService";
import { PropertiesServiceIdentity } from "./propertiesService";

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
                    component: ({ context }) => <NodeGeneralProperties node={context} selectionService={selectionService} />,
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
                    section: "Display",
                    component: ({ context }) => <AbstractMeshDisplayProperties mesh={context} />,
                },
                {
                    section: "Advanced",
                    component: ({ context }) => <AbstractMeshAdvancedProperties mesh={context} />,
                },
                {
                    section: "Outlines & Overlays",
                    component: ({ context }) => <AbstractMeshOutlineOverlayProperties mesh={context} />,
                },
                {
                    section: "Occlusions",
                    component: ({ context }) => <AbstractMeshOcclusionsProperties mesh={context} />,
                },
                {
                    section: "Edge Rendering",
                    component: ({ context }) => <AbstractMeshEdgeRenderingProperties mesh={context} />,
                },
                {
                    section: "Debug",
                    component: ({ context }) => <AbstractMeshDebugProperties mesh={context} />,
                },
            ],
        });

        const meshContentRegistration = propertiesService.addSectionContent({
            key: "Mesh Properties",
            predicate: (entity: unknown): entity is Mesh => entity instanceof Mesh && entity.getTotalVertices() > 0,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <MeshGeneralProperties mesh={context} />,
                },
                {
                    section: "Display",
                    component: ({ context }) => <MeshDisplayProperties mesh={context} />,
                },
                {
                    section: "Morph Targets",
                    component: ({ context }) => <MeshMorphTargetsProperties mesh={context} />,
                },
            ],
        });

        const gaussianSplattingContentRegistration = propertiesService.addSectionContent({
            key: "Gaussian Splatting Properties",
            predicate: (entity: unknown): entity is GaussianSplattingMesh => entity instanceof GaussianSplattingMesh && entity.getTotalVertices() > 0,
            content: [
                {
                    section: "Gaussian Splatting",
                    component: ({ context }) => <GaussianSplattingDisplayProperties mesh={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                nodeContentRegistration.dispose();
                abstractMeshContentRegistration.dispose();
                meshContentRegistration.dispose();
                gaussianSplattingContentRegistration.dispose();
            },
        };
    },
};
