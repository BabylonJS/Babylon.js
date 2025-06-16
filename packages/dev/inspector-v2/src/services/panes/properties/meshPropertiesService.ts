import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { AbstractMesh } from "core/Meshes/abstractMesh";

import { GeneralPropertiesSectionIdentity } from "./commonPropertiesService";
import { PropertiesServiceIdentity } from "./propertiesService";
import { MeshAdvancedProperties } from "../../../components/properties/meshAdvancedProperties";
import { MeshGeneralProperties } from "../../../components/properties/meshGeneralProperties";
import { MeshTransformProperties } from "../../../components/properties/meshTransformProperties";

export const TransformsPropertiesSectionIdentity = Symbol("Transforms");
export const AdvancedPropertiesSectionIdentity = Symbol("Advanced");

export const MeshPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Mesh Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const transformsSectionRegistration = propertiesService.addSection({
            order: 1,
            identity: TransformsPropertiesSectionIdentity,
        });

        const advancedSectionRegistration = propertiesService.addSection({
            order: 2,
            identity: AdvancedPropertiesSectionIdentity,
        });

        const contentRegistration = propertiesService.addSectionContent({
            key: "Mesh Properties",
            predicate: (entity: unknown) => entity instanceof AbstractMesh,
            content: [
                // "GENERAL" section.
                {
                    section: GeneralPropertiesSectionIdentity,
                    order: 1,
                    component: MeshGeneralProperties,
                },

                // "TRANSFORMS" section.
                {
                    section: TransformsPropertiesSectionIdentity,
                    order: 0,
                    component: MeshTransformProperties,
                },

                // "ADVANCED" section.
                {
                    section: AdvancedPropertiesSectionIdentity,
                    order: 0,
                    component: MeshAdvancedProperties,
                },
            ],
        });

        return {
            dispose: () => {
                contentRegistration.dispose();
                transformsSectionRegistration.dispose();
                advancedSectionRegistration.dispose();
            },
        };
    },
};
