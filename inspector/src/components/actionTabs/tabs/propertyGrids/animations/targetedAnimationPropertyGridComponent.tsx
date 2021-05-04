import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { TargetedAnimation } from "babylonjs/Animations/animationGroup";
import { Scene } from "babylonjs/scene";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { ButtonLineComponent } from "../../../../../sharedUiComponents/lines/buttonLineComponent";
import { LineContainerComponent } from "../../../../../sharedUiComponents/lines/lineContainerComponent";
import { TextLineComponent } from "../../../../../sharedUiComponents/lines/textLineComponent";
import { LockObject } from "../../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { GlobalState } from "../../../../globalState";
import { TextInputLineComponent } from "../../../../../sharedUiComponents/lines/textInputLineComponent";
import { AnimationGroup } from "babylonjs/Animations/animationGroup";
import { AnimationCurveEditorComponent } from "./curveEditor/animationCurveEditorComponent";
import { Context } from "./curveEditor/context";

interface ITargetedAnimationGridComponentProps {
    globalState: GlobalState;
    targetedAnimation: TargetedAnimation;
    scene: Scene;
    lockObject: LockObject;
    onSelectionChangedObservable?: Observable<any>;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class TargetedAnimationGridComponent extends React.Component<ITargetedAnimationGridComponentProps> {
    private _animationGroup: AnimationGroup | undefined;
    private _animationCurveEditorContext: Context;

    constructor(props: ITargetedAnimationGridComponentProps) {
        super(props);
        this._animationGroup = this.props.scene.animationGroups.find((ag) => {
            let ta = ag.targetedAnimations.find((ta) => ta === this.props.targetedAnimation);
            return ta !== undefined;
        });
    }

    playOrPause = () => {
        if (this._animationGroup) {
            if (this._animationGroup.isPlaying) {
                this._animationGroup.stop();
            } else {
                this._animationGroup.start();
            }
            this.forceUpdate();
        }
    };

    deleteAnimation = () => {
        if (this._animationGroup) {
            let index = this._animationGroup.targetedAnimations.indexOf(this.props.targetedAnimation);

            if (index > -1) {
                this._animationGroup.targetedAnimations.splice(index, 1);
                this.props.onSelectionChangedObservable?.notifyObservers(null);

                if (this._animationGroup.isPlaying) {
                    this._animationGroup.stop();
                    this._animationGroup.start();
                }
            }
        }
    };

    render() {
        const targetedAnimation = this.props.targetedAnimation;

        if (!this._animationCurveEditorContext) {
            this._animationCurveEditorContext = new Context();
            this._animationCurveEditorContext.title = (this.props.targetedAnimation.target as any).name || "";            
            this._animationCurveEditorContext.animations = [this.props.targetedAnimation.animation];
            this._animationCurveEditorContext.target = this.props.targetedAnimation.target;
            this._animationCurveEditorContext.scene = this.props.scene;
        }        

        return (
            <div className="pane">
                <LineContainerComponent title="GENERAL" selection={this.props.globalState}>
                    <TextLineComponent label="Class" value={targetedAnimation.getClassName()} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Name" target={targetedAnimation.animation} propertyName="name" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {targetedAnimation.target.name && <TextLineComponent label="Target" value={targetedAnimation.target.name} onLink={() => this.props.globalState.onSelectionChangedObservable.notifyObservers(targetedAnimation)} />}
                    <AnimationCurveEditorComponent globalState={this.props.globalState} context={this._animationCurveEditorContext}/>
                    <ButtonLineComponent label="Dispose" onClick={this.deleteAnimation} />
                </LineContainerComponent>
            </div>
        );
    }
}
