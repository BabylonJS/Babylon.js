import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { TransformNode } from "core/Meshes/transformNode";

import { PropertiesServiceIdentity } from "./propertiesService";
import { TransformProperties } from "../../../components/properties/transformProperties";

export const TransformPropertiesSectionIdentity = Symbol("Transform");

export const TransformNodePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Transform Node Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const transformSectionRegistration = propertiesService.addSection({
            order: 1,
            identity: TransformPropertiesSectionIdentity,
        });

        const contentRegistration = propertiesService.addSectionContent({
            key: "Transform Properties",
            predicate: (entity: unknown) => entity instanceof TransformNode,
            content: [
                // "TRANSFORM" section.
                {
                    section: TransformPropertiesSectionIdentity,
                    order: 0,
                    component: ({ context }) => <TransformProperties transform={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                contentRegistration.dispose();
                transformSectionRegistration.dispose();
            },
        };
    },
};
