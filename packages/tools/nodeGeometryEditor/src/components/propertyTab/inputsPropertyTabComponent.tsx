import * as React from "react";
import type { GlobalState } from "../../globalState";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";

import "./propertyTab.scss";
import { Vector2LineComponent } from "shared-ui-components/lines/vector2LineComponent";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";
import { Vector4LineComponent } from "shared-ui-components/lines/vector4LineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import type { GeometryInputBlock } from "core/Meshes/Node/Blocks/geometryInputBlock";
import { NodeGeometryBlockConnectionPointTypes } from "core/Meshes/Node/Enums/nodeGeometryConnectionPointTypes";

interface IInputsPropertyTabComponentProps {
    globalState: GlobalState;
    inputs: GeometryInputBlock[];
    lockObject: LockObject;
}

export class InputsPropertyTabComponent extends React.Component<IInputsPropertyTabComponentProps> {
    constructor(props: IInputsPropertyTabComponentProps) {
        super(props);
    }

    processInputBlockUpdate(ib: GeometryInputBlock) {
        this.props.globalState.stateManager.onUpdateRequiredObservable.notifyObservers(ib);

        if (ib.isConstant) {
            this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers(true);
        }
    }

    renderInputBlock(block: GeometryInputBlock) {
        switch (block.type) {
            case NodeGeometryBlockConnectionPointTypes.Float: {
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
            case NodeGeometryBlockConnectionPointTypes.Vector2:
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
            case NodeGeometryBlockConnectionPointTypes.Vector3:
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
            case NodeGeometryBlockConnectionPointTypes.Vector4:
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

    render() {
        return (
            <LineContainerComponent title="INPUTS">
                {this.props.inputs.map((ib) => {
                    if (ib.isContextual || !ib.name) {
                        return null;
                    }
                    return this.renderInputBlock(ib);
                })}
            </LineContainerComponent>
        );
    }
}
