import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";
import type { ISelectionService } from "../../selectionService";

import { PropertiesServiceIdentity } from "./propertiesService";
import { SelectionServiceIdentity } from "../../selectionService";

import { Material } from "core/Materials/material";
import { MaterialGeneralProperties, MaterialStencilProperties, MaterialTransparencyProperties } from "../../../components/properties/materials/materialProperties";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { StandardMaterialLightingAndColorProperties } from "../../../components/properties/materials/standardMaterialLightingAndColorProperties";

import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { PBRMaterialLightingAndColorProperties } from "../../../components/properties/materials/pbrMaterialLightingAndColorProperties";

import {
    PBRBaseMaterialClearCoatProperties,
    PBRBaseMaterialIridescenceProperties,
    PBRBaseMaterialAnisotropicProperties,
    PBRBaseMaterialSheenProperties,
} from "../../../components/properties/materials/pbrBaseMaterialProperties";

import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import { PBRBaseSimpleMaterial } from "core/Materials/PBR/pbrBaseSimpleMaterial";

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
                    section: "Lighting & Colors",
                    component: ({ context }) => <StandardMaterialLightingAndColorProperties standardMaterial={context} />,
                },
            ],
        });

        const pbrBaseMaterialPropertiesRegistration = propertiesService.addSectionContent({
            key: "PBR Base Material Properties",
            predicate: (entity: unknown): entity is PBRBaseMaterial => entity instanceof PBRBaseMaterial && !(entity instanceof PBRBaseSimpleMaterial),
            content: [
                {
                    section: "Clear Coat",
                    component: ({ context }) => <PBRBaseMaterialClearCoatProperties material={context} />,
                },
                {
                    section: "Iridescence",
                    component: ({ context }) => <PBRBaseMaterialIridescenceProperties material={context} />,
                },
                {
                    section: "Anisotropic",
                    component: ({ context }) => <PBRBaseMaterialAnisotropicProperties material={context} />,
                },
                {
                    section: "Sheen",
                    component: ({ context }) => <PBRBaseMaterialSheenProperties material={context} />,
                },
            ],
        });

        const pbrMaterialContentRegistration = propertiesService.addSectionContent({
            key: "PBR Material Properties",
            predicate: (entity: unknown) => entity instanceof PBRMaterial,
            content: [
                {
                    section: "Lighting & Colors",
                    component: ({ context }) => <PBRMaterialLightingAndColorProperties pbrMaterial={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                materialContentRegistration.dispose();
                standardMaterialContentRegistration.dispose();
                pbrBaseMaterialPropertiesRegistration.dispose();
                pbrMaterialContentRegistration.dispose();
            },
        };
    },
};
