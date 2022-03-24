import * as React from "react";
import type { GlobalState } from "../../../globalState";
import { Color3LineComponent } from "../../../sharedComponents/color3LineComponent";
import type { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";

interface IColor3PropertyTabComponentProps {
    globalState: GlobalState;
    inputBlock: InputBlock;
}

export class Color3PropertyTabComponent extends React.Component<IColor3PropertyTabComponentProps> {
    render() {
        return (
            <Color3LineComponent
                globalState={this.props.globalState}
                label="Value"
                target={this.props.inputBlock}
                propertyName="value"
                onChange={() => {
                    this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.inputBlock);
                }}
            ></Color3LineComponent>
        );
    }
}
