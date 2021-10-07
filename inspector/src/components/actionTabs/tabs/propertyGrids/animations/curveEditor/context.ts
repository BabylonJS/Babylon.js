import { Nullable } from "babylonjs/types";
import { Animation } from "babylonjs/Animations/animation";
import { Observable } from "babylonjs/Misc/observable";
import { KeyPointComponent } from "./graph/keyPoint";
import { Scene } from "babylonjs/scene";
import { IAnimatable } from "babylonjs/Animations/animatable.interface";
import { AnimationGroup, TargetedAnimation } from "babylonjs/Animations/animationGroup";
import { Animatable } from "babylonjs/Animations/animatable";

export class Context {
    title: string;
    animations: Nullable<Animation[] | TargetedAnimation[]>;
    scene: Scene;
    target: Nullable<IAnimatable>;
    rootAnimationGroup: Nullable<AnimationGroup>;
    activeAnimations: Animation[] = [];
    activeChannels: {[key: number]: string} = {};
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
    onSelectAllKeys = new Observable<void>();

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

    onSelectToActivated = new Observable<{from:number, to:number}>();

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
        let animatable: Animatable;
        if (forward) {
            if (this.rootAnimationGroup) {
                this.rootAnimationGroup.start(true, 1.0, this.fromKey, this.toKey);
            } else {    
                animatable = this.scene.beginAnimation(this.target, this.fromKey, this.toKey, true);
            }
        } else {
            if (this.rootAnimationGroup) {
                this.rootAnimationGroup.start(true, 1.0, this.toKey, this.fromKey);
            } else {    
                animatable = this.scene.beginAnimation(this.target, this.toKey, this.fromKey, true);
            }
        }
        this.forwardAnimation = forward;

        // Move
        if (this.rootAnimationGroup) {
            this.rootAnimationGroup.goToFrame(this.activeFrame);
        } else { 
            animatable!.goToFrame(this.activeFrame);
        }

        this.onAnimationStateChanged.notifyObservers();
    }

    public stop() {
        this.isPlaying = false;
        if (this.rootAnimationGroup) {
            this.rootAnimationGroup.stop();
        } else {
            this.scene.stopAnimation(this.target);
        }

        this.onAnimationStateChanged.notifyObservers();
    }

    public moveToFrame(frame: number) {
        if (!this.animations || !this.animations.length) {
            return;
        }

        this.activeFrame = frame;

        if (!this.isPlaying) {
            if (this.rootAnimationGroup) {
                this.rootAnimationGroup.start(false, 1.0, this.fromKey, this.toKey);
            } else { 
                this.scene.beginAnimation(this.target, this.fromKey, this.toKey, false);
            }
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

    public refreshTarget() {        
        if (!this.animations || !this.animations.length) {
            return;
        }

        if (this.isPlaying) {
            return;
        }

        this.moveToFrame(this.activeFrame);
    }

    public clearSelection() {
        this.activeKeyPoints = [];
        this.onActiveKeyPointChanged.notifyObservers();
    }

    public enableChannel(animation: Animation, color: string) {
        this.activeChannels[animation.uniqueId] = color;
    }

    public disableChannel(animation: Animation) {
        delete this.activeChannels[animation.uniqueId];
    }

    public isChannelEnabled(animation: Animation, color: string) {
        return this.activeChannels[animation.uniqueId] === undefined || this.activeChannels[animation.uniqueId] === color;
    }

    public getActiveChannel(animation: Animation) {
        return this.activeChannels[animation.uniqueId];
    }

    public resetAllActiveChannels() {
        this.activeChannels = {};
    }

    public getAnimationSortIndex(animation: Animation) {
        if (!this.animations) {
            return -1;
        }

        for (var index = 0; index < this.animations?.length; index++) {
            if (animation === (this.useTargetAnimations ? (this.animations[0] as TargetedAnimation).animation : (this.animations[index] as Animation))) {
                return index;
            }
        }

        return -1;
    }
}