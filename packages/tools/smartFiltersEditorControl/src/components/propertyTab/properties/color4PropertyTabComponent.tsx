import * as react from "react";
import { Color4LineComponent } from "@babylonjs/shared-ui-components/lines/color4LineComponent.js";
import type { ConnectionPointType, InputBlock } from "@babylonjs/smart-filters";
import { Color4 } from "@babylonjs/core/Maths/math.color.js";
import type { StateManager } from "@babylonjs/shared-ui-components/nodeGraphSystem/stateManager";

interface IColor4PropertyTabComponentProps {
    stateManager: StateManager;
    inputBlock: InputBlock<ConnectionPointType.Color4>;
}

export class Color4PropertyTabComponent extends react.Component<IColor4PropertyTabComponentProps> {
    override render() {
        const target = this.props.inputBlock.runtimeValue.value;
        const foo = {
            color: new Color4(target.r, target.g, target.b, target.a),
        };
        return (
            <Color4LineComponent
                lockObject={this.props.stateManager.lockObject}
                label={this.props.inputBlock.name}
                target={foo}
                propertyName="color"
                onChange={() => {
                    target.r = foo.color.r;
                    target.g = foo.color.g;
                    target.b = foo.color.b;
                    target.a = foo.color.a;
                    this.props.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.inputBlock);
                }}
            ></Color4LineComponent>
        );
    }
}
