import * as React from "react";

import { Observable } from "core/Misc/observable";
import type { PBRMetallicRoughnessMaterial } from "core/Materials/PBR/pbrMetallicRoughnessMaterial";

import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { CommonMaterialPropertyGridComponent } from "./commonMaterialPropertyGridComponent";
import { TextureLinkLineComponent } from "../../../lines/textureLinkLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../../globalState";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";

interface IPBRMetallicRoughnessMaterialPropertyGridComponentProps {
    globalState: GlobalState;
    material: PBRMetallicRoughnessMaterial;
    lockObject: LockObject;
    onSelectionChangedObservable?: Observable<any>;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class PBRMetallicRoughnessMaterialPropertyGridComponent extends React.Component<IPBRMetallicRoughnessMaterialPropertyGridComponentProps> {
    private _onDebugSelectionChangeObservable = new Observable<TextureLinkLineComponent>();

    constructor(props: IPBRMetallicRoughnessMaterialPropertyGridComponentProps) {
        super(props);
    }

    renderTextures() {
        const material = this.props.material;
        const onDebugSelectionChangeObservable = this._onDebugSelectionChangeObservable;

        return (
            <LineContainerComponent title="TEXTURES" selection={this.props.globalState}>
                <TextureLinkLineComponent
                    label="Base"
                    texture={material.baseTexture}
                    propertyName="baseTexture"
                    material={material}
                    onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                    onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                />
                <TextureLinkLineComponent
                    label="Metallic roughness"
                    texture={material.metallicRoughnessTexture}
                    propertyName="metallicRoughnessTexture"
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
                        label="Base"
                        target={material}
                        propertyName="baseColor"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        isLinear={true}
                    />
                    <Color3LineComponent
                        lockObject={this.props.lockObject}
                        label="Emissive"
                        target={material}
                        propertyName="emissiveColor"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        isLinear={true}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="LEVELS" closed={true} selection={this.props.globalState}>
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Metallic"
                        target={material}
                        propertyName="metallic"
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Roughness"
                        target={material}
                        propertyName="roughness"
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
