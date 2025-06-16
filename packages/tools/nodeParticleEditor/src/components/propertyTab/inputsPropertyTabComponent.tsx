import * as React from "react";
import type { GlobalState } from "../../globalState";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";

import "./propertyTab.scss";
import { Vector2LineComponent } from "shared-ui-components/lines/vector2LineComponent";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import type { ParticleInputBlock } from "core/Particles/Node/Blocks/particleInputBlock";
import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";
import { Color4PropertyTabComponent } from "./properties/color4PropertyTabComponent";

interface IInputsPropertyTabComponentProps {
    globalState: GlobalState;
    inputs: ParticleInputBlock[];
    lockObject: LockObject;
}

export class InputsPropertyTabComponent extends React.Component<IInputsPropertyTabComponentProps> {
    constructor(props: IInputsPropertyTabComponentProps) {
        super(props);
    }

    processInputBlockUpdate() {
        this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
    }

    renderInputBlock(block: ParticleInputBlock) {
        switch (block.type) {
            case NodeParticleBlockConnectionPointTypes.Int:
            case NodeParticleBlockConnectionPointTypes.Float: {
                const cantDisplaySlider = isNaN(block.min) || isNaN(block.max) || block.min === block.max;
                const isInteger = block.type === NodeParticleBlockConnectionPointTypes.Int;
                return (
                    <div key={block.uniqueId}>
                        {cantDisplaySlider && (
                            <FloatLineComponent
                                lockObject={this.props.lockObject}
                                key={block.uniqueId}
                                label={block.name}
                                target={block}
                                isInteger={isInteger}
                                propertyName="value"
                                onChange={() => this.processInputBlockUpdate()}
                            />
                        )}
                        {!cantDisplaySlider && (
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                key={block.uniqueId}
                                label={block.name}
                                target={block}
                                propertyName="value"
                                step={isInteger ? 1 : Math.abs(block.max - block.min) / 100.0}
                                decimalCount={isInteger ? 0 : 2}
                                minimum={block.min}
                                maximum={block.max}
                                onChange={() => this.processInputBlockUpdate()}
                            />
                        )}
                    </div>
                );
            }
            case NodeParticleBlockConnectionPointTypes.Vector2:
                return (
                    <Vector2LineComponent
                        lockObject={this.props.lockObject}
                        key={block.uniqueId}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onChange={() => this.processInputBlockUpdate()}
                    />
                );
            case NodeParticleBlockConnectionPointTypes.Vector3:
                return (
                    <Vector3LineComponent
                        lockObject={this.props.lockObject}
                        key={block.uniqueId}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onChange={() => this.processInputBlockUpdate()}
                    />
                );
            case NodeParticleBlockConnectionPointTypes.Color4:
                return <Color4PropertyTabComponent lockObject={this.props.lockObject} globalState={this.props.globalState} inputBlock={block} />;
        }
        return null;
    }

    override render() {
        return (
            <LineContainerComponent title="INPUTS">
                {this.props.inputs.map((ib) => {
                    if (ib.isSystemSource || ib.isContextual || !ib.name || !ib.displayInInspector) {
                        return null;
                    }
                    return this.renderInputBlock(ib);
                })}
            </LineContainerComponent>
        );
    }
}
