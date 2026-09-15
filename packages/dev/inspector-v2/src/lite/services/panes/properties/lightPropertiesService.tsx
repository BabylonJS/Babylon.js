import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import {
    DirectionalLightSetupProperties,
    HemisphericLightSetupProperties,
    LightGeneralProperties,
    PointLightSetupProperties,
    SpotLightSetupProperties,
} from "../../../components/properties/lightProperties";
import { IsDirectionalLight, IsHemisphericLight, IsLight, IsPointLight, IsSpotLight } from "../../../sceneEntityUtils";
import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";

export const LightPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Babylon Lite Light Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const registrations = [
            propertiesService.addSectionContent({
                key: "Babylon Lite Light Properties",
                predicate: IsLight,
                content: [{ section: "General", component: ({ context }) => <LightGeneralProperties light={context} /> }],
            }),
            propertiesService.addSectionContent({
                key: "Babylon Lite Directional Light Properties",
                predicate: IsDirectionalLight,
                content: [{ section: "Setup", component: ({ context }) => <DirectionalLightSetupProperties light={context} /> }],
            }),
            propertiesService.addSectionContent({
                key: "Babylon Lite Point Light Properties",
                predicate: IsPointLight,
                content: [{ section: "Setup", component: ({ context }) => <PointLightSetupProperties light={context} /> }],
            }),
            propertiesService.addSectionContent({
                key: "Babylon Lite Spot Light Properties",
                predicate: IsSpotLight,
                content: [{ section: "Setup", component: ({ context }) => <SpotLightSetupProperties light={context} /> }],
            }),
            propertiesService.addSectionContent({
                key: "Babylon Lite Hemispheric Light Properties",
                predicate: IsHemisphericLight,
                content: [{ section: "Setup", component: ({ context }) => <HemisphericLightSetupProperties light={context} /> }],
            }),
        ];

        return {
            dispose: () => registrations.forEach((registration) => registration.dispose()),
        };
    },
};
