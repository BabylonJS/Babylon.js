import type { ServiceDefinition } from "../../../../modularity/serviceDefinition";
import type { IPropertiesService } from "../propertiesService";

import { SpotLight } from "core/Lights/spotLight";

import { SpotLightSetupProperties } from "../../../../components/properties/lights/spotLightSetupProperties";
import { PropertiesServiceIdentity } from "../propertiesService";

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
            predicate: (entity: unknown) => entity instanceof SpotLight,
            content: [
                // "SETUP" section.
                {
                    section: SetupPropertiesSectionIdentity,
                    order: 0,
                    component: SpotLightSetupProperties,
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
