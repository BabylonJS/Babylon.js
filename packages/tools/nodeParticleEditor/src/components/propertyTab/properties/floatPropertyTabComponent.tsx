import * as React from "react";
import type { GlobalState } from "../../../globalState";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import type { ParticleInputBlock } from "core/Particles/Node/Blocks/particleInputBlock";
import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";

interface IFloatPropertyTabComponentProps {
    globalState: GlobalState;
    inputBlock: ParticleInputBlock;
}

export class FloatPropertyTabComponent extends React.Component<IFloatPropertyTabComponentProps> {
    override render() {
        return (
            <FloatLineComponent
                lockObject={this.props.globalState.lockObject}
                label="Value"
                target={this.props.inputBlock}
                propertyName="value"
                isInteger={this.props.inputBlock.type === NodeParticleBlockConnectionPointTypes.Int}
                onChange={() => {
                    this.props.globalState.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.inputBlock);
                    this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
                }}
            ></FloatLineComponent>
        );
    }
}
