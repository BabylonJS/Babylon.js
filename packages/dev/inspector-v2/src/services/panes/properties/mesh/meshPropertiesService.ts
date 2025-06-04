import type { ServiceDefinition } from "../../../../modularity/serviceDefinition";
import type { IPropertiesService } from "../propertiesService";

import { AbstractMesh } from "core/Meshes/abstractMesh";

import { GeneralPropertiesSectionIdentity } from "../common/commonPropertiesService";
import { PropertiesServiceIdentity } from "../propertiesService";
import { MeshGeneralProperties } from "./meshGeneralProperties";
import { MeshTransformProperties } from "./meshTransformProperties";

export const TransformsPropertiesSectionIdentity = Symbol("Transforms");

export const MeshPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Mesh Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const transformsSectionRegistration = propertiesService.addSection({
            order: 1,
            identity: TransformsPropertiesSectionIdentity,
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
            ],
        });

        return {
            dispose: () => {
                contentRegistration.dispose();
                transformsSectionRegistration.dispose();
            },
        };
    },
};
