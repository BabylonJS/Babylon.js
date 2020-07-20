import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";
import { Constants } from "babylonjs/Engines/constants";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { Color3LineComponent } from "../../../lines/color3LineComponent";
import { CheckBoxLineComponent } from "../../../lines/checkBoxLineComponent";
import { Vector2LineComponent } from "../../../lines/vector2LineComponent";
import { SliderLineComponent } from "../../../lines/sliderLineComponent";
import { OptionsLineComponent } from "../../../lines/optionsLineComponent";
import { CommonMaterialPropertyGridComponent } from "./commonMaterialPropertyGridComponent";
import { TextureLinkLineComponent } from "../../../lines/textureLinkLineComponent";
import { LockObject } from "../lockObject";
import { GlobalState } from '../../../../globalState';

interface IPBRMaterialPropertyGridComponentProps {
    globalState: GlobalState;
    material: PBRMaterial;
    lockObject: LockObject;
    onSelectionChangedObservable?: Observable<any>;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class PBRMaterialPropertyGridComponent extends React.Component<IPBRMaterialPropertyGridComponentProps> {
    private _onDebugSelectionChangeObservable = new Observable<TextureLinkLineComponent>();
    constructor(props: IPBRMaterialPropertyGridComponentProps) {
        super(props);
    }

    switchAmbientMode(state: boolean) {
        this.props.material.debugMode = state ? 21 : 0;
    }

    switchMetallicMode(state: boolean) {
        this.props.material.debugMode = state ? 62 : 0;
    }

    switchRoughnessMode(state: boolean) {
        this.props.material.debugMode = state ? 63 : 0;
    }

    renderTextures(onDebugSelectionChangeObservable: Observable<TextureLinkLineComponent>) {
        const material = this.props.material;

        return (
            <LineContainerComponent globalState={this.props.globalState} title="CHANNELS">
                <TextureLinkLineComponent label="Albedo" texture={material.albedoTexture} propertyName="albedoTexture" material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent customDebugAction={(state) => this.switchMetallicMode(state)} label="Metallic" texture={material.metallicTexture} propertyName="metallicTexture" material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent customDebugAction={(state) => this.switchRoughnessMode(state)} label="Roughness" texture={material.metallicTexture} propertyName="metallicTexture" material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent label="Reflection" texture={material.reflectionTexture} propertyName="reflectionTexture" material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent label="Refraction" texture={material.refractionTexture} propertyName="refractionTexture" material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent label="Reflectivity" texture={material.reflectivityTexture} propertyName="reflectivityTexture" material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent label="Micro-surface" texture={material.microSurfaceTexture} propertyName="microSurfaceTexture" material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent label="Bump" texture={material.bumpTexture} propertyName="bumpTexture" material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent label="Emissive" texture={material.emissiveTexture} propertyName="emissiveTexture" material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent label="Opacity" texture={material.opacityTexture} propertyName="opacityTexture" material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent customDebugAction={(state) => this.switchAmbientMode(state)} label="Ambient" texture={material.ambientTexture} propertyName="ambientTexture" material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent label="Lightmap" texture={material.lightmapTexture} propertyName="lightmapTexture" material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent label="Detailmap" texture={material.detailMap.texture} material={material} onTextureCreated={(texture) => material.detailMap.texture = texture} onTextureRemoved={() => material.detailMap.texture = null} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <CheckBoxLineComponent label="Use lightmap as shadowmap" target={material} propertyName="useLightmapAsShadowmap" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <CheckBoxLineComponent label="Use detailmap" target={material.detailMap} propertyName="isEnabled" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </LineContainerComponent>
        );
    }

    render() {
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
            { label: "Albdeo Map", value: 20 },
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
            // Misc
            { label: "SEO", value: 80 },
            { label: "EHO", value: 81 },
            { label: "Energy Factor", value: 82 },
            { label: "Specular Reflectance", value: 83 },
            { label: "Clear Coat Reflectance", value: 84 },
            { label: "Sheen Reflectance", value: 85 },
            { label: "Luminance Over Alpha", value: 86 },
            { label: "Alpha", value: 87 },
        ];

        var realTimeFilteringQualityOptions = [
            { label: "Low", value: Constants.TEXTURE_FILTERING_QUALITY_LOW },
            { label: "Medium", value: Constants.TEXTURE_FILTERING_QUALITY_MEDIUM },
            { label: "High", value: Constants.TEXTURE_FILTERING_QUALITY_HIGH }
        ];

        (material.sheen as any)._useRoughness = (material.sheen as any)._useRoughness ?? material.sheen.roughness !== null;
        material.sheen.roughness = material.sheen.roughness ?? (material.sheen as any)._saveRoughness ?? 0;

        if (!(material.sheen as any)._useRoughness) {
            (material.sheen as any)._saveRoughness = material.sheen.roughness;
            material.sheen.roughness = null;
        }

        return (
            <div className="pane">
                <CommonMaterialPropertyGridComponent globalState={this.props.globalState} lockObject={this.props.lockObject} material={material} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                {this.renderTextures(this._onDebugSelectionChangeObservable)}
                <LineContainerComponent globalState={this.props.globalState} title="LIGHTING & COLORS">
                    <Color3LineComponent label="Albedo" target={material} propertyName="albedoColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} isLinear={true}/>
                    <Color3LineComponent label="Reflectivity" target={material} propertyName="reflectivityColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} isLinear={true} />
                    <SliderLineComponent label="Micro-surface" target={material} propertyName="microSurface" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Color3LineComponent label="Emissive" target={material} propertyName="emissiveColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} isLinear={true} />
                    <Color3LineComponent label="Ambient" target={material} propertyName="ambientColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} isLinear={true} />
                    <CheckBoxLineComponent label="Use physical light falloff" target={material} propertyName="usePhysicalLightFalloff" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="METALLIC WORKFLOW">
                    <SliderLineComponent label="Metallic" target={material} propertyName="metallic" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Roughness" target={material} propertyName="roughness" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Index of Refraction" target={material} propertyName="indexOfRefraction" minimum={1} maximum={2} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="F0 Factor" target={material} propertyName="metallicF0Factor" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Color3LineComponent label="Reflectance Color" target={material} propertyName="metallicReflectanceColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} isLinear={true} />
                    <TextureLinkLineComponent label="Reflectance Texture" texture={material.metallicReflectanceTexture} onTextureCreated={(texture) => material.metallicReflectanceTexture = texture} onTextureRemoved={() => material.metallicReflectanceTexture = null} material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={this._onDebugSelectionChangeObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="CLEAR COAT">
                    <CheckBoxLineComponent label="Enabled" target={material.clearCoat} propertyName="isEnabled"
                        onValueChanged={() => this.forceUpdate()}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {
                        material.clearCoat.isEnabled &&
                        <div className="fragment">
                            <SliderLineComponent label="Intensity" target={material.clearCoat} propertyName="intensity" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <SliderLineComponent label="Roughness" target={material.clearCoat} propertyName="roughness" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <SliderLineComponent label="IOR" target={material.clearCoat} propertyName="indexOfRefraction" minimum={1.0} maximum={3} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <TextureLinkLineComponent label="Clear coat" texture={material.clearCoat.texture} onTextureCreated={(texture) => material.clearCoat.texture = texture} onTextureRemoved={() => material.clearCoat.texture = null} material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={this._onDebugSelectionChangeObservable} />
                            <TextureLinkLineComponent label="Bump" texture={material.clearCoat.bumpTexture} onTextureCreated={(texture) => material.clearCoat.bumpTexture = texture} onTextureRemoved={() => material.clearCoat.bumpTexture = null} material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={this._onDebugSelectionChangeObservable} />
                            {
                                material.clearCoat.bumpTexture &&
                                <SliderLineComponent label="Bump strength" target={material.clearCoat.bumpTexture} propertyName="level" minimum={0} maximum={2} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            }
                            <CheckBoxLineComponent label="Tint" target={material.clearCoat} propertyName="isTintEnabled" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            {
                                material.clearCoat.isEnabled && material.clearCoat.isTintEnabled &&
                                <Color3LineComponent label="Tint Color" target={material.clearCoat} propertyName="tintColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} isLinear={true} />
                            }
                            {
                                material.clearCoat.isEnabled && material.clearCoat.isTintEnabled &&
                                <SliderLineComponent label="At Distance" target={material.clearCoat} propertyName="tintColorAtDistance" minimum={0} maximum={20} step={0.1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            }
                            {
                                material.clearCoat.isEnabled && material.clearCoat.isTintEnabled &&
                                <SliderLineComponent label="Tint Thickness" target={material.clearCoat} propertyName="tintThickness" minimum={0} maximum={20} step={0.1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            }
                            {
                                material.clearCoat.isEnabled && material.clearCoat.isTintEnabled &&
                                <TextureLinkLineComponent label="Tint" texture={material.clearCoat.tintTexture} onTextureCreated={(texture) => material.clearCoat.tintTexture = texture} onTextureRemoved={() => material.clearCoat.tintTexture = null} material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={this._onDebugSelectionChangeObservable} />
                            }
                        </div>
                    }
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="ANISOTROPIC">
                    <CheckBoxLineComponent label="Enabled" target={material.anisotropy} propertyName="isEnabled"
                        onValueChanged={() => this.forceUpdate()}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {
                        material.anisotropy.isEnabled &&
                        <div className="fragment">
                            <SliderLineComponent label="Intensity" target={material.anisotropy} propertyName="intensity" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <Vector2LineComponent label="Direction" target={material.anisotropy} propertyName="direction" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <TextureLinkLineComponent label="Anisotropic" texture={material.anisotropy.texture} onTextureCreated={(texture) => material.anisotropy.texture = texture} onTextureRemoved={() => material.anisotropy.texture = null} material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={this._onDebugSelectionChangeObservable} />
                        </div>
                    }
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="SHEEN">
                    <CheckBoxLineComponent label="Enabled" target={material.sheen} propertyName="isEnabled"
                        onValueChanged={() => this.forceUpdate()}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {
                        material.sheen.isEnabled &&
                        <div className="fragment">
                            <CheckBoxLineComponent label="Link to Albedo" target={material.sheen} propertyName="linkSheenWithAlbedo" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <SliderLineComponent label="Intensity" target={material.sheen} propertyName="intensity" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <Color3LineComponent label="Color" target={material.sheen} propertyName="color" onPropertyChangedObservable={this.props.onPropertyChangedObservable} isLinear={true} />
                            <TextureLinkLineComponent label="Sheen" texture={material.sheen.texture} onTextureCreated={(texture) => material.sheen.texture = texture} onTextureRemoved={() => material.sheen.texture = null} material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={this._onDebugSelectionChangeObservable} />
                            <CheckBoxLineComponent label="Use roughness" target={material.sheen} propertyName="_useRoughness" />
                            { (material.sheen as any)._useRoughness &&
                                <SliderLineComponent label="Roughness" target={material.sheen} propertyName="roughness" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            }
                            <CheckBoxLineComponent label="Albedo scaling" target={material.sheen} propertyName="albedoScaling" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        </div>
                    }
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="SUBSURFACE">
                    <TextureLinkLineComponent label="Thickness" texture={material.subSurface.thicknessTexture} onTextureCreated={(texture) => material.subSurface.thicknessTexture = texture} onTextureRemoved={() => material.subSurface.thicknessTexture = null} material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={this._onDebugSelectionChangeObservable} />
                    <SliderLineComponent label="Min Thickness" target={material.subSurface} propertyName="minimumThickness" minimum={0} maximum={10} step={0.1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Max Thickness" target={material.subSurface} propertyName="maximumThickness" minimum={0} maximum={10} step={0.1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Mask From Thickness" target={material.subSurface} propertyName="useMaskFromThicknessTexture"
                        onValueChanged={() => this.forceUpdate()}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Mask From Thickness (glTF-style)" target={material.subSurface} propertyName="useMaskFromThicknessTextureGltf"
                        onValueChanged={() => this.forceUpdate()}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Color3LineComponent label="Tint Color" target={material.subSurface} propertyName="tintColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} isLinear={true} />

                    <CheckBoxLineComponent label="Scattering Enabled" target={material.subSurface} propertyName="isScatteringEnabled"
                        onValueChanged={() => this.forceUpdate()}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    { (material.subSurface as any).isScatteringEnabled && material.getScene().prePassRenderer &&
                        <SliderLineComponent label="Meters per unit" target={ material.getScene().prePassRenderer!.subSurfaceConfiguration } propertyName="metersPerUnit" minimum={0.01} maximum={2} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    <CheckBoxLineComponent label="Refraction Enabled" target={material.subSurface} propertyName="isRefractionEnabled"
                        onValueChanged={() => this.forceUpdate()}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {
                        material.subSurface.isRefractionEnabled &&
                        <div className="fragment">
                            <SliderLineComponent label="Intensity" target={material.subSurface} propertyName="refractionIntensity" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <TextureLinkLineComponent label="Refraction" texture={material.subSurface.refractionTexture} onTextureCreated={(texture) => material.subSurface.refractionTexture = texture} onTextureRemoved={() => material.subSurface.refractionTexture = null} material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={this._onDebugSelectionChangeObservable} />
                            <SliderLineComponent label="Index of Refraction" target={material.subSurface} propertyName="indexOfRefraction" minimum={1} maximum={2} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <SliderLineComponent label="Tint at Distance" target={material.subSurface} propertyName="tintColorAtDistance" minimum={0} maximum={10} step={0.1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <CheckBoxLineComponent label="Link refraction with transparency" target={material.subSurface} propertyName="linkRefractionWithTransparency" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <CheckBoxLineComponent label="Use albedo to tint surface transparency" target={material.subSurface} propertyName="useAlbedoToTintRefraction" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        </div>
                    }

                    <CheckBoxLineComponent label="Translucency Enabled" target={material.subSurface} propertyName="isTranslucencyEnabled"
                        onValueChanged={() => this.forceUpdate()}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {
                        material.subSurface.isTranslucencyEnabled &&
                        <div className="fragment">
                            <SliderLineComponent label="Intensity" target={material.subSurface} propertyName="translucencyIntensity" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <Color3LineComponent label="Diffusion Distance" target={material.subSurface} propertyName="diffusionDistance" onPropertyChangedObservable={this.props.onPropertyChangedObservable} isLinear={true} />
                        </div>
                    }
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="LEVELS" closed={true}>
                    <SliderLineComponent label="Environment" target={material} propertyName="environmentIntensity" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Specular" target={material} propertyName="specularIntensity" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Emissive" target={material} propertyName="emissiveIntensity" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Direct" target={material} propertyName="directIntensity" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {
                        material.bumpTexture &&
                        <SliderLineComponent label="Bump strength" target={material.bumpTexture} propertyName="level" minimum={0} maximum={2} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    {
                        material.ambientTexture &&
                        <SliderLineComponent label="Ambient strength" target={material} propertyName="ambientTextureStrength" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    {
                        material.reflectionTexture &&
                        <SliderLineComponent label="Reflection strength" target={material.reflectionTexture} propertyName="level" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    {
                        material.clearCoat.texture &&
                        <SliderLineComponent label="Clear coat" target={material.clearCoat.texture} propertyName="level" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    {
                        material.clearCoat.bumpTexture &&
                        <SliderLineComponent label="Clear coat bump" target={material.clearCoat.bumpTexture} propertyName="level" minimum={0} maximum={2} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    {
                        material.clearCoat.tintTexture && false && /* level is not used for the clear coat tint texture */
                        <SliderLineComponent label="Clear coat tint" target={material.clearCoat.tintTexture} propertyName="level" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    {
                        material.anisotropy.texture &&
                        <SliderLineComponent label="Anisotropic" target={material.anisotropy.texture} propertyName="level" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    {
                        material.sheen.texture &&
                        <SliderLineComponent label="Sheen" target={material.sheen.texture} propertyName="level" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    {
                        material.subSurface.thicknessTexture &&
                        <SliderLineComponent label="Thickness" target={material.subSurface.thicknessTexture} propertyName="level" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    {
                        material.subSurface.refractionTexture &&
                        <SliderLineComponent label="Refraction" target={material.subSurface.refractionTexture} propertyName="level" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    {
                        material.detailMap.isEnabled && <>
                        <SliderLineComponent label="Detailmap diffuse" target={material.detailMap} propertyName="diffuseBlendLevel" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <SliderLineComponent label="Detailmap bump" target={material.detailMap} propertyName="bumpLevel" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <SliderLineComponent label="Detailmap roughness" target={material.detailMap} propertyName="roughnessBlendLevel" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    </> }
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="RENDERING" closed={true}>
                    <CheckBoxLineComponent label="Alpha from albedo" target={material} propertyName="useAlphaFromAlbedoTexture" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Ambient in grayscale" target={material} propertyName="useAmbientInGrayScale" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Radiance over alpha" target={material} propertyName="useRadianceOverAlpha" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Micro-surface from ref. map alpha" target={material} propertyName="useMicroSurfaceFromReflectivityMapAlpha" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Specular over alpha" target={material} propertyName="useSpecularOverAlpha" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Specular anti-aliasing" target={material} propertyName="enableSpecularAntiAliasing" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Realtime Filtering" target={material} propertyName="realTimeFiltering" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <OptionsLineComponent allowNullValue={true} label="Realtime Filtering quality" options={realTimeFilteringQualityOptions} target={material} propertyName="realTimeFilteringQuality" onPropertyChangedObservable={this.props.onPropertyChangedObservable}  />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="NORMAL MAP" closed={true}>
                    <CheckBoxLineComponent label="Invert X axis" target={material} propertyName="invertNormalMapX" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Invert Y axis" target={material} propertyName="invertNormalMapY" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="ADVANCED" closed={true}>
                    <CheckBoxLineComponent label="Energy Conservation" target={material.brdf} propertyName="useEnergyConservation"
                        onValueChanged={() => this.forceUpdate()}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Spherical Harmonics" target={material.brdf} propertyName="useSphericalHarmonics"
                        onValueChanged={() => this.forceUpdate()}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Radiance occlusion" target={material} propertyName="useRadianceOcclusion" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Horizon occlusion " target={material} propertyName="useHorizonOcclusion" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Unlit" target={material} propertyName="unlit" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="DEBUG" closed={true}>
                    <OptionsLineComponent label="Debug mode" options={debugMode} target={material} propertyName="debugMode" />
                    <SliderLineComponent label="Split position" target={material} propertyName="debugLimit" minimum={-1} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Output factor" target={material} propertyName="debugFactor" minimum={0} maximum={5} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}