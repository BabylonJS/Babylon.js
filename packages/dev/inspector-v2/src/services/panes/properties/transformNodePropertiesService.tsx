import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { TransformNode } from "core/Meshes/transformNode";

import { PropertiesServiceIdentity } from "./propertiesService";
import { TransformNodeTransformProperties } from "../../../components/properties/transformNodeTransformProperties";

export const TransformsPropertiesSectionIdentity = Symbol("Transforms");

export const TransformNodePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Transform Node Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const transformsSectionRegistration = propertiesService.addSection({
            order: 1,
            identity: TransformsPropertiesSectionIdentity,
        });

        const contentRegistration = propertiesService.addSectionContent({
            key: "Transform Node Properties",
            predicate: (entity: unknown) => entity instanceof TransformNode,
            content: [
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
