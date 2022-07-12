import * as React from "react";
import type { GlobalState } from "../../../globalState";
import type { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";

interface IFloatPropertyTabComponentProps {
    globalState: GlobalState;
    inputBlock: InputBlock;
}

export class FloatPropertyTabComponent extends React.Component<IFloatPropertyTabComponentProps> {
    render() {
        return (
            <FloatLineComponent
                lockObject={this.props.globalState.lockObject}
                label="Value"
                target={this.props.inputBlock}
                propertyName="value"
                onChange={() => {
                    if (this.props.inputBlock.isConstant) {
                        this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers(true);
                    }
                    this.props.globalState.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.inputBlock);
                }}
            ></FloatLineComponent>
        );
    }
}
