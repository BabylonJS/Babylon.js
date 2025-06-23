import type { ServiceDefinition } from "../../../../modularity/serviceDefinition";
import type { IPropertiesService } from "../propertiesService";

import { HemisphericLight } from "core/Lights/hemisphericLight";

import { PropertiesServiceIdentity } from "../propertiesService";
import { HemisphericLightSetupProperties } from "../../../../components/properties/lights/hemisphericLightSetupProperties";

export const SetupPropertiesSectionIdentity = Symbol("Setup");

export const HemisphericLightPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Hemispheric Light Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const setupSectionRegistration = propertiesService.addSection({
            order: 2,
            identity: SetupPropertiesSectionIdentity,
        });

        const contentRegistration = propertiesService.addSectionContent({
            key: "Hemispheric Light Properties",
            predicate: (entity: unknown) => entity instanceof HemisphericLight,
            content: [
                // "SETUP" section.
                {
                    section: SetupPropertiesSectionIdentity,
                    order: 0,
                    component: HemisphericLightSetupProperties,
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
