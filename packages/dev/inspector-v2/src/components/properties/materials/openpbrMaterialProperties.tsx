import { type FunctionComponent } from "react";

import { type OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { BoundProperty } from "../boundProperty";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { CheckboxPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/checkboxPropertyLine";
import { TextureSelectorPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/entitySelectorPropertyLine";

/**
 * Displays the base layer properties of an OpenPBR material.
 * @param props - The required properties
 * @returns A JSX element representing the base layer properties.
 */
export const OpenPBRMaterialBaseProperties: FunctionComponent<{ material: OpenPBRMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Base Weight"
                target={material}
                propertyKey="baseWeight"
                min={0}
                max={1}
                step={0.01}
                description="Controls how strong or visible the base aspect appears."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/basesubstrate"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Base Weight"
                target={material}
                propertyKey="baseWeightTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={Color3PropertyLine}
                label="Base Color"
                target={material}
                propertyKey="baseColor"
                isLinearMode
                description="Sets the primary surface color of the material."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/basesubstrate"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Base Color"
                target={material}
                propertyKey="baseColorTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Base Metalness"
                target={material}
                propertyKey="baseMetalness"
                min={0}
                max={1}
                step={0.01}
                description="Controls whether the material behaves as metal or non-metal. The parameter supersedes transmission_weight and subsurface_weight."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/basesubstrate"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Base Metalness"
                target={material}
                propertyKey="baseMetalnessTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Base Diffuse Roughness"
                target={material}
                propertyKey="baseDiffuseRoughness"
                min={0}
                max={1}
                step={0.01}
                description="Softens the surface's base appearance. Higher values create matte or porous looks. Lower values are smoother."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/basesubstrate"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Base Diffuse Roughness"
                target={material}
                propertyKey="baseDiffuseRoughnessTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Ambient Occlusion"
                target={material}
                propertyKey="ambientOcclusionTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
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
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Specular Weight"
                target={material}
                propertyKey="specularWeight"
                min={0}
                max={1}
                step={0.01}
                description="Controls how strong the reflections appear."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/basesubstrate"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Specular Weight"
                target={material}
                propertyKey="specularWeightTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={Color3PropertyLine}
                label="Specular Color"
                target={material}
                propertyKey="specularColor"
                isLinearMode
                description="Tints the color of reflections."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/basesubstrate"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Specular Color"
                target={material}
                propertyKey="specularColorTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Specular Roughness"
                target={material}
                propertyKey="specularRoughness"
                min={0}
                max={1}
                step={0.01}
                description="Controls how sharp or blurry reflections are."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/basesubstrate"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Specular Roughness"
                target={material}
                propertyKey="specularRoughnessTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Specular Roughness Anisotropy"
                target={material}
                propertyKey="specularRoughnessAnisotropy"
                min={0}
                max={1}
                step={0.01}
                description="Stretches reflections in one direction for brushed or streaked looks. Requires specular_roughness > 0."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/microfacetmodel"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Specular Roughness Anisotropy"
                target={material}
                propertyKey="specularRoughnessAnisotropyTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Specular IOR"
                target={material}
                propertyKey="specularIor"
                min={1}
                max={3}
                step={0.01}
                description="Index of refraction is a physical value controlling the reflective intensity and refraction. The parameter has no effect on metals."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/basesubstrate"
            />
        </>
    );
};

export const OpenPBRMaterialTransmissionProperties: FunctionComponent<{ material: OpenPBRMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Transmission Weight"
                target={material}
                propertyKey="transmissionWeight"
                min={0}
                max={1}
                step={0.01}
                description="Controls the presence of the transparency effect. The parameter is superseded by base_metalness."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/basesubstrate/translucentbase"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Transmission Weight"
                target={material}
                propertyKey="transmissionWeightTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={Color3PropertyLine}
                label="Transmission Color"
                target={material}
                propertyKey="transmissionColor"
                isLinearMode
                description="Tints light passing through the material. Works with transmission_depth for realistic thickness-based coloring."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/basesubstrate/translucentbase"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Transmission Color"
                target={material}
                propertyKey="transmissionColorTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Transmission Depth (cm)"
                target={material}
                propertyKey="transmissionDepth"
                min={0}
                max={5}
                step={0.001}
                convertTo={(value) => value * 100}
                convertFrom={(value) => value / 100}
                description="Controls how quickly light is absorbed with thickness. Distance is in scene units."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/basesubstrate/translucentbase"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Transmission Depth"
                target={material}
                propertyKey="transmissionDepthTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={Color3PropertyLine}
                label="Transmission Scatter"
                target={material}
                propertyKey="transmissionScatter"
                isLinearMode
                description="Adds internal cloudiness to create materials like juice, honey, etc. Requires transmission_depth > 0."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/basesubstrate/translucentbase"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Transmission Scatter"
                target={material}
                propertyKey="transmissionScatterTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Transmission Scatter Anisotropy"
                target={material}
                propertyKey="transmissionScatterAnisotropy"
                min={-1}
                max={1}
                step={0.01}
                description="Shifts scattering forward/backward for clearer or hazier appearance depending on viewing angle."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/basesubstrate/translucentbase"
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Transmission Dispersion Abbe Number"
                target={material}
                propertyKey="transmissionDispersionAbbeNumber"
                min={1}
                max={100}
                step={1}
                description="Physical value for the rainbow color separation in refraction."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/basesubstrate/translucentbase"
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Transmission Dispersion Scale"
                target={material}
                propertyKey="transmissionDispersionScale"
                min={0}
                max={1}
                step={0.01}
                description="Strength of rainbow color separation in refraction."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/basesubstrate/translucentbase"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Transmission Dispersion Scale"
                target={material}
                propertyKey="transmissionDispersionScaleTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
        </>
    );
};

export const OpenPBRMaterialSubsurfaceProperties: FunctionComponent<{ material: OpenPBRMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Subsurface Weight"
                target={material}
                propertyKey="subsurfaceWeight"
                min={0}
                max={1}
                step={0.01}
                description="Controls the presence of the subsurface effect. The parameter is superseded by base_metalness and transmission_weight."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/basesubstrate/subsurface"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Subsurface Weight"
                target={material}
                propertyKey="subsurfaceWeightTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={Color3PropertyLine}
                label="Subsurface Color"
                target={material}
                propertyKey="subsurfaceColor"
                isLinearMode
                description="Colors the light that scatters under the surface."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/basesubstrate/subsurface"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Subsurface Color"
                target={material}
                propertyKey="subsurfaceColorTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Subsurface Radius (cm)"
                target={material}
                propertyKey="subsurfaceRadius"
                min={0}
                max={4}
                step={0.001}
                convertTo={(value) => value * 100}
                convertFrom={(value) => value / 100}
                description="Controls how soft and spread-out the subsurface look appears."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/basesubstrate/subsurface"
            />
            <BoundProperty
                component={Color3PropertyLine}
                label="Subsurface Radius Scale"
                target={material}
                propertyKey="subsurfaceRadiusScale"
                isLinearMode
                description="Tints thin areas with light shining through, like warm glow on ears or leaves."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/basesubstrate/subsurface"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Subsurface Radius Scale"
                target={material}
                propertyKey="subsurfaceRadiusScaleTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Subsurface Scatter Anisotropy"
                target={material}
                propertyKey="subsurfaceScatterAnisotropy"
                min={-1}
                max={1}
                step={0.01}
                description="Shifts scattering forward/backward for a softer glow or a sharper one."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/basesubstrate/subsurface"
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
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Coat Weight"
                target={material}
                propertyKey="coatWeight"
                min={0}
                max={1}
                step={0.01}
                description="Controls the presence of the coat."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/coat"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Coat Weight"
                target={material}
                propertyKey="coatWeightTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={Color3PropertyLine}
                label="Coat Color"
                target={material}
                propertyKey="coatColor"
                isLinearMode
                description="Tints the coat, for tinted varnish or paint."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/coat"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Coat Color"
                target={material}
                propertyKey="coatColorTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Coat Roughness"
                target={material}
                propertyKey="coatRoughness"
                min={0}
                max={1}
                step={0.01}
                description="Controls how sharp or blurry the coat reflections appear."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/coat/roughening"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Coat Roughness"
                target={material}
                propertyKey="coatRoughnessTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Coat Roughness Anisotropy"
                target={material}
                propertyKey="coatRoughnessAnisotropy"
                min={0}
                max={1}
                step={0.01}
                description="Stretches coat reflections in one direction for brushed or streaked looks. Requires coat_roughness > 0."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/coat"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Coat Roughness Anisotropy"
                target={material}
                propertyKey="coatRoughnessAnisotropyTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Coat IOR"
                target={material}
                propertyKey="coatIor"
                min={1}
                max={3}
                step={0.01}
                description="Index of refraction is a physical value controlling the reflective intensity of the coat."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/coat"
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Coat Darkening"
                target={material}
                propertyKey="coatDarkening"
                min={0}
                max={1}
                step={0.01}
                description="Darkens the base under the coat, similar to how real varnish deepens color."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/coat/darkening"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Coat Darkening"
                target={material}
                propertyKey="coatDarkeningTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
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
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Fuzz Weight"
                target={material}
                propertyKey="fuzzWeight"
                min={0}
                max={1}
                step={0.01}
                description="Controls the presence of the fuzz."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/fuzz"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Fuzz Weight"
                target={material}
                propertyKey="fuzzWeightTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={Color3PropertyLine}
                label="Fuzz Color"
                target={material}
                propertyKey="fuzzColor"
                isLinearMode
                description="Controls the color of the fuzz."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/fuzz"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Fuzz Color"
                target={material}
                propertyKey="fuzzColorTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Fuzz Roughness"
                target={material}
                propertyKey="fuzzRoughness"
                min={0}
                max={1}
                step={0.01}
                description="Controls the roughness of the fuzz."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/fuzz"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Fuzz Roughness"
                target={material}
                propertyKey="fuzzRoughnessTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
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
            <BoundProperty
                component={Color3PropertyLine}
                label="Emission Color"
                target={material}
                propertyKey="emissionColor"
                isLinearMode
                description="Controls the color of the glow."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/emission"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Emission Color"
                target={material}
                propertyKey="emissionColorTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Emission Luminance"
                target={material}
                propertyKey="emissionLuminance"
                min={0}
                max={10}
                step={0.01}
                description="Controls how bright the glow is."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/emission"
            />
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
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Thin Film Weight"
                target={material}
                propertyKey="thinFilmWeight"
                min={0}
                max={1}
                step={0.01}
                description="Controls the presence of the thin-film."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/thin-filmiridescence"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Thin Film Weight"
                target={material}
                propertyKey="thinFilmWeightTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Thin Film Thickness"
                target={material}
                propertyKey="thinFilmThickness"
                min={0}
                max={1}
                step={0.01}
                description="Changes the color pattern of the iridescence."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/thin-filmiridescence"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Thin Film Thickness"
                target={material}
                propertyKey="thinFilmThicknessTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Thin Film IOR"
                target={material}
                propertyKey="thinFilmIor"
                min={1}
                max={3}
                step={0.01}
                description="Alters the strength and contrast of the color shift based in the index of refraction."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/thin-filmiridescence"
            />
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
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Geometry Opacity"
                target={material}
                propertyKey="geometryOpacity"
                min={0}
                max={1}
                step={0.01}
                description="Controls material presence and transparency cutout."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/opacity/transparency"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Geometry Opacity"
                target={material}
                propertyKey="geometryOpacityTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={CheckboxPropertyLine}
                label="Thin-Walled"
                target={material}
                propertyKey="geometryThinWalled"
                description="When enabled, treats material as a thin shell (like leaves, paper sheets or windows). Disables ray bending in refraction."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/thin-walledcase"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Geometry Normal"
                target={material}
                propertyKey="geometryNormalTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Tangent Angle"
                target={material}
                propertyKey="geometryTangentAngle"
                min={0}
                max={Math.PI}
                step={0.01}
                description="Tangent vector controlling anisotropic reflection direction for the base (metal and non-metal). Works with specular_roughness_anisotropy."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/geometry/tangent"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Geometry Tangent"
                target={material}
                propertyKey="geometryTangentTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Coat Tangent Angle"
                target={material}
                propertyKey="geometryCoatTangentAngle"
                min={0}
                max={Math.PI}
                step={0.01}
                description="Tangent vector controlling anisotropic reflection direction for the coat. Works with coat_roughness_anisotropy."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/geometry/coat-tangent"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Geometry Coat Normal"
                target={material}
                propertyKey="geometryCoatNormalTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Geometry Coat Tangent"
                target={material}
                propertyKey="geometryCoatTangentTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Geometry Thickness"
                target={material}
                propertyKey="geometryThickness"
                min={0}
                step={0.001}
                description="Controls the thickness of the geometry for volume approximations."
                docLink="https://academysoftwarefoundation.github.io/OpenPBR/index.html#model/thickness"
            />
            <BoundProperty
                component={TextureSelectorPropertyLine}
                label="Geometry Thickness"
                target={material}
                propertyKey="geometryThicknessTexture"
                scene={material.getScene()}
                defaultValue={null}
                onLink={(texture) => void texture}
            />
        </>
    );
};
