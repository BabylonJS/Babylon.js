import * as React from "react";

import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Observable } from "babylonjs/Misc/observable";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { CheckBoxLineComponent } from "../../../lines/checkBoxLineComponent";
import { Vector3LineComponent } from "../../../lines/vector3LineComponent";
import { TextLineComponent } from "../../../lines/textLineComponent";
import { QuaternionLineComponent } from "../../../lines/quaternionLineComponent";
import { LockObject } from "../lockObject";
import { GlobalState } from '../../../../globalState';
import { CustomPropertyGridComponent } from '../customPropertyGridComponent';
import { ButtonLineComponent } from '../../../lines/buttonLineComponent';
import { TextInputLineComponent } from '../../../lines/textInputLineComponent';
import { AnimationGridComponent } from '../animations/animationPropertyGridComponent';

interface ITransformNodePropertyGridComponentProps {
    globalState: GlobalState;
    transformNode: TransformNode,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class TransformNodePropertyGridComponent extends React.Component<ITransformNodePropertyGridComponentProps> {
    constructor(props: ITransformNodePropertyGridComponentProps) {
        super(props);
    }

    render() {
        const transformNode = this.props.transformNode;

        return (
            <div className="pane">
                <CustomPropertyGridComponent globalState={this.props.globalState} target={transformNode}
                    lockObject={this.props.lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent globalState={this.props.globalState} title="GENERAL">
                    <TextLineComponent label="ID" value={transformNode.id} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Name" target={transformNode} propertyName="name" onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                    <TextLineComponent label="Unique ID" value={transformNode.uniqueId.toString()} />
                    <TextLineComponent label="Class" value={transformNode.getClassName()} />                    
                    <CheckBoxLineComponent label="IsEnabled" isSelected={() => transformNode.isEnabled()} onSelect={(value) => transformNode.setEnabled(value)} />
                    {
                        transformNode.parent &&
                        <TextLineComponent label="Parent" value={transformNode.parent.name} onLink={() => this.props.globalState.onSelectionChangedObservable.notifyObservers(transformNode.parent)}/>
                    }        
                    <ButtonLineComponent label="Dispose" onClick={() => {
                        transformNode.dispose();
                        this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
                    }} />              
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="TRANSFORMATIONS">
                    <Vector3LineComponent label="Position" target={transformNode} propertyName="position" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {
                        !transformNode.rotationQuaternion &&
                        <Vector3LineComponent label="Rotation" useEuler={this.props.globalState.onlyUseEulers} target={transformNode} propertyName="rotation" step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    {
                        transformNode.rotationQuaternion &&
                        <QuaternionLineComponent label="Rotation" useEuler={this.props.globalState.onlyUseEulers} target={transformNode} propertyName="rotationQuaternion" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    <Vector3LineComponent label="Scaling" target={transformNode} propertyName="scaling" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <AnimationGridComponent globalState={this.props.globalState} animatable={transformNode} scene={transformNode.getScene()} lockObject={this.props.lockObject} />
            </div>
        );
    }
}