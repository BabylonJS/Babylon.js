import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { TransformNode } from "core/Meshes/transformNode";

import { TransformNodePhysicsProperties } from "../../../components/properties/physics/physicsProperties";
import { PropertiesServiceIdentity } from "./propertiesService";

export const PhysicsPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Physics Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const contentRegistration = propertiesService.addSectionContent({
            key: "Physics Properties",
            predicate: (entity: unknown) => entity instanceof TransformNode,
            content: [
                {
                    section: "Physics",
                    component: ({ context: node }) => <TransformNodePhysicsProperties node={node} />,
                },
            ],
        });

        return {
            dispose: () => {
                contentRegistration.dispose();
            },
        };
    },
};
