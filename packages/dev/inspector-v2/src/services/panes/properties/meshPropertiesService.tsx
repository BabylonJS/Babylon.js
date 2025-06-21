import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";
import type { ISelectionService } from "../../selectionService";

import { AbstractMesh } from "core/Meshes/abstractMesh";

import { GeneralPropertiesSectionIdentity } from "./commonPropertiesService";
import { PropertiesServiceIdentity } from "./propertiesService";
import { SelectionServiceIdentity } from "../../selectionService";
import { MeshAdvancedProperties } from "../../../components/properties/meshAdvancedProperties";
import { MeshGeneralProperties } from "../../../components/properties/meshGeneralProperties";

export const AdvancedPropertiesSectionIdentity = Symbol("Advanced");

export const MeshPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "Mesh Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService, selectionService) => {
        const advancedSectionRegistration = propertiesService.addSection({
            order: 2,
            identity: AdvancedPropertiesSectionIdentity,
        });

        const contentRegistration = propertiesService.addSectionContent({
            key: "Mesh Properties",
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

        return {
            dispose: () => {
                contentRegistration.dispose();
                advancedSectionRegistration.dispose();
            },
        };
    },
};
