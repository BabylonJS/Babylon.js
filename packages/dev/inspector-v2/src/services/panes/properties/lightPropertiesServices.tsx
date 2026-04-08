import { type ServiceDefinition } from "../../../modularity/serviceDefinition";
import { type ISelectionService, SelectionServiceIdentity } from "../../selectionService";
import { type IPropertiesService, PropertiesServiceIdentity } from "./propertiesService";

import { ClusteredLightContainer } from "core/Lights/Clustered/clusteredLightContainer";
import { DirectionalLight } from "core/Lights/directionalLight";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { Light } from "core/Lights/light";
import { PointLight } from "core/Lights/pointLight";
import { RectAreaLight } from "core/Lights/rectAreaLight";
import { ShadowLight } from "core/Lights/shadowLight";
import { SpotLight } from "core/Lights/spotLight";
import { AreaLightSetupProperties } from "../../../components/properties/lights/areaLightProperties";
import { ClusteredLightContainerLightsProperties, ClusteredLightContainerSetupProperties } from "../../../components/properties/lights/clusteredLightContainerProperties";
import { DirectionalLightDebugProperties, DirectionalLightSetupProperties } from "../../../components/properties/lights/directionalLightProperties";
import { HemisphericLightSetupProperties } from "../../../components/properties/lights/hemisphericLightProperties";
import { LightGeneralProperties } from "../../../components/properties/lights/lightProperties";
import { PointLightSetupProperties } from "../../../components/properties/lights/pointLightProperties";
import { ShadowGeneratorSetupProperties } from "../../../components/properties/lights/shadowGeneratorProperties";
import { ShadowsSetupProperties } from "../../../components/properties/lights/shadowLightProperties";
import { SpotLightSetupProperties } from "../../../components/properties/lights/spotLightProperties";

export const LightPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "Light Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService, selectionService) => {
        const lightContentRegistration = propertiesService.addSectionContent({
            key: "Light Properties",
            predicate: (entity: unknown) => entity instanceof Light,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <LightGeneralProperties light={context} selectionService={selectionService} />,
                },
            ],
        });

        const directionalLightContentRegistration = propertiesService.addSectionContent({
            key: "Directional Light Properties",
            predicate: (entity: unknown) => entity instanceof DirectionalLight,
            content: [
                {
                    section: "Setup",
                    component: DirectionalLightSetupProperties,
                },
                {
                    section: "Debug",
                    component: DirectionalLightDebugProperties,
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

        const clusteredLightContainerContentRegistration = propertiesService.addSectionContent({
            key: "Clustered Light Container Properties",
            predicate: (entity: unknown) => entity instanceof ClusteredLightContainer,
            content: [
                {
                    section: "Setup",
                    component: ClusteredLightContainerSetupProperties,
                },
                {
                    section: "Lights",
                    component: ({ context }) => <ClusteredLightContainerLightsProperties container={context} selectionService={selectionService} />,
                },
            ],
        });

        return {
            dispose: () => {
                clusteredLightContainerContentRegistration.dispose();
                areaLightContentRegistration.dispose();
                shadowLightContentRegistration.dispose();
                spotLightContentRegistration.dispose();
                hemisphericLightContentRegistration.dispose();
                pointLightContentRegistration.dispose();
                directionalLightContentRegistration.dispose();
                lightContentRegistration.dispose();
            },
        };
    },
};
