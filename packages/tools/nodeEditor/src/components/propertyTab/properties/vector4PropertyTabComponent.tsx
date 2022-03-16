import * as React from "react";
import { GlobalState } from "../../../globalState";
import { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { Vector4LineComponent } from "../../../sharedComponents/vector4LineComponent";

interface IVector4PropertyTabComponentProps {
    globalState: GlobalState;
    inputBlock: InputBlock;
}

export class Vector4PropertyTabComponent extends React.Component<IVector4PropertyTabComponentProps> {
    render() {
        return (
            <Vector4LineComponent
                globalState={this.props.globalState}
                label="Value"
                target={this.props.inputBlock}
                propertyName="value"
                onChange={() => {
                    this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.inputBlock);
                }}
            ></Vector4LineComponent>
        );
    }
}
