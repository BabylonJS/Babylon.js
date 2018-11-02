import * as React from "react";
import { Observable, BackgroundMaterial, BaseTexture } from "babylonjs";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { Color3LineComponent } from "../../../lines/color3LineComponent";
import { CheckBoxLineComponent } from "../../../lines/checkBoxLineComponent";
import { SliderLineComponent } from "../../../lines/sliderLineComponent";
import { CommonMaterialPropertyGridComponent } from "./commonMaterialPropertyGridComponent";
import { TextureLinkLineComponent } from "../../../lines/textureLinkLineComponent";

interface IBackgroundMaterialPropertyGridComponentProps {
    material: BackgroundMaterial,
    onSelectionChangeObservable?: Observable<any>,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class BackgroundMaterialPropertyGridComponent extends React.Component<IBackgroundMaterialPropertyGridComponentProps> {
    constructor(props: IBackgroundMaterialPropertyGridComponentProps) {
        super(props);
    }

    renderTextures() {
        const material = this.props.material;

        const onDebugSelectionChangeObservable = new BABYLON.Observable<BaseTexture>();

        return (
            <LineContainerComponent title="TEXTURES">
                <TextureLinkLineComponent label="Diffuse" texture={material.diffuseTexture} material={material} onSelectionChangeObservable={this.props.onSelectionChangeObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                <TextureLinkLineComponent label="Reflection" texture={material.reflectionTexture} material={material} onSelectionChangeObservable={this.props.onSelectionChangeObservable} onDebugSelectionChangeObservable={onDebugSelectionChangeObservable} />
                {
                    material.reflectionTexture &&
                    <SliderLineComponent label="Reflection blur" target={material} propertyName="reflectionBlur" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                }
            </LineContainerComponent>
        )
    }

    render() {
        const material = this.props.material;

        return (
            <div className="pane">
                <CommonMaterialPropertyGridComponent material={material} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent title="LIGHTING & COLORS">
                    <Color3LineComponent label="Primary" target={material} propertyName="primaryColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Shadow level" target={material} propertyName="primaryColorShadowLevel" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Highlight level" target={material} propertyName="primaryColorHighlightLevel" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                {this.renderTextures()}
                <LineContainerComponent title="RENDERING" closed={true}>
                    <CheckBoxLineComponent label="Enable noise" target={material} propertyName="enableNoise" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Opacity fresnel" target={material} propertyName="opacityFresnel" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Reflection fresnel" target={material} propertyName="reflectionFresnel" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Reflection amount" target={material} propertyName="reflectionAmount" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}