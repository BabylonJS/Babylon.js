import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";
import type { ISelectionService } from "../../selectionService";

import { AbstractMesh } from "core/Meshes/abstractMesh";
import { Mesh } from "core/Meshes";

import { GeneralPropertiesSectionIdentity } from "./commonPropertiesService";
import { PropertiesServiceIdentity } from "./propertiesService";
import { SelectionServiceIdentity } from "../../selectionService";
import { MeshAdvancedProperties } from "../../../components/properties/meshAdvancedProperties";
import { MeshGeneralProperties } from "../../../components/properties/meshGeneralProperties";
import { MeshOutlineOverlayProperties } from "../../../components/properties/meshOutlineOverlayProperties";

export const AdvancedPropertiesSectionIdentity = Symbol("Advanced");
export const OutlineOverlayPropertiesSectionItentity = Symbol("Outline & Overlay");

export const MeshPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "Mesh Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService, selectionService) => {
        // Abstract Mesh
        const advancedSectionRegistration = propertiesService.addSection({
            order: 2,
            identity: AdvancedPropertiesSectionIdentity,
        });

        const abstractMeshContentRegistration = propertiesService.addSectionContent({
            key: "Abstract Mesh Properties",
            // Meshes without vertices are effectively TransformNodes, so don't add mesh properties for them.
            predicate: (entity: unknown): entity is AbstractMesh => entity instanceof AbstractMesh && entity.getTotalVertices() > 0,
            content: [
                // "GENERAL" section.
                {
                    section: GeneralPropertiesSectionIdentity,
                    order: 2,
                    component: ({ context }) => <MeshGeneralProperties mesh={context} selectionService={selectionService} />,
                },

                // "ADVANCED" section.
                {
                    section: AdvancedPropertiesSectionIdentity,
                    order: 0,
                    component: ({ context }) => <MeshAdvancedProperties mesh={context} />,
                },
            ],
        });

        const outlineOverlaySectionRegistration = propertiesService.addSection({
            order: 0,
            identity: OutlineOverlayPropertiesSectionItentity,
        });

        const meshPropertiesContentRegistration = propertiesService.addSectionContent({
            key: "Mesh Properties",
            predicate: (entity: unknown): entity is Mesh => entity instanceof Mesh,
            content: [
                // "OUTLINES & OVERLAYS" section.
                {
                    section: OutlineOverlayPropertiesSectionItentity,
                    order: 0,
                    component: ({ context }) => <MeshOutlineOverlayProperties mesh={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                abstractMeshContentRegistration.dispose();
                meshPropertiesContentRegistration.dispose();
                advancedSectionRegistration.dispose();
                outlineOverlaySectionRegistration.dispose();
            },
        };
    },
};
