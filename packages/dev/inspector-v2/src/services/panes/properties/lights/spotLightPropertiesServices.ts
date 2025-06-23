import type { ServiceDefinition } from "../../../../modularity/serviceDefinition";
import type { IPropertiesService } from "../propertiesService";

import { PointLight } from "core/Lights/pointLight";

import { PropertiesServiceIdentity } from "../propertiesService";
import { PointLightSetupProperties } from "../../../../components/properties/lights/pointLightSetupProperties";

export const SetupPropertiesSectionIdentity = Symbol("Setup");

export const SpotLightPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Spot Lights Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const setupSectionRegistration = propertiesService.addSection({
            order: 2,
            identity: SetupPropertiesSectionIdentity,
        });

        const contentRegistration = propertiesService.addSectionContent({
            key: "Spot Light Properties",
            predicate: (entity: unknown) => entity instanceof PointLight,
            content: [
                // "SETUP" section.
                {
                    section: SetupPropertiesSectionIdentity,
                    order: 0,
                    component: PointLightSetupProperties,
                },
            ],
        });

        return {
            dispose: () => {
                contentRegistration.dispose();
                setupSectionRegistration.dispose();
            },
        };
    },
};
