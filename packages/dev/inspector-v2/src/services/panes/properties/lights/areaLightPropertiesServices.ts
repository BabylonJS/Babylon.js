import type { ServiceDefinition } from "../../../../modularity/serviceDefinition";
import type { IPropertiesService } from "../propertiesService";

import { RectAreaLight } from "core/Lights/rectAreaLight";

import { AreaLightSetupProperties } from "../../../../components/properties/lights/areaLightSetupProperties";
import { PropertiesServiceIdentity } from "../propertiesService";

export const AreaLightPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Area Light Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const contentRegistration = propertiesService.addSectionContent({
            key: "Area Light Properties",
            predicate: (entity: unknown) => entity instanceof RectAreaLight,
            content: [
                {
                    section: "Setup",
                    component: AreaLightSetupProperties,
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
