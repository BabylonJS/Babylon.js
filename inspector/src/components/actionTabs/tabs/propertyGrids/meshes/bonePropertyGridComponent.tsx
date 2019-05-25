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

    render() {
        const bone = this.props.bone;

        return (
            <div className="pane">
                <LineContainerComponent globalState={this.props.globalState} title="GENERAL">
                    <TextLineComponent label="ID" value={bone.id} />
                    <TextLineComponent label="Unique ID" value={bone.uniqueId.toString()} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="TRANSFORMATIONS">
                    <Vector3LineComponent label="Position" target={bone} propertyName="position" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {
                        !bone.rotationQuaternion &&
                        <Vector3LineComponent label="Rotation" target={bone} propertyName="rotation" step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    {
                        bone.rotationQuaternion &&
                        <QuaternionLineComponent label="Rotation" target={bone} propertyName="rotationQuaternion" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    <Vector3LineComponent label="Scaling" target={bone} propertyName="scaling" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}