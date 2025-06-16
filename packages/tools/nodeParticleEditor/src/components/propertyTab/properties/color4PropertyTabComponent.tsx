import * as React from "react";
import type { GlobalState } from "../../../globalState";
import { Color4LineComponent } from "shared-ui-components/lines/color4LineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { ParticleInputBlock } from "core/Particles/Node/Blocks/particleInputBlock";

interface IColor4PropertyTabComponentProps {
    globalState: GlobalState;
    inputBlock: ParticleInputBlock;
    lockObject: LockObject;
}

export class Color4PropertyTabComponent extends React.Component<IColor4PropertyTabComponentProps> {
    override render() {
        return (
            <Color4LineComponent
                lockObject={this.props.lockObject}
                label="Value"
                target={this.props.inputBlock}
                propertyName="value"
                onChange={() => {
                    this.props.globalState.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.inputBlock);
                    this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
                }}
            ></Color4LineComponent>
        );
    }
}
