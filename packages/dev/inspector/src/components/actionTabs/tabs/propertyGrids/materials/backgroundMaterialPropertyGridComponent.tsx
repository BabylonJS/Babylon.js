import * as React from "react";

import { Observable } from "core/Misc/observable";
import type { BackgroundMaterial } from "core/Materials/Background/backgroundMaterial";

import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { CommonMaterialPropertyGridComponent } from "./commonMaterialPropertyGridComponent";
import { TextureLinkLineComponent } from "../../../lines/textureLinkLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../../globalState";

interface IBackgroundMaterialPropertyGridComponentProps {
    globalState: GlobalState;
    material: BackgroundMaterial;
    lockObject: LockObject;
    onSelectionChangedObservable?: Observable<any>;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class BackgroundMaterialPropertyGridComponent extends React.Component<IBackgroundMaterialPropertyGridComponentProps> {
    private _onDebugSelectionChangeObservable = new Observable<TextureLinkLineComponent>();

    constructor(props: IBackgroundMaterialPropertyGridComponentProps) {
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
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Reflection"
                    texture={material.reflectionTexture}
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                {material.reflectionTexture && (
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Reflection blur"
                        target={material}
                        propertyName="reflectionBlur"
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                )}
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
                <LineContainerComponent title="LIGHTING & COLORS" selection={this.props.globalState}>
                    <Color3LineComponent
                        lockObject={this.props.lockObject}
                        label="Primary"
                        target={material}
                        propertyName="primaryColor"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Shadow level"
                        target={material}
                        propertyName="primaryColorShadowLevel"
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Highlight level"
                        target={material}
                        propertyName="primaryColorHighlightLevel"
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                {this.renderTextures()}
                <LineContainerComponent title="RENDERING" closed={true} selection={this.props.globalState}>
                    <CheckBoxLineComponent label="Enable noise" target={material} propertyName="enableNoise" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent
                        label="Opacity fresnel"
                        target={material}
                        propertyName="opacityFresnel"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <CheckBoxLineComponent
                        label="Reflection fresnel"
                        target={material}
                        propertyName="reflectionFresnel"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Reflection amount"
                        target={material}
                        propertyName="reflectionAmount"
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
