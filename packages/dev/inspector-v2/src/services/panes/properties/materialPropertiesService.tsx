import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";
import type { ISelectionService } from "../../selectionService";

import { PropertiesServiceIdentity } from "./propertiesService";
import { SelectionServiceIdentity } from "../../selectionService";

import { Material, MultiMaterial } from "core/Materials";
import { MaterialGeneralProperties, MaterialStencilProperties, MaterialTransparencyProperties } from "../../../components/properties/materials/materialProperties";
import { MultiMaterialChildrenProperties } from "../../../components/properties/materials/multiMaterialProperties";
import { MaterialGeneralProperties, MaterialStencilProperties, MaterialTransparencyProperties } from "../../../components/properties/materials/materialProperties";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { StandardMaterialLightingAndColorProperties } from "../../../components/properties/materials/standardMaterialLightingAndColorProperties";

export const MaterialPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "Material Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService, selectionService) => {
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

        const multiMaterialContentRegistration = propertiesService.addSectionContent({
            key: "Multi Material Properties",
            predicate: (entity: unknown) => entity instanceof MultiMaterial,
            content: [
                {
                    section: "Children",
                    component: ({ context }) => <MultiMaterialChildrenProperties multiMaterial={context} selectionService={selectionService} />,
                },
            ],
        });

        return {
            dispose: () => {
                materialContentRegistration.dispose();
                standardMaterialContentRegistration.dispose();
                multiMaterialContentRegistration.dispose();
            },
        };
    },
};
