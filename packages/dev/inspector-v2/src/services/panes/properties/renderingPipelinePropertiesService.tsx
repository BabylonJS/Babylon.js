import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { PropertiesServiceIdentity } from "./propertiesService";

export const RenderingPipelinePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Rendering Pipeline Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        // TODO: Add content registrations for each section and for each type in the RenderingPipeline class hierarchy.

        return {
            dispose: () => {
                // TODO: Dispose content registrations.
            },
        };
    },
};
