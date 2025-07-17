import type { ServiceDefinition } from "../../../../modularity/serviceDefinition";
import type { IPropertiesService } from "../propertiesService";

import { PointLight } from "core/Lights/pointLight";

import { PointLightSetupProperties } from "../../../../components/properties/lights/pointLightSetupProperties";
import { PropertiesServiceIdentity } from "../propertiesService";

export const PointLightPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Point Light Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const contentRegistration = propertiesService.addSectionContent({
            key: "Point Light Properties",
            predicate: (entity: unknown) => entity instanceof PointLight,
            content: [
                {
                    section: "Setup",
                    component: PointLightSetupProperties,
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
