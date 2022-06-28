import * as React from "react";
import type { GlobalState } from "../../../globalState";
import type { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";

interface IColor3PropertyTabComponentProps {
    globalState: GlobalState;
    inputBlock: InputBlock;
}

export class Color3PropertyTabComponent extends React.Component<IColor3PropertyTabComponentProps> {
    render() {
        return (
            <Color3LineComponent
                label="Value"
                target={this.props.inputBlock}
                propertyName="value"
                onChange={() => {
                    this.props.globalState.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.inputBlock);
                }}
            ></Color3LineComponent>
        );
    }
}
