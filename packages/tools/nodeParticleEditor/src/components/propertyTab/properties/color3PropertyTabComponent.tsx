import * as React from "react";
import type { GlobalState } from "../../../globalState";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { ParticleInputBlock } from "core/Particles/Node/Blocks/particleInputBlock";

interface IColor3PropertyTabComponentProps {
    globalState: GlobalState;
    inputBlock: ParticleInputBlock;
    lockObject: LockObject;
}

export class Color3PropertyTabComponent extends React.Component<IColor3PropertyTabComponentProps> {
    override render() {
        return (
            <Color3LineComponent
                lockObject={this.props.lockObject}
                label="Value"
                target={this.props.inputBlock}
                propertyName="value"
                onChange={() => {
                    this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
                }}
            ></Color3LineComponent>
        );
    }
}
