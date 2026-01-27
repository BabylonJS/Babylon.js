import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISettingsContext } from "../../../services/settingsContext";
import type { ISelectionService } from "../../selectionService";
import type { IPropertiesService } from "./propertiesService";

import { Material } from "core/Materials/material";
import { MultiMaterial } from "core/Materials/multiMaterial";
import { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { SkyMaterial } from "materials/sky/skyMaterial";
import { MaterialGeneralProperties, MaterialStencilProperties, MaterialTransparencyProperties } from "../../../components/properties/materials/materialProperties";
import { MultiMaterialChildrenProperties } from "../../../components/properties/materials/multiMaterialProperties";
import { NodeMaterialGeneralProperties, NodeMaterialInputProperties } from "../../../components/properties/materials/nodeMaterialProperties";
import { NormalMapProperties } from "../../../components/properties/materials/normalMapProperties";
import {
    OpenPBRMaterialBaseProperties,
    OpenPBRMaterialSpecularProperties,
    OpenPBRMaterialTransmissionProperties,
    OpenPBRMaterialCoatProperties,
    OpenPBRMaterialFuzzProperties,
    OpenPBRMaterialEmissionProperties,
    OpenPBRMaterialThinFilmProperties,
    OpenPBRMaterialGeometryProperties,
} from "../../../components/properties/materials/openpbrMaterialProperties";
import {
    PBRBaseMaterialAdvancedProperties,
    PBRBaseMaterialAnisotropicProperties,
    PBRBaseMaterialChannelsProperties,
    PBRBaseMaterialClearCoatProperties,
    PBRBaseMaterialDebugProperties,
    PBRBaseMaterialGeneralProperties,
    PBRBaseMaterialIridescenceProperties,
    PBRBaseMaterialLevelProperties,
    PBRBaseMaterialLightingAndColorProperties,
    PBRBaseMaterialMetallicWorkflowProperties,
    PBRBaseMaterialRenderingProperties,
    PBRBaseMaterialSheenProperties,
    PBRBaseMaterialSubSurfaceProperties,
    PBRBaseMaterialTransparencyProperties,
} from "../../../components/properties/materials/pbrBaseMaterialProperties";
import { SkyMaterialProperties } from "../../../components/properties/materials/skyMaterialProperties";
import {
    StandardMaterialGeneralProperties,
    StandardMaterialLevelsProperties,
    StandardMaterialLightingAndColorProperties,
    StandardMaterialTexturesProperties,
    StandardMaterialTransparencyProperties,
} from "../../../components/properties/materials/standardMaterialProperties";
import { SelectionServiceIdentity } from "../../selectionService";
import { SettingsContextIdentity } from "../../settingsContext";
import { PropertiesServiceIdentity } from "./propertiesService";

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
                    section: "General",
                    component: ({ context }) => <StandardMaterialGeneralProperties material={context} />,
                },
                {
                    section: "Transparency",
                    component: ({ context }) => <StandardMaterialTransparencyProperties material={context} />,
                },
                {
                    section: "Textures",
                    component: ({ context }) => <StandardMaterialTexturesProperties material={context} selectionService={selectionService} />,
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

        const pbrMaterialPropertyChangedObserver = propertiesService.onPropertyChanged.add((changeInfo) => {
            /**
             * In Inspector V2, all PBR materials (PBRMaterial, PBRMetallicRoughnessMaterial, PBRSpecularGlossinessMaterial) are edited using the PBRBaseMaterial properties.
             * Therefore, when a property of PBRBaseMaterial is changed, we need to mark the material as dirty to ensure the changes are reflected correctly because none of the properties
             * of PBRBaseMaterial are tagged with a decorator that would automatically mark the material as dirty.
             */
            if (changeInfo.entity instanceof PBRBaseMaterial) {
                changeInfo.entity.markAsDirty(Material.AllDirtyFlag);
            }
        });

        const pbrBaseMaterialPropertiesRegistration = propertiesService.addSectionContent({
            key: "PBR Base Material Properties",
            predicate: (entity: unknown) => entity instanceof PBRBaseMaterial,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <PBRBaseMaterialGeneralProperties material={context} />,
                },
                {
                    section: "Transparency",
                    component: ({ context }) => <PBRBaseMaterialTransparencyProperties material={context} />,
                },
                {
                    section: "Textures",
                    component: ({ context }) => <PBRBaseMaterialChannelsProperties material={context} selectionService={selectionService} />,
                },
                {
                    section: "Lighting & Colors",
                    component: ({ context }) => <PBRBaseMaterialLightingAndColorProperties material={context} />,
                },
                {
                    section: "Metallic Workflow",
                    component: ({ context }) => <PBRBaseMaterialMetallicWorkflowProperties material={context} selectionService={selectionService} />,
                },
                {
                    section: "Clear Coat",
                    component: ({ context }) => <PBRBaseMaterialClearCoatProperties material={context} selectionService={selectionService} />,
                },
                {
                    section: "Iridescence",
                    component: ({ context }) => <PBRBaseMaterialIridescenceProperties material={context} selectionService={selectionService} />,
                },
                {
                    section: "Anisotropic",
                    component: ({ context }) => <PBRBaseMaterialAnisotropicProperties material={context} selectionService={selectionService} />,
                },
                {
                    section: "Sheen",
                    component: ({ context }) => <PBRBaseMaterialSheenProperties material={context} selectionService={selectionService} />,
                },
                {
                    section: "SubSurface",
                    component: ({ context }) => <PBRBaseMaterialSubSurfaceProperties material={context} selectionService={selectionService} />,
                },
                {
                    section: "Levels",
                    component: ({ context }) => <PBRBaseMaterialLevelProperties material={context} />,
                },
                {
                    section: "Rendering",
                    component: ({ context }) => <PBRBaseMaterialRenderingProperties material={context} />,
                },
                {
                    section: "Normal Map",
                    component: ({ context }) => <NormalMapProperties material={context} />,
                },
                {
                    section: "Advanced",
                    component: ({ context }) => <PBRBaseMaterialAdvancedProperties material={context} />,
                },
                {
                    section: "Debug",
                    component: ({ context }) => <PBRBaseMaterialDebugProperties material={context} />,
                },
            ],
        });

        const openPBRMaterialPropertiesRegistration = propertiesService.addSectionContent({
            key: "OpenPBR Material Properties",
            predicate: (entity: unknown) => entity instanceof OpenPBRMaterial,
            content: [
                {
                    section: "Base",
                    component: ({ context }) => <OpenPBRMaterialBaseProperties material={context} />,
                },
                {
                    section: "Specular",
                    component: ({ context }) => <OpenPBRMaterialSpecularProperties material={context} />,
                },
                {
                    section: "Transmission",
                    component: ({ context }) => <OpenPBRMaterialTransmissionProperties material={context} />,
                },
                {
                    section: "Coat",
                    component: ({ context }) => <OpenPBRMaterialCoatProperties material={context} />,
                },
                {
                    section: "Fuzz",
                    component: ({ context }) => <OpenPBRMaterialFuzzProperties material={context} />,
                },
                {
                    section: "Emission",
                    component: ({ context }) => <OpenPBRMaterialEmissionProperties material={context} />,
                },
                {
                    section: "Thin Film",
                    component: ({ context }) => <OpenPBRMaterialThinFilmProperties material={context} />,
                },
                {
                    section: "Geometry",
                    component: ({ context }) => <OpenPBRMaterialGeometryProperties material={context} />,
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

        const nodeMaterialContentRegistration = propertiesService.addSectionContent({
            key: "Node Material Properties",
            predicate: (entity: unknown) => entity instanceof NodeMaterial,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <NodeMaterialGeneralProperties material={context} />,
                },
                {
                    section: "Inputs",
                    component: ({ context }) => <NodeMaterialInputProperties material={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                pbrMaterialPropertyChangedObserver.remove();
                materialContentRegistration.dispose();
                standardMaterialContentRegistration.dispose();
                pbrBaseMaterialPropertiesRegistration.dispose();
                openPBRMaterialPropertiesRegistration.dispose();
                skyMaterialRegistration.dispose();
                multiMaterialContentRegistration.dispose();
                nodeMaterialContentRegistration.dispose();
            },
        };
    },
};
