import type { FunctionComponent } from "react";

import type { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { BoundProperty } from "../boundProperty";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { FileUploadLine } from "shared-ui-components/fluent/hoc/fileUploadLine";
import { ReadFile } from "core/Misc/fileTools";
import { Texture } from "core/Materials/Textures/texture";

// TODO: ryamtrem / gehalper This function is temporal until there is a line control to handle texture links (similar to the old TextureLinkLineComponent)
const UpdateTexture = (file: File, material: OpenPBRMaterial, textureSetter: (texture: BaseTexture) => void) => {
    ReadFile(
        file,
        (data) => {
            const blob = new Blob([data], { type: "octet/stream" });
            const url = URL.createObjectURL(blob);
            textureSetter(new Texture(url, material.getScene(), false, false));
        },
        undefined,
        true
    );
};

/**
 * Displays the base layer properties of an OpenPBR material.
 * @param props - The required properties
 * @returns A JSX element representing the base layer properties.
 */
export const OpenPBRMaterialBaseProperties: FunctionComponent<{ material: OpenPBRMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty component={SyncedSliderPropertyLine} label="Base Weight" target={material} propertyKey="baseWeight" min={0} max={1} step={0.01} />
            <FileUploadLine
                label="Base Weight"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.baseWeightTexture = texture));
                    }
                }}
            />
            <BoundProperty component={Color3PropertyLine} label="Base Color" target={material} propertyKey="baseColor" isLinearMode />
            <FileUploadLine
                label="Base Color"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.baseColorTexture = texture));
                    }
                }}
            />
            <BoundProperty component={SyncedSliderPropertyLine} label="Base Metalness" target={material} propertyKey="baseMetalness" min={0} max={1} step={0.01} />
            <FileUploadLine
                label="Base Metalness"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.baseMetalnessTexture = texture));
                    }
                }}
            />
            <BoundProperty component={SyncedSliderPropertyLine} label="Base Diffuse Roughness" target={material} propertyKey="baseDiffuseRoughness" min={0} max={1} step={0.01} />
            <FileUploadLine
                label="Base Diffuse Roughness"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.baseDiffuseRoughnessTexture = texture));
                    }
                }}
            />
        </>
    );
};

/**
 * Displays the specular layer properties of an OpenPBR material.
 * @param props - The required properties
 * @returns A JSX element representing the specular layer properties.
 */
export const OpenPBRMaterialSpecularProperties: FunctionComponent<{ material: OpenPBRMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty component={SyncedSliderPropertyLine} label="Specular Weight" target={material} propertyKey="specularWeight" min={0} max={1} step={0.01} />
            <FileUploadLine
                label="Specular Weight"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.specularWeightTexture = texture));
                    }
                }}
            />
            <BoundProperty component={Color3PropertyLine} label="Specular Color" target={material} propertyKey="specularColor" isLinearMode />
            <FileUploadLine
                label="Specular Color"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.specularColorTexture = texture));
                    }
                }}
            />
            <BoundProperty component={SyncedSliderPropertyLine} label="Specular Roughness" target={material} propertyKey="specularRoughness" min={0} max={1} step={0.01} />
            <FileUploadLine
                label="Specular Roughness"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.specularRoughnessTexture = texture));
                    }
                }}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Specular Roughness Anisotropy"
                target={material}
                propertyKey="specularRoughnessAnisotropy"
                min={0}
                max={1}
                step={0.01}
            />
            <FileUploadLine
                label="Specular Roughness Anisotropy"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.specularRoughnessAnisotropyTexture = texture));
                    }
                }}
            />
            <BoundProperty component={SyncedSliderPropertyLine} label="Specular IOR" target={material} propertyKey="specularIor" min={1} max={3} step={0.01} />
        </>
    );
};

export const OpenPBRMaterialTransmissionProperties: FunctionComponent<{ material: OpenPBRMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty component={SyncedSliderPropertyLine} label="Transmission Weight" target={material} propertyKey="transmissionWeight" min={0} max={1} step={0.01} />
            <FileUploadLine
                label="Transmission Weight"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.transmissionWeightTexture = texture));
                    }
                }}
            />
            <BoundProperty component={Color3PropertyLine} label="Transmission Color" target={material} propertyKey="transmissionColor" isLinearMode />
            <FileUploadLine
                label="Transmission Color"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.transmissionColorTexture = texture));
                    }
                }}
            />
            <BoundProperty component={SyncedSliderPropertyLine} label="Transmission Depth" target={material} propertyKey="transmissionDepth" min={0} step={0.01} />
            <FileUploadLine
                label="Transmission Depth"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.transmissionDepthTexture = texture));
                    }
                }}
            />
            <BoundProperty component={Color3PropertyLine} label="Transmission Scatter" target={material} propertyKey="transmissionScatter" isLinearMode />
            <FileUploadLine
                label="Transmission Scatter"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.transmissionScatterTexture = texture));
                    }
                }}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Transmission Scatter Anisotropy"
                target={material}
                propertyKey="transmissionScatterAnisotropy"
                min={-1}
                max={1}
                step={0.01}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Transmission Dispersion Abbe Number"
                target={material}
                propertyKey="transmissionDispersionAbbeNumber"
                min={1}
                max={100}
                step={1}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Transmission Dispersion Scale"
                target={material}
                propertyKey="transmissionDispersionScale"
                min={0}
                max={1}
                step={0.01}
            />
            <FileUploadLine
                label="Transmission Dispersion Scale"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.transmissionDispersionScaleTexture = texture));
                    }
                }}
            />
        </>
    );
};

/**
 * Displays the coat layer properties of an OpenPBR material.
 * @param props - The required properties
 * @returns A JSX element representing the coat layer properties.
 */
export const OpenPBRMaterialCoatProperties: FunctionComponent<{ material: OpenPBRMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty component={SyncedSliderPropertyLine} label="Coat Weight" target={material} propertyKey="coatWeight" min={0} max={1} step={0.01} />
            <FileUploadLine
                label="Coat Weight"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.coatWeightTexture = texture));
                    }
                }}
            />
            <BoundProperty component={Color3PropertyLine} label="Coat Color" target={material} propertyKey="coatColor" isLinearMode />
            <FileUploadLine
                label="Coat Color"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.coatColorTexture = texture));
                    }
                }}
            />
            <BoundProperty component={SyncedSliderPropertyLine} label="Coat Roughness" target={material} propertyKey="coatRoughness" min={0} max={1} step={0.01} />
            <FileUploadLine
                label="Coat Roughness"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.coatRoughnessTexture = texture));
                    }
                }}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Coat Roughness Anisotropy"
                target={material}
                propertyKey="coatRoughnessAnisotropy"
                min={0}
                max={1}
                step={0.01}
            />
            <FileUploadLine
                label="Coat Roughness Anisotropy"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.coatRoughnessAnisotropyTexture = texture));
                    }
                }}
            />
            <BoundProperty component={SyncedSliderPropertyLine} label="Coat IOR" target={material} propertyKey="coatIor" min={1} max={3} step={0.01} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Coat Darkening" target={material} propertyKey="coatDarkening" min={0} max={1} step={0.01} />
            <FileUploadLine
                label="Coat Darkening"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.coatDarkeningTexture = texture));
                    }
                }}
            />
        </>
    );
};

/**
 * Displays the fuzz layer properties of an OpenPBR material.
 * @param props - The required properties
 * @returns A JSX element representing the fuzz layer properties.
 */
export const OpenPBRMaterialFuzzProperties: FunctionComponent<{ material: OpenPBRMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty component={SyncedSliderPropertyLine} label="Fuzz Weight" target={material} propertyKey="fuzzWeight" min={0} max={1} step={0.01} />
            <FileUploadLine
                label="Fuzz Weight"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.fuzzWeightTexture = texture));
                    }
                }}
            />
            <BoundProperty component={Color3PropertyLine} label="Fuzz Color" target={material} propertyKey="fuzzColor" isLinearMode />
            <FileUploadLine
                label="Fuzz Color"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.fuzzColorTexture = texture));
                    }
                }}
            />
            <BoundProperty component={SyncedSliderPropertyLine} label="Fuzz Roughness" target={material} propertyKey="fuzzRoughness" min={0} max={1} step={0.01} />
            <FileUploadLine
                label="Fuzz Roughness"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.fuzzRoughnessTexture = texture));
                    }
                }}
            />
            <BoundProperty component={SyncedSliderPropertyLine} label="Number of Samples" target={material} propertyKey="fuzzSampleNumber" min={4} max={64} step={1} />
        </>
    );
};

/**
 * Displays the emission properties of an OpenPBR material.
 * @param props - The required properties
 * @returns A JSX element representing the emission properties.
 */
export const OpenPBRMaterialEmissionProperties: FunctionComponent<{ material: OpenPBRMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty component={Color3PropertyLine} label="Emission Color" target={material} propertyKey="emissionColor" isLinearMode />
            <FileUploadLine
                label="Emission Color"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.emissionColorTexture = texture));
                    }
                }}
            />
            <BoundProperty component={SyncedSliderPropertyLine} label="Emission Luminance" target={material} propertyKey="emissionLuminance" min={0} max={10} step={0.01} />
        </>
    );
};

/**
 * Displays the thin film properties of an OpenPBR material.
 * @param props - The required properties
 * @returns A JSX element representing the thin film properties.
 */
export const OpenPBRMaterialThinFilmProperties: FunctionComponent<{ material: OpenPBRMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty component={SyncedSliderPropertyLine} label="Thin Film Weight" target={material} propertyKey="thinFilmWeight" min={0} max={1} step={0.01} />
            <FileUploadLine
                label="Thin Film Weight"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.thinFilmWeightTexture = texture));
                    }
                }}
            />
            <BoundProperty component={SyncedSliderPropertyLine} label="Thin Film Thickness" target={material} propertyKey="thinFilmThickness" min={0} max={1} step={0.01} />
            <FileUploadLine
                label="Thin Film Thickness"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.thinFilmThicknessTexture = texture));
                    }
                }}
            />
            <BoundProperty component={SyncedSliderPropertyLine} label="Thin Film IOR" target={material} propertyKey="thinFilmIor" min={1} max={3} step={0.01} />
        </>
    );
};

/**
 * Displays the geometry properties of an OpenPBR material.
 * @param props - The required properties
 * @returns A JSX element representing the geometry properties.
 */
export const OpenPBRMaterialGeometryProperties: FunctionComponent<{ material: OpenPBRMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty component={SyncedSliderPropertyLine} label="Opacity" target={material} propertyKey="geometryOpacity" min={0} max={1} step={0.01} />
            <FileUploadLine
                label="Geometry Opacity"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.geometryOpacityTexture = texture));
                    }
                }}
            />
            <FileUploadLine
                label="Geometry Normal"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.geometryNormalTexture = texture));
                    }
                }}
            />
            <BoundProperty component={SyncedSliderPropertyLine} label="Tangent Angle" target={material} propertyKey="geometryTangentAngle" min={0} max={Math.PI} step={0.01} />
            <FileUploadLine
                label="Geometry Tangent"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.geometryTangentTexture = texture));
                    }
                }}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Coat Tangent Angle"
                target={material}
                propertyKey="geometryCoatTangentAngle"
                min={0}
                max={Math.PI}
                step={0.01}
            />
            <FileUploadLine
                label="Geometry Coat Normal"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.geometryCoatNormalTexture = texture));
                    }
                }}
            />
            <FileUploadLine
                label="Geometry Coat Tangent"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.geometryCoatTangentTexture = texture));
                    }
                }}
            />
            <BoundProperty component={SyncedSliderPropertyLine} label="Geometry Thickness" target={material} propertyKey="geometryThickness" min={0} step={0.1} />
            <FileUploadLine
                label="Geometry Thickness"
                accept=".jpg, .png, .tga, .dds, .env, .exr"
                onClick={(files) => {
                    if (files.length > 0) {
                        UpdateTexture(files[0], material, (texture) => (material.geometryThicknessTexture = texture));
                    }
                }}
            />
        </>
    );
};
