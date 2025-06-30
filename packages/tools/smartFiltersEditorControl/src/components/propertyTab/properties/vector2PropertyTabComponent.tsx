import { Component } from "react";
import type { ConnectionPointType, InputBlock } from "smart-filters";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager.js";
import { Vector2LineComponent } from "shared-ui-components/lines/vector2LineComponent.js";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject.js";
import { Vector2 } from "core/Maths/math.vector.js";

/**
 * Props for the Vector2PropertyTabComponent
 */
export interface IVector2PropertyTabComponentProps {
    /**
     * The state manager of the graph
     */
    stateManager: StateManager;

    /**
     *  The input block to edit (must be of type ConnectionPointType.Vector2)
     */
    inputBlock: InputBlock<ConnectionPointType.Vector2>;

    /**
     * The lock object to use
     */
    lockObject: LockObject;
}

/**
 * The property tab component for InputBlock of type ConnectionPointType.Vector2.
 */
export class Vector2PropertyTabComponent extends Component<IVector2PropertyTabComponentProps> {
    // eslint-disable-next-line babylonjs/available
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
