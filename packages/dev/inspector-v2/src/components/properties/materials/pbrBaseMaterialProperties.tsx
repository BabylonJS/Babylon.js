import type { FunctionComponent } from "react";

import { BoundProperty } from "../boundProperty";
import { useProperty } from "../../../hooks/compoundPropertyHooks";

import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";

import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import { FileUploadLine } from "shared-ui-components/fluent/hoc/fileUploadLine";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { Vector2PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";

import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { ReadFile } from "core/Misc/fileTools";
import { Texture } from "core/Materials/Textures/texture";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import type { DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { Color3 } from "core/Maths/math.color";
import { Constants } from "core/Engines/constants";
import { Material } from "core/Materials/material";
import { BoundTextureProperty } from "../textures/boundTextureProperty";

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

// TODO: ryamtrem / gehalper This function is temporal until there is a line control to handle texture links (similar to the old TextureLinkLineComponent)
const UpdateTexture = (file: File, material: PBRBaseMaterial, textureSetter: (texture: BaseTexture) => void) => {
    ReadFile(
        file,
        (data) => {
            const blob = new Blob([data], { type: "octet/stream" });
            const url = URL.createObjectURL(blob);
            textureSetter(new Texture(url, material.getScene(), false, false));
            material.markAsDirty(Material.AllDirtyFlag);
        },
        undefined,
        true
    );
};

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
                    <BoundProperty component={SwitchPropertyLine} label="Albedo texture has alpha" target={material._albedoTexture} propertyKey="hasAlpha" />
                </>
            )}
            <BoundProperty component={SwitchPropertyLine} label="Use alpha from albedo texture" target={material} propertyKey="_useAlphaFromAlbedoTexture" />
        </>
    );
};

export const PBRBaseMaterialChannelsProperties: FunctionComponent<{ material: PBRBaseMaterial }> = (props) => {
    const { material } = props;
    const scene = material.getScene();

    return (
        <>
            <BoundTextureProperty label="Albedo" target={material} propertyKey="_albedoTexture" scene={scene} />
            <BoundTextureProperty label="Base Weight" target={material} propertyKey="_baseWeightTexture" scene={scene} />
            <BoundTextureProperty label="Base Diffuse Roughness" target={material} propertyKey="_baseDiffuseRoughnessTexture" scene={scene} />
            <BoundTextureProperty label="Metallic Roughness" target={material} propertyKey="_metallicTexture" scene={scene} />
            <BoundTextureProperty label="Reflection" target={material} propertyKey="_reflectionTexture" scene={scene} cubeOnly />
            <BoundTextureProperty label="Refraction" target={material.subSurface} propertyKey="refractionTexture" scene={scene} />
            <BoundTextureProperty label="Reflectivity" target={material} propertyKey="_reflectivityTexture" scene={scene} />
            <BoundTextureProperty label="Micro-surface" target={material} propertyKey="_microSurfaceTexture" scene={scene} />
            <BoundTextureProperty label="Bump" target={material} propertyKey="_bumpTexture" scene={scene} />
            <BoundTextureProperty label="Emissive" target={material} propertyKey="_emissiveTexture" scene={scene} />
            <BoundTextureProperty label="Opacity" target={material} propertyKey="_opacityTexture" scene={scene} />
            <BoundTextureProperty label="Ambient" target={material} propertyKey="_ambientTexture" scene={scene} />
            <BoundTextureProperty label="Lightmap" target={material} propertyKey="_lightmapTexture" scene={scene} />
            <BoundTextureProperty label="Detailmap" target={material.detailMap} propertyKey="texture" scene={scene} />
            <BoundProperty component={SwitchPropertyLine} label="Use lightmap as shadowmap" target={material} propertyKey="_useLightmapAsShadowmap" />
            <BoundProperty component={SwitchPropertyLine} label="Use detailmap" target={material.detailMap} propertyKey="isEnabled" />
            <BoundProperty component={SwitchPropertyLine} label="Use decalmap" target={material.decalMap} propertyKey="isEnabled" />
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
            <BoundProperty component={SyncedSliderPropertyLine} label="Micro-Surface" target={material} propertyKey="_microSurface" min={0} max={1} step={0.01} />
            <BoundProperty component={Color3PropertyLine} label="Emissive" target={material} propertyKey="_emissiveColor" isLinearMode />
            <BoundProperty component={Color3PropertyLine} label="Ambient" target={material} propertyKey="_ambientColor" isLinearMode />
            <BoundProperty component={NumberDropdownPropertyLine} label="Light falloff" target={material} propertyKey="_lightFalloff" options={LightFalloffOptions} />
        </>
    );
};

export const PBRBaseMaterialMetallicWorkflowProperties: FunctionComponent<{ material: PBRBaseMaterial }> = (props) => {
    const { material } = props;

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
                min={1}
                max={3}
                step={0.01}
            />
            <BoundProperty component={SyncedSliderPropertyLine} label="F0 Factor" target={material} propertyKey="_metallicF0Factor" min={0} max={1} step={0.01} />
            <BoundProperty component={Color3PropertyLine} label="Reflectance Color" target={material} propertyKey="_metallicReflectanceColor" isLinearMode />
            <BoundProperty
                component={SwitchPropertyLine}
                label="Metallic only"
                description="Use only metallic from MetallicReflectance texture"
                target={material}
                propertyKey="_useOnlyMetallicFromMetallicReflectanceTexture"
            />
            <FileUploadLine
                label="MetallicReflectance Texture"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material._metallicReflectanceTexture = texture));
                    }
                }}
            />
            <FileUploadLine
                label="Reflectance Texture"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material._reflectanceTexture = texture));
                    }
                }}
            />
        </>
    );
};

export const PBRBaseMaterialClearCoatProperties: FunctionComponent<{ material: PBRBaseMaterial }> = (props) => {
    const { material } = props;

    const isEnabled = useProperty(material.clearCoat, "isEnabled");
    const isTintEnabled = useProperty(material.clearCoat, "isTintEnabled");
    const bumpTexture = useProperty(material.clearCoat, "bumpTexture");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Enabled" target={material.clearCoat} propertyKey="isEnabled" />
            <Collapse visible={isEnabled}>
                <BoundProperty component={SyncedSliderPropertyLine} label="Intensity" target={material.clearCoat} propertyKey="intensity" min={0} max={1} step={0.01} />
                <BoundProperty component={SyncedSliderPropertyLine} label="Roughness" target={material.clearCoat} propertyKey="roughness" min={0} max={1} step={0.01} />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="IOR"
                    description="Index of Refraction"
                    target={material.clearCoat}
                    propertyKey="indexOfRefraction"
                    min={1}
                    max={3}
                    step={0.01}
                />
                <BoundProperty component={SwitchPropertyLine} label="Remap F0" target={material.clearCoat} propertyKey="remapF0OnInterfaceChange" />
                <FileUploadLine
                    label="Clear coat"
                    accept=".jpg, .png, .tga, .dds, .env, .exr"
                    onClick={(files) => {
                        if (files.length > 0) {
                            UpdateTexture(files[0], material, (texture) => (material.clearCoat.texture = texture));
                        }
                    }}
                />
                <FileUploadLine
                    label="Roughness"
                    accept=".jpg, .png, .tga, .dds, .env, .exr"
                    onClick={(files) => {
                        if (files.length > 0) {
                            UpdateTexture(files[0], material, (texture) => (material.clearCoat.textureRoughness = texture));
                        }
                    }}
                />
                <FileUploadLine
                    label="Bump"
                    accept=".jpg, .png, .tga, .dds, .env, .exr"
                    onClick={(files) => {
                        if (files.length > 0) {
                            UpdateTexture(files[0], material, (texture) => (material.clearCoat.bumpTexture = texture));
                        }
                    }}
                />
                <Collapse visible={bumpTexture !== null}>
                    <BoundProperty component={SyncedSliderPropertyLine} label="Bump Strength" target={bumpTexture} propertyKey="level" min={0} max={2} step={0.01} />
                </Collapse>
                <BoundProperty component={SwitchPropertyLine} label="Use Roughness from Main Texture" target={material.clearCoat} propertyKey="useRoughnessFromMainTexture" />
                <BoundProperty component={SwitchPropertyLine} label="Tint" target={material.clearCoat} propertyKey="isTintEnabled" />
                <Collapse visible={isTintEnabled}>
                    <BoundProperty component={Color3PropertyLine} label="Tint Color" target={material.clearCoat} propertyKey="tintColor" isLinearMode={true} />
                    <BoundProperty
                        component={SyncedSliderPropertyLine}
                        label="At Distance"
                        target={material.clearCoat}
                        propertyKey="tintColorAtDistance"
                        min={0}
                        max={20}
                        step={0.1}
                    />
                    <BoundProperty
                        component={SyncedSliderPropertyLine}
                        label="Tint Thickness"
                        target={material.clearCoat}
                        propertyKey="tintThickness"
                        min={0}
                        max={20}
                        step={0.1}
                    />
                    <FileUploadLine
                        label="Tint"
                        accept=".jpg, .png, .tga, .dds, .env, .exr"
                        onClick={(files) => {
                            if (files.length > 0) {
                                UpdateTexture(files[0], material, (texture) => (material.clearCoat.tintTexture = texture));
                            }
                        }}
                    />
                </Collapse>
            </Collapse>
        </>
    );
};

export const PBRBaseMaterialIridescenceProperties: FunctionComponent<{ material: PBRBaseMaterial }> = (props) => {
    const { material } = props;

    const isEnabled = useProperty(material.iridescence, "isEnabled");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Enabled" target={material.iridescence} propertyKey="isEnabled" />
            <Collapse visible={isEnabled}>
                <BoundProperty component={SyncedSliderPropertyLine} label="Intensity" target={material.iridescence} propertyKey="intensity" min={0} max={1} step={0.01} />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="IOR"
                    description="Index of Refraction"
                    target={material.iridescence}
                    propertyKey="indexOfRefraction"
                    min={1}
                    max={3}
                    step={0.01}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Minimum Thickness"
                    target={material.iridescence}
                    propertyKey="minimumThickness"
                    min={0}
                    max={1000}
                    step={10}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Maxium Thickness"
                    target={material.iridescence}
                    propertyKey="maximumThickness"
                    min={0}
                    max={1000}
                    step={10}
                />
                <FileUploadLine
                    label="Iridescence"
                    accept=".jpg, .png, .tga, .dds, .env, .exr"
                    onClick={(files) => {
                        if (files.length > 0) {
                            UpdateTexture(files[0], material, (texture) => (material.iridescence.texture = texture));
                        }
                    }}
                />
                <FileUploadLine
                    label="Thickness"
                    accept=".jpg, .png, .tga, .dds, .env, .exr"
                    onClick={(files) => {
                        if (files.length > 0) {
                            UpdateTexture(files[0], material, (texture) => (material.iridescence.thicknessTexture = texture));
                        }
                    }}
                />
            </Collapse>
        </>
    );
};

export const PBRBaseMaterialAnisotropicProperties: FunctionComponent<{ material: PBRBaseMaterial }> = (props) => {
    const { material } = props;

    const isEnabled = useProperty(material.anisotropy, "isEnabled");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Enabled" target={material.anisotropy} propertyKey="isEnabled" />
            <Collapse visible={isEnabled}>
                <BoundProperty component={SwitchPropertyLine} label="Legacy Mode" target={material.anisotropy} propertyKey="legacy" />
                <BoundProperty component={SyncedSliderPropertyLine} label="Intensity" target={material.anisotropy} propertyKey="intensity" min={0} max={1} step={0.01} />
                <BoundProperty component={Vector2PropertyLine} label="Direction" target={material.anisotropy} propertyKey="direction" />
                <FileUploadLine
                    label="Anisotropic"
                    accept=".jpg, .png, .tga, .dds, .env, .exr"
                    onClick={(files) => {
                        if (files.length > 0) {
                            UpdateTexture(files[0], material, (texture) => (material.anisotropy.texture = texture));
                        }
                    }}
                />
            </Collapse>
        </>
    );
};

export const PBRBaseMaterialSheenProperties: FunctionComponent<{ material: PBRBaseMaterial }> = (props) => {
    const { material } = props;

    const isEnabled = useProperty(material.sheen, "isEnabled");
    const useRoughness = useProperty(material.sheen, "_useRoughness");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Enabled" target={material.sheen} propertyKey="isEnabled" />
            <Collapse visible={isEnabled}>
                <BoundProperty component={SwitchPropertyLine} label="Link to Albedo" target={material.sheen} propertyKey="linkSheenWithAlbedo" />
                <BoundProperty component={SyncedSliderPropertyLine} label="Intensity" target={material.sheen} propertyKey="intensity" min={0} max={1} step={0.01} />
                <BoundProperty component={Color3PropertyLine} label="Color" target={material.sheen} propertyKey="color" isLinearMode={true} />
                <FileUploadLine
                    label="Sheen"
                    accept=".jpg, .png, .tga, .dds, .env, .exr"
                    onClick={(files) => {
                        if (files.length > 0) {
                            UpdateTexture(files[0], material, (texture) => (material.sheen.texture = texture));
                        }
                    }}
                />
                <FileUploadLine
                    label="Roughness"
                    accept=".jpg, .png, .tga, .dds, .env, .exr"
                    onClick={(files) => {
                        if (files.length > 0) {
                            UpdateTexture(files[0], material, (texture) => (material.sheen.textureRoughness = texture));
                        }
                    }}
                />
                <BoundProperty component={SwitchPropertyLine} label="Use Roughness" target={material.sheen} propertyKey="_useRoughness" />
                <Collapse visible={useRoughness}>
                    <BoundProperty
                        nullable
                        component={SyncedSliderPropertyLine}
                        label="Roughness"
                        target={material.sheen}
                        propertyKey="roughness"
                        defaultValue={0}
                        min={0}
                        max={1}
                        step={0.01}
                    />
                </Collapse>
                <BoundProperty component={SwitchPropertyLine} label="Use Roughness from Main Texture" target={material.sheen} propertyKey="useRoughnessFromMainTexture" />
                <BoundProperty component={SwitchPropertyLine} label="Albedo Scaling" target={material.sheen} propertyKey="albedoScaling" />
            </Collapse>
        </>
    );
};

export const PBRBaseMaterialSubSurfaceProperties: FunctionComponent<{ material: PBRBaseMaterial }> = (props) => {
    const { material } = props;

    const useScattering = useProperty(material.subSurface, "isScatteringEnabled") && !!material.getScene().prePassRenderer && !!material.getScene().subSurfaceConfiguration;
    const useRefraction = useProperty(material.subSurface, "isRefractionEnabled");
    const useDispersion = useProperty(material.subSurface, "isDispersionEnabled");
    const useTranslucency = useProperty(material.subSurface, "isTranslucencyEnabled");

    return (
        <>
            <FileUploadLine
                label="Thickness"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.subSurface.thicknessTexture = texture));
                    }
                }}
            />
            <BoundProperty component={SyncedSliderPropertyLine} label="Min Thickness" target={material.subSurface} propertyKey="minimumThickness" min={0} max={10} step={0.1} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Max Thickness" target={material.subSurface} propertyKey="maximumThickness" min={0} max={10} step={0.1} />
            <BoundProperty component={SwitchPropertyLine} label="Mask From Thickness" target={material.subSurface} propertyKey="useMaskFromThicknessTexture" />
            <BoundProperty component={SwitchPropertyLine} label="glTF-Style Textures" target={material.subSurface} propertyKey="useGltfStyleTextures" />
            <BoundProperty component={SwitchPropertyLine} label="Use Thickness as Depth" target={material.subSurface} propertyKey="useThicknessAsDepth" />
            <BoundProperty component={Color3PropertyLine} label="Tint Color" target={material.subSurface} propertyKey="tintColor" isLinearMode={true} />
            <BoundProperty component={SwitchPropertyLine} label="Scattering Enabled" target={material.subSurface} propertyKey="isScatteringEnabled" />
            <Collapse visible={useScattering}>
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Meters per unit"
                    target={material.getScene().subSurfaceConfiguration}
                    propertyKey="metersPerUnit"
                    min={0.01}
                    max={2}
                    step={0.01}
                />
            </Collapse>
            <BoundProperty component={SwitchPropertyLine} label="Refraction Enabled" target={material.subSurface} propertyKey="isRefractionEnabled" />
            <Collapse visible={useRefraction}>
                <BoundProperty component={SyncedSliderPropertyLine} label="Intensity" target={material.subSurface} propertyKey="refractionIntensity" min={0} max={1} step={0.01} />
                <FileUploadLine
                    label="Refraction Intensity"
                    accept=".jpg, .png, .tga, .dds, .env, .exr"
                    onClick={(files) => {
                        if (files.length > 0) {
                            UpdateTexture(files[0], material, (texture) => (material.subSurface.refractionIntensityTexture = texture));
                        }
                    }}
                />
                <FileUploadLine
                    label="Refraction"
                    accept=".jpg, .png, .tga, .dds, .env, .exr"
                    onClick={(files) => {
                        if (files.length > 0) {
                            UpdateTexture(files[0], material, (texture) => (material.subSurface.refractionTexture = texture));
                        }
                    }}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Volume Index of Refraction"
                    target={material.subSurface}
                    propertyKey="volumeIndexOfRefraction"
                    min={1}
                    max={3}
                    step={0.01}
                />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Tint at Distance"
                    target={material.subSurface}
                    propertyKey="tintColorAtDistance"
                    min={0}
                    max={10}
                    step={0.1}
                />
                <BoundProperty component={SwitchPropertyLine} label="Link refraction with transparency" target={material.subSurface} propertyKey="linkRefractionWithTransparency" />
                <BoundProperty
                    component={SwitchPropertyLine}
                    label="Use albedo to tint surface transparency"
                    target={material.subSurface}
                    propertyKey="useAlbedoToTintRefraction"
                />
            </Collapse>
            <BoundProperty component={SwitchPropertyLine} label="Dispersion Enabled" target={material.subSurface} propertyKey="isDispersionEnabled" />
            <Collapse visible={useDispersion}>
                <BoundProperty component={SyncedSliderPropertyLine} label="Intensity" target={material.subSurface} propertyKey="dispersion" min={0} max={5} step={0.01} />
            </Collapse>
            <BoundProperty component={SwitchPropertyLine} label="Translucency Enabled" target={material.subSurface} propertyKey="isTranslucencyEnabled" />
            <Collapse visible={useTranslucency}>
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Intensity"
                    target={material.subSurface}
                    propertyKey="translucencyIntensity"
                    min={0}
                    max={1}
                    step={0.01}
                />
                <FileUploadLine
                    label="Intensity"
                    accept=".jpg, .png, .tga, .dds, .env, .exr"
                    onClick={(files) => {
                        if (files.length > 0) {
                            UpdateTexture(files[0], material, (texture) => (material.subSurface.translucencyIntensityTexture = texture));
                        }
                    }}
                />
                <BoundProperty component={Color3PropertyLine} label="Diffusion Distance" target={material.subSurface} propertyKey="diffusionDistance" isLinearMode={true} />
                <BoundProperty
                    component={SwitchPropertyLine}
                    label="Use albedo to tint surface translucency"
                    target={material.subSurface}
                    propertyKey="useAlbedoToTintTranslucency"
                />
                <BoundProperty
                    component={Color3PropertyLine}
                    label="Translucency Tint"
                    target={material.subSurface}
                    propertyKey="translucencyColor"
                    isLinearMode={true}
                    nullable
                    defaultValue={Color3.White()}
                />
                <FileUploadLine
                    label="Translucency Tint"
                    accept=".jpg, .png, .tga, .dds, .env, .exr"
                    onClick={(files) => {
                        if (files.length > 0) {
                            UpdateTexture(files[0], material, (texture) => (material.subSurface.translucencyColorTexture = texture));
                        }
                    }}
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
            <BoundProperty component={SyncedSliderPropertyLine} label="Bump strength" target={material._bumpTexture} propertyKey="level" min={0} max={2} step={0.01} />
            <Collapse visible={!!material._ambientTexture}>
                <BoundProperty component={SyncedSliderPropertyLine} label="Ambient strength" target={material} propertyKey="_ambientTextureStrength" min={0} max={1} step={0.01} />
            </Collapse>
            <BoundProperty component={SyncedSliderPropertyLine} label="Reflection strength" target={material._reflectionTexture} propertyKey="level" min={0} max={1} step={0.01} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Clear coat" target={material.clearCoat.texture} propertyKey="level" min={0} max={1} step={0.01} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Clear coat bump" target={material.clearCoat.bumpTexture} propertyKey="level" min={0} max={2} step={0.01} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Anisotropic" target={material.anisotropy.texture} propertyKey="level" min={0} max={1} step={0.01} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Sheen" target={material.sheen.texture} propertyKey="level" min={0} max={1} step={0.01} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Thickness" target={material.subSurface.thicknessTexture} propertyKey="level" min={0} max={1} step={0.01} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Refraction" target={material.subSurface.refractionTexture} propertyKey="level" min={0} max={1} step={0.01} />
            <Collapse visible={material.detailMap.isEnabled}>
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Detailmap diffuse"
                    target={material.detailMap}
                    propertyKey="diffuseBlendLevel"
                    min={0}
                    max={1}
                    step={0.01}
                />
                <BoundProperty component={SyncedSliderPropertyLine} label="Detailmap bump" target={material.detailMap} propertyKey="bumpLevel" min={0} max={1} step={0.01} />
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Detailmap roughness"
                    target={material.detailMap}
                    propertyKey="roughnessBlendLevel"
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
            <BoundProperty component={SwitchPropertyLine} label="Alpha from albedo" target={material} propertyKey="_useAlphaFromAlbedoTexture" />
            <BoundProperty component={SwitchPropertyLine} label="Ambient in grayscale" target={material} propertyKey="_useAmbientInGrayScale" />
            <BoundProperty component={SwitchPropertyLine} label="Radiance over alpha" target={material} propertyKey="_useRadianceOverAlpha" />
            <BoundProperty component={SwitchPropertyLine} label="Micro-surface from ref. map alpha" target={material} propertyKey="_useMicroSurfaceFromReflectivityMapAlpha" />
            <BoundProperty component={SwitchPropertyLine} label="Specular over alpha" target={material} propertyKey="_useSpecularOverAlpha" />
            <BoundProperty component={SwitchPropertyLine} label="Specular anti-aliasing" target={material} propertyKey="_enableSpecularAntiAliasing" />
            <BoundProperty component={SwitchPropertyLine} label="Realtime Filtering" target={material} propertyKey="realTimeFiltering" />
            <BoundProperty
                component={NumberDropdownPropertyLine}
                label="Realtime Filtering quality"
                target={material}
                propertyKey="realTimeFilteringQuality"
                options={RealTimeFilteringQualityOptions}
            />
            <BoundProperty
                component={NumberDropdownPropertyLine}
                label="Base Diffuse Model"
                target={material.brdf}
                propertyKey="baseDiffuseModel"
                options={BaseDiffuseModelOptions}
            />
            <BoundProperty
                component={NumberDropdownPropertyLine}
                label="Dielectric Specular Model"
                target={material.brdf}
                propertyKey="dielectricSpecularModel"
                options={DielectricSpecularModelOptions}
            />
            <BoundProperty
                component={NumberDropdownPropertyLine}
                label="Conductor Specular Model"
                target={material.brdf}
                propertyKey="conductorSpecularModel"
                options={ConductorSpecularModelOptions}
            />
        </>
    );
};

export const PBRBaseMaterialAdvancedProperties: FunctionComponent<{ material: PBRBaseMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Energy Conservation" target={material.brdf} propertyKey="useEnergyConservation" />
            <BoundProperty component={SwitchPropertyLine} label="Spherical Harmonics" target={material.brdf} propertyKey="useSphericalHarmonics" />
            <BoundProperty component={SwitchPropertyLine} label="Radiance occlusion" target={material} propertyKey="_useRadianceOcclusion" />
            <BoundProperty component={SwitchPropertyLine} label="Horizon occlusion" target={material} propertyKey="_useHorizonOcclusion" />
            <BoundProperty component={SwitchPropertyLine} label="Mix irradiance with rough radiance" target={material.brdf} propertyKey="mixIblRadianceWithIrradiance" />
            <BoundProperty
                component={SwitchPropertyLine}
                label="Use legacy specular energy conservation"
                target={material.brdf}
                propertyKey="useLegacySpecularEnergyConservation"
            />
            <BoundProperty component={SwitchPropertyLine} label="Unlit" target={material} propertyKey="_unlit" />
        </>
    );
};

export const PBRBaseMaterialDebugProperties: FunctionComponent<{ material: PBRBaseMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty component={NumberDropdownPropertyLine} label="Debug mode" target={material} propertyKey="debugMode" options={DebugMode} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Split position" target={material} propertyKey="debugLimit" min={-1} max={1} step={0.01} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Output factor" target={material} propertyKey="debugFactor" min={0} max={5} step={0.01} />
        </>
    );
};
