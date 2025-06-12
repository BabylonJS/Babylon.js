import { Component } from "react";
import type { ConnectionPointType, InputBlock } from "@babylonjs/smart-filters";
import type { StateManager } from "@babylonjs/shared-ui-components/nodeGraphSystem/stateManager.js";
import { Vector2LineComponent } from "@babylonjs/shared-ui-components/lines/vector2LineComponent.js";
import type { LockObject } from "@babylonjs/shared-ui-components/tabs/propertyGrids/lockObject.js";
import { Vector2 } from "@babylonjs/core/Maths/math.vector.js";

export interface Vector2PropertyTabComponentProps {
    stateManager: StateManager;
    inputBlock: InputBlock<ConnectionPointType.Vector2>;
    lockObject: LockObject;
}

/**
 * The property tab component for InputBlock of type ConnectionPointType.Vector2.
 */
export class Vector2PropertyTabComponent extends Component<Vector2PropertyTabComponentProps> {
    override render() {
        const value = this.props.inputBlock.runtimeValue.value;
        const target = {
            value: new Vector2(value.x, value.y),
        };
        return (
            <Vector2LineComponent
                lockObject={this.props.lockObject}
                key={this.props.inputBlock.uniqueId}
                label={this.props.inputBlock.name}
                target={target}
                propertyName="value"
                onChange={() => {
                    value.x = target.value.x;
                    value.y = target.value.y;
                    this.props.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.inputBlock);
                }}
            ></Vector2LineComponent>
        );
    }
}
