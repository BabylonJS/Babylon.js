import * as React from "react";
import type { GlobalState } from "../../../globalState";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GeometryInputBlock } from "core/Meshes/Node/Blocks/geometryInputBlock";

interface IVector3PropertyTabComponentProps {
    globalState: GlobalState;
    inputBlock: GeometryInputBlock;
    lockObject: LockObject;
}

export class Vector3PropertyTabComponent extends React.Component<IVector3PropertyTabComponentProps> {
    override render() {
        return (
            <Vector3LineComponent
                lockObject={this.props.lockObject}
                label="Value"
                target={this.props.inputBlock}
                propertyName="value"
                onChange={() => {
                    this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
                }}
            ></Vector3LineComponent>
        );
    }
}
