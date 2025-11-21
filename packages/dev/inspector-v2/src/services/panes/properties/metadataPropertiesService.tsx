import type { IMetadataContainer } from "../../../components/properties/metadataProperties";
import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { MetadataProperties } from "../../../components/properties/metadataProperties";
import { PropertiesServiceIdentity } from "./propertiesService";

function IsMetadataContainer(entity: unknown): entity is IMetadataContainer {
    return (entity as IMetadataContainer).metadata !== undefined;
}

export const MetadataPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Metadata Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const contentRegistration = propertiesService.addSectionContent({
            key: "Metadata Properties",
            // TransformNode and Bone don't share a common base class, but both have the same transform related properties.
            predicate: (entity: unknown) => IsMetadataContainer(entity),
            content: [
                {
                    section: "Metadata",
                    component: ({ context }) => <MetadataProperties entity={context} />,
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
