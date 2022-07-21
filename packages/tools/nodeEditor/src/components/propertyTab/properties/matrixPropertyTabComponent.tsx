import * as React from "react";
import type { GlobalState } from "../../../globalState";
import type { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { MatrixLineComponent } from "shared-ui-components/lines/matrixLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";

interface IMatrixPropertyTabComponentProps {
    globalState: GlobalState;
    inputBlock: InputBlock;
    lockObject: LockObject;
}

export class MatrixPropertyTabComponent extends React.Component<IMatrixPropertyTabComponentProps> {
    render() {
        return (
            <MatrixLineComponent
                lockObject={this.props.lockObject}
                label="Value"
                target={this.props.inputBlock}
                propertyName="value"
                onChange={() => {
                    this.props.globalState.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.inputBlock);
                }}
                mode={this.props.inputBlock.matrixMode}
                onModeChange={(mode) => {
                    this.props.inputBlock.matrixMode = mode;
                }}
            ></MatrixLineComponent>
        );
    }
}
