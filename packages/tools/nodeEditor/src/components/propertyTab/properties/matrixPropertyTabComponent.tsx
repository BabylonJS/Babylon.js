import * as React from "react";
import type { GlobalState } from "../../../globalState";
import type { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { MatrixLineComponent } from "../../../sharedComponents/matrixLineComponent";

interface IMatrixPropertyTabComponentProps {
    globalState: GlobalState;
    inputBlock: InputBlock;
}

export class MatrixPropertyTabComponent extends React.Component<IMatrixPropertyTabComponentProps> {
    render() {
        return (
            <MatrixLineComponent
                globalState={this.props.globalState}
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
