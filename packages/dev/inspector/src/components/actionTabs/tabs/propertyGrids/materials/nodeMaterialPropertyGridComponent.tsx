import * as React from "react";

import { Observable } from "core/Misc/observable";
import type { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { CommonMaterialPropertyGridComponent } from "./commonMaterialPropertyGridComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../../globalState";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";
import { Vector4LineComponent } from "shared-ui-components/lines/vector4LineComponent";
import { Vector2LineComponent } from "shared-ui-components/lines/vector2LineComponent";
import { TextureLinkLineComponent } from "../../../lines/textureLinkLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { NodeMaterialBlockConnectionPointTypes } from "core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";
import type { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { GradientPropertyTabComponent } from "../../gradientNodePropertyComponent";
import { Color4LineComponent } from "shared-ui-components/lines/color4LineComponent";

interface INodeMaterialPropertyGridComponentProps {
    globalState: GlobalState;
    material: NodeMaterial;
    lockObject: LockObject;
    onSelectionChangedObservable?: Observable<any>;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class NodeMaterialPropertyGridComponent extends React.Component<INodeMaterialPropertyGridComponentProps> {
    private _onDebugSelectionChangeObservable = new Observable<TextureLinkLineComponent>();

    constructor(props: INodeMaterialPropertyGridComponentProps) {
        super(props);
    }

    edit() {
        this.props.material.edit({ nodeEditorConfig: { backgroundColor: this.props.material.getScene().clearColor } });
    }

    renderTextures() {
        const material = this.props.material;

        const onDebugSelectionChangeObservable = this._onDebugSelectionChangeObservable;

        const textureBlocks = material.getTextureBlocks();

        if (!textureBlocks || textureBlocks.length === 0) {
            return null;
        }

        return (
            <LineContainerComponent title="TEXTURES" selection={this.props.globalState}>
                {textureBlocks.map((textureBlock, i) => {
                    return (
                        <TextureLinkLineComponent
                            label={textureBlock.name}
                            key={"nodematText" + i}
                            texture={textureBlock.texture}
                            material={material}
                            onTextureCreated={(texture) => (textureBlock.texture = texture)}
                            onSelectionChangedObservable={this.props.onSelectionChangedObservable}
                            onDebugSelectionChangeObservable={onDebugSelectionChangeObservable}
                        />
                    );
                })}
            </LineContainerComponent>
        );
    }

    renderInputBlock(block: InputBlock) {
        switch (block.type) {
            case NodeMaterialBlockConnectionPointTypes.Float: {
                const cantDisplaySlider = isNaN(block.min) || isNaN(block.max) || block.min === block.max;
                return (
                    <div key={block.name}>
                        {block.isBoolean && (
                            <CheckBoxLineComponent
                                key={block.name}
                                label={block.name}
                                target={block}
                                propertyName="value"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                        )}
                        {!block.isBoolean && cantDisplaySlider && (
                            <FloatLineComponent
                                key={block.name}
                                lockObject={this.props.lockObject}
                                label={block.name}
                                target={block}
                                propertyName="value"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                        )}
                        {!block.isBoolean && !cantDisplaySlider && (
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                key={block.name}
                                label={block.name}
                                target={block}
                                propertyName="value"
                                step={(block.max - block.min) / 100.0}
                                minimum={block.min}
                                maximum={block.max}
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                        )}
                    </div>
                );
            }
            case NodeMaterialBlockConnectionPointTypes.Color3:
                return (
                    <Color3LineComponent
                        lockObject={this.props.lockObject}
                        key={block.name}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            case NodeMaterialBlockConnectionPointTypes.Color4:
                return (
                    <Color4LineComponent
                        lockObject={this.props.lockObject}
                        key={block.name}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                return (
                    <Vector2LineComponent
                        lockObject={this.props.lockObject}
                        key={block.name}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            case NodeMaterialBlockConnectionPointTypes.Vector3:
                return (
                    <Vector3LineComponent
                        lockObject={this.props.lockObject}
                        key={block.name}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
            case NodeMaterialBlockConnectionPointTypes.Vector4:
                return (
                    <Vector4LineComponent
                        lockObject={this.props.lockObject}
                        key={block.name}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                );
        }

        return null;
    }

    renderInputValues() {
        const configurableInputBlocks = this.props.material
            .getInputBlocks()
            .filter((block) => {
                return block.visibleInInspector && block.isUniform && !block.isSystemValue;
            })
            .sort((a, b) => {
                return a.name.localeCompare(b.name);
            });

        const namedGroups: string[] = [];
        for (const block of configurableInputBlocks) {
            if (!block.groupInInspector) {
                return;
            }

            if (namedGroups.indexOf(block.groupInInspector) === -1) {
                namedGroups.push(block.groupInInspector);
            }
        }
        namedGroups.sort();

        const gradiantNodeMaterialBlocks = this.props.material.attachedBlocks
            .filter((block) => {
                return block.visibleInInspector && block.getClassName() === "GradientBlock";
            })
            .sort((a, b) => {
                return a.name.localeCompare(b.name);
            });

        const inputBlockContainer =
            configurableInputBlocks.length > 0 ? (
                <LineContainerComponent title="INPUTS" selection={this.props.globalState}>
                    {" "}
                    {configurableInputBlocks
                        .filter((block) => !block.groupInInspector)
                        .map((block) => {
                            return this.renderInputBlock(block);
                        })}
                </LineContainerComponent>
            ) : null;

        return (
            <>
                {inputBlockContainer}
                {namedGroups.map((name, i) => {
                    return (
                        <LineContainerComponent key={"inputValue" + i} title={name.toUpperCase()} selection={this.props.globalState}>
                            {configurableInputBlocks
                                .filter((block) => block.groupInInspector === name)
                                .map((block) => {
                                    return this.renderInputBlock(block);
                                })}
                        </LineContainerComponent>
                    );
                })}
                {gradiantNodeMaterialBlocks.map((block, i) => {
                    return (
                        <LineContainerComponent key={block.name + i} title={block.name.toUpperCase()} selection={this.props.globalState}>
                            {<GradientPropertyTabComponent globalState={this.props.globalState} block={block} />}
                        </LineContainerComponent>
                    );
                })}
            </>
        );
    }

    override render() {
        const material = this.props.material;

        return (
            <>
                <CommonMaterialPropertyGridComponent
                    globalState={this.props.globalState}
                    lockObject={this.props.lockObject}
                    material={material}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <LineContainerComponent title="CONFIGURATION" selection={this.props.globalState}>
                    <CheckBoxLineComponent label="Ignore alpha" target={material} propertyName="ignoreAlpha" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <ButtonLineComponent label="Node Material Editor" onClick={() => this.edit()} />
                </LineContainerComponent>
                {this.renderInputValues()}
                {this.renderTextures()}
            </>
        );
    }
}
