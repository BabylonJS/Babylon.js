import { Nullable } from "babylonjs/types";
import { Animation } from "babylonjs/Animations/animation";
import { Observable } from "babylonjs/Misc/observable";
import { KeyPointComponent } from "./graph/keyPoint";
import { Scene } from "babylonjs/scene";
import { IAnimatable } from "babylonjs/Animations/animatable.interface";
import { TargetedAnimation } from "babylonjs/Animations/animationGroup";

export class Context {
    title: string;
    animations: Nullable<Animation[] | TargetedAnimation[]>;
    scene: Scene;
    target: Nullable<IAnimatable>;
    activeAnimation: Nullable<Animation>;
    activeColor: Nullable<string> = null;
    activeKeyPoints: Nullable<KeyPointComponent[]>;
    mainKeyPoint: Nullable<KeyPointComponent>;
    snippetId: string;
    useTargetAnimations: boolean;

    activeFrame: number;
    fromKey: number;
    toKey: number;
    forwardAnimation = true;
    isPlaying: boolean;

    referenceMinFrame = 0;
    referenceMaxFrame = 100;

    onActiveAnimationChanged = new Observable<void>();
    onActiveKeyPointChanged = new Observable<void>();
    onHostWindowResized = new Observable<void>();

    onActiveKeyFrameChanged = new Observable<number>();
    
    onFrameSet = new Observable<number>();
    onFrameManuallyEntered = new Observable<number>();

    onMainKeyPointSet = new Observable<void>();
    onMainKeyPointMoved = new Observable<void>();

    onValueSet = new Observable<number>();
    onValueManuallyEntered = new Observable<number>();

    onFrameRequired = new Observable<void>();
    onNewKeyPointRequired = new Observable<void>();
    onFlattenTangentRequired = new Observable<void>();
    onLinearTangentRequired = new Observable<void>();
    onBreakTangentRequired = new Observable<void>();
    onUnifyTangentRequired = new Observable<void>();

    onDeleteAnimation = new Observable<Animation>();

    onGraphMoved = new Observable<number>();
    onGraphScaled = new Observable<number>();

    onRangeUpdated = new Observable<void>();

    onMoveToFrameRequired = new Observable<number>();

    onAnimationStateChanged = new Observable<void>();

    onDeleteKeyActiveKeyPoints = new Observable<void>();

    onSelectionRectangleMoved = new Observable<DOMRect>();

    onAnimationsLoaded = new Observable<void>();

    onEditAnimationRequired = new Observable<Animation>();
    onEditAnimationUIClosed = new Observable<void>();

    public prepare() {        
        this.isPlaying = false;
        if (!this.animations || !this.animations.length) {
            return;
        }

        const animation = this.useTargetAnimations ? (this.animations[0] as TargetedAnimation).animation : (this.animations[0] as Animation);
        const keys = animation.getKeys();
        this.fromKey = keys[0].frame;
        this.toKey = keys[keys.length - 1].frame;

        this.referenceMinFrame = 0;
        this.referenceMaxFrame = this.toKey;
        this.snippetId = animation.snippetId;
    
        if (!animation || !animation.hasRunningRuntimeAnimations) {
            return;
        }
        this.isPlaying = true;
    }

    public play(forward: boolean) {
        this.isPlaying = true;
        this.scene.stopAnimation(this.target);
        if (forward) {
            this.scene.beginAnimation(this.target, this.fromKey, this.toKey, true);
        } else {
            this.scene.beginAnimation(this.target, this.toKey, this.fromKey, true);
        }
        this.forwardAnimation = forward;

        this.onAnimationStateChanged.notifyObservers();
    }

    public stop() {
        this.isPlaying = false;
        this.scene.stopAnimation(this.target);
    
        this.onAnimationStateChanged.notifyObservers();
    }

    public moveToFrame(frame: number) {
        if (!this.animations || !this.animations.length) {
            return;
        }

        this.activeFrame = frame;

        if (!this.isPlaying) {
            this.scene.beginAnimation(this.target, frame, frame, false);
            return;
        }

        for (var animationEntry of this.animations) {
            const animation = this.useTargetAnimations ? (animationEntry as TargetedAnimation).animation : animationEntry as Animation;

            if (!animation.hasRunningRuntimeAnimations) {
                return;
            }

            for (var runtimeAnimation of animation.runtimeAnimations) {
                runtimeAnimation.goToFrame(frame);
            }
        }

        this.stop();
    }
}