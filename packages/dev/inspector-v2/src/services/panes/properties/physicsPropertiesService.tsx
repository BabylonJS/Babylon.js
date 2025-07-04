import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";
import type { PhysicsTransformNode } from "../../../components/properties/physicsProperties";

import { TransformNode } from "core/Meshes/transformNode";

import { PropertiesServiceIdentity } from "./propertiesService";
import { TransformNodePhysicsProperties } from "../../../components/properties/physicsProperties";

export const PhysicsPropertiesSectionIdentity = Symbol("Physics");

export const PhysicsPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Physics Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const physicsSectionRegistration = propertiesService.addSection({
            order: 1,
            identity: PhysicsPropertiesSectionIdentity,
        });

        const contentRegistration = propertiesService.addSectionContent({
            key: "Physics Properties",
            predicate: (entity: unknown): entity is PhysicsTransformNode => entity instanceof TransformNode && !!entity.physicsBody,
            content: [
                // "Physics" section.
                {
                    section: PhysicsPropertiesSectionIdentity,
                    order: 0,
                    component: ({ context }) => <TransformNodePhysicsProperties node={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                contentRegistration.dispose();
                physicsSectionRegistration.dispose();
            },
        };
    },
};
