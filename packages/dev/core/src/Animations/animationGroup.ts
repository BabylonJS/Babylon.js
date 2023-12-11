import type { Animatable } from "./animatable";
import { Animation } from "./animation";
import type { IMakeAnimationAdditiveOptions } from "./animation";
import type { IAnimationKey } from "./animationKey";

import type { Scene, IDisposable } from "../scene";
import { Observable } from "../Misc/observable";
import type { Nullable } from "../types";
import { EngineStore } from "../Engines/engineStore";

import type { AbstractScene } from "../abstractScene";
import { Tags } from "../Misc/tags";
import type { AnimationGroupMask } from "./animationGroupMask";

/**
 * This class defines the direct association between an animation and a target
 */
export class TargetedAnimation {
    /**
     * Animation to perform
     */
    public animation: Animation;
    /**
     * Target to animate
     */
    public target: any;

    /**
     * Returns the string "TargetedAnimation"
     * @returns "TargetedAnimation"
     */
    public getClassName(): string {
        return "TargetedAnimation";
    }

    /**
     * Serialize the object
     * @returns the JSON object representing the current entity
     */
    public serialize(): any {
        const serializationObject: any = {};
        serializationObject.animation = this.animation.serialize();
        serializationObject.targetId = this.target.id;

        return serializationObject;
    }
}

/**
 * Options to be used when creating an additive group animation
 */
export interface IMakeAnimationGroupAdditiveOptions extends IMakeAnimationAdditiveOptions {
    /**
     * Defines if the animation group should be cloned or not (default is false)
     */
    cloneOriginalAnimationGroup?: boolean;
    /**
     * The name of the cloned animation group if cloneOriginalAnimationGroup is true
     */
    clonedAnimationGroupName?: string;
}

/**
 * Use this class to create coordinated animations on multiple targets
 */
export class AnimationGroup implements IDisposable {
    private _scene: Scene;

    private _targetedAnimations = new Array<TargetedAnimation>();
    private _animatables = new Array<Animatable>();
    private _from = Number.MAX_VALUE;
    private _to = -Number.MAX_VALUE;
    private _isStarted: boolean;
    private _isPaused: boolean;
    private _speedRatio = 1;
    private _loopAnimation = false;
    private _isAdditive = false;
    private _weight = -1;
    private _playOrder = 0;
    private _enableBlending: Nullable<boolean> = null;
    private _blendingSpeed: Nullable<number> = null;
    private _numActiveAnimatables = 0;

    /** @internal */
    public _parentContainer: Nullable<AbstractScene> = null;

    /**
     * Gets or sets the unique id of the node
     */
    public uniqueId: number;

    /**
     * This observable will notify when one animation have ended
     */
    public onAnimationEndObservable = new Observable<TargetedAnimation>();

    /**
     * Observer raised when one animation loops
     */
    public onAnimationLoopObservable = new Observable<TargetedAnimation>();

    /**
     * Observer raised when all animations have looped
     */
    public onAnimationGroupLoopObservable = new Observable<AnimationGroup>();

    /**
     * This observable will notify when all animations have ended.
     */
    public onAnimationGroupEndObservable = new Observable<AnimationGroup>();

    /**
     * This observable will notify when all animations have paused.
     */
    public onAnimationGroupPauseObservable = new Observable<AnimationGroup>();

    /**
     * This observable will notify when all animations are playing.
     */
    public onAnimationGroupPlayObservable = new Observable<AnimationGroup>();

    /**
     * Gets or sets an object used to store user defined information for the node
     */
    public metadata: any = null;

    /**
     * Gets or sets the mask associated with this animation group. This mask is used to filter which objects should be animated.
     */
    public mask?: AnimationGroupMask;

    /**
     * Makes sure that the animations are either played or stopped according to the animation group mask.
     * Note however that the call won't have any effect if the animation group has not been started yet.
     * You should call this function if you modify the mask after the animation group has been started.
     */
    public syncWithMask() {
        if (!this.mask) {
            this._numActiveAnimatables = this._targetedAnimations.length;
            return;
        }

        this._numActiveAnimatables = 0;

        for (let i = 0; i < this._animatables.length; ++i) {
            const animatable = this._animatables[i];

            if (this.mask.disabled || this.mask.retainsTarget(animatable.target.name)) {
                this._numActiveAnimatables++;
                if (animatable.paused) {
                    animatable.restart();
                }
            } else {
                if (!animatable.paused) {
                    animatable.pause();
                }
            }
        }
    }

    /**
     * Removes all animations for the targets not retained by the animation group mask.
     * Use this function if you know you won't need those animations anymore and if you want to free memory.
     */
    public removeUnmaskedAnimations() {
        if (!this.mask || this.mask.disabled) {
            return;
        }

        // Removes all animatables (in case the animation group has already been started)
        for (let i = 0; i < this._animatables.length; ++i) {
            const animatable = this._animatables[i];

            if (!this.mask.retainsTarget(animatable.target.name)) {
                animatable.stop();
                this._animatables.splice(i, 1);
                --i;
            }
        }

        // Removes the targeted animations
        for (let index = 0; index < this._targetedAnimations.length; index++) {
            const targetedAnimation = this._targetedAnimations[index];

            if (!this.mask.retainsTarget(targetedAnimation.target.name)) {
                this._targetedAnimations.splice(index, 1);
                --index;
            }
        }
    }

    /**
     * Gets the first frame
     */
    public get from(): number {
        return this._from;
    }

    /**
     * Gets the last frame
     */
    public get to(): number {
        return this._to;
    }

    /**
     * Define if the animations are started
     */
    public get isStarted(): boolean {
        return this._isStarted;
    }

    /**
     * Gets a value indicating that the current group is playing
     */
    public get isPlaying(): boolean {
        return this._isStarted && !this._isPaused;
    }

    /**
     * Gets or sets the speed ratio to use for all animations
     */
    public get speedRatio(): number {
        return this._speedRatio;
    }

    /**
     * Gets or sets the speed ratio to use for all animations
     */
    public set speedRatio(value: number) {
        if (this._speedRatio === value) {
            return;
        }

        this._speedRatio = value;

        for (let index = 0; index < this._animatables.length; index++) {
            const animatable = this._animatables[index];
            animatable.speedRatio = this._speedRatio;
        }
    }

    /**
     * Gets or sets if all animations should loop or not
     */
    public get loopAnimation(): boolean {
        return this._loopAnimation;
    }

    public set loopAnimation(value: boolean) {
        if (this._loopAnimation === value) {
            return;
        }

        this._loopAnimation = value;

        for (let index = 0; index < this._animatables.length; index++) {
            const animatable = this._animatables[index];
            animatable.loopAnimation = this._loopAnimation;
        }
    }

    /**
     * Gets or sets if all animations should be evaluated additively
     */
    public get isAdditive(): boolean {
        return this._isAdditive;
    }

    public set isAdditive(value: boolean) {
        if (this._isAdditive === value) {
            return;
        }

        this._isAdditive = value;

        for (let index = 0; index < this._animatables.length; index++) {
            const animatable = this._animatables[index];
            animatable.isAdditive = this._isAdditive;
        }
    }

    /**
     * Gets or sets the weight to apply to all animations of the group
     */
    public get weight(): number {
        return this._weight;
    }

    public set weight(value: number) {
        if (this._weight === value) {
            return;
        }

        this._weight = value;
        this.setWeightForAllAnimatables(this._weight);
    }

    /**
     * Gets the targeted animations for this animation group
     */
    public get targetedAnimations(): Array<TargetedAnimation> {
        return this._targetedAnimations;
    }

    /**
     * returning the list of animatables controlled by this animation group.
     */
    public get animatables(): Array<Animatable> {
        return this._animatables;
    }

    /**
     * Gets the list of target animations
     */
    public get children() {
        return this._targetedAnimations;
    }

    /**
     * Gets or sets the order of play of the animation group (default: 0)
     */
    public get playOrder() {
        return this._playOrder;
    }

    public set playOrder(value: number) {
        if (this._playOrder === value) {
            return;
        }

        this._playOrder = value;

        if (this._animatables.length > 0) {
            for (let i = 0; i < this._animatables.length; i++) {
                this._animatables[i].playOrder = this._playOrder;
            }

            this._scene.sortActiveAnimatables();
        }
    }

    /**
     * Allows the animations of the animation group to blend with current running animations
     * Note that a null value means that each animation will use their own existing blending configuration (Animation.enableBlending)
     */
    public get enableBlending() {
        return this._enableBlending;
    }

    public set enableBlending(value: Nullable<boolean>) {
        if (this._enableBlending === value) {
            return;
        }

        this._enableBlending = value;

        if (value !== null) {
            for (let i = 0; i < this._targetedAnimations.length; ++i) {
                this._targetedAnimations[i].animation.enableBlending = value;
            }
        }
    }

    /**
     * Gets or sets the animation blending speed
     * Note that a null value means that each animation will use their own existing blending configuration (Animation.blendingSpeed)
     */
    public get blendingSpeed() {
        return this._blendingSpeed;
    }

    public set blendingSpeed(value: Nullable<number>) {
        if (this._blendingSpeed === value) {
            return;
        }

        this._blendingSpeed = value;

        if (value !== null) {
            for (let i = 0; i < this._targetedAnimations.length; ++i) {
                this._targetedAnimations[i].animation.blendingSpeed = value;
            }
        }
    }

    /**
     * Gets the length (in seconds) of the animation group
     * This function assumes that all animations are played at the same framePerSecond speed!
     * Note: you can only call this method after you've added at least one targeted animation!
     * @param from Starting frame range (default is AnimationGroup.from)
     * @param to Ending frame range (default is AnimationGroup.to)
     * @returns The length in seconds
     */
    public getLength(from?: number, to?: number): number {
        from = from ?? this._from;
        to = to ?? this._to;

        const fps = this.targetedAnimations[0].animation.framePerSecond * this._speedRatio;

        return (to - from) / fps;
    }

    /**
     * Merge the array of animation groups into a new animation group
     * @param animationGroups List of animation groups to merge
     * @param disposeSource If true, animation groups will be disposed after being merged (default: true)
     * @param normalize If true, animation groups will be normalized before being merged, so that all animations have the same "from" and "to" frame (default: false)
     * @param weight Weight for the new animation group. If not provided, it will inherit the weight from the first animation group of the array
     * @returns The new animation group or null if no animation groups were passed
     */
    public static MergeAnimationGroups(animationGroups: Array<AnimationGroup>, disposeSource = true, normalize = false, weight?: number): Nullable<AnimationGroup> {
        if (animationGroups.length === 0) {
            return null;
        }

        weight = weight ?? animationGroups[0].weight;

        let beginFrame = Number.MAX_VALUE;
        let endFrame = -Number.MAX_VALUE;

        if (normalize) {
            for (const animationGroup of animationGroups) {
                if (animationGroup.from < beginFrame) {
                    beginFrame = animationGroup.from;
                }

                if (animationGroup.to > endFrame) {
                    endFrame = animationGroup.to;
                }
            }
        }

        const mergedAnimationGroup = new AnimationGroup(animationGroups[0].name + "_merged", animationGroups[0]._scene, weight);

        for (const animationGroup of animationGroups) {
            if (normalize) {
                animationGroup.normalize(beginFrame, endFrame);
            }

            for (const targetedAnimation of animationGroup.targetedAnimations) {
                mergedAnimationGroup.addTargetedAnimation(targetedAnimation.animation, targetedAnimation.target);
            }

            if (disposeSource) {
                animationGroup.dispose();
            }
        }

        return mergedAnimationGroup;
    }

    /**
     * Instantiates a new Animation Group.
     * This helps managing several animations at once.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/groupAnimations
     * @param name Defines the name of the group
     * @param scene Defines the scene the group belongs to
     * @param weight Defines the weight to use for animations in the group (-1.0 by default, meaning "no weight")
     * @param playOrder Defines the order of play of the animation group (default is 0)
     */
    public constructor(
        /** The name of the animation group */
        public name: string,
        scene: Nullable<Scene> = null,
        weight = -1,
        playOrder = 0
    ) {
        this._scene = scene || EngineStore.LastCreatedScene!;
        this._weight = weight;
        this._playOrder = playOrder;
        this.uniqueId = this._scene.getUniqueId();

        this._scene.addAnimationGroup(this);
    }

    /**
     * Add an animation (with its target) in the group
     * @param animation defines the animation we want to add
     * @param target defines the target of the animation
     * @returns the TargetedAnimation object
     */
    public addTargetedAnimation(animation: Animation, target: any): TargetedAnimation {
        const targetedAnimation = new TargetedAnimation();
        targetedAnimation.animation = animation;
        targetedAnimation.target = target;

        const keys = animation.getKeys();
        if (this._from > keys[0].frame) {
            this._from = keys[0].frame;
        }

        if (this._to < keys[keys.length - 1].frame) {
            this._to = keys[keys.length - 1].frame;
        }

        if (this._enableBlending !== null) {
            animation.enableBlending = this._enableBlending;
        }

        if (this._blendingSpeed !== null) {
            animation.blendingSpeed = this._blendingSpeed;
        }

        this._targetedAnimations.push(targetedAnimation);

        return targetedAnimation;
    }

    /**
     * Remove an animation from the group
     * @param animation defines the animation we want to remove
     */
    public removeTargetedAnimation(animation: Animation) {
        for (let index = this._targetedAnimations.length - 1; index > -1; index--) {
            const targetedAnimation = this._targetedAnimations[index];
            if (targetedAnimation.animation === animation) {
                this._targetedAnimations.splice(index, 1);
            }
        }
    }

    /**
     * This function will normalize every animation in the group to make sure they all go from beginFrame to endFrame
     * It can add constant keys at begin or end
     * @param beginFrame defines the new begin frame for all animations or the smallest begin frame of all animations if null (defaults to null)
     * @param endFrame defines the new end frame for all animations or the largest end frame of all animations if null (defaults to null)
     * @returns the animation group
     */
    public normalize(beginFrame: Nullable<number> = null, endFrame: Nullable<number> = null): AnimationGroup {
        if (beginFrame == null) {
            beginFrame = this._from;
        }
        if (endFrame == null) {
            endFrame = this._to;
        }

        for (let index = 0; index < this._targetedAnimations.length; index++) {
            const targetedAnimation = this._targetedAnimations[index];
            const keys = targetedAnimation.animation.getKeys();
            const startKey = keys[0];
            const endKey = keys[keys.length - 1];

            if (startKey.frame > beginFrame) {
                const newKey: IAnimationKey = {
                    frame: beginFrame,
                    value: startKey.value,
                    inTangent: startKey.inTangent,
                    outTangent: startKey.outTangent,
                    interpolation: startKey.interpolation,
                };
                keys.splice(0, 0, newKey);
            }

            if (endKey.frame < endFrame) {
                const newKey: IAnimationKey = {
                    frame: endFrame,
                    value: endKey.value,
                    inTangent: endKey.inTangent,
                    outTangent: endKey.outTangent,
                    interpolation: endKey.interpolation,
                };
                keys.push(newKey);
            }
        }

        this._from = beginFrame;
        this._to = endFrame;

        return this;
    }

    private _animationLoopCount: number;
    private _animationLoopFlags: boolean[] = [];

    private _processLoop(animatable: Animatable, targetedAnimation: TargetedAnimation, index: number) {
        animatable.onAnimationLoop = () => {
            this.onAnimationLoopObservable.notifyObservers(targetedAnimation);

            if (this._animationLoopFlags[index]) {
                return;
            }

            this._animationLoopFlags[index] = true;

            this._animationLoopCount++;
            if (this._animationLoopCount === this._numActiveAnimatables) {
                this.onAnimationGroupLoopObservable.notifyObservers(this);
                this._animationLoopCount = 0;
                this._animationLoopFlags.length = 0;
            }
        };
    }

    /**
     * Start all animations on given targets
     * @param loop defines if animations must loop
     * @param speedRatio defines the ratio to apply to animation speed (1 by default)
     * @param from defines the from key (optional)
     * @param to defines the to key (optional)
     * @param isAdditive defines the additive state for the resulting animatables (optional)
     * @returns the current animation group
     */
    public start(loop = false, speedRatio = 1, from?: number, to?: number, isAdditive?: boolean): AnimationGroup {
        if (this._isStarted || this._targetedAnimations.length === 0) {
            return this;
        }

        this._loopAnimation = loop;

        this._animationLoopCount = 0;
        this._animationLoopFlags.length = 0;

        for (let index = 0; index < this._targetedAnimations.length; index++) {
            const targetedAnimation = this._targetedAnimations[index];
            const animatable = this._scene.beginDirectAnimation(
                targetedAnimation.target,
                [targetedAnimation.animation],
                from !== undefined ? from : this._from,
                to !== undefined ? to : this._to,
                loop,
                speedRatio,
                undefined,
                undefined,
                isAdditive !== undefined ? isAdditive : this._isAdditive
            );
            animatable.weight = this._weight;
            animatable.playOrder = this._playOrder;
            animatable.onAnimationEnd = () => {
                this.onAnimationEndObservable.notifyObservers(targetedAnimation);
                this._checkAnimationGroupEnded(animatable);
            };

            this._processLoop(animatable, targetedAnimation, index);
            this._animatables.push(animatable);
        }

        this.syncWithMask();

        this._scene.sortActiveAnimatables();

        this._speedRatio = speedRatio;

        this._isStarted = true;
        this._isPaused = false;

        this.onAnimationGroupPlayObservable.notifyObservers(this);

        return this;
    }

    /**
     * Pause all animations
     * @returns the animation group
     */
    public pause(): AnimationGroup {
        if (!this._isStarted) {
            return this;
        }

        this._isPaused = true;

        for (let index = 0; index < this._animatables.length; index++) {
            const animatable = this._animatables[index];
            animatable.pause();
        }

        this.onAnimationGroupPauseObservable.notifyObservers(this);

        return this;
    }

    /**
     * Play all animations to initial state
     * This function will start() the animations if they were not started or will restart() them if they were paused
     * @param loop defines if animations must loop
     * @returns the animation group
     */
    public play(loop?: boolean): AnimationGroup {
        // only if all animatables are ready and exist
        if (this.isStarted && this._animatables.length === this._targetedAnimations.length) {
            if (loop !== undefined) {
                this.loopAnimation = loop;
            }
            this.restart();
        } else {
            this.stop();
            this.start(loop, this._speedRatio);
        }

        this._isPaused = false;

        return this;
    }

    /**
     * Reset all animations to initial state
     * @returns the animation group
     */
    public reset(): AnimationGroup {
        if (!this._isStarted) {
            this.play();
            this.goToFrame(0);
            this.stop();
            return this;
        }

        for (let index = 0; index < this._animatables.length; index++) {
            const animatable = this._animatables[index];
            animatable.reset();
        }

        return this;
    }

    /**
     * Restart animations from key 0
     * @returns the animation group
     */
    public restart(): AnimationGroup {
        if (!this._isStarted) {
            return this;
        }

        for (let index = 0; index < this._animatables.length; index++) {
            const animatable = this._animatables[index];
            animatable.restart();
        }

        this.onAnimationGroupPlayObservable.notifyObservers(this);

        return this;
    }

    /**
     * Stop all animations
     * @returns the animation group
     */
    public stop(): AnimationGroup {
        if (!this._isStarted) {
            return this;
        }

        const list = this._animatables.slice();
        for (let index = 0; index < list.length; index++) {
            list[index].stop(undefined, undefined, true);
        }

        // We will take care of removing all stopped animatables
        let curIndex = 0;
        for (let index = 0; index < this._scene._activeAnimatables.length; index++) {
            const animatable = this._scene._activeAnimatables[index];
            if (animatable._runtimeAnimations.length > 0) {
                this._scene._activeAnimatables[curIndex++] = animatable;
            }
        }
        this._scene._activeAnimatables.length = curIndex;

        this._isStarted = false;

        return this;
    }

    /**
     * Set animation weight for all animatables
     *
     * @since 6.12.4
     *  You can pass the weight to the AnimationGroup constructor, or use the weight property to set it after the group has been created,
     *  making it easier to define the overall animation weight than calling setWeightForAllAnimatables() after the animation group has been started
     * @param weight defines the weight to use
     * @returns the animationGroup
     * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#animation-weights
     */
    public setWeightForAllAnimatables(weight: number): AnimationGroup {
        for (let index = 0; index < this._animatables.length; index++) {
            const animatable = this._animatables[index];
            animatable.weight = weight;
        }

        return this;
    }

    /**
     * Synchronize and normalize all animatables with a source animatable
     * @param root defines the root animatable to synchronize with (null to stop synchronizing)
     * @returns the animationGroup
     * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#animation-weights
     */
    public syncAllAnimationsWith(root: Nullable<Animatable>): AnimationGroup {
        for (let index = 0; index < this._animatables.length; index++) {
            const animatable = this._animatables[index];
            animatable.syncWith(root);
        }

        return this;
    }

    /**
     * Goes to a specific frame in this animation group
     * @param frame the frame number to go to
     * @returns the animationGroup
     */
    public goToFrame(frame: number): AnimationGroup {
        if (!this._isStarted) {
            return this;
        }

        for (let index = 0; index < this._animatables.length; index++) {
            const animatable = this._animatables[index];
            animatable.goToFrame(frame);
        }

        return this;
    }

    /**
     * Dispose all associated resources
     */
    public dispose(): void {
        this._targetedAnimations.length = 0;
        this._animatables.length = 0;

        // Remove from scene
        const index = this._scene.animationGroups.indexOf(this);

        if (index > -1) {
            this._scene.animationGroups.splice(index, 1);
        }

        if (this._parentContainer) {
            const index = this._parentContainer.animationGroups.indexOf(this);
            if (index > -1) {
                this._parentContainer.animationGroups.splice(index, 1);
            }
            this._parentContainer = null;
        }

        this.onAnimationEndObservable.clear();
        this.onAnimationGroupEndObservable.clear();
        this.onAnimationGroupPauseObservable.clear();
        this.onAnimationGroupPlayObservable.clear();
        this.onAnimationLoopObservable.clear();
        this.onAnimationGroupLoopObservable.clear();
    }

    private _checkAnimationGroupEnded(animatable: Animatable) {
        // animatable should be taken out of the array
        const idx = this._animatables.indexOf(animatable);
        if (idx > -1) {
            this._animatables.splice(idx, 1);
        }

        // all animatables were removed? animation group ended!
        if (this._animatables.length === 0) {
            this._isStarted = false;
            this.onAnimationGroupEndObservable.notifyObservers(this);
        }
    }

    /**
     * Clone the current animation group and returns a copy
     * @param newName defines the name of the new group
     * @param targetConverter defines an optional function used to convert current animation targets to new ones
     * @param cloneAnimations defines if the animations should be cloned or referenced
     * @returns the new animation group
     */
    public clone(newName: string, targetConverter?: (oldTarget: any) => any, cloneAnimations = false): AnimationGroup {
        const newGroup = new AnimationGroup(newName || this.name, this._scene, this._weight, this._playOrder);

        newGroup._from = this.from;
        newGroup._to = this.to;
        newGroup._speedRatio = this.speedRatio;
        newGroup._loopAnimation = this.loopAnimation;
        newGroup._isAdditive = this.isAdditive;
        newGroup._enableBlending = this.enableBlending;
        newGroup._blendingSpeed = this.blendingSpeed;
        newGroup.metadata = this.metadata;
        newGroup.mask = this.mask;

        for (const targetAnimation of this._targetedAnimations) {
            newGroup.addTargetedAnimation(
                cloneAnimations ? targetAnimation.animation.clone() : targetAnimation.animation,
                targetConverter ? targetConverter(targetAnimation.target) : targetAnimation.target
            );
        }

        return newGroup;
    }

    /**
     * Serializes the animationGroup to an object
     * @returns Serialized object
     */
    public serialize(): any {
        const serializationObject: any = {};

        serializationObject.name = this.name;
        serializationObject.from = this.from;
        serializationObject.to = this.to;
        serializationObject.speedRatio = this.speedRatio;
        serializationObject.loopAnimation = this.loopAnimation;
        serializationObject.isAdditive = this.isAdditive;
        serializationObject.weight = this.weight;
        serializationObject.playOrder = this.playOrder;
        serializationObject.enableBlending = this.enableBlending;
        serializationObject.blendingSpeed = this.blendingSpeed;

        serializationObject.targetedAnimations = [];
        for (let targetedAnimationIndex = 0; targetedAnimationIndex < this.targetedAnimations.length; targetedAnimationIndex++) {
            const targetedAnimation = this.targetedAnimations[targetedAnimationIndex];
            serializationObject.targetedAnimations[targetedAnimationIndex] = targetedAnimation.serialize();
        }

        if (Tags && Tags.HasTags(this)) {
            serializationObject.tags = Tags.GetTags(this);
        }

        // Metadata
        if (this.metadata) {
            serializationObject.metadata = this.metadata;
        }

        return serializationObject;
    }

    // Statics
    /**
     * Returns a new AnimationGroup object parsed from the source provided.
     * @param parsedAnimationGroup defines the source
     * @param scene defines the scene that will receive the animationGroup
     * @returns a new AnimationGroup
     */
    public static Parse(parsedAnimationGroup: any, scene: Scene): AnimationGroup {
        const animationGroup = new AnimationGroup(parsedAnimationGroup.name, scene, parsedAnimationGroup.weight, parsedAnimationGroup.playOrder);
        for (let i = 0; i < parsedAnimationGroup.targetedAnimations.length; i++) {
            const targetedAnimation = parsedAnimationGroup.targetedAnimations[i];
            const animation = Animation.Parse(targetedAnimation.animation);
            const id = targetedAnimation.targetId;
            if (targetedAnimation.animation.property === "influence") {
                // morph target animation
                const morphTarget = scene.getMorphTargetById(id);
                if (morphTarget) {
                    animationGroup.addTargetedAnimation(animation, morphTarget);
                }
            } else {
                const targetNode = scene.getNodeById(id);

                if (targetNode != null) {
                    animationGroup.addTargetedAnimation(animation, targetNode);
                }
            }
        }

        if (Tags) {
            Tags.AddTagsTo(animationGroup, parsedAnimationGroup.tags);
        }

        if (parsedAnimationGroup.from !== null && parsedAnimationGroup.to !== null) {
            animationGroup.normalize(parsedAnimationGroup.from, parsedAnimationGroup.to);
        }

        if (parsedAnimationGroup.speedRatio !== undefined) {
            animationGroup._speedRatio = parsedAnimationGroup.speedRatio;
        }
        if (parsedAnimationGroup.loopAnimation !== undefined) {
            animationGroup._loopAnimation = parsedAnimationGroup.loopAnimation;
        }

        if (parsedAnimationGroup.isAdditive !== undefined) {
            animationGroup._isAdditive = parsedAnimationGroup.isAdditive;
        }

        if (parsedAnimationGroup.weight !== undefined) {
            animationGroup._weight = parsedAnimationGroup.weight;
        }

        if (parsedAnimationGroup.playOrder !== undefined) {
            animationGroup._playOrder = parsedAnimationGroup.playOrder;
        }

        if (parsedAnimationGroup.enableBlending !== undefined) {
            animationGroup._enableBlending = parsedAnimationGroup.enableBlending;
        }

        if (parsedAnimationGroup.blendingSpeed !== undefined) {
            animationGroup._blendingSpeed = parsedAnimationGroup.blendingSpeed;
        }

        if (parsedAnimationGroup.metadata !== undefined) {
            animationGroup.metadata = parsedAnimationGroup.metadata;
        }

        return animationGroup;
    }

    /**
     * Convert the keyframes for all animations belonging to the group to be relative to a given reference frame.
     * @param sourceAnimationGroup defines the AnimationGroup containing animations to convert
     * @param referenceFrame defines the frame that keyframes in the range will be relative to (default: 0)
     * @param range defines the name of the AnimationRange belonging to the animations in the group to convert
     * @param cloneOriginal defines whether or not to clone the group and convert the clone or convert the original group (default is false)
     * @param clonedName defines the name of the resulting cloned AnimationGroup if cloneOriginal is true
     * @returns a new AnimationGroup if cloneOriginal is true or the original AnimationGroup if cloneOriginal is false
     */
    public static MakeAnimationAdditive(sourceAnimationGroup: AnimationGroup, referenceFrame: number, range?: string, cloneOriginal?: boolean, clonedName?: string): AnimationGroup;

    /**
     * Convert the keyframes for all animations belonging to the group to be relative to a given reference frame.
     * @param sourceAnimationGroup defines the AnimationGroup containing animations to convert
     * @param options defines the options to use when converting keyframes
     * @returns a new AnimationGroup if options.cloneOriginalAnimationGroup is true or the original AnimationGroup if options.cloneOriginalAnimationGroup is false
     */
    public static MakeAnimationAdditive(sourceAnimationGroup: AnimationGroup, options?: IMakeAnimationGroupAdditiveOptions): AnimationGroup;

    /** @internal */
    public static MakeAnimationAdditive(
        sourceAnimationGroup: AnimationGroup,
        referenceFrameOrOptions?: number | IMakeAnimationGroupAdditiveOptions,
        range?: string,
        cloneOriginal = false,
        clonedName?: string
    ): AnimationGroup {
        let options: IMakeAnimationGroupAdditiveOptions;

        if (typeof referenceFrameOrOptions === "object") {
            options = referenceFrameOrOptions;
        } else {
            options = {
                referenceFrame: referenceFrameOrOptions,
                range: range,
                cloneOriginalAnimationGroup: cloneOriginal,
                clonedAnimationName: clonedName,
            };
        }

        let animationGroup = sourceAnimationGroup;
        if (options.cloneOriginalAnimationGroup) {
            animationGroup = sourceAnimationGroup.clone(options.clonedAnimationGroupName || animationGroup.name);
        }

        const targetedAnimations = animationGroup.targetedAnimations;
        for (let index = 0; index < targetedAnimations.length; index++) {
            const targetedAnimation = targetedAnimations[index];
            targetedAnimation.animation = Animation.MakeAnimationAdditive(targetedAnimation.animation, options);
        }

        animationGroup.isAdditive = true;

        if (options.clipKeys) {
            // We need to recalculate the from/to frames for the animation group because some keys may have been removed
            let from = Number.MAX_VALUE;
            let to = -Number.MAX_VALUE;

            const targetedAnimations = animationGroup.targetedAnimations;
            for (let index = 0; index < targetedAnimations.length; index++) {
                const targetedAnimation = targetedAnimations[index];
                const animation = targetedAnimation.animation;
                const keys = animation.getKeys();

                if (from > keys[0].frame) {
                    from = keys[0].frame;
                }

                if (to < keys[keys.length - 1].frame) {
                    to = keys[keys.length - 1].frame;
                }
            }

            animationGroup._from = from;
            animationGroup._to = to;
        }

        return animationGroup;
    }

    /**
     * Creates a new animation, keeping only the keys that are inside a given key range
     * @param sourceAnimationGroup defines the animation group on which to operate
     * @param fromKey defines the lower bound of the range
     * @param toKey defines the upper bound of the range
     * @param name defines the name of the new animation group. If not provided, use the same name as animationGroup
     * @param dontCloneAnimations defines whether or not the animations should be cloned before clipping the keys. Default is false, so animations will be cloned
     * @returns a new animation group stripped from all the keys outside the given range
     */
    public static ClipKeys(sourceAnimationGroup: AnimationGroup, fromKey: number, toKey: number, name?: string, dontCloneAnimations?: boolean): AnimationGroup {
        const animationGroup = sourceAnimationGroup.clone(name || sourceAnimationGroup.name);

        return AnimationGroup.ClipKeysInPlace(animationGroup, fromKey, toKey, dontCloneAnimations);
    }

    /**
     * Updates an existing animation, keeping only the keys that are inside a given key range
     * @param animationGroup defines the animation group on which to operate
     * @param fromKey defines the lower bound of the range
     * @param toKey defines the upper bound of the range
     * @param dontCloneAnimations defines whether or not the animations should be cloned before clipping the keys. Default is false, so animations will be cloned
     * @returns the animationGroup stripped from all the keys outside the given range
     */
    public static ClipKeysInPlace(animationGroup: AnimationGroup, fromKey: number, toKey: number, dontCloneAnimations?: boolean): AnimationGroup {
        return AnimationGroup.ClipInPlace(animationGroup, fromKey, toKey, dontCloneAnimations, false);
    }

    /**
     * Creates a new animation, keeping only the frames that are inside a given frame range
     * @param sourceAnimationGroup defines the animation group on which to operate
     * @param fromFrame defines the lower bound of the range
     * @param toFrame defines the upper bound of the range
     * @param name defines the name of the new animation group. If not provided, use the same name as animationGroup
     * @param dontCloneAnimations defines whether or not the animations should be cloned before clipping the frames. Default is false, so animations will be cloned
     * @returns a new animation group stripped from all the frames outside the given range
     */
    public static ClipFrames(sourceAnimationGroup: AnimationGroup, fromFrame: number, toFrame: number, name?: string, dontCloneAnimations?: boolean): AnimationGroup {
        const animationGroup = sourceAnimationGroup.clone(name || sourceAnimationGroup.name);

        return AnimationGroup.ClipFramesInPlace(animationGroup, fromFrame, toFrame, dontCloneAnimations);
    }

    /**
     * Updates an existing animation, keeping only the frames that are inside a given frame range
     * @param animationGroup defines the animation group on which to operate
     * @param fromFrame defines the lower bound of the range
     * @param toFrame defines the upper bound of the range
     * @param dontCloneAnimations defines whether or not the animations should be cloned before clipping the frames. Default is false, so animations will be cloned
     * @returns the animationGroup stripped from all the frames outside the given range
     */
    public static ClipFramesInPlace(animationGroup: AnimationGroup, fromFrame: number, toFrame: number, dontCloneAnimations?: boolean): AnimationGroup {
        return AnimationGroup.ClipInPlace(animationGroup, fromFrame, toFrame, dontCloneAnimations, true);
    }

    /**
     * Updates an existing animation, keeping only the keys that are inside a given key or frame range
     * @param animationGroup defines the animation group on which to operate
     * @param start defines the lower bound of the range
     * @param end defines the upper bound of the range
     * @param dontCloneAnimations defines whether or not the animations should be cloned before clipping the keys. Default is false, so animations will be cloned
     * @param useFrame defines if the range is defined by frame numbers or key indices (default is false which means use key indices)
     * @returns the animationGroup stripped from all the keys outside the given range
     */
    public static ClipInPlace(animationGroup: AnimationGroup, start: number, end: number, dontCloneAnimations?: boolean, useFrame = false): AnimationGroup {
        let from = Number.MAX_VALUE;
        let to = -Number.MAX_VALUE;

        const targetedAnimations = animationGroup.targetedAnimations;
        for (let index = 0; index < targetedAnimations.length; index++) {
            const targetedAnimation = targetedAnimations[index];
            const animation = dontCloneAnimations ? targetedAnimation.animation : targetedAnimation.animation.clone();

            if (useFrame) {
                // Make sure we have keys corresponding to the bounds of the frame range
                animation.createKeyForFrame(start);
                animation.createKeyForFrame(end);
            }

            const keys = animation.getKeys();
            const newKeys: IAnimationKey[] = [];

            let startFrame = Number.MAX_VALUE;
            for (let k = 0; k < keys.length; k++) {
                const key = keys[k];
                if ((!useFrame && k >= start && k <= end) || (useFrame && key.frame >= start && key.frame <= end)) {
                    const newKey: IAnimationKey = {
                        frame: key.frame,
                        value: key.value.clone ? key.value.clone() : key.value,
                        inTangent: key.inTangent,
                        outTangent: key.outTangent,
                        interpolation: key.interpolation,
                        lockedTangent: key.lockedTangent,
                    };
                    if (startFrame === Number.MAX_VALUE) {
                        startFrame = newKey.frame;
                    }
                    newKey.frame -= startFrame;
                    newKeys.push(newKey);
                }
            }

            if (newKeys.length === 0) {
                targetedAnimations.splice(index, 1);
                index--;
                continue;
            }

            if (from > newKeys[0].frame) {
                from = newKeys[0].frame;
            }

            if (to < newKeys[newKeys.length - 1].frame) {
                to = newKeys[newKeys.length - 1].frame;
            }

            animation.setKeys(newKeys, true);
            targetedAnimation.animation = animation; // in case the animation has been cloned
        }

        animationGroup._from = from;
        animationGroup._to = to;

        return animationGroup;
    }

    /**
     * Returns the string "AnimationGroup"
     * @returns "AnimationGroup"
     */
    public getClassName(): string {
        return "AnimationGroup";
    }

    /**
     * Creates a detailed string about the object
     * @param fullDetails defines if the output string will support multiple levels of logging within scene loading
     * @returns a string representing the object
     */
    public toString(fullDetails?: boolean): string {
        let ret = "Name: " + this.name;
        ret += ", type: " + this.getClassName();
        if (fullDetails) {
            ret += ", from: " + this._from;
            ret += ", to: " + this._to;
            ret += ", isStarted: " + this._isStarted;
            ret += ", speedRatio: " + this._speedRatio;
            ret += ", targetedAnimations length: " + this._targetedAnimations.length;
            ret += ", animatables length: " + this._animatables;
        }
        return ret;
    }
}
