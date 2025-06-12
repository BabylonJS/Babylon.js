import * as react from "react";
import type { GlobalState } from "../../globalState";

import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent.js";

import "../../assets/styles/components/propertyTab.scss";
import type { LockObject } from "@babylonjs/shared-ui-components/tabs/propertyGrids/lockObject";
import { FloatSliderComponent } from "../../sharedComponents/floatSliderComponent.js";
import { ConnectionPointType } from "@babylonjs/smart-filters";
import type { AnyInputBlock } from "@babylonjs/smart-filters";
import { Vector2PropertyTabComponent } from "./properties/vector2PropertyTabComponent.js";
import { Color3PropertyTabComponent } from "./properties/color3PropertyTabComponent.js";
import { Color4PropertyTabComponent } from "./properties/color4PropertyTabComponent.js";

interface IInputsPropertyTabComponentProps {
    globalState: GlobalState;
    inputs: AnyInputBlock[];
    lockObject: LockObject;
}

export class InputsPropertyTabComponent extends react.Component<IInputsPropertyTabComponentProps> {
    constructor(props: IInputsPropertyTabComponentProps) {
        super(props);
    }

    processInputBlockUpdate(ib: AnyInputBlock) {
        this.props.globalState.stateManager.onUpdateRequiredObservable.notifyObservers(ib);
    }

    renderInputBlock(block: AnyInputBlock) {
        switch (block.type) {
            case ConnectionPointType.Color3: {
                return (
                    <Color3PropertyTabComponent
                        key={block.uniqueId}
                        stateManager={this.props.globalState.stateManager}
                        inputBlock={block}
                    ></Color3PropertyTabComponent>
                );
            }
            case ConnectionPointType.Color4: {
                return (
                    <Color4PropertyTabComponent
                        key={block.uniqueId}
                        stateManager={this.props.globalState.stateManager}
                        inputBlock={block}
                    ></Color4PropertyTabComponent>
                );
            }
            case ConnectionPointType.Float: {
                return (
                    <FloatSliderComponent
                        key={block.uniqueId}
                        lockObject={this.props.lockObject}
                        label={block.name}
                        target={block.runtimeValue}
                        propertyName="value"
                        min={block.editorData?.min ?? null}
                        max={block.editorData?.max ?? null}
                        onChange={() => this.processInputBlockUpdate(block)}
                    ></FloatSliderComponent>
                );
            }
            case ConnectionPointType.Vector2: {
                return (
                    <Vector2PropertyTabComponent
                        stateManager={this.props.globalState.stateManager}
                        lockObject={this.props.lockObject}
                        inputBlock={block}
                        key={block.uniqueId}
                    ></Vector2PropertyTabComponent>
                );
            }
        }
        return null;
    }

    override render() {
        return (
            <LineContainerComponent title="INPUTS">
                {this.props.inputs.map((ib) => {
                    if (!ib.name) {
                        return null;
                    }
                    return this.renderInputBlock(ib);
                })}
            </LineContainerComponent>
        );
    }
}
