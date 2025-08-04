import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";
import type { ISelectionService } from "../../selectionService";

import { PropertiesServiceIdentity } from "./propertiesService";
import { SelectionServiceIdentity } from "../../selectionService";

import { Material } from "core/Materials/material";
import { MaterialGeneralProperties, MaterialStencilProperties, MaterialTransparencyProperties } from "../../../components/properties/materials/materialProperties";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { StandardMaterialLightingAndColorProperties } from "../../../components/properties/materials/standardMaterialLightingAndColorProperties";
import { StandardMaterialTexturesProperties } from "../../../components/properties/materials/standardMaterialTexturesProperties";
import { StandardMaterialLevelsProperties } from "../../../components/properties/materials/standardMaterialLevelsProperties";

export const MaterialPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "Material Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService) => {
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
                    section: "Textures",
                    component: ({ context }) => <StandardMaterialTexturesProperties standardMaterial={context} />,
                },
                {
                    section: "Lighting & Colors",
                    component: ({ context }) => <StandardMaterialLightingAndColorProperties standardMaterial={context} />,
                },
                {
                    section: "Levels",
                    component: ({ context }) => <StandardMaterialLevelsProperties standardMaterial={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                materialContentRegistration.dispose();
                standardMaterialContentRegistration.dispose();
            },
        };
    },
};
