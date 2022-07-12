import * as React from "react";

import { Observable } from "core/Misc/observable";
import type { PBRSpecularGlossinessMaterial } from "core/Materials/PBR/pbrSpecularGlossinessMaterial";

import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { CommonMaterialPropertyGridComponent } from "./commonMaterialPropertyGridComponent";
import { TextureLinkLineComponent } from "../../../lines/textureLinkLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../../globalState";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";

interface IPBRSpecularGlossinessMaterialPropertyGridComponentProps {
    globalState: GlobalState;
    material: PBRSpecularGlossinessMaterial;
    lockObject: LockObject;
    onSelectionChangedObservable?: Observable<any>;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
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
                    label="Specular glossiness"
                    texture={material.specularGlossinessTexture}
                    propertyName="specularGlossinessTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Normal"
                    texture={material.normalTexture}
                    propertyName="normalTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Environment"
                    texture={material.environmentTexture}
                    propertyName="environmentTexture"
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
                    label="Lightmap"
                    texture={material.lightmapTexture}
                    propertyName="lightmapTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
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
                        isLinear={true}
                    />
                    <Color3LineComponent
                        lockObject={this.props.lockObject}
                        label="Specular"
                        target={material}
                        propertyName="specularColor"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        isLinear={true}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="LEVELS" closed={true} selection={this.props.globalState}>
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Glossiness"
                        target={material}
                        propertyName="glossiness"
                        minimum={0}
                        maximum={1}
                        step={0.01}
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
            </div>
        );
    }
}
