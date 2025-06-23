import type { ServiceDefinition } from "../../../../modularity/serviceDefinition";
import type { IPropertiesService } from "../propertiesService";

import { PointLight } from "core/Lights/pointLight";

import { PropertiesServiceIdentity } from "../propertiesService";
import { PointLightSetupProperties } from "../../../../components/properties/lights/pointLightSetupProperties";
import { ShadowsSetupProperties } from "../../../../components/properties/lights/shadowsSetupProperties";
import { ShadowGeneratorSetupProperties } from "../../../../components/properties/lights/shadowGeneratorSetupProperties";

export const SetupPropertiesSectionIdentity = Symbol("Setup");
export const ShadowsSetupPropertiesSectionIdentity = Symbol("Shadows");
export const ShadowGeneratorSetupPropertiesSectionIdentity = Symbol("Shadow Generator");

export const PointLightPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Point Light Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const setupSectionRegistration = propertiesService.addSection({
            order: 2,
            identity: SetupPropertiesSectionIdentity,
        });

        const shadowsSectionRegistration = propertiesService.addSection({
            order: 3,
            identity: ShadowsSetupPropertiesSectionIdentity,
        });

        const shadowGeneratorSectionRegistration = propertiesService.addSection({
            order: 4,
            identity: ShadowGeneratorSetupPropertiesSectionIdentity,
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

        const shadowContentRegistration = propertiesService.addSectionContent({
            key: "Point Light Shadow Properties",
            predicate: (entity: unknown) => entity instanceof PointLight,
            content: [
                // "SETUP" section.
                {
                    section: ShadowsSetupPropertiesSectionIdentity,
                    order: 0,
                    component: ShadowsSetupProperties,
                },
            ],
        });

        const shadowGeneratorContentRegistration = propertiesService.addSectionContent({
            key: "Point Light Shadow Generator Properties",
            predicate: (entity: unknown) => entity instanceof PointLight,
            content: [
                // "SETUP" section.
                {
                    section: ShadowGeneratorSetupPropertiesSectionIdentity,
                    order: 0,
                    component: ShadowGeneratorSetupProperties,
                },
            ],
        });

        return {
            dispose: () => {
                contentRegistration.dispose();
                shadowContentRegistration.dispose();
                shadowGeneratorContentRegistration.dispose();
                setupSectionRegistration.dispose();
                shadowsSectionRegistration.dispose();
                shadowGeneratorSectionRegistration.dispose();
            },
        };
    },
};
