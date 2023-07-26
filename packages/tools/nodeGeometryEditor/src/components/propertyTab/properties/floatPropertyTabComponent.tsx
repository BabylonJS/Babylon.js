import * as React from "react";
import type { GlobalState } from "../../../globalState";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import type { GeometryInputBlock } from "core/Meshes/Node/Blocks/geometryInputBlock";

interface IFloatPropertyTabComponentProps {
    globalState: GlobalState;
    inputBlock: GeometryInputBlock;
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
                    this.props.globalState.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.inputBlock);
                }}
            ></FloatLineComponent>
        );
    }
}
