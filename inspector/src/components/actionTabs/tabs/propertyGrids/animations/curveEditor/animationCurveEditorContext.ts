import { Nullable } from "babylonjs/types";
import { Animation } from "babylonjs/Animations/animation";
import { Observable } from "babylonjs/Misc/observable";
import { AnimationCurveEditorKeyPointComponent } from "./graph/animationCurveEditorKeyPoint";

export class AnimationCurveEditorContext {
    title: string;
    animations: Nullable<Animation[]>;
    activeAnimation: Nullable<Animation>;
    activeKeyPoints: Nullable<AnimationCurveEditorKeyPointComponent[]>;

    onActiveAnimationChanged = new Observable<void>();
    onActiveKeyPointChanged = new Observable<Nullable<{keyPoint: AnimationCurveEditorKeyPointComponent, channel: string}>>();
    onHostWindowResized = new Observable<void>();

    onActiveKeyFrameChanged = new Observable<number>();
    
    onFrameSet = new Observable<number>();
    onFrameManuallyEntered = new Observable<number>();

    onValueSet = new Observable<number>();
    onValueManuallyEntered = new Observable<number>();

    onFrameRequired = new Observable<void>();
}