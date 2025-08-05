import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { PropertiesServiceIdentity } from "./propertiesService";

import { Material } from "core/Materials";
import { SkyMaterial } from "materials/sky/skyMaterial";
import { SkyMaterialProperties } from "../../../components/properties/materials/skyMaterialProperties";
import { SettingsContextIdentity } from "../../settingsContext";
import type { ISettingsContext } from "../../../services/settingsContext";
import { MaterialGeneralProperties, MaterialStencilProperties, MaterialTransparencyProperties } from "../../../components/properties/materials/materialProperties";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { StandardMaterialLightingAndColorProperties } from "../../../components/properties/materials/standardMaterialLightingAndColorProperties";

export const MaterialPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISettingsContext]> = {
    friendlyName: "Material Properties",
    consumes: [PropertiesServiceIdentity, SettingsContextIdentity],
    factory: (propertiesService, settingsContext) => {
        const materialContentRegistration = propertiesService.addSectionContent({
            key: "Material Properties",
            predicate: (entity: unknown) => entity instanceof Material,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <MaterialGeneralProperties material={context} />,
                },
                {
                    section: "Transparency",
                    component: ({ context }) => <MaterialTransparencyProperties material={context} />,
                },
                {
                    section: "Stencil",
                    component: ({ context }) => <MaterialStencilProperties material={context} />,
                },
            ],
        });

        const standardMaterialContentRegistration = propertiesService.addSectionContent({
            key: "Standard Material Properties",
            predicate: (entity: unknown) => entity instanceof StandardMaterial,
            content: [
                {
                    section: "Lighting & Colors",
                    component: ({ context }) => <StandardMaterialLightingAndColorProperties standardMaterial={context} />,
                },
            ],
        });

        const skyMaterialRegistration = propertiesService.addSectionContent({
            key: "Sky",
            predicate: (entity: unknown) => entity instanceof SkyMaterial,
            content: [
                {
                    section: "Sky",
                    component: ({ context }) => <SkyMaterialProperties material={context} settings={settingsContext} />,
                },
            ],
        });

        return {
            dispose: () => {
                materialContentRegistration.dispose();
                skyMaterialRegistration.dispose();
                standardMaterialContentRegistration.dispose();
            },
        };
    },
};
