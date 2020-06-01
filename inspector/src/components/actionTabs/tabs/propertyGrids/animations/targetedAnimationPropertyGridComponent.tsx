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
    onSelectionChangedObservable?: Observable<any>,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class TargetedAnimationGridComponent extends React.Component<ITargetedAnimationGridComponentProps> {

    private _isCurveEditorOpen: boolean;
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
            if (this._animationGroup.isPlaying) {
                this._animationGroup.stop();
            } else {
                this._animationGroup.start();
            }
            this.forceUpdate();
        } 
    }

    deleteAnimation() {        
        if (this._animationGroup) {
            let index = this._animationGroup.targetedAnimations.indexOf(this.props.targetedAnimation);

            if (index > -1) {
                this._animationGroup.targetedAnimations.splice(index, 1);
                this.props.onSelectionChangedObservable?.notifyObservers(null);

                if (this._animationGroup.isPlaying) {
                    this._animationGroup.stop();
                    this._animationGroup.start();
                }
            }
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
                            size={{ width: 1024, height: 512 }}
                            onOpen={(window: Window) => { window.console.log("Window opened!!") }}
                            onClose={(window: Window) => this.onCloseAnimationCurveEditor(window)}>

                            <AnimationCurveEditorComponent
                                scene={this.props.scene} 
                                entity={targetedAnimation as any} 
                                playOrPause={() => this.playOrPause()}
                                close={(event) => this.onCloseAnimationCurveEditor(event.view)} />
                        </PopupComponent>
                    }                    
                    <ButtonLineComponent label="Dispose" onClick={() => this.deleteAnimation()} />
                </LineContainerComponent>
            </div>
        );
    }
}