import type { ServiceDefinition } from "../../../../modularity/serviceDefinition";
import type { IPropertiesService } from "../propertiesService";

import { DirectionalLight } from "core/Lights/directionalLight";

import { DirectionalLightSetupProperties } from "../../../../components/properties/lights/directionalLightSetupProperties";
import { PropertiesServiceIdentity } from "../propertiesService";

export const SetupPropertiesSectionIdentity = Symbol("Setup");

export const DirectionalLightPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Directional Light Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const setupSectionRegistration = propertiesService.addSection({
            order: 2,
            identity: SetupPropertiesSectionIdentity,
        });

        const contentRegistration = propertiesService.addSectionContent({
            key: "Directional Light Properties",
            predicate: (entity: unknown) => entity instanceof DirectionalLight,
            content: [
                // "SETUP" section.
                {
                    section: SetupPropertiesSectionIdentity,
                    order: 0,
                    component: DirectionalLightSetupProperties,
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
