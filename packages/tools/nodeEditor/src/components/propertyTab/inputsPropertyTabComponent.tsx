import * as React from "react";
import type { GlobalState } from "../../globalState";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import type { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { NodeMaterialBlockConnectionPointTypes } from "core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";

import "./propertyTab.scss";
import { Vector2LineComponent } from "shared-ui-components/lines/vector2LineComponent";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";
import { Vector4LineComponent } from "shared-ui-components/lines/vector4LineComponent";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";
import { Color4LineComponent } from "shared-ui-components/lines/color4LineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";

interface IInputsPropertyTabComponentProps {
    globalState: GlobalState;
    inputs: InputBlock[];
    lockObject: LockObject;
}

export class InputsPropertyTabComponent extends React.Component<IInputsPropertyTabComponentProps> {
    constructor(props: IInputsPropertyTabComponentProps) {
        super(props);
    }

    processInputBlockUpdate(ib: InputBlock) {
        this.props.globalState.stateManager.onUpdateRequiredObservable.notifyObservers(ib);

        if (ib.isConstant) {
            this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
        }
    }

    renderInputBlock(block: InputBlock) {
        switch (block.type) {
            case NodeMaterialBlockConnectionPointTypes.Float: {
                const cantDisplaySlider = isNaN(block.min) || isNaN(block.max) || block.min === block.max;
                return (
                    <div key={block.uniqueId}>
                        {block.isBoolean && (
                            <CheckBoxLineComponent
                                key={block.uniqueId}
                                label={block.name}
                                target={block}
                                propertyName="value"
                                onValueChanged={() => {
                                    this.processInputBlockUpdate(block);
                                }}
                            />
                        )}
                        {!block.isBoolean && cantDisplaySlider && (
                            <FloatLineComponent
                                lockObject={this.props.lockObject}
                                key={block.uniqueId}
                                label={block.name}
                                target={block}
                                propertyName="value"
                                onChange={() => this.processInputBlockUpdate(block)}
                            />
                        )}
                        {!block.isBoolean && !cantDisplaySlider && (
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                key={block.uniqueId}
                                label={block.name}
                                target={block}
                                propertyName="value"
                                step={(block.max - block.min) / 100.0}
                                minimum={block.min}
                                maximum={block.max}
                                onChange={() => this.processInputBlockUpdate(block)}
                            />
                        )}
                    </div>
                );
            }
            case NodeMaterialBlockConnectionPointTypes.Color3:
                return (
                    <Color3LineComponent
                        lockObject={this.props.lockObject}
                        key={block.uniqueId}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onChange={() => this.processInputBlockUpdate(block)}
                    />
                );
            case NodeMaterialBlockConnectionPointTypes.Color4:
                return (
                    <Color4LineComponent
                        lockObject={this.props.lockObject}
                        key={block.uniqueId}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onChange={() => this.processInputBlockUpdate(block)}
                    />
                );
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                return (
                    <Vector2LineComponent
                        lockObject={this.props.lockObject}
                        key={block.uniqueId}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onChange={() => this.processInputBlockUpdate(block)}
                    />
                );
            case NodeMaterialBlockConnectionPointTypes.Vector3:
                return (
                    <Vector3LineComponent
                        lockObject={this.props.lockObject}
                        key={block.uniqueId}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onChange={() => this.processInputBlockUpdate(block)}
                    />
                );
            case NodeMaterialBlockConnectionPointTypes.Vector4:
                return (
                    <Vector4LineComponent
                        lockObject={this.props.lockObject}
                        key={block.uniqueId}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onChange={() => this.processInputBlockUpdate(block)}
                    />
                );
        }
        return null;
    }

    override render() {
        return (
            <LineContainerComponent title="INPUTS">
                {this.props.inputs.map((ib) => {
                    if (!ib.isUniform || ib.isSystemValue || !ib.name) {
                        return null;
                    }
                    return this.renderInputBlock(ib);
                })}
            </LineContainerComponent>
        );
    }
}
