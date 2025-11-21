import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { DirectionalLight } from "core/Lights/directionalLight";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { PointLight } from "core/Lights/pointLight";
import { RectAreaLight } from "core/Lights/rectAreaLight";
import { ShadowLight } from "core/Lights/shadowLight";
import { SpotLight } from "core/Lights/spotLight";
import { AreaLightSetupProperties } from "../../../components/properties/lights/areaLightProperties";
import { DirectionalLightSetupProperties } from "../../../components/properties/lights/directionalLightProperties";
import { HemisphericLightSetupProperties } from "../../../components/properties/lights/hemisphericLightProperties";
import { PointLightSetupProperties } from "../../../components/properties/lights/pointLightProperties";
import { ShadowGeneratorSetupProperties } from "../../../components/properties/lights/shadowGeneratorProperties";
import { ShadowsSetupProperties } from "../../../components/properties/lights/shadowLightProperties";
import { SpotLightSetupProperties } from "../../../components/properties/lights/spotLightProperties";
import { PropertiesServiceIdentity } from "./propertiesService";

export const LightPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Light Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const directionalLightContentRegistration = propertiesService.addSectionContent({
            key: "Directional Light Properties",
            predicate: (entity: unknown) => entity instanceof DirectionalLight,
            content: [
                {
                    section: "Setup",
                    component: DirectionalLightSetupProperties,
                },
            ],
        });

        const pointLightContentRegistration = propertiesService.addSectionContent({
            key: "Point Light Properties",
            predicate: (entity: unknown) => entity instanceof PointLight,
            content: [
                {
                    section: "Setup",
                    component: PointLightSetupProperties,
                },
            ],
        });

        const hemisphericLightContentRegistration = propertiesService.addSectionContent({
            key: "Hemispheric Light Properties",
            predicate: (entity: unknown) => entity instanceof HemisphericLight,
            content: [
                {
                    section: "Setup",
                    component: HemisphericLightSetupProperties,
                },
            ],
        });

        const spotLightContentRegistration = propertiesService.addSectionContent({
            key: "Spot Light Properties",
            predicate: (entity: unknown) => entity instanceof SpotLight,
            content: [
                {
                    section: "Setup",
                    component: SpotLightSetupProperties,
                },
            ],
        });

        const shadowLightContentRegistration = propertiesService.addSectionContent({
            key: "Shadow Light Properties",
            predicate: (entity: unknown) => entity instanceof ShadowLight,
            content: [
                {
                    section: "Shadows",
                    component: ShadowsSetupProperties,
                },
                {
                    section: "Shadow Generator",
                    component: ShadowGeneratorSetupProperties,
                },
            ],
        });

        const areaLightContentRegistration = propertiesService.addSectionContent({
            key: "Area Light Properties",
            predicate: (entity: unknown) => entity instanceof RectAreaLight,
            content: [
                {
                    section: "Setup",
                    component: AreaLightSetupProperties,
                },
            ],
        });

        return {
            dispose: () => {
                areaLightContentRegistration.dispose();
                shadowLightContentRegistration.dispose();
                spotLightContentRegistration.dispose();
                hemisphericLightContentRegistration.dispose();
                pointLightContentRegistration.dispose();
                directionalLightContentRegistration.dispose();
            },
        };
    },
};
