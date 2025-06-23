import type { ServiceDefinition } from "../../../../modularity/serviceDefinition";
import type { IPropertiesService } from "../propertiesService";

import { HemisphericLight } from "core/Lights/hemisphericLight";

import { GeneralPropertiesSectionIdentity } from "../commonPropertiesService";
import { PropertiesServiceIdentity } from "../propertiesService";
import { HemisphericLightGeneralProperties } from "../../../../components/properties/lights/hemisphericLight/hemisphericLightGeneralProperties";
import { HemisphericLightSetupProperties } from "../../../../components/properties/lights/hemisphericLight/hemisphericLightSetupProperties";
import { HemisphericLightAnimationProperties } from "../../../../components/properties/lights/hemisphericLight/hemisphericLightAnimationProperties";

export const AnimationsPropertiesSectionIdentity = Symbol("Animations");
export const SetupPropertiesSectionIdentity = Symbol("Setup");

export const HemisphericLightPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Hemispheric Light Properties",
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
            key: "Hemispheric Light Properties",
            predicate: (entity: unknown) => entity instanceof HemisphericLight,
            content: [
                // "GENERAL" section.
                {
                    section: GeneralPropertiesSectionIdentity,
                    order: 1,
                    component: HemisphericLightGeneralProperties,
                },

                // "SETUP" section.
                {
                    section: SetupPropertiesSectionIdentity,
                    order: 0,
                    component: HemisphericLightSetupProperties,
                },

                // "ANIMATIONS" section.
                {
                    section: AnimationsPropertiesSectionIdentity,
                    order: 0,
                    component: HemisphericLightAnimationProperties,
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
