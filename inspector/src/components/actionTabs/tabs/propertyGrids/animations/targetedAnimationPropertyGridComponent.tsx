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
import { PopupComponent } from '../animations/popupComponent';
import { AnimationCurveEditorComponent } from '../animations/animationCurveEditorComponent';
import { AnimationGroup } from "babylonjs/Animations/animationGroup";

interface ITargetedAnimationGridComponentProps {
    globalState: GlobalState;
    targetedAnimation: TargetedAnimation,
    scene: Scene,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class TargetedAnimationGridComponent extends React.Component<ITargetedAnimationGridComponentProps> {

    private _isCurveEditorOpen: boolean;
    private _isPlaying: boolean;
    private _animationGroup: AnimationGroup | undefined;
    constructor(props: ITargetedAnimationGridComponentProps) {
        super(props);
        this._animationGroup = this.props.scene.animationGroups.find(ag => {
            let ta = ag.targetedAnimations.find(ta => ta === this.props.targetedAnimation);  
            return ta !== undefined;
        });
    }

    onOpenAnimationCurveEditor() {
        this._isCurveEditorOpen = true;
    }

    onCloseAnimationCurveEditor(window: Window | null) {
        this._isCurveEditorOpen = false;
        if (window === null) {
            console.log("Window already closed");
        } else {
            window.close();
        }
    }

    playOrPause() {
        if (this._animationGroup){
            this._isPlaying = this.props.scene.getAllAnimatablesByTarget(this.props.targetedAnimation.target).length > 0;
            let animationGroup = this.props.scene.getAnimationGroupByName(this._animationGroup.name);
            if (this._isPlaying) {
                animationGroup?.stop();
            } else {
                animationGroup?.start();
            }
            this.forceUpdate();
        } 
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
                    {
                        this._isCurveEditorOpen && <PopupComponent
                            id="curve-editor"
                            title="Curve Animation Editor"
                            size={{ width: 950, height: 540 }}
                            onOpen={(window: Window) => { window.console.log("Window opened!!") }}
                            onClose={(window: Window) => this.onCloseAnimationCurveEditor(window)}>

                            <AnimationCurveEditorComponent 
                                title="Animations Curve Editor" 
                                scene={this.props.scene} 
                                entity={targetedAnimation as any} 
                                playOrPause={() => this.playOrPause()}
                                close={(event) => this.onCloseAnimationCurveEditor(event.view)} />
                        </PopupComponent>
                        }
                </LineContainerComponent>
            </div>
        );
    }
}