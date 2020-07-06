import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { PBRSpecularGlossinessMaterial } from "babylonjs/Materials/PBR/pbrSpecularGlossinessMaterial";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { Color3LineComponent } from "../../../lines/color3LineComponent";
import { SliderLineComponent } from "../../../lines/sliderLineComponent";
import { CommonMaterialPropertyGridComponent } from "./commonMaterialPropertyGridComponent";
import { TextureLinkLineComponent } from "../../../lines/textureLinkLineComponent";
import { LockObject } from "../lockObject";
import { GlobalState } from '../../../../globalState';
import { CheckBoxLineComponent } from '../../../lines/checkBoxLineComponent';

interface IPBRSpecularGlossinessMaterialPropertyGridComponentProps {
    globalState: GlobalState;
    material: PBRSpecularGlossinessMaterial,
    lockObject: LockObject,
    onSelectionChangedObservable?: Observable<any>,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class PBRSpecularGlossinessMaterialPropertyGridComponent extends React.Component<IPBRSpecularGlossinessMaterialPropertyGridComponentProps> {
    private _onDebugSelectionChangeObservable = new Observable<TextureLinkLineComponent>();

    constructor(props: IPBRSpecularGlossinessMaterialPropertyGridComponentProps) {
        super(props);
    }

    renderTextures() {
        const material = this.props.material;
        const onDebugSelectionChangeObservable = this._onDebugSelectionChangeObservable;

        return (
            <LineContainerComponent globalState={this.props.globalState} title="TEXTURES">
                <TextureLinkLineComponent label="Diffuse" texture={material.diffuseTexture} propertyName="diffuseTexture" material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent label="Specular glossiness" texture={material.specularGlossinessTexture} propertyName="specularGlossinessTexture" material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent label="Normal" texture={material.normalTexture} propertyName="normalTexture" material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent label="Environment" texture={material.environmentTexture} propertyName="environmentTexture" material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent label="Emissive" texture={material.emissiveTexture} propertyName="emissiveTexture" material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent label="Lightmap" texture={material.lightmapTexture} propertyName="lightmapTexture" material={material} onSelectionChangedObservable={this.props.onSelectionChangedObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
            </LineContainerComponent>
        )
    }

    render() {
        const material = this.props.material;

        return (
            <div className="pane">
                <CommonMaterialPropertyGridComponent globalState={this.props.globalState} lockObject={this.props.lockObject} material={material} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                {this.renderTextures()}
                <LineContainerComponent globalState={this.props.globalState} title="LIGHTING & COLORS">
                    <Color3LineComponent label="Diffuse" target={material} propertyName="diffuseColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} isLinear={true} />
                    <Color3LineComponent label="Specular" target={material} propertyName="specularColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} isLinear={true} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="LEVELS" closed={true}>
                    <SliderLineComponent label="Glossiness" target={material} propertyName="glossiness" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="NORMAL MAP" closed={true}>
                    <CheckBoxLineComponent label="Invert X axis" target={material} propertyName="invertNormalMapX" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Invert Y axis" target={material} propertyName="invertNormalMapY" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}