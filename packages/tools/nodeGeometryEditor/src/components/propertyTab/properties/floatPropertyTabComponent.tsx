import * as React from "react";
import type { GlobalState } from "../../../globalState";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import type { GeometryInputBlock } from "core/Meshes/Node/Blocks/geometryInputBlock";
import { NodeGeometryBlockConnectionPointTypes } from "core/Meshes/Node/Enums/nodeGeometryConnectionPointTypes";

interface IFloatPropertyTabComponentProps {
    globalState: GlobalState;
    inputBlock: GeometryInputBlock;
}

export class FloatPropertyTabComponent extends React.Component<IFloatPropertyTabComponentProps> {
    override render() {
        return (
            <FloatLineComponent
                lockObject={this.props.globalState.lockObject}
                label="Value"
                target={this.props.inputBlock}
                propertyName="value"
                isInteger={this.props.inputBlock.type === NodeGeometryBlockConnectionPointTypes.Int}
                onChange={() => {
                    this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
                }}
            ></FloatLineComponent>
        );
    }
}
