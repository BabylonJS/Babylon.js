import type { ServiceDefinition } from "../../../../modularity/serviceDefinition";
import type { IPropertiesService } from "../propertiesService";

import { ShadowLight } from "core/Lights/shadowLight";

import { ShadowGeneratorSetupProperties } from "../../../../components/properties/lights/shadowGeneratorSetupProperties";
import { ShadowsSetupProperties } from "../../../../components/properties/lights/shadowsSetupProperties";
import { PropertiesServiceIdentity } from "../propertiesService";

export const ShadowsSetupPropertiesSectionIdentity = Symbol("Shadows");
export const ShadowGeneratorSetupPropertiesSectionIdentity = Symbol("Shadow Generator");

export const ShadowLightPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Shadow Lights Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const shadowsSectionRegistration = propertiesService.addSection({
            order: 3,
            identity: ShadowsSetupPropertiesSectionIdentity,
        });

        const shadowGeneratorSectionRegistration = propertiesService.addSection({
            order: 4,
            identity: ShadowGeneratorSetupPropertiesSectionIdentity,
        });

        const shadowContentRegistration = propertiesService.addSectionContent({
            key: "Shadow Light Shadow Properties",
            predicate: (entity: unknown) => entity instanceof ShadowLight,
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
            key: "Shadow Light Shadow Generator Properties",
            predicate: (entity: unknown) => entity instanceof ShadowLight,
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
                shadowContentRegistration.dispose();
                shadowGeneratorContentRegistration.dispose();
                shadowsSectionRegistration.dispose();
                shadowGeneratorSectionRegistration.dispose();
            },
        };
    },
};
