import * as react from "react";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent.js";
import type { ConnectionPointType, InputBlock } from "smart-filters";
import { Color3 } from "core/Maths/math.color.js";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";

interface IColor3PropertyTabComponentProps {
    stateManager: StateManager;
    inputBlock: InputBlock<ConnectionPointType.Color3>;
}

export class Color3PropertyTabComponent extends react.Component<IColor3PropertyTabComponentProps> {
    override render() {
        const target = this.props.inputBlock.runtimeValue.value;
        const foo = {
            color: new Color3(target.r, target.g, target.b),
        };
        return (
            <Color3LineComponent
                lockObject={this.props.stateManager.lockObject}
                label={this.props.inputBlock.name}
                target={foo}
                propertyName="color"
                onChange={() => {
                    target.r = foo.color.r;
                    target.g = foo.color.g;
                    target.b = foo.color.b;
                    this.props.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.inputBlock);
                }}
            ></Color3LineComponent>
        );
    }
}
