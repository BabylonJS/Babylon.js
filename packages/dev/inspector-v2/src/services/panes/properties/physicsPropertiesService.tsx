import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { TransformNode } from "core/Meshes/transformNode";

import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";
import { PhysicsBodyProperties } from "../../../components/properties/physics/physicsProperties";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
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
                    component: ({ context: node }) => {
                        const physicsBody = useProperty(node, "physicsBody");

                        if (!physicsBody) {
                            return (
                                <MessageBar
                                    intent="info"
                                    title="No Physics Body"
                                    message="To modify physics properties, attach a physics body to this node."
                                    docLink="https://doc.babylonjs.com/features/featuresDeepDive/physics/rigidBodies"
                                />
                            );
                        }

                        return <PhysicsBodyProperties physicsBody={physicsBody} />;
                    },
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
