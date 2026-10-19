import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IPropertiesService, PropertiesServiceIdentity } from "./propertiesService";

import { Bone } from "core/Bones/bone";
import { TransformNode } from "core/Meshes/transformNode";
import { TransformNodeHierarchyBoundingSizeProperties } from "../../../components/properties/nodes/transformNodeHierarchyBoundingSize";
import { TransformProperties } from "../../../components/properties/transformProperties";

export const TransformPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Transform Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const contentRegistration = propertiesService.addSectionContent({
            key: "Transform Properties",
            // TransformNode and Bone don't share a common base class, but both have the same transform related properties.
            predicate: (entity: unknown) => entity instanceof TransformNode || entity instanceof Bone,
            content: [
                {
                    section: "Transform",
                    component: ({ context }) => <TransformProperties transform={context} />,
                },
            ],
        });

        const hierarchyBoundingSizeRegistration = propertiesService.addSectionContent({
            key: "Transform Node Hierarchy Bounding Size",
            predicate: (entity: unknown): entity is TransformNode => entity instanceof TransformNode,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <TransformNodeHierarchyBoundingSizeProperties node={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                contentRegistration.dispose();
                hierarchyBoundingSizeRegistration.dispose();
            },
        };
    },
};
