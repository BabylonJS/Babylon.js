import * as React from "react";
import type { GlobalState } from "../../../globalState";
import type { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";

interface IVector3PropertyTabComponentProps {
    globalState: GlobalState;
    inputBlock: InputBlock;
    lockObject: LockObject;
}

export class Vector3PropertyTabComponent extends React.Component<IVector3PropertyTabComponentProps> {
    render() {
        return (
            <Vector3LineComponent
                lockObject={this.props.lockObject}
                label="Value"
                target={this.props.inputBlock}
                propertyName="value"
                onChange={() => {
                    this.props.globalState.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.inputBlock);
                }}
            ></Vector3LineComponent>
        );
    }
}
