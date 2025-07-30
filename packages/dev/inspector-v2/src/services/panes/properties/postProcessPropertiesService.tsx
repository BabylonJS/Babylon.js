import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { PropertiesServiceIdentity } from "./propertiesService";

export const PostProcessPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Post Process Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        // TODO: Add content registrations for each section and for each type in the PostProcess class hierarchy.

        return {
            dispose: () => {
                // TODO: Dispose content registrations.
            },
        };
    },
};
