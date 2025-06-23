import type { ServiceDefinition } from "../../../../modularity/serviceDefinition";
import type { IPropertiesService } from "../propertiesService";

import { AreaLight } from "core/Lights/areaLight";

import { PropertiesServiceIdentity } from "../propertiesService";
import { AreaLightSetupProperties } from "../../../../components/properties/lights/areaLightSetupProperties";

export const SetupPropertiesSectionIdentity = Symbol("Setup");

export const AreaLightPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Area Light Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const setupSectionRegistration = propertiesService.addSection({
            order: 2,
            identity: SetupPropertiesSectionIdentity,
        });

        const contentRegistration = propertiesService.addSectionContent({
            key: "Area Light Properties",
            predicate: (entity: unknown) => entity instanceof AreaLight,
            content: [
                // "SETUP" section.
                {
                    section: SetupPropertiesSectionIdentity,
                    order: 0,
                    component: AreaLightSetupProperties,
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
