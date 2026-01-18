import * as React from "react";
import type { GlobalState } from "../../../globalState";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { ParticleInputBlock } from "core/Particles/Node/Blocks/particleInputBlock";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";
import { Color3 } from "core/Maths/math.color";

interface IVector3PropertyTabComponentProps {
    globalState: GlobalState;
    inputBlock: ParticleInputBlock;
    lockObject: LockObject;
}

export class Vector3PropertyTabComponent extends React.Component<IVector3PropertyTabComponentProps> {
    override render() {
        const asColor3 = new Color3(this.props.inputBlock.value.x, this.props.inputBlock.value.y, this.props.inputBlock.value.z);
        const tempObject = {
            color: asColor3,
        };
        return (
            <>
                <Vector3LineComponent
                    lockObject={this.props.lockObject}
                    label="Value"
                    target={this.props.inputBlock}
                    propertyName="value"
                    onChange={() => {
                        this.props.globalState.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.inputBlock);
                        this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
                    }}
                ></Vector3LineComponent>
                <Color3LineComponent
                    lockObject={this.props.lockObject}
                    label="Pick from color"
                    target={tempObject}
                    propertyName="color"
                    onChange={() => {
                        this.props.inputBlock.value.x = tempObject.color.r;
                        this.props.inputBlock.value.y = tempObject.color.g;
                        this.props.inputBlock.value.z = tempObject.color.b;
                        this.props.globalState.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.inputBlock);
                        this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
                    }}
                ></Color3LineComponent>
            </>
        );
    }
}
