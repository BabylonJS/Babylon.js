import type { ServiceDefinition } from "../../../../modularity/serviceDefinition";
import type { IPropertiesService } from "../propertiesService";

import { PointLight } from "core/Lights/pointLight";

import { PointLightSetupProperties } from "../../../../components/properties/lights/pointLightSetupProperties";
import { PropertiesServiceIdentity } from "../propertiesService";

export const SetupPropertiesSectionIdentity = Symbol("Setup");

export const PointLightPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Point Light Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const setupSectionRegistration = propertiesService.addSection({
            order: 2,
            identity: SetupPropertiesSectionIdentity,
        });

        const contentRegistration = propertiesService.addSectionContent({
            key: "Point Light Properties",
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
