import type { ServiceDefinition } from "../../../../modularity/serviceDefinition";
import type { IPropertiesService } from "../propertiesService";

import { PointLight } from "core/Lights/pointLight";

import { GeneralPropertiesSectionIdentity } from "../commonPropertiesService";
import { PropertiesServiceIdentity } from "../propertiesService";
import { PointLightGeneralProperties } from "../../../../components/properties/lights/pointLight/pointLightGeneralProperties";
import { PointLightSetupProperties } from "../../../../components/properties/lights/pointLight/pointLightSetupProperties";
import { PointLightAnimationProperties } from "../../../../components/properties/lights/pointLight/pointLightAnimationProperties";

export const AnimationsPropertiesSectionIdentity = Symbol("Animations");
export const SetupPropertiesSectionIdentity = Symbol("Setup");

export const SpotLightPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Spot Lights Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const animationsSectionRegistration = propertiesService.addSection({
            order: 1,
            identity: AnimationsPropertiesSectionIdentity,
        });

        const setupSectionRegistration = propertiesService.addSection({
            order: 2,
            identity: SetupPropertiesSectionIdentity,
        });

        const contentRegistration = propertiesService.addSectionContent({
            key: "Spot Light Properties",
            predicate: (entity: unknown) => entity instanceof PointLight,
            content: [
                // "GENERAL" section.
                {
                    section: GeneralPropertiesSectionIdentity,
                    order: 1,
                    component: PointLightGeneralProperties,
                },

                // "SETUP" section.
                {
                    section: SetupPropertiesSectionIdentity,
                    order: 0,
                    component: PointLightSetupProperties,
                },

                // "ANIMATIONS" section.
                {
                    section: AnimationsPropertiesSectionIdentity,
                    order: 0,
                    component: PointLightAnimationProperties,
                },
            ],
        });

        return {
            dispose: () => {
                contentRegistration.dispose();
                animationsSectionRegistration.dispose();
                setupSectionRegistration.dispose();
            },
        };
    },
};
