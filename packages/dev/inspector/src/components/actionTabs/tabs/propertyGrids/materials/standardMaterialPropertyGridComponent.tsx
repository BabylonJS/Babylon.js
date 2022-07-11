import * as React from "react";

import { Observable } from "core/Misc/observable";
import type { StandardMaterial } from "core/Materials/standardMaterial";

import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { CommonMaterialPropertyGridComponent } from "./commonMaterialPropertyGridComponent";
import { TextureLinkLineComponent } from "../../../lines/textureLinkLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../../globalState";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";

interface IStandardMaterialPropertyGridComponentProps {
    globalState: GlobalState;
    material: StandardMaterial;
    lockObject: LockObject;
    onSelectionChangedObservable?: Observable<any>;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class StandardMaterialPropertyGridComponent extends React.Component<IStandardMaterialPropertyGridComponentProps> {
    private _onDebugSelectionChangeObservable = new Observable<TextureLinkLineComponent>();

    constructor(props: IStandardMaterialPropertyGridComponentProps) {
        super(props);
    }

    renderTextures() {
        const material = this.props.material;

        const onDebugSelectionChangeObservable = this._onDebugSelectionChangeObservable;

        return (
            <LineContainerComponent title="TEXTURES" selection={this.props.globalState}>
                <TextureLinkLineComponent
                    label="Diffuse"
                    texture={material.diffuseTexture}
                    propertyName="diffuseTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Specular"
                    texture={material.specularTexture}
                    propertyName="specularTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Reflection"
                    texture={material.reflectionTexture}
                    propertyName="reflectionTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Refraction"
                    texture={material.refractionTexture}
                    propertyName="refractionTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Emissive"
                    texture={material.emissiveTexture}
                    propertyName="emissiveTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Bump"
                    texture={material.bumpTexture}
                    propertyName="bumpTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Opacity"
                    texture={material.opacityTexture}
                    propertyName="opacityTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Ambient"
                    texture={material.ambientTexture}
                    propertyName="ambientTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Lightmap"
                    texture={material.lightmapTexture}
                    propertyName="lightmapTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Detailmap"
                    texture={material.detailMap.texture}
                    material={material}
                    onTextureCreated={(texture) => (material.detailMap.texture = texture)}
                    onTextureRemoved={() => (material.detailMap.texture = null)}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <CheckBoxLineComponent
                    label="Use lightmap as shadowmap"
                    target={material}
                    propertyName="useLightmapAsShadowmap"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <CheckBoxLineComponent
                    label="Use detailmap"
                    target={material.detailMap}
                    propertyName="isEnabled"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
            </LineContainerComponent>
        );
    }

    render() {
        const material = this.props.material;

        return (
            <div className="pane">
                <CommonMaterialPropertyGridComponent
                    globalState={this.props.globalState}
                    lockObject={this.props.lockObject}
                    material={material}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                {this.renderTextures()}
                <LineContainerComponent title="LIGHTING & COLORS" selection={this.props.globalState}>
                    <Color3LineComponent
                        lockObject={this.props.lockObject}
                        label="Diffuse"
                        target={material}
                        propertyName="diffuseColor"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <Color3LineComponent
                        lockObject={this.props.lockObject}
                        label="Specular"
                        target={material}
                        propertyName="specularColor"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Specular power"
                        target={material}
                        propertyName="specularPower"
                        minimum={0}
                        maximum={128}
                        step={0.1}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <Color3LineComponent
                        lockObject={this.props.lockObject}
                        label="Emissive"
                        target={material}
                        propertyName="emissiveColor"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <Color3LineComponent
                        lockObject={this.props.lockObject}
                        label="Ambient"
                        target={material}
                        propertyName="ambientColor"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <CheckBoxLineComponent
                        label="Use specular over alpha"
                        target={material}
                        propertyName="useSpecularOverAlpha"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="LEVELS" closed={true} selection={this.props.globalState}>
                    {material.diffuseTexture && (
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="Diffuse level"
                            target={material.diffuseTexture}
                            propertyName="level"
                            minimum={0}
                            maximum={2}
                            step={0.01}
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    {material.specularTexture && (
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="Specular level"
                            target={material.specularTexture}
                            propertyName="level"
                            minimum={0}
                            maximum={2}
                            step={0.01}
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    {material.reflectionTexture && (
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="Reflection level"
                            target={material.reflectionTexture}
                            propertyName="level"
                            minimum={0}
                            maximum={2}
                            step={0.01}
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    {material.refractionTexture && (
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="Refraction level"
                            target={material.refractionTexture}
                            propertyName="level"
                            minimum={0}
                            maximum={2}
                            step={0.01}
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    {material.emissiveTexture && (
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="Emissive level"
                            target={material.emissiveTexture}
                            propertyName="level"
                            minimum={0}
                            maximum={2}
                            step={0.01}
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    {material.bumpTexture && (
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="Bump level"
                            target={material.bumpTexture}
                            propertyName="level"
                            minimum={0}
                            maximum={2}
                            step={0.01}
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    {material.opacityTexture && (
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="Opacity level"
                            target={material.opacityTexture}
                            propertyName="level"
                            minimum={0}
                            maximum={2}
                            step={0.01}
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    {material.ambientTexture && (
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="Ambient level"
                            target={material.ambientTexture}
                            propertyName="level"
                            minimum={0}
                            maximum={2}
                            step={0.01}
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    {material.lightmapTexture && (
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="Lightmap level"
                            target={material.lightmapTexture}
                            propertyName="level"
                            minimum={0}
                            maximum={2}
                            step={0.01}
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    {material.detailMap.isEnabled && (
                        <>
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                label="Detailmap diffuse"
                                target={material.detailMap}
                                propertyName="diffuseBlendLevel"
                                minimum={0}
                                maximum={1}
                                step={0.01}
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                label="Detailmap bump"
                                target={material.detailMap}
                                propertyName="bumpLevel"
                                minimum={0}
                                maximum={1}
                                step={0.01}
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                        </>
                    )}
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
            </div>
        );
    }
}
