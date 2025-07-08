import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { TransformNode } from "core/Meshes/transformNode";

import { PropertiesServiceIdentity } from "./propertiesService";
import { PhysicsBodyProperties } from "../../../components/properties/physicsProperties";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { PlaceholderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLine";

export const PhysicsPropertiesSectionIdentity = Symbol("Physics");

export const PhysicsPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Physics Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const physicsSectionRegistration = propertiesService.addSection({
            order: 5,
            identity: PhysicsPropertiesSectionIdentity,
        });

        const contentRegistration = propertiesService.addSectionContent({
            key: "Physics Properties",
            predicate: (entity: unknown) => entity instanceof TransformNode,
            content: [
                // "Physics" section.
                {
                    section: PhysicsPropertiesSectionIdentity,
                    order: 0,
                    component: ({ context: node }) => {
                        const physicsBody = useProperty(node, "physicsBody");

                        if (!physicsBody) {
                            return <PlaceholderPropertyLine label="No Physics Body" value={undefined} onChange={() => {}} />;
                        }

                        return <PhysicsBodyProperties physicsBody={physicsBody} />;
                    },
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
