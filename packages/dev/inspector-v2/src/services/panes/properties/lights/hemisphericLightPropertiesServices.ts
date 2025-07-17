import type { ServiceDefinition } from "../../../../modularity/serviceDefinition";
import type { IPropertiesService } from "../propertiesService";

import { HemisphericLight } from "core/Lights/hemisphericLight";

import { HemisphericLightSetupProperties } from "../../../../components/properties/lights/hemisphericLightSetupProperties";
import { PropertiesServiceIdentity } from "../propertiesService";

export const HemisphericLightPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Hemispheric Light Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const contentRegistration = propertiesService.addSectionContent({
            key: "Hemispheric Light Properties",
            predicate: (entity: unknown) => entity instanceof HemisphericLight,
            content: [
                {
                    section: "Setup",
                    component: HemisphericLightSetupProperties,
                },
            ],
        });

        return {
            dispose: () => {
                contentRegistration.dispose();
            },
        };
    },
};
