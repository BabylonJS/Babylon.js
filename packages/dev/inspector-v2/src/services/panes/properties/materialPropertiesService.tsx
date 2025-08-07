import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISettingsContext } from "../../../services/settingsContext";
import type { ISelectionService } from "../../selectionService";
import type { IPropertiesService } from "./propertiesService";

import { Material } from "core/Materials/material";
import { MultiMaterial } from "core/Materials/multiMaterial";
import { PBRBaseSimpleMaterial } from "core/Materials/PBR/pbrBaseSimpleMaterial";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { SkyMaterial } from "materials/sky/skyMaterial";
import { MaterialGeneralProperties, MaterialStencilProperties, MaterialTransparencyProperties } from "../../../components/properties/materials/materialProperties";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { StandardMaterialLightingAndColorProperties } from "../../../components/properties/materials/standardMaterialLightingAndColorProperties";

export const MaterialPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService, ISettingsContext]> = {
    friendlyName: "Material Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity, SettingsContextIdentity],
    factory: (propertiesService, selectionService, settingsContext) => {
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
                {
                    section: "Normal Map",
                    component: ({ context }) => <NormalMapProperties material={context} />,
                },
            ],
        });

        const pbrMaterialNormalMapsContentRegistration = propertiesService.addSectionContent({
            key: "PBR Material Normal Map Properties",
            predicate: (entity: unknown): entity is MaterialWithNormalMaps => entity instanceof PBRMaterial || entity instanceof PBRBaseSimpleMaterial,
            content: [
                {
                    section: "Normal Map",
                    component: ({ context }) => <NormalMapProperties material={context} />,
                },
            ],
        });

        const skyMaterialRegistration = propertiesService.addSectionContent({
            key: "Sky Material Properties",
            predicate: (entity: unknown) => entity instanceof SkyMaterial,
            content: [
                {
                    section: "Sky",
                    component: ({ context }) => <SkyMaterialProperties material={context} settings={settingsContext} />,
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
                pbrMaterialNormalMapsContentRegistration.dispose();
                skyMaterialRegistration.dispose();
                multiMaterialContentRegistration.dispose();
                pbrBaseMaterialPropertiesRegistration.dispose();
                pbrMaterialContentRegistration.dispose();
            },
        };
    },
};
