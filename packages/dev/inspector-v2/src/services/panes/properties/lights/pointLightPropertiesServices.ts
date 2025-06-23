import type { ServiceDefinition } from "../../../../modularity/serviceDefinition";
import type { IPropertiesService } from "../propertiesService";

import { AreaLight } from "core/Lights/areaLight";

import { GeneralPropertiesSectionIdentity } from "../commonPropertiesService";
import { PropertiesServiceIdentity } from "../propertiesService";
import { AreaLightGeneralProperties } from "../../../../components/properties/lights/areaLight/areaLightGeneralProperties";
import { AreaLightSetupProperties } from "../../../../components/properties/lights/areaLight/areaLightSetupProperties";
import { AreaLightAnimationProperties } from "../../../../components/properties/lights/areaLight/areaLightAnimationProperties";

export const AnimationsPropertiesSectionIdentity = Symbol("Animations");
export const SetupPropertiesSectionIdentity = Symbol("Setup");

export const AreaLightsPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Area Lights Properties",
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
            key: "Area Light Properties",
            predicate: (entity: unknown) => entity instanceof AreaLight,
            content: [
                // "GENERAL" section.
                {
                    section: GeneralPropertiesSectionIdentity,
                    order: 1,
                    component: AreaLightGeneralProperties,
                },

                // "SETUP" section.
                {
                    section: SetupPropertiesSectionIdentity,
                    order: 0,
                    component: AreaLightSetupProperties,
                },

                // "ANIMATIONS" section.
                {
                    section: AnimationsPropertiesSectionIdentity,
                    order: 0,
                    component: AreaLightAnimationProperties,
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
