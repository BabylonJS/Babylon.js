import type { FunctionComponent } from "react";

import { BoundProperty } from "../boundProperty";
import { useProperty } from "../../../hooks/compoundPropertyHooks";

import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";

import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { Vector2PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";

import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import type { DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { Constants } from "core/Engines/constants";
import { TextureSelectorPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/entitySelectorPropertyLine";
import type { ISelectionService } from "../../../services/selectionService";
import { Color3 } from "core/Maths/math.color";

declare module "core/Materials/PBR/pbrSheenConfiguration" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface PBRSheenConfiguration {
        _useRoughness: boolean;
    }
}

export const LightFalloffOptions = [
    { label: "Physical", value: PBRBaseMaterial.LIGHTFALLOFF_PHYSICAL },
    { label: "glTF", value: PBRBaseMaterial.LIGHTFALLOFF_GLTF },
    { label: "Standard", value: PBRBaseMaterial.LIGHTFALLOFF_STANDARD },
] as const satisfies DropdownOption<number>[];

export const RealTimeFilteringQualityOptions = [
    { label: "Low", value: Constants.TEXTURE_FILTERING_QUALITY_LOW },
    { label: "Medium", value: Constants.TEXTURE_FILTERING_QUALITY_MEDIUM },
    { label: "High", value: Constants.TEXTURE_FILTERING_QUALITY_HIGH },
] as const satisfies DropdownOption<number>[];

export const BaseDiffuseModelOptions = [
    { label: "Lambert", value: Constants.MATERIAL_DIFFUSE_MODEL_LAMBERT },
    { label: "Burley", value: Constants.MATERIAL_DIFFUSE_MODEL_BURLEY },
    { label: "OpenPBR", value: Constants.MATERIAL_DIFFUSE_MODEL_E_OREN_NAYAR },
] as const satisfies DropdownOption<number>[];

export const DielectricSpecularModelOptions = [
    { label: "glTF", value: Constants.MATERIAL_DIELECTRIC_SPECULAR_MODEL_GLTF },
    { label: "OpenPBR", value: Constants.MATERIAL_DIELECTRIC_SPECULAR_MODEL_OPENPBR },
] as const satisfies DropdownOption<number>[];

export const ConductorSpecularModelOptions = [
    { label: "glTF", value: Constants.MATERIAL_CONDUCTOR_SPECULAR_MODEL_GLTF },
    { label: "OpenPBR", value: Constants.MATERIAL_CONDUCTOR_SPECULAR_MODEL_OPENPBR },
] as const satisfies DropdownOption<number>[];

export const DebugMode = [
    { label: "None", value: 0 },
    // Geometry
    { label: "Normalized position", value: 1 },
    { label: "Normals", value: 2 },
    { label: "Tangents", value: 3 },
    { label: "Bitangents", value: 4 },
    { label: "Bump Normals", value: 5 },
    { label: "UV1", value: 6 },
    { label: "UV2", value: 7 },
    { label: "ClearCoat Normals", value: 8 },
    { label: "ClearCoat Tangents", value: 9 },
    { label: "ClearCoat Bitangents", value: 10 },
    { label: "Anisotropic Normals", value: 11 },
    { label: "Anisotropic Tangents", value: 12 },
    { label: "Anisotropic Bitangents", value: 13 },
    // Maps
    { label: "Albedo Map", value: 20 },
    { label: "Ambient Map", value: 21 },
    { label: "Opacity Map", value: 22 },
    { label: "Emissive Map", value: 23 },
    { label: "Light Map", value: 24 },
    { label: "Metallic Map", value: 25 },
    { label: "Reflectivity Map", value: 26 },
    { label: "ClearCoat Map", value: 27 },
    { label: "ClearCoat Tint Map", value: 28 },
    { label: "Sheen Map", value: 29 },
    { label: "Anisotropic Map", value: 30 },
    { label: "Thickness Map", value: 31 },
    { label: "Bump Map", value: 32 },
    // Env
    { label: "Env Refraction", value: 40 },
    { label: "Env Reflection", value: 41 },
    { label: "Env Clear Coat", value: 42 },
    // Lighting
    { label: "Direct Diffuse", value: 50 },
    { label: "Direct Specular", value: 51 },
    { label: "Direct Clear Coat", value: 52 },
    { label: "Direct Sheen", value: 53 },
    { label: "Env Irradiance", value: 54 },
    // Lighting Params
    { label: "Surface Albedo", value: 60 },
    { label: "Reflectance 0", value: 61 },
    { label: "Metallic", value: 62 },
    { label: "Metallic F0", value: 71 },
    { label: "Roughness", value: 63 },
    { label: "AlphaG", value: 64 },
    { label: "NdotV", value: 65 },
    { label: "ClearCoat Color", value: 66 },
    { label: "ClearCoat Roughness", value: 67 },
    { label: "ClearCoat NdotV", value: 68 },
    { label: "Transmittance", value: 69 },
    { label: "Refraction Transmittance", value: 70 },
    { label: "Glossiness", value: 72 },
    { label: "Base Color", value: 73 },
    { label: "Specular Color", value: 74 },
    { label: "Emissive Color", value: 75 },
    // Misc
    { label: "SEO", value: 80 },
    { label: "EHO", value: 81 },
    { label: "Energy Factor", value: 82 },
    { label: "Specular Reflectance", value: 83 },
    { label: "Clear Coat Reflectance", value: 84 },
    { label: "Sheen Reflectance", value: 85 },
    { label: "Luminance Over Alpha", value: 86 },
    { label: "Alpha", value: 87 },
    { label: "Albedo Alpha", value: 88 },
    { label: "Ambient occlusion color", value: 89 },
] as const satisfies DropdownOption<number>[];

export const PBRBaseMaterialGeneralProperties: FunctionComponent<{ material: PBRBaseMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Disable Lighting" target={material} propertyKey="_disableLighting" />
        </>
    );
};

export const PBRBaseMaterialTransparencyProperties: FunctionComponent<{ material: PBRBaseMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            {material._albedoTexture && (
                <>
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Albedo texture has alpha"
                        target={material._albedoTexture}
                        propertyKey="hasAlpha"
                        propertyPath="_albedoTexture.hasAlpha"
                    />
                </>
            )}
            <BoundProperty component={SwitchPropertyLine} label="Use alpha from albedo texture" target={material} propertyKey="_useAlphaFromAlbedoTexture" />
        </>
    );
};

export const PBRBaseMaterialChannelsProperties: FunctionComponent<{ material: PBRBaseMaterial; selectionService: ISelectionService }> = (props) => {
    const { material, selectionService } = props;
    const scene = material.getScene();

    const selectEntity = (entity: unknown) => (selectionService.selectedEntity = entity);

    return (
        <>
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Albedo"
                target={material}
                propertyKey="_albedoTexture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Base Weight"
                target={material}
                propertyKey="_baseWeightTexture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Base Diffuse Roughness"
                target={material}
                propertyKey="_baseDiffuseRoughnessTexture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Metallic Roughness"
                target={material}
                propertyKey="_metallicTexture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Reflection"
                target={material}
                propertyKey="_reflectionTexture"
                scene={scene}
                cubeOnly
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Refraction"
                target={material.subSurface}
                propertyKey="refractionTexture"
                propertyPath="subSurface.refractionTexture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Reflectivity"
                target={material}
                propertyKey="_reflectivityTexture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Micro Surface"
                target={material}
                propertyKey="_microSurfaceTexture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Bump"
                target={material}
                propertyKey="_bumpTexture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Emissive"
                target={material}
                propertyKey="_emissiveTexture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Opacity"
                target={material}
                propertyKey="_opacityTexture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Ambient"
                target={material}
                propertyKey="_ambientTexture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Lightmap"
                target={material}
                propertyKey="_lightmapTexture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Detailmap"
                target={material.detailMap}
                propertyKey="texture"
                propertyPath="detailMap.texture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty component={SwitchPropertyLine} label="Use Lightmap as Shadowmap" target={material} propertyKey="_useLightmapAsShadowmap" />
            <BoundProperty component={SwitchPropertyLine} label="Use Detailmap" target={material.detailMap} propertyKey="isEnabled" propertyPath="detailMap.isEnabled" />
            <BoundProperty component={SwitchPropertyLine} label="Use Decalmap" target={material.decalMap} propertyKey="isEnabled" propertyPath="decalMap.isEnabled" />
        </>
    );
};

export const PBRBaseMaterialLightingAndColorProperties: FunctionComponent<{ material: PBRBaseMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty component={Color3PropertyLine} label="Albedo" target={material} propertyKey="_albedoColor" isLinearMode />
            <BoundProperty component={SyncedSliderPropertyLine} label="Base Weight" target={material} propertyKey="_baseWeight" min={0} max={1} step={0.01} />
            <BoundProperty component={Color3PropertyLine} label="Reflectivity" target={material} propertyKey="_reflectivityColor" isLinearMode />
            <BoundProperty component={SyncedSliderPropertyLine} label="Micro Surface" target={material} propertyKey="_microSurface" min={0} max={1} step={0.01} />
            <BoundProperty component={Color3PropertyLine} label="Emissive" target={material} propertyKey="_emissiveColor" isLinearMode />
            <BoundProperty component={Color3PropertyLine} label="Ambient" target={material} propertyKey="_ambientColor" isLinearMode />
            <BoundProperty component={NumberDropdownPropertyLine} label="Light Falloff" target={material} propertyKey="_lightFalloff" options={LightFalloffOptions} />
        </>
    );
};

export const PBRBaseMaterialMetallicWorkflowProperties: FunctionComponent<{ material: PBRBaseMaterial; selectionService: ISelectionService }> = (props) => {
    const { material, selectionService } = props;
    const scene = material.getScene();

    const selectEntity = (entity: unknown) => (selectionService.selectedEntity = entity);

    return (
        <>
            <BoundProperty component={SyncedSliderPropertyLine} label="Metallic" target={material} propertyKey="_metallic" min={0} max={1} step={0.01} nullable defaultValue={0} />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Roughness"
                target={material}
                propertyKey="_roughness"
                min={0}
                max={1}
                step={0.01}
                nullable
                defaultValue={0}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Base Diffuse Roughness"
                target={material}
                propertyKey="_baseDiffuseRoughness"
                min={0}
                max={1}
                step={0.01}
                nullable
                defaultValue={0}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Index of Refraction"
                target={material.subSurface}
                propertyKey="indexOfRefraction"
                propertyPath="subSurface.indexOfRefraction"
                min={1}
                max={3}
                step={0.01}
            />
            <BoundProperty component={SyncedSliderPropertyLine} label="F0 Factor" target={material} propertyKey="_metallicF0Factor" min={0} max={1} step={0.01} />
            <BoundProperty component={Color3PropertyLine} label="Reflectance Color" target={material} propertyKey="_metallicReflectanceColor" isLinearMode />
            <BoundProperty
                component={SwitchPropertyLine}
                label="Metallic Only"
                description="Use only metallic from MetallicReflectance texture"
                target={material}
                propertyKey="_useOnlyMetallicFromMetallicReflectanceTexture"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Metallic Reflectance"
                target={material}
                propertyKey="_metallicReflectanceTexture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Reflectance"
                target={material}
                propertyKey="_reflectanceTexture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
        </>
    );
};

export const PBRBaseMaterialClearCoatProperties: FunctionComponent<{ material: PBRBaseMaterial; selectionService: ISelectionService }> = (props) => {
    const { material, selectionService } = props;
    const scene = material.getScene();

    const selectEntity = (entity: unknown) => (selectionService.selectedEntity = entity);

    const isEnabled = useProperty(material.clearCoat, "isEnabled");
    const isTintEnabled = useProperty(material.clearCoat, "isTintEnabled");
    const bumpTexture = useProperty(material.clearCoat, "bumpTexture");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Enabled" target={material.clearCoat} propertyKey="isEnabled" propertyPath="clearCoat.isEnabled" />
            <Collapse visible={isEnabled}>
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Intensity"
                    target={material.clearCoat}
                    propertyKey="intensity"
                    propertyPath="clearCoat.intensity"
                    min={0}
                    max={1}
                    step={0.01}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Roughness"
                    target={material.clearCoat}
                    propertyKey="roughness"
                    propertyPath="clearCoat.roughness"
                    min={0}
                    max={1}
                    step={0.01}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="IOR"
                    description="Index of Refraction"
                    target={material.clearCoat}
                    propertyKey="indexOfRefraction"
                    propertyPath="clearCoat.indexOfRefraction"
                    min={1}
                    max={3}
                    step={0.01}
                />
                <BoundProperty
                    component={SwitchPropertyLine}
                    label="Remap F0"
                    target={material.clearCoat}
                    propertyKey="remapF0OnInterfaceChange"
                    propertyPath="clearCoat.remapF0OnInterfaceChange"
                />
                <BoundProperty
                    component={TextureSelectorPropertyLine}
                    label="Clear Coat"
                    target={material.clearCoat}
                    propertyKey="texture"
                    propertyPath="clearCoat.texture"
                    scene={scene}
                    onLink={selectEntity}
                    defaultValue={null}
                />
                <BoundProperty
                    component={TextureSelectorPropertyLine}
                    label="Roughness"
                    target={material.clearCoat}
                    propertyKey="textureRoughness"
                    propertyPath="clearCoat.textureRoughness"
                    scene={scene}
                    onLink={selectEntity}
                    defaultValue={null}
                />
                <BoundProperty
                    component={TextureSelectorPropertyLine}
                    label="Bump"
                    target={material.clearCoat}
                    propertyKey="bumpTexture"
                    propertyPath="clearCoat.bumpTexture"
                    scene={scene}
                    onLink={selectEntity}
                    defaultValue={null}
                />
                <Collapse visible={bumpTexture !== null}>
                    <BoundProperty
                        component={SyncedSliderPropertyLine}
                        label="Bump Strength"
                        target={bumpTexture}
                        propertyKey="level"
                        propertyPath="clearCoat.bumpTexture.level"
                        min={0}
                        max={2}
                        step={0.01}
                    />
                </Collapse>
                <BoundProperty
                    component={SwitchPropertyLine}
                    label="Use Roughness from Main Texture"
                    target={material.clearCoat}
                    propertyKey="useRoughnessFromMainTexture"
                    propertyPath="clearCoat.useRoughnessFromMainTexture"
                />
                <BoundProperty component={SwitchPropertyLine} label="Tint" target={material.clearCoat} propertyKey="isTintEnabled" propertyPath="clearCoat.isTintEnabled" />
                <Collapse visible={isTintEnabled}>
                    <BoundProperty
                        component={Color3PropertyLine}
                        label="Tint Color"
                        target={material.clearCoat}
                        propertyKey="tintColor"
                        propertyPath="clearCoat.tintColor"
                        isLinearMode={true}
                    />
                    <BoundProperty
                        component={SyncedSliderPropertyLine}
                        label="At Distance"
                        target={material.clearCoat}
                        propertyKey="tintColorAtDistance"
                        propertyPath="clearCoat.tintColorAtDistance"
                        min={0}
                        max={20}
                        step={0.1}
                    />
                    <BoundProperty
                        component={SyncedSliderPropertyLine}
                        label="Tint Thickness"
                        target={material.clearCoat}
                        propertyKey="tintThickness"
                        propertyPath="clearCoat.tintThickness"
                        min={0}
                        max={20}
                        step={0.1}
                    />
                    <BoundProperty
                        component={TextureSelectorPropertyLine}
                        label="Tint"
                        target={material.clearCoat}
                        propertyKey="tintTexture"
                        propertyPath="clearCoat.tintTexture"
                        scene={scene}
                        onLink={selectEntity}
                        defaultValue={null}
                    />
                </Collapse>
            </Collapse>
        </>
    );
};

export const PBRBaseMaterialIridescenceProperties: FunctionComponent<{ material: PBRBaseMaterial; selectionService: ISelectionService }> = (props) => {
    const { material, selectionService } = props;
    const scene = material.getScene();

    const selectEntity = (entity: unknown) => (selectionService.selectedEntity = entity);

    const isEnabled = useProperty(material.iridescence, "isEnabled");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Enabled" target={material.iridescence} propertyKey="isEnabled" propertyPath="iridescence.isEnabled" />
            <Collapse visible={isEnabled}>
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Intensity"
                    target={material.iridescence}
                    propertyKey="intensity"
                    propertyPath="iridescence.intensity"
                    min={0}
                    max={1}
                    step={0.01}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="IOR"
                    description="Index of Refraction"
                    target={material.iridescence}
                    propertyKey="indexOfRefraction"
                    propertyPath="iridescence.indexOfRefraction"
                    min={1}
                    max={3}
                    step={0.01}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Min Thickness"
                    target={material.iridescence}
                    propertyKey="minimumThickness"
                    propertyPath="iridescence.minimumThickness"
                    min={0}
                    max={1000}
                    step={10}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Max Thickness"
                    target={material.iridescence}
                    propertyKey="maximumThickness"
                    propertyPath="iridescence.maximumThickness"
                    min={0}
                    max={1000}
                    step={10}
                />
                <BoundProperty
                    component={TextureSelectorPropertyLine}
                    label="Iridescence"
                    target={material.iridescence}
                    propertyKey="texture"
                    propertyPath="iridescence.texture"
                    scene={scene}
                    onLink={selectEntity}
                    defaultValue={null}
                />
                <BoundProperty
                    component={TextureSelectorPropertyLine}
                    label="Thickness"
                    target={material.iridescence}
                    propertyKey="thicknessTexture"
                    propertyPath="iridescence.thicknessTexture"
                    scene={scene}
                    onLink={selectEntity}
                    defaultValue={null}
                />
            </Collapse>
        </>
    );
};

export const PBRBaseMaterialAnisotropicProperties: FunctionComponent<{ material: PBRBaseMaterial; selectionService: ISelectionService }> = (props) => {
    const { material, selectionService } = props;
    const scene = material.getScene();

    const selectEntity = (entity: unknown) => (selectionService.selectedEntity = entity);

    const isEnabled = useProperty(material.anisotropy, "isEnabled");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Enabled" target={material.anisotropy} propertyKey="isEnabled" propertyPath="anisotropy.isEnabled" />
            <Collapse visible={isEnabled}>
                <BoundProperty component={SwitchPropertyLine} label="Legacy Mode" target={material.anisotropy} propertyKey="legacy" propertyPath="anisotropy.legacy" />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Intensity"
                    target={material.anisotropy}
                    propertyKey="intensity"
                    propertyPath="anisotropy.intensity"
                    min={0}
                    max={1}
                    step={0.01}
                />
                <BoundProperty component={Vector2PropertyLine} label="Direction" target={material.anisotropy} propertyKey="direction" propertyPath="anisotropy.direction" />
                <BoundProperty
                    component={TextureSelectorPropertyLine}
                    label="Anisotropic"
                    target={material.anisotropy}
                    propertyKey="texture"
                    propertyPath="anisotropy.texture"
                    scene={scene}
                    onLink={selectEntity}
                    defaultValue={null}
                />
            </Collapse>
        </>
    );
};

export const PBRBaseMaterialSheenProperties: FunctionComponent<{ material: PBRBaseMaterial; selectionService: ISelectionService }> = (props) => {
    const { material, selectionService } = props;
    const scene = material.getScene();

    const selectEntity = (entity: unknown) => (selectionService.selectedEntity = entity);

    const isEnabled = useProperty(material.sheen, "isEnabled");
    const useRoughness = useProperty(material.sheen, "_useRoughness");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Enabled" target={material.sheen} propertyKey="isEnabled" propertyPath="sheen.isEnabled" />
            <Collapse visible={isEnabled}>
                <BoundProperty
                    component={SwitchPropertyLine}
                    label="Link to Albedo"
                    target={material.sheen}
                    propertyKey="linkSheenWithAlbedo"
                    propertyPath="sheen.linkSheenWithAlbedo"
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Intensity"
                    target={material.sheen}
                    propertyKey="intensity"
                    propertyPath="sheen.intensity"
                    min={0}
                    max={1}
                    step={0.01}
                />
                <BoundProperty component={Color3PropertyLine} label="Color" target={material.sheen} propertyKey="color" propertyPath="sheen.color" isLinearMode={true} />
                <BoundProperty
                    component={TextureSelectorPropertyLine}
                    label="Sheen"
                    target={material.sheen}
                    propertyKey="texture"
                    propertyPath="sheen.texture"
                    scene={scene}
                    onLink={selectEntity}
                    defaultValue={null}
                />
                <BoundProperty
                    component={TextureSelectorPropertyLine}
                    label="Roughness"
                    target={material.sheen}
                    propertyKey="textureRoughness"
                    propertyPath="sheen.textureRoughness"
                    scene={scene}
                    onLink={selectEntity}
                    defaultValue={null}
                />
                <BoundProperty component={SwitchPropertyLine} label="Use Roughness" target={material.sheen} propertyKey="_useRoughness" propertyPath="sheen._useRoughness" />
                <Collapse visible={useRoughness}>
                    <BoundProperty
                        nullable
                        component={SyncedSliderPropertyLine}
                        label="Roughness"
                        target={material.sheen}
                        propertyKey="roughness"
                        propertyPath="sheen.roughness"
                        defaultValue={0}
                        min={0}
                        max={1}
                        step={0.01}
                    />
                </Collapse>
                <BoundProperty
                    component={SwitchPropertyLine}
                    label="Use Roughness from Main Texture"
                    target={material.sheen}
                    propertyKey="useRoughnessFromMainTexture"
                    propertyPath="sheen.useRoughnessFromMainTexture"
                />
                <BoundProperty component={SwitchPropertyLine} label="Albedo Scaling" target={material.sheen} propertyKey="albedoScaling" propertyPath="sheen.albedoScaling" />
            </Collapse>
        </>
    );
};

export const PBRBaseMaterialSubSurfaceProperties: FunctionComponent<{ material: PBRBaseMaterial; selectionService: ISelectionService }> = (props) => {
    const { material, selectionService } = props;
    const scene = material.getScene();

    const selectEntity = (entity: unknown) => (selectionService.selectedEntity = entity);

    const useScattering = useProperty(material.subSurface, "isScatteringEnabled") && !!material.getScene().prePassRenderer && !!material.getScene().subSurfaceConfiguration;
    const useRefraction = useProperty(material.subSurface, "isRefractionEnabled");
    const useDispersion = useProperty(material.subSurface, "isDispersionEnabled");
    const useTranslucency = useProperty(material.subSurface, "isTranslucencyEnabled");

    return (
        <>
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Thickness"
                target={material.subSurface}
                propertyKey="thicknessTexture"
                propertyPath="subSurface.thicknessTexture"
                scene={scene}
                onLink={selectEntity}
                defaultValue={null}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Min Thickness"
                target={material.subSurface}
                propertyKey="minimumThickness"
                propertyPath="subSurface.minimumThickness"
                min={0}
                max={10}
                step={0.1}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Max Thickness"
                target={material.subSurface}
                propertyKey="maximumThickness"
                propertyPath="subSurface.maximumThickness"
                min={0}
                max={10}
                step={0.1}
            />
            <BoundProperty
                component={SwitchPropertyLine}
                label="Mask From Thickness"
                target={material.subSurface}
                propertyKey="useMaskFromThicknessTexture"
                propertyPath="subSurface.useMaskFromThicknessTexture"
            />
            <BoundProperty
                component={SwitchPropertyLine}
                label="glTF-Style Textures"
                target={material.subSurface}
                propertyKey="useGltfStyleTextures"
                propertyPath="subSurface.useGltfStyleTextures"
            />
            <BoundProperty
                component={SwitchPropertyLine}
                label="Use Thickness as Depth"
                target={material.subSurface}
                propertyKey="useThicknessAsDepth"
                propertyPath="subSurface.useThicknessAsDepth"
            />
            <BoundProperty
                component={Color3PropertyLine}
                label="Tint Color"
                target={material.subSurface}
                propertyKey="tintColor"
                propertyPath="subSurface.tintColor"
                isLinearMode={true}
            />
            <BoundProperty
                component={SwitchPropertyLine}
                label="Scattering Enabled"
                target={material.subSurface}
                propertyKey="isScatteringEnabled"
                propertyPath="subSurface.isScatteringEnabled"
            />
            <Collapse visible={useScattering}>
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Meters Per Unit"
                    target={material.getScene().subSurfaceConfiguration}
                    propertyKey="metersPerUnit"
                    propertyPath="getScene().subSurfaceConfiguration.metersPerUnit"
                    min={0.01}
                    max={2}
                    step={0.01}
                />
            </Collapse>
            <BoundProperty
                component={SwitchPropertyLine}
                label="Refraction Enabled"
                target={material.subSurface}
                propertyKey="isRefractionEnabled"
                propertyPath="subSurface.isRefractionEnabled"
            />
            <Collapse visible={useRefraction}>
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Intensity"
                    target={material.subSurface}
                    propertyKey="refractionIntensity"
                    propertyPath="subSurface.refractionIntensity"
                    min={0}
                    max={1}
                    step={0.01}
                />
                <BoundProperty
                    component={TextureSelectorPropertyLine}
                    label="Refraction Intensity"
                    target={material.subSurface}
                    propertyKey="refractionIntensityTexture"
                    propertyPath="subSurface.refractionIntensityTexture"
                    scene={scene}
                    onLink={selectEntity}
                    defaultValue={null}
                />
                <BoundProperty
                    component={TextureSelectorPropertyLine}
                    label="Refraction"
                    target={material.subSurface}
                    propertyKey="refractionTexture"
                    propertyPath="subSurface.refractionTexture"
                    scene={scene}
                    onLink={selectEntity}
                    defaultValue={null}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Volume Index of Refraction"
                    target={material.subSurface}
                    propertyKey="volumeIndexOfRefraction"
                    propertyPath="subSurface.volumeIndexOfRefraction"
                    min={1}
                    max={3}
                    step={0.01}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Tint at Distance"
                    target={material.subSurface}
                    propertyKey="tintColorAtDistance"
                    propertyPath="subSurface.tintColorAtDistance"
                    min={0}
                    max={10}
                    step={0.1}
                />
                <BoundProperty
                    component={SwitchPropertyLine}
                    label="Link Refraction with Transparency"
                    target={material.subSurface}
                    propertyKey="linkRefractionWithTransparency"
                    propertyPath="subSurface.linkRefractionWithTransparency"
                />
                <BoundProperty
                    component={SwitchPropertyLine}
                    label="Use Albedo to Tint Surface Transparency"
                    target={material.subSurface}
                    propertyKey="useAlbedoToTintRefraction"
                    propertyPath="subSurface.useAlbedoToTintRefraction"
                />
            </Collapse>
            <BoundProperty
                component={SwitchPropertyLine}
                label="Dispersion Enabled"
                target={material.subSurface}
                propertyKey="isDispersionEnabled"
                propertyPath="subSurface.isDispersionEnabled"
            />
            <Collapse visible={useDispersion}>
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Intensity"
                    target={material.subSurface}
                    propertyKey="dispersion"
                    propertyPath="subSurface.dispersion"
                    min={0}
                    max={5}
                    step={0.01}
                />
            </Collapse>
            <BoundProperty
                component={SwitchPropertyLine}
                label="Translucency Enabled"
                target={material.subSurface}
                propertyKey="isTranslucencyEnabled"
                propertyPath="subSurface.isTranslucencyEnabled"
            />
            <Collapse visible={useTranslucency}>
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Intensity"
                    target={material.subSurface}
                    propertyKey="translucencyIntensity"
                    propertyPath="subSurface.translucencyIntensity"
                    min={0}
                    max={1}
                    step={0.01}
                />
                <BoundProperty
                    component={TextureSelectorPropertyLine}
                    label="Intensity Texture"
                    target={material.subSurface}
                    propertyKey="translucencyIntensityTexture"
                    propertyPath="subSurface.translucencyIntensityTexture"
                    scene={scene}
                    onLink={selectEntity}
                    defaultValue={null}
                />
                <BoundProperty
                    component={Color3PropertyLine}
                    label="Diffusion Distance"
                    target={material.subSurface}
                    propertyKey="diffusionDistance"
                    propertyPath="subSurface.diffusionDistance"
                    isLinearMode={true}
                />
                <BoundProperty
                    component={SwitchPropertyLine}
                    label="Use Albedo to Tint Surface Translucency"
                    target={material.subSurface}
                    propertyKey="useAlbedoToTintTranslucency"
                    propertyPath="subSurface.useAlbedoToTintTranslucency"
                />
                <BoundProperty
                    component={Color3PropertyLine}
                    label="Translucency Tint"
                    target={material.subSurface}
                    propertyKey="translucencyColor"
                    propertyPath="subSurface.translucencyColor"
                    isLinearMode={true}
                    nullable
                    defaultValue={Color3.White()}
                />
                <BoundProperty
                    component={TextureSelectorPropertyLine}
                    label="Translucency Tint Texture"
                    target={material.subSurface}
                    propertyKey="translucencyColorTexture"
                    propertyPath="subSurface.translucencyColorTexture"
                    scene={scene}
                    onLink={selectEntity}
                    defaultValue={null}
                />
            </Collapse>
        </>
    );
};

export const PBRBaseMaterialLevelProperties: FunctionComponent<{ material: PBRBaseMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty component={SyncedSliderPropertyLine} label="Environment" target={material} propertyKey="_environmentIntensity" min={0} max={1} step={0.01} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Specular" target={material} propertyKey="_specularIntensity" min={0} max={1} step={0.01} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Emissive" target={material} propertyKey="_emissiveIntensity" min={0} max={1} step={0.01} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Direct" target={material} propertyKey="_directIntensity" min={0} max={1} step={0.01} />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Bump Strength"
                target={material._bumpTexture}
                propertyKey="level"
                propertyPath="_bumpTexture.level"
                min={0}
                max={2}
                step={0.01}
            />
            <Collapse visible={!!material._ambientTexture}>
                <BoundProperty component={SyncedSliderPropertyLine} label="Ambient Strength" target={material} propertyKey="_ambientTextureStrength" min={0} max={1} step={0.01} />
            </Collapse>
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Reflection Strength"
                target={material._reflectionTexture}
                propertyKey="level"
                propertyPath="_reflectionTexture.level"
                min={0}
                max={1}
                step={0.01}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Clear Coat"
                target={material.clearCoat.texture}
                propertyKey="level"
                propertyPath="clearCoat.texture.level"
                min={0}
                max={1}
                step={0.01}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Clear Coat Bump"
                target={material.clearCoat.bumpTexture}
                propertyKey="level"
                propertyPath="clearCoat.bumpTexture.level"
                min={0}
                max={2}
                step={0.01}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Anisotropic"
                target={material.anisotropy.texture}
                propertyKey="level"
                propertyPath="anisotropy.texture.level"
                min={0}
                max={1}
                step={0.01}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Sheen"
                target={material.sheen.texture}
                propertyKey="level"
                propertyPath="sheen.texture.level"
                min={0}
                max={1}
                step={0.01}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Thickness"
                target={material.subSurface.thicknessTexture}
                propertyKey="level"
                propertyPath="subSurface.thicknessTexture.level"
                min={0}
                max={1}
                step={0.01}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Refraction"
                target={material.subSurface.refractionTexture}
                propertyKey="level"
                propertyPath="subSurface.refractionTexture.level"
                min={0}
                max={1}
                step={0.01}
            />
            <Collapse visible={material.detailMap.isEnabled}>
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Detailmap Diffuse"
                    target={material.detailMap}
                    propertyKey="diffuseBlendLevel"
                    propertyPath="detailMap.diffuseBlendLevel"
                    min={0}
                    max={1}
                    step={0.01}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Detailmap Bump"
                    target={material.detailMap}
                    propertyKey="bumpLevel"
                    propertyPath="detailMap.bumpLevel"
                    min={0}
                    max={1}
                    step={0.01}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Detailmap Roughness"
                    target={material.detailMap}
                    propertyKey="roughnessBlendLevel"
                    propertyPath="detailMap.roughnessBlendLevel"
                    min={0}
                    max={1}
                    step={0.01}
                />
            </Collapse>
        </>
    );
};

export const PBRBaseMaterialRenderingProperties: FunctionComponent<{ material: PBRBaseMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Alpha from Albedo" target={material} propertyKey="_useAlphaFromAlbedoTexture" />
            <BoundProperty component={SwitchPropertyLine} label="Ambient in Grayscale" target={material} propertyKey="_useAmbientInGrayScale" />
            <BoundProperty component={SwitchPropertyLine} label="Radiance over Alpha" target={material} propertyKey="_useRadianceOverAlpha" />
            <BoundProperty component={SwitchPropertyLine} label="Micro-surface from Ref. Map Alpha" target={material} propertyKey="_useMicroSurfaceFromReflectivityMapAlpha" />
            <BoundProperty component={SwitchPropertyLine} label="Specular over Alpha" target={material} propertyKey="_useSpecularOverAlpha" />
            <BoundProperty component={SwitchPropertyLine} label="Specular Anti-aliasing" target={material} propertyKey="_enableSpecularAntiAliasing" />
            <BoundProperty component={SwitchPropertyLine} label="Realtime Filtering" target={material} propertyKey="realTimeFiltering" />
            <BoundProperty
                component={NumberDropdownPropertyLine}
                label="Realtime Filtering Quality"
                target={material}
                propertyKey="realTimeFilteringQuality"
                options={RealTimeFilteringQualityOptions}
            />
            <BoundProperty
                component={NumberDropdownPropertyLine}
                label="Base Diffuse Model"
                target={material.brdf}
                propertyKey="baseDiffuseModel"
                propertyPath="brdf.baseDiffuseModel"
                options={BaseDiffuseModelOptions}
            />
            <BoundProperty
                component={NumberDropdownPropertyLine}
                label="Dielectric Specular Model"
                target={material.brdf}
                propertyKey="dielectricSpecularModel"
                propertyPath="brdf.dielectricSpecularModel"
                options={DielectricSpecularModelOptions}
            />
            <BoundProperty
                component={NumberDropdownPropertyLine}
                label="Conductor Specular Model"
                target={material.brdf}
                propertyKey="conductorSpecularModel"
                propertyPath="brdf.conductorSpecularModel"
                options={ConductorSpecularModelOptions}
            />
        </>
    );
};

export const PBRBaseMaterialAdvancedProperties: FunctionComponent<{ material: PBRBaseMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty
                component={SwitchPropertyLine}
                label="Energy Conservation"
                target={material.brdf}
                propertyKey="useEnergyConservation"
                propertyPath="brdf.useEnergyConservation"
            />
            <BoundProperty
                component={SwitchPropertyLine}
                label="Spherical Harmonics"
                target={material.brdf}
                propertyKey="useSphericalHarmonics"
                propertyPath="brdf.useSphericalHarmonics"
            />
            <BoundProperty component={SwitchPropertyLine} label="Radiance Occlusion" target={material} propertyKey="_useRadianceOcclusion" />
            <BoundProperty component={SwitchPropertyLine} label="Horizon Occlusion" target={material} propertyKey="_useHorizonOcclusion" />
            <BoundProperty
                component={SwitchPropertyLine}
                label="Mix Irradiance with Rough Radiance"
                target={material.brdf}
                propertyKey="mixIblRadianceWithIrradiance"
                propertyPath="brdf.mixIblRadianceWithIrradiance"
            />
            <BoundProperty
                component={SwitchPropertyLine}
                label="Use Legacy Specular Energy Conservation"
                target={material.brdf}
                propertyKey="useLegacySpecularEnergyConservation"
                propertyPath="brdf.useLegacySpecularEnergyConservation"
            />
            <BoundProperty component={SwitchPropertyLine} label="Unlit" target={material} propertyKey="_unlit" />
        </>
    );
};

export const PBRBaseMaterialDebugProperties: FunctionComponent<{ material: PBRBaseMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty component={NumberDropdownPropertyLine} label="Debug Mode" target={material} propertyKey="debugMode" options={DebugMode} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Split Position" target={material} propertyKey="debugLimit" min={-1} max={1} step={0.01} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Output Factor" target={material} propertyKey="debugFactor" min={0} max={5} step={0.01} />
        </>
    );
};
