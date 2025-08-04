import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";
import type { ISelectionService } from "../../selectionService";

import { PropertiesServiceIdentity } from "./propertiesService";
import { SelectionServiceIdentity } from "../../selectionService";

import { MaterialGeneralProperties, MaterialStencilProperties, MaterialTransparencyProperties } from "../../../components/properties/materials/materialProperties";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { StandardMaterialLightingAndColorProperties } from "../../../components/properties/materials/standardMaterialLightingAndColorProperties";
import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import { PBRBaseMaterialClearCoatProperties } from "../../../components/properties/materials/pbrBaseMaterialProperties";

export const MaterialPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "PBR Material Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService) => {
        const materialContentRegistration = propertiesService.addSectionContent({
            key: "PBR Material Properties",
            predicate: (entity: unknown) => entity instanceof PBRBaseMaterial,
            content: [
                {
                    section: "Clear Coat",
                    component: ({ context }) => <PBRBaseMaterialClearCoatProperties material={context} />,
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

        return {
            dispose: () => {
                materialContentRegistration.dispose();
                standardMaterialContentRegistration.dispose();
            },
        };
    },
};
