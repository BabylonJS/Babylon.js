import * as React from "react";
import type { GlobalState } from "../../../globalState";
import type { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { Vector4LineComponent } from "shared-ui-components/lines/vector4LineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";

interface IVector4PropertyTabComponentProps {
    globalState: GlobalState;
    inputBlock: InputBlock;
    lockObject: LockObject;
}

export class Vector4PropertyTabComponent extends React.Component<IVector4PropertyTabComponentProps> {
    render() {
        return (
            <Vector4LineComponent
                lockObject={this.props.lockObject}
                label="Value"
                target={this.props.inputBlock}
                propertyName="value"
                onChange={() => {
                    this.props.globalState.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.inputBlock);
                }}
            ></Vector4LineComponent>
        );
    }
}
