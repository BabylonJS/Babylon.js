import * as React from "react";

import type { Observable } from "core/Misc/observable";

import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../../globalState";
import type { Bone } from "core/Bones/bone";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";
import { QuaternionLineComponent } from "../../../lines/quaternionLineComponent";

interface IBonePropertyGridComponentProps {
    globalState: GlobalState;
    bone: Bone;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class BonePropertyGridComponent extends React.Component<IBonePropertyGridComponentProps> {
    constructor(props: IBonePropertyGridComponentProps) {
        super(props);
    }

    onTransformNodeLink() {
        if (!this.props.globalState.onSelectionChangedObservable) {
            return;
        }

        const node = this.props.bone.getTransformNode()!;
        this.props.globalState.onSelectionChangedObservable.notifyObservers(node);
    }

    render() {
        const bone = this.props.bone;

        return (
            <div className="pane">
                <LineContainerComponent title="GENERAL" selection={this.props.globalState}>
                    <TextLineComponent label="Name" value={bone.name} />
                    <TextLineComponent label="Index" value={bone.getIndex().toString()} />
                    <TextLineComponent label="Unique ID" value={bone.uniqueId.toString()} />
                    {bone.getParent() && (
                        <TextLineComponent
                            label="Parent"
                            value={bone.getParent()!.name}
                            onLink={() => this.props.globalState.onSelectionChangedObservable.notifyObservers(bone.getParent())}
                        />
                    )}
                    {bone.getTransformNode() && <TextLineComponent label="Linked node" value={bone.getTransformNode()!.name} onLink={() => this.onTransformNodeLink()} />}
                </LineContainerComponent>
                <LineContainerComponent title="TRANSFORMATIONS" selection={this.props.globalState}>
                    <Vector3LineComponent
                        lockObject={this.props.lockObject}
                        label="Position"
                        target={bone}
                        propertyName="position"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    {!bone.rotationQuaternion && (
                        <Vector3LineComponent
                            lockObject={this.props.lockObject}
                            label="Rotation"
                            useEuler={this.props.globalState.onlyUseEulers}
                            target={bone}
                            propertyName="rotation"
                            step={0.01}
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    {bone.rotationQuaternion && (
                        <QuaternionLineComponent
                            lockObject={this.props.lockObject}
                            label="Rotation"
                            useEuler={this.props.globalState.onlyUseEulers}
                            target={bone}
                            propertyName="rotationQuaternion"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    <Vector3LineComponent
                        lockObject={this.props.lockObject}
                        label="Scaling"
                        target={bone}
                        propertyName="scaling"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
