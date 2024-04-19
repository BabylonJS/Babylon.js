import * as React from "react";
import type { GlobalState } from "../../../globalState";
import { Vector2LineComponent } from "shared-ui-components/lines/vector2LineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GeometryInputBlock } from "core/Meshes/Node/Blocks/geometryInputBlock";

interface IVector2PropertyTabComponentProps {
    globalState: GlobalState;
    inputBlock: GeometryInputBlock;
    lockObject: LockObject;
}

export class Vector2PropertyTabComponent extends React.Component<IVector2PropertyTabComponentProps> {
    override render() {
        return (
            <Vector2LineComponent
                lockObject={this.props.lockObject}
                label="Value"
                target={this.props.inputBlock}
                propertyName="value"
                onChange={() => {
                    this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
                }}
            ></Vector2LineComponent>
        );
    }
}
