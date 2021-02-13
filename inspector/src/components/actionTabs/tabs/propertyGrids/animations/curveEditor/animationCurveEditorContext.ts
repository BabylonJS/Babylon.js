import { Nullable } from "babylonjs/types";
import { Animation } from "babylonjs/Animations/animation";
import { Observable } from "babylonjs/Misc/observable";
import { AnimationCurveEditorKeyPointComponent } from "./graph/animationCurveEditorKeyPoint";

export class AnimationCurveEditorContext {
    title: string;
    animations: Nullable<Animation[]>;
    activeAnimation: Nullable<Animation>;
    activeSubAnimation: string;
    scale: number = 1;

    onActiveAnimationChanged = new Observable<void>();
    onActiveKeyPointChanged = new Observable<Nullable<AnimationCurveEditorKeyPointComponent>>();
    onHostWindowResized = new Observable<void>();
}