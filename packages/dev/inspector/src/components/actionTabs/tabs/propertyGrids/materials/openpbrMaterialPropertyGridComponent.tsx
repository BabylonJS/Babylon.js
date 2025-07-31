import * as React from "react";

import { Observable } from "core/Misc/observable";
import { Constants } from "core/Engines/constants";

import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { CommonMaterialPropertyGridComponent } from "./commonMaterialPropertyGridComponent";
import { TextureLinkLineComponent } from "../../../lines/textureLinkLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../../globalState";

import "core/Materials/material.decalMap";
import "core/Rendering/prePassRendererSceneComponent";
import "core/Rendering/subSurfaceSceneComponent";
import type { OpenPBRMaterial } from "core/Materials/PBR/openPbrMaterial";

interface IOpenPBRMaterialPropertyGridComponentProps {
    globalState: GlobalState;
    material: OpenPBRMaterial;
    lockObject: LockObject;
    onSelectionChangedObservable?: Observable<any>;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

/**
 * @internal
 */
export class OpenPBRMaterialPropertyGridComponent extends React.Component<IOpenPBRMaterialPropertyGridComponentProps> {
    private _onDebugSelectionChangeObservable = new Observable<TextureLinkLineComponent>();
    constructor(props: IOpenPBRMaterialPropertyGridComponentProps) {
        super(props);
    }

    switchAmbientMode(state: boolean) {
        this.props.material.debugMode = state ? 21 : 0;
    }

    renderTextures(onDebugSelectionChangeObservable: Observable<TextureLinkLineComponent>) {
        const material = this.props.material;

        return (
            <LineContainerComponent title="CHANNELS" selection={this.props.globalState}>
                <TextureLinkLineComponent
                    label="Base Weight"
                    texture={material.baseWeightTexture}
                    propertyName="baseWeightTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Base Color"
                    texture={material.baseColorTexture}
                    propertyName="baseColorTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Base Diffuse Roughness"
                    texture={material.baseDiffuseRoughnessTexture}
                    propertyName="baseDiffuseRoughnessTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Metallic Roughness"
                    texture={material.baseMetalRoughTexture}
                    propertyName="baseMetalRoughTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Radiance"
                    texture={material._radianceTexture}
                    propertyName="radianceTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Specular Weight"
                    texture={material.specularWeightTexture}
                    propertyName="specularWeightTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Specular Color"
                    texture={material.specularColorTexture}
                    propertyName="specularColorTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Geometry Normal"
                    texture={material.geometryNormalTexture}
                    propertyName="geometryNormalTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Geometry Coat Normal"
                    texture={material.geometryCoatNormalTexture}
                    propertyName="geometryCoatNormalTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Geometry Opacity"
                    texture={material.geometryOpacityTexture}
                    propertyName="geometryOpacityTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Coat Weight"
                    texture={material.coatWeightTexture}
                    propertyName="coatWeightTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Coat Color"
                    texture={material.coatColorTexture}
                    propertyName="coatColorTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Coat Roughness"
                    texture={material.coatRoughnessTexture}
                    propertyName="coatRoughnessTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
            </LineContainerComponent>
        );
    }

    override render() {
        const material = this.props.material;

        const debugMode = [
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
        ];

        const realTimeFilteringQualityOptions = [
            { label: "Low", value: Constants.TEXTURE_FILTERING_QUALITY_LOW },
            { label: "Medium", value: Constants.TEXTURE_FILTERING_QUALITY_MEDIUM },
            { label: "High", value: Constants.TEXTURE_FILTERING_QUALITY_HIGH },
        ];

        return (
            <>
                <CommonMaterialPropertyGridComponent
                    globalState={this.props.globalState}
                    lockObject={this.props.lockObject}
                    material={material}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                {this.renderTextures(this._onDebugSelectionChangeObservable)}
                <LineContainerComponent title="BASE" selection={this.props.globalState}>
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Weight"
                        target={material}
                        propertyName="baseWeight"
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextureLinkLineComponent
                        label="Weight Texture"
                        texture={material.baseWeightTexture}
                        propertyName="baseWeightTexture"
                        material={material}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onDebugSelectionChangeObservable={this._onDebugSelectionChangeObservable}
                    />
                    <Color3LineComponent
                        lockObject={this.props.lockObject}
                        label="Color"
                        target={material}
                        propertyName="baseColor"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        isLinear={true}
                    />
                    <TextureLinkLineComponent
                        label="Color Texture"
                        texture={material.baseColorTexture}
                        propertyName="baseColorTexture"
                        material={material}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onDebugSelectionChangeObservable={this._onDebugSelectionChangeObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Metalness"
                        target={material}
                        propertyName="baseMetalness"
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextureLinkLineComponent
                        label="Metal/Rough Texture"
                        texture={material.baseMetalRoughTexture}
                        propertyName="baseMetalRoughTexture"
                        material={material}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onDebugSelectionChangeObservable={this._onDebugSelectionChangeObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Diffuse Roughness"
                        target={material}
                        propertyName="baseDiffuseRoughness"
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextureLinkLineComponent
                        label="Diffuse Roughness Texture"
                        texture={material.baseDiffuseRoughnessTexture}
                        propertyName="baseDiffuseRoughnessTexture"
                        material={material}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onDebugSelectionChangeObservable={this._onDebugSelectionChangeObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="SPECULAR" selection={this.props.globalState}>
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Weight"
                        target={material}
                        propertyName="specularWeight"
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextureLinkLineComponent
                        label="Weight Texture"
                        texture={material.specularWeightTexture}
                        propertyName="specularWeightTexture"
                        material={material}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onDebugSelectionChangeObservable={this._onDebugSelectionChangeObservable}
                    />
                    <Color3LineComponent
                        lockObject={this.props.lockObject}
                        label="Color"
                        target={material}
                        propertyName="specularColor"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        isLinear={true}
                    />
                    <TextureLinkLineComponent
                        label="Color Texture"
                        texture={material.specularColorTexture}
                        propertyName="specularColorTexture"
                        material={material}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onDebugSelectionChangeObservable={this._onDebugSelectionChangeObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Roughness"
                        target={material}
                        propertyName="specularRoughness"
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextureLinkLineComponent
                        label="Metal/Rough Texture"
                        texture={material.baseMetalRoughTexture}
                        propertyName="baseMetalRoughTexture"
                        material={material}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onDebugSelectionChangeObservable={this._onDebugSelectionChangeObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="IOR"
                        target={material}
                        propertyName="specularIor"
                        minimum={1}
                        maximum={3}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="COAT" selection={this.props.globalState}>
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Weight"
                        target={material}
                        propertyName="coatWeight"
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextureLinkLineComponent
                        label="Weight Texture"
                        texture={material.coatWeightTexture}
                        propertyName="coatWeightTexture"
                        material={material}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onDebugSelectionChangeObservable={this._onDebugSelectionChangeObservable}
                    />
                    <Color3LineComponent
                        lockObject={this.props.lockObject}
                        label="Color"
                        target={material}
                        propertyName="coatColor"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        isLinear={true}
                    />
                    <TextureLinkLineComponent
                        label="Color Texture"
                        texture={material.coatColorTexture}
                        propertyName="coatColorTexture"
                        material={material}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onDebugSelectionChangeObservable={this._onDebugSelectionChangeObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Roughness"
                        target={material}
                        propertyName="coatRoughness"
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextureLinkLineComponent
                        label="Roughness Texture"
                        texture={material.coatRoughnessTexture}
                        propertyName="coatRoughnessTexture"
                        material={material}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onDebugSelectionChangeObservable={this._onDebugSelectionChangeObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="IOR"
                        target={material}
                        propertyName="coatIor"
                        minimum={1}
                        maximum={3}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Darkening"
                        target={material}
                        propertyName="coatDarkening"
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="EMISSION" selection={this.props.globalState}>
                    <Color3LineComponent
                        lockObject={this.props.lockObject}
                        label="Color"
                        target={material}
                        propertyName="emissionColor"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        isLinear={true}
                    />
                    <TextureLinkLineComponent
                        label="Color Texture"
                        texture={material.emissionColorTexture}
                        propertyName="emissionColorTexture"
                        material={material}
                        onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                        onDebugSelectionChangeObservable={this._onDebugSelectionChangeObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Luminance"
                        target={material}
                        propertyName="emissionLuminance"
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="LEVELS" closed={true} selection={this.props.globalState}>
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Environment"
                        target={material}
                        propertyName="environmentIntensity"
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Direct"
                        target={material}
                        propertyName="directIntensity"
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="RENDERING" closed={true} selection={this.props.globalState}>
                    <CheckBoxLineComponent
                        label="Realtime Filtering"
                        target={material}
                        propertyName="realTimeFiltering"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <OptionsLine
                        allowNullValue={true}
                        label="Realtime Filtering quality"
                        options={realTimeFilteringQualityOptions}
                        target={material}
                        propertyName="realTimeFilteringQuality"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="NORMAL MAP" closed={true} selection={this.props.globalState}>
                    <CheckBoxLineComponent
                        label="Invert X axis"
                        target={material}
                        propertyName="invertNormalMapX"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <CheckBoxLineComponent
                        label="Invert Y axis"
                        target={material}
                        propertyName="invertNormalMapY"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="ADVANCED" closed={true} selection={this.props.globalState}>
                    <CheckBoxLineComponent
                        label="Horizon occlusion "
                        target={material}
                        propertyName="useHorizonOcclusion"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="DEBUG" closed={true} selection={this.props.globalState}>
                    <OptionsLine label="Debug mode" options={debugMode} target={material} propertyName="debugMode" />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Split position"
                        target={material}
                        propertyName="debugLimit"
                        minimum={-1}
                        maximum={1}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Output factor"
                        target={material}
                        propertyName="debugFactor"
                        minimum={0}
                        maximum={5}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
            </>
        );
    }
}
