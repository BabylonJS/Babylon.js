import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";
import type { ISelectionService } from "../../selectionService";

import { TransformNode } from "core/Meshes/transformNode";

import { GeneralPropertiesSectionIdentity } from "./commonPropertiesService";
import { PropertiesServiceIdentity } from "./propertiesService";
import { SelectionServiceIdentity } from "../../selectionService";
import { TransformNodeGeneralProperties } from "../../../components/properties/transformNodeGeneralProperties";
import { TransformNodeTransformProperties } from "../../../components/properties/transformNodeTransformProperties";

export const TransformsPropertiesSectionIdentity = Symbol("Transforms");

export const TransformNodePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "Transform Node Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService, selectionService) => {
        const transformsSectionRegistration = propertiesService.addSection({
            order: 1,
            identity: TransformsPropertiesSectionIdentity,
        });

        const contentRegistration = propertiesService.addSectionContent({
            key: "Transform Node Properties",
            predicate: (entity: unknown) => entity instanceof TransformNode,
            content: [
                // "GENERAL" section.
                {
                    section: GeneralPropertiesSectionIdentity,
                    order: 1,
                    component: ({ context }) => <TransformNodeGeneralProperties node={context} setSelectedEntity={(entity) => (selectionService.selectedEntity = entity)} />,
                },

                // "TRANSFORMS" section.
                {
                    section: TransformsPropertiesSectionIdentity,
                    order: 0,
                    component: ({ context }) => <TransformNodeTransformProperties node={context} />,
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
