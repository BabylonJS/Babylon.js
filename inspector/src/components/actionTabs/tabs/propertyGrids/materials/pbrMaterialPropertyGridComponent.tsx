import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { Color3LineComponent } from "../../../lines/color3LineComponent";
import { CheckBoxLineComponent } from "../../../lines/checkBoxLineComponent";
import { SliderLineComponent } from "../../../lines/sliderLineComponent";
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
    private _onDebugSelectionChangeObservable = new Observable<BaseTexture>();
    constructor(props: IPBRMaterialPropertyGridComponentProps) {
        super(props);
    }

    renderTextures(onDebugSelectionChangeObservable: Observable<BaseTexture>) {
        const material = this.props.material;

        if (material.getActiveTextures().length === 0) {
            return null;
        }

        return (
            <LineContainerComponent globalState={this.props.globalState} title="TEXTURES">
                <TextureLinkLineComponent label="Albedo" texture={material.albedoTexture} material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent label="Metallic" texture={material.metallicTexture} material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent label="Reflection" texture={material.reflectionTexture} material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent label="Refraction" texture={material.refractionTexture} material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent label="Micro-surface" texture={material.microSurfaceTexture} material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent label="Bump" texture={material.bumpTexture} material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent label="Emissive" texture={material.emissiveTexture} material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent label="Opacity" texture={material.opacityTexture} material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent label="Ambient" texture={material.ambientTexture} material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent label="Lightmap" texture={material.lightmapTexture} material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
            </LineContainerComponent>
        );
    }

    render() {
        const material = this.props.material;

        return (
            <div className="pane">
                <CommonMaterialPropertyGridComponent globalState={this.props.globalState} lockObject={this.props.lockObject} material={material} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                {this.renderTextures(this._onDebugSelectionChangeObservable)}
                <LineContainerComponent globalState={this.props.globalState} title="LIGHTING & COLORS">
                    <Color3LineComponent label="Albedo" target={material} propertyName="albedoColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Color3LineComponent label="Reflectivity" target={material} propertyName="reflectivityColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Micro-surface" target={material} propertyName="microSurface" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Color3LineComponent label="Emissive" target={material} propertyName="emissiveColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Color3LineComponent label="Ambient" target={material} propertyName="ambientColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="METALLIC WORKFLOW">
                    <SliderLineComponent label="Metallic" target={material} propertyName="metallic" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Roughness" target={material} propertyName="roughness" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="CLEAR COAT">
                    <CheckBoxLineComponent label="Enabled" target={material.clearCoat} propertyName="isEnabled"
                        onValueChanged={() => this.forceUpdate()}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {
                        material.clearCoat.isEnabled &&
                        <div>
                            <SliderLineComponent label="Intensity" target={material.clearCoat} propertyName="intensity" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <SliderLineComponent label="Roughness" target={material.clearCoat} propertyName="roughness" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <SliderLineComponent label="IOR" target={material.clearCoat} propertyName="indiceOfRefraction" minimum={1.0} maximum={3} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <TextureLinkLineComponent label="Texture" texture={material.clearCoat.texture} material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={this._onDebugSelectionChangeObservable} />
                            <TextureLinkLineComponent label="Bump" texture={material.clearCoat.bumpTexture} material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={this._onDebugSelectionChangeObservable} />
                            {
                                material.clearCoat.bumpTexture &&
                                <SliderLineComponent label="Bump strength" target={material.clearCoat.bumpTexture} propertyName="level" minimum={0} maximum={2} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            }
                            <CheckBoxLineComponent label="Tint" target={material.clearCoat} propertyName="isTintEnabled" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            {
                                material.clearCoat.isEnabled && material.clearCoat.isTintEnabled &&
                                <Color3LineComponent label="Tint Color" target={material.clearCoat} propertyName="tintColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
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
                                <TextureLinkLineComponent label="Tint Texture" texture={material.clearCoat.tintTexture} material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={this._onDebugSelectionChangeObservable} />
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
                        <div>
                            <SliderLineComponent label="Intensity" target={material.anisotropy} propertyName="intensity" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            <CheckBoxLineComponent label="Follow tangents" target={material.anisotropy} propertyName="followTangents" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
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
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="RENDERING" closed={true}>
                    <CheckBoxLineComponent label="Alpha from albedo" target={material} propertyName="useAlphaFromAlbedoTexture" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Ambient in grayscale" target={material} propertyName="useAmbientInGrayScale" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Radiance over alpha" target={material} propertyName="useRadianceOverAlpha" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Link refraction with transparency" target={material} propertyName="linkRefractionWithTransparency" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Micro-surface from ref. map alpha" target={material} propertyName="useMicroSurfaceFromReflectivityMapAlpha" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Specular over alpha" target={material} propertyName="useSpecularOverAlpha" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Specular anti-aliasing" target={material} propertyName="enableSpecularAntiAliasing" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="ADVANCED" closed={true}>
                    <CheckBoxLineComponent label="Radiance occlusion" target={material} propertyName="useRadianceOcclusion" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Horizon occlusion " target={material} propertyName="useHorizonOcclusion" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Unlit" target={material} propertyName="unlit" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}