import * as React from "react";
import type { GlobalState } from "../../../globalState";
import { Vector4LineComponent } from "shared-ui-components/lines/vector4LineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { ParticleInputBlock } from "core/Particles/Node/Blocks/particleInputBlock";

interface IVector4PropertyTabComponentProps {
    globalState: GlobalState;
    inputBlock: ParticleInputBlock;
    lockObject: LockObject;
}

export class Vector4PropertyTabComponent extends React.Component<IVector4PropertyTabComponentProps> {
    override render() {
        return (
            <Vector4LineComponent
                lockObject={this.props.lockObject}
                label="Value"
                target={this.props.inputBlock}
                propertyName="value"
                onChange={() => {
                    this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
                }}
            ></Vector4LineComponent>
        );
    }
}
