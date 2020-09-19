import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { TextLineComponent } from "../../../lines/textLineComponent";
import { LockObject } from "../lockObject";
import { GlobalState } from '../../../../globalState';
import { Bone } from 'babylonjs/Bones/bone';
import { Vector3LineComponent } from '../../../lines/vector3LineComponent';
import { QuaternionLineComponent } from '../../../lines/quaternionLineComponent';

interface IBonePropertyGridComponentProps {
    globalState: GlobalState;
    bone: Bone,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
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
                <LineContainerComponent globalState={this.props.globalState} title="GENERAL">
                    <TextLineComponent label="Name" value={bone.name} />
                    <TextLineComponent label="Index" value={bone.getIndex().toString()} />
                    <TextLineComponent label="Unique ID" value={bone.uniqueId.toString()} />
                    {
                        bone.getParent() &&
                        <TextLineComponent label="Parent" value={bone.getParent()!.name} onLink={() => this.props.globalState.onSelectionChangedObservable.notifyObservers(bone.getParent())}/>
                    }                    
                    {
                        bone.getTransformNode() &&
                        <TextLineComponent label="Linked node" value={bone.getTransformNode()!.name} onLink={() => this.onTransformNodeLink()}/>
                    }
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="TRANSFORMATIONS">
                    <Vector3LineComponent label="Position" target={bone} propertyName="position" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {
                        !bone.rotationQuaternion &&
                        <Vector3LineComponent label="Rotation" useEuler={this.props.globalState.onlyUseEulers} target={bone} propertyName="rotation" step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    {
                        bone.rotationQuaternion &&
                        <QuaternionLineComponent label="Rotation" useEuler={this.props.globalState.onlyUseEulers} target={bone} propertyName="rotationQuaternion" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    <Vector3LineComponent label="Scaling" target={bone} propertyName="scaling" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}