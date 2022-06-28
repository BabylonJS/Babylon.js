import * as React from "react";
import type { GlobalState } from "../../../globalState";
import type { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { Color4LineComponent } from "shared-ui-components/lines/color4LineComponent";

interface IColor4PropertyTabComponentProps {
    globalState: GlobalState;
    inputBlock: InputBlock;
}

export class Color4PropertyTabComponent extends React.Component<IColor4PropertyTabComponentProps> {
    render() {
        return (
            <Color4LineComponent
                label="Value"
                target={this.props.inputBlock}
                propertyName="value"
                onChange={() => {
                    this.props.globalState.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.inputBlock);
                }}
            ></Color4LineComponent>
        );
    }
}
