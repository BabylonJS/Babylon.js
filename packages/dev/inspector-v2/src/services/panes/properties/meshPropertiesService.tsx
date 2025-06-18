import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";
import type { ISelectionService } from "../../selectionService";

import { AbstractMesh } from "core/Meshes/abstractMesh";

import { GeneralPropertiesSectionIdentity } from "./commonPropertiesService";
import { PropertiesServiceIdentity } from "./propertiesService";
import { SelectionServiceIdentity } from "../../selectionService";
import { MeshAdvancedProperties } from "../../../components/properties/meshAdvancedProperties";
import { MeshGeneralProperties } from "../../../components/properties/meshGeneralProperties";

export const TransformsPropertiesSectionIdentity = Symbol("Transforms");
export const AdvancedPropertiesSectionIdentity = Symbol("Advanced");

export const MeshPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "Mesh Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService, selectionService) => {
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
                transformsSectionRegistration.dispose();
                advancedSectionRegistration.dispose();
            },
        };
    },
};
