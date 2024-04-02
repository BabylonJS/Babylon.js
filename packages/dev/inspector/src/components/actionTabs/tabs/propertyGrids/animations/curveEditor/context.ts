import type { Nullable } from "core/types";
import { Animation } from "core/Animations/animation";
import { Observable } from "core/Misc/observable";
import type { KeyPointComponent } from "./graph/keyPoint";
import type { Scene } from "core/scene";
import type { IAnimatable } from "core/Animations/animatable.interface";
import type { AnimationGroup, TargetedAnimation } from "core/Animations/animationGroup";
import type { Animatable } from "core/Animations/animatable";
import type { AnimationKeyInterpolation } from "core/Animations/animationKey";

export interface IActiveAnimationChangedOptions {
    evaluateKeys?: boolean;
    frame?: boolean;
    range?: boolean;
}
export class Context {
    title: string;
    animations: Nullable<Animation[] | TargetedAnimation[]>;
    scene: Scene;
    target: Nullable<IAnimatable>;
    rootAnimationGroup: Nullable<AnimationGroup>;
    activeAnimations: Animation[] = [];
    activeChannels: { [key: number]: string } = {};
    activeKeyPoints: Nullable<KeyPointComponent[]>;
    mainKeyPoint: Nullable<KeyPointComponent>;
    snippetId: string;
    useTargetAnimations: boolean;

    activeFrame: number;
    fromKey: number;
    toKey: number;
    useExistingPlayRange: boolean = false;
    forwardAnimation = true;
    isPlaying: boolean;
    clipLength: number;

    referenceMinFrame = 0;
    referenceMaxFrame = 100;

    focusedInput = false;

    onActiveAnimationChanged = new Observable<IActiveAnimationChangedOptions>();
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
    onCreateOrUpdateKeyPointRequired = new Observable<void>();
    onFlattenTangentRequired = new Observable<void>();
    onLinearTangentRequired = new Observable<void>();
    onBreakTangentRequired = new Observable<void>();
    onUnifyTangentRequired = new Observable<void>();
    onStepTangentRequired = new Observable<void>();

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

    onClipLengthIncreased = new Observable<number>();
    onClipLengthDecreased = new Observable<number>();

    onInterpolationModeSet = new Observable<{ keyId: number; value: AnimationKeyInterpolation }>();

    onSelectToActivated = new Observable<{ from: number; to: number }>();

    onRangeFrameBarResized = new Observable<number>();
    onPlayheadMoved = new Observable<number>();

    lockLastFrameValue: boolean = false;
    lockLastFrameFrame: boolean = false;

    // value frame inTangent outTangent
    onActiveKeyDataChanged = new Observable<number>();
    public prepare() {
        this.isPlaying = false;
        if (!this.animations || !this.animations.length) {
            return;
        }

        const animation = this.useTargetAnimations ? (this.animations[0] as TargetedAnimation).animation : (this.animations[0] as Animation);
        const keys = animation.getKeys();

        this.referenceMinFrame = 0;
        this.referenceMaxFrame = keys[keys.length - 1].frame;

        if (!this.useExistingPlayRange) {
            this.fromKey = this.referenceMinFrame;
            this.toKey = this.referenceMaxFrame;
        }

        this.snippetId = animation.snippetId;

        this.clipLength = this.referenceMaxFrame;

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

        for (const animationEntry of this.animations) {
            const animation = this.useTargetAnimations ? (animationEntry as TargetedAnimation).animation : (animationEntry as Animation);
            if (!animation.hasRunningRuntimeAnimations) {
                return;
            }

            for (const runtimeAnimation of animation.runtimeAnimations) {
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
        this.clearSelection();
        this.activeChannels = {};
    }

    public getAnimationSortIndex(animation: Animation) {
        if (!this.animations) {
            return -1;
        }

        for (let index = 0; index < this.animations?.length; index++) {
            if (animation === (this.useTargetAnimations ? (this.animations[0] as TargetedAnimation).animation : (this.animations[index] as Animation))) {
                return index;
            }
        }

        return -1;
    }

    public getPrevKey(): Nullable<number> {
        if (!this.animations || !this.animations.length || this.activeAnimations.length === 0) {
            return null;
        }

        let prevKey = -Number.MAX_VALUE;

        for (const animation of this.activeAnimations) {
            const keys = animation.getKeys();

            for (const key of keys) {
                if (key.frame < this.activeFrame && key.frame > prevKey) {
                    prevKey = key.frame;
                }
            }
        }

        if (prevKey === -Number.MAX_VALUE) {
            prevKey = this.fromKey;
        }

        return prevKey;
    }

    public getNextKey(): Nullable<number> {
        if (!this.animations || !this.animations.length) {
            return null;
        }

        let nextKey = Number.MAX_VALUE;

        for (const animation of this.activeAnimations) {
            const keys = animation.getKeys();

            for (const key of keys) {
                if (key.frame > this.activeFrame && key.frame < nextKey) {
                    nextKey = key.frame;
                }
            }
        }

        if (nextKey === Number.MAX_VALUE) {
            nextKey = this.toKey;
        }

        return nextKey;
    }

    /**
     * If any current active animation has a key at the received frameNumber,
     * return the index of the animation in the active animation array, and
     * the index of the frame on the animation.
     * @param frameNumber the frame number to look for
     * @returns null if no key was found, or an object with the animation index and key index
     */
    public getKeyAtAnyFrameIndex(frameNumber: number) {
        if (!this.animations || !this.animations.length || !this.activeAnimations || !this.activeAnimations.length) {
            return null;
        }

        let animIdx = 0;
        for (const animation of this.activeAnimations) {
            const keys = animation.getKeys();
            let idx = 0;
            for (const key of keys) {
                if (Math.floor(frameNumber - key.frame) === 0) {
                    return { animationIndex: animIdx, keyIndex: idx };
                }
                idx++;
            }
            animIdx++;
        }
        return null;
    }

    /**
     * @returns true if any active animation has a quaternion animation
     */
    public hasActiveQuaternionAnimationKeyPoints() {
        const activeAnimData = this.activeKeyPoints?.map((keyPointComponent) => keyPointComponent.props.curve.animation.dataType);
        const quaternionAnimData = activeAnimData?.filter((type) => type === Animation.ANIMATIONTYPE_QUATERNION);
        const hasActiveQuaternionAnimation = (quaternionAnimData?.length || 0) > 0;
        return hasActiveQuaternionAnimation;
    }
}
