import * as React from "react";
import type { GlobalState } from "../../../globalState";
import type { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { Vector2LineComponent } from "shared-ui-components/lines/vector2LineComponent";

interface IVector2PropertyTabComponentProps {
    globalState: GlobalState;
    inputBlock: InputBlock;
}

export class Vector2PropertyTabComponent extends React.Component<IVector2PropertyTabComponentProps> {
    render() {
        return (
            <Vector2LineComponent
                label="Value"
                target={this.props.inputBlock}
                propertyName="value"
                onChange={() => {
                    this.props.globalState.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.inputBlock);
                }}
            ></Vector2LineComponent>
        );
    }
}
