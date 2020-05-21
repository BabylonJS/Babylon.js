import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { TargetedAnimation } from "babylonjs/Animations/animationGroup";
import { Scene } from "babylonjs/scene";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { ButtonLineComponent } from "../../../lines/buttonLineComponent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { TextLineComponent } from "../../../lines/textLineComponent";
import { LockObject } from "../lockObject";
import { GlobalState } from '../../../../globalState';
import { TextInputLineComponent } from '../../../lines/textInputLineComponent';

interface ITargetedAnimationGridComponentProps {
    globalState: GlobalState;
    targetedAnimation: TargetedAnimation,
    scene: Scene,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class TargetedAnimationGridComponent extends React.Component<ITargetedAnimationGridComponentProps> {

    constructor(props: ITargetedAnimationGridComponentProps) {
        super(props);
    }

    onOpenAnimationCurveEditor() {
        // Need to connect with Animation curve editor
    }

    render() {
        const targetedAnimation = this.props.targetedAnimation;

        return (
            <div className="pane">
                <LineContainerComponent globalState={this.props.globalState} title="GENERAL">
                    <TextLineComponent label="Class" value={targetedAnimation.getClassName()} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Name" target={targetedAnimation.animation} propertyName="name" onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                    {
                        targetedAnimation.target.name &&
                        <TextLineComponent label="Target" value={targetedAnimation.target.name} onLink={() => this.props.globalState.onSelectionChangedObservable.notifyObservers(targetedAnimation)}/>
                    }
                    <ButtonLineComponent label="Edit animation" onClick={() => this.onOpenAnimationCurveEditor()} />
                </LineContainerComponent>
            </div>
        );
    }
}