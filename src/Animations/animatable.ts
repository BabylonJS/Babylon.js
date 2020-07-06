import { Animation } from "./animation";
import { RuntimeAnimation } from "./runtimeAnimation";

import { Nullable } from "../types";
import { Observable } from "../Misc/observable";
import { Scene } from "../scene";
import { Matrix, Quaternion, Vector3, TmpVectors } from '../Maths/math.vector';
import { PrecisionDate } from '../Misc/precisionDate';
import { Bone } from '../Bones/bone';
import { Node } from "../node";

/**
 * Class used to store an actual running animation
 */
export class Animatable {
    private _localDelayOffset: Nullable<number> = null;
    private _pausedDelay: Nullable<number> = null;
    private _runtimeAnimations = new Array<RuntimeAnimation>();
    private _paused = false;
    private _scene: Scene;
    private _speedRatio = 1;
    private _weight = -1.0;
    private _syncRoot: Nullable<Animatable> = null;

    /**
     * Gets or sets a boolean indicating if the animatable must be disposed and removed at the end of the animation.
     * This will only apply for non looping animation (default is true)
     */
    public disposeOnEnd = true;

    /**
     * Gets a boolean indicating if the animation has started
     */
    public animationStarted = false;

    /**
     * Observer raised when the animation ends
     */
    public onAnimationEndObservable = new Observable<Animatable>();

    /**
     * Observer raised when the animation loops
     */
    public onAnimationLoopObservable = new Observable<Animatable>();

    /**
     * Gets the root Animatable used to synchronize and normalize animations
     */
    public get syncRoot(): Nullable<Animatable> {
        return this._syncRoot;
    }

    /**
     * Gets the current frame of the first RuntimeAnimation
     * Used to synchronize Animatables
     */
    public get masterFrame(): number {
        if (this._runtimeAnimations.length === 0) {
            return 0;
        }

        return this._runtimeAnimations[0].currentFrame;
    }

    /**
     * Gets or sets the animatable weight (-1.0 by default meaning not weighted)
     */
    public get weight(): number {
        return this._weight;
    }

    public set weight(value: number) {
        if (value === -1) { // -1 is ok and means no weight
            this._weight = -1;
            return;
        }

        // Else weight must be in [0, 1] range
        this._weight = Math.min(Math.max(value, 0), 1.0);
    }

    /**
     * Gets or sets the speed ratio to apply to the animatable (1.0 by default)
     */
    public get speedRatio(): number {
        return this._speedRatio;
    }

    public set speedRatio(value: number) {
        for (var index = 0; index < this._runtimeAnimations.length; index++) {
            var animation = this._runtimeAnimations[index];

            animation._prepareForSpeedRatioChange(value);
        }
        this._speedRatio = value;
    }

    /**
     * Creates a new Animatable
     * @param scene defines the hosting scene
     * @param target defines the target object
     * @param fromFrame defines the starting frame number (default is 0)
     * @param toFrame defines the ending frame number (default is 100)
     * @param loopAnimation defines if the animation must loop (default is false)
     * @param speedRatio defines the factor to apply to animation speed (default is 1)
     * @param onAnimationEnd defines a callback to call when animation ends if it is not looping
     * @param animations defines a group of animation to add to the new Animatable
     * @param onAnimationLoop defines a callback to call when animation loops
     * @param isAdditive defines whether the animation should be evaluated additively
     */
    constructor(scene: Scene,
        /** defines the target object */
        public target: any,
        /** defines the starting frame number (default is 0) */
        public fromFrame: number = 0,
        /** defines the ending frame number (default is 100) */
        public toFrame: number = 100,
        /** defines if the animation must loop (default is false)  */
        public loopAnimation: boolean = false,
        speedRatio: number = 1.0,
        /** defines a callback to call when animation ends if it is not looping */
        public onAnimationEnd?: Nullable<() => void>,
        animations?: Animation[],
        /** defines a callback to call when animation loops */
        public onAnimationLoop?: Nullable<() => void>,
        /** defines whether the animation should be evaluated additively */
        public isAdditive: boolean = false) {
        this._scene = scene;
        if (animations) {
            this.appendAnimations(target, animations);
        }

        this._speedRatio = speedRatio;
        scene._activeAnimatables.push(this);
    }

    // Methods
    /**
     * Synchronize and normalize current Animatable with a source Animatable
     * This is useful when using animation weights and when animations are not of the same length
     * @param root defines the root Animatable to synchronize with
     * @returns the current Animatable
     */
    public syncWith(root: Animatable): Animatable {
        this._syncRoot = root;

        if (root) {
            // Make sure this animatable will animate after the root
            let index = this._scene._activeAnimatables.indexOf(this);
            if (index > -1) {
                this._scene._activeAnimatables.splice(index, 1);
                this._scene._activeAnimatables.push(this);
            }
        }

        return this;
    }

    /**
     * Gets the list of runtime animations
     * @returns an array of RuntimeAnimation
     */
    public getAnimations(): RuntimeAnimation[] {
        return this._runtimeAnimations;
    }

    /**
     * Adds more animations to the current animatable
     * @param target defines the target of the animations
     * @param animations defines the new animations to add
     */
    public appendAnimations(target: any, animations: Animation[]): void {
        for (var index = 0; index < animations.length; index++) {
            var animation = animations[index];

            let newRuntimeAnimation = new RuntimeAnimation(target, animation, this._scene, this);
            newRuntimeAnimation._onLoop = () => {
                this.onAnimationLoopObservable.notifyObservers(this);
                if (this.onAnimationLoop) {
                    this.onAnimationLoop();
                }
            };

            this._runtimeAnimations.push(newRuntimeAnimation);
        }
    }

    /**
     * Gets the source animation for a specific property
     * @param property defines the propertyu to look for
     * @returns null or the source animation for the given property
     */
    public getAnimationByTargetProperty(property: string): Nullable<Animation> {
        var runtimeAnimations = this._runtimeAnimations;

        for (var index = 0; index < runtimeAnimations.length; index++) {
            if (runtimeAnimations[index].animation.targetProperty === property) {
                return runtimeAnimations[index].animation;
            }
        }

        return null;
    }

    /**
     * Gets the runtime animation for a specific property
     * @param property defines the propertyu to look for
     * @returns null or the runtime animation for the given property
     */
    public getRuntimeAnimationByTargetProperty(property: string): Nullable<RuntimeAnimation> {
        var runtimeAnimations = this._runtimeAnimations;

        for (var index = 0; index < runtimeAnimations.length; index++) {
            if (runtimeAnimations[index].animation.targetProperty === property) {
                return runtimeAnimations[index];
            }
        }

        return null;
    }

    /**
     * Resets the animatable to its original state
     */
    public reset(): void {
        var runtimeAnimations = this._runtimeAnimations;

        for (var index = 0; index < runtimeAnimations.length; index++) {
            runtimeAnimations[index].reset(true);
        }

        this._localDelayOffset = null;
        this._pausedDelay = null;
    }

    /**
     * Allows the animatable to blend with current running animations
     * @see https://doc.babylonjs.com/babylon101/animations#animation-blending
     * @param blendingSpeed defines the blending speed to use
     */
    public enableBlending(blendingSpeed: number): void {
        var runtimeAnimations = this._runtimeAnimations;

        for (var index = 0; index < runtimeAnimations.length; index++) {
            runtimeAnimations[index].animation.enableBlending = true;
            runtimeAnimations[index].animation.blendingSpeed = blendingSpeed;
        }
    }

    /**
     * Disable animation blending
     * @see https://doc.babylonjs.com/babylon101/animations#animation-blending
     */
    public disableBlending(): void {
        var runtimeAnimations = this._runtimeAnimations;

        for (var index = 0; index < runtimeAnimations.length; index++) {
            runtimeAnimations[index].animation.enableBlending = false;
        }
    }

    /**
     * Jump directly to a given frame
     * @param frame defines the frame to jump to
     */
    public goToFrame(frame: number): void {
        var runtimeAnimations = this._runtimeAnimations;

        if (runtimeAnimations[0]) {
            var fps = runtimeAnimations[0].animation.framePerSecond;
            var currentFrame = runtimeAnimations[0].currentFrame;
            var delay = this.speedRatio === 0 ? 0 : ((frame - currentFrame) / fps * 1000) / this.speedRatio;
            if (this._localDelayOffset === null) {
                this._localDelayOffset = 0;
            }
            this._localDelayOffset -= delay;
        }

        for (var index = 0; index < runtimeAnimations.length; index++) {
            runtimeAnimations[index].goToFrame(frame);
        }
    }

    /**
     * Pause the animation
     */
    public pause(): void {
        if (this._paused) {
            return;
        }
        this._paused = true;
    }

    /**
     * Restart the animation
     */
    public restart(): void {
        this._paused = false;
    }

    private _raiseOnAnimationEnd() {
        if (this.onAnimationEnd) {
            this.onAnimationEnd();
        }

        this.onAnimationEndObservable.notifyObservers(this);
    }

    /**
     * Stop and delete the current animation
     * @param animationName defines a string used to only stop some of the runtime animations instead of all
     * @param targetMask - a function that determines if the animation should be stopped based on its target (all animations will be stopped if both this and animationName are empty)
     */
    public stop(animationName?: string, targetMask?: (target: any) => boolean): void {
        if (animationName || targetMask) {
            var idx = this._scene._activeAnimatables.indexOf(this);

            if (idx > -1) {

                var runtimeAnimations = this._runtimeAnimations;

                for (var index = runtimeAnimations.length - 1; index >= 0; index--) {
                    const runtimeAnimation = runtimeAnimations[index];
                    if (animationName && runtimeAnimation.animation.name != animationName) {
                        continue;
                    }
                    if (targetMask && !targetMask(runtimeAnimation.target)) {
                        continue;
                    }

                    runtimeAnimation.dispose();
                    runtimeAnimations.splice(index, 1);
                }

                if (runtimeAnimations.length == 0) {
                    this._scene._activeAnimatables.splice(idx, 1);
                    this._raiseOnAnimationEnd();
                }
            }

        } else {

            var index = this._scene._activeAnimatables.indexOf(this);

            if (index > -1) {
                this._scene._activeAnimatables.splice(index, 1);
                var runtimeAnimations = this._runtimeAnimations;

                for (var index = 0; index < runtimeAnimations.length; index++) {
                    runtimeAnimations[index].dispose();
                }

                this._raiseOnAnimationEnd();
            }
        }
    }

    /**
     * Wait asynchronously for the animation to end
     * @returns a promise which will be fullfilled when the animation ends
     */
    public waitAsync(): Promise<Animatable> {
        return new Promise((resolve, reject) => {
            this.onAnimationEndObservable.add(() => {
                resolve(this);
            }, undefined, undefined, this, true);
        });
    }

    /** @hidden */
    public _animate(delay: number): boolean {
        if (this._paused) {
            this.animationStarted = false;
            if (this._pausedDelay === null) {
                this._pausedDelay = delay;
            }
            return true;
        }

        if (this._localDelayOffset === null) {
            this._localDelayOffset = delay;
            this._pausedDelay = null;
        } else if (this._pausedDelay !== null) {
            this._localDelayOffset += delay - this._pausedDelay;
            this._pausedDelay = null;
        }

        if (this._weight === 0) { // We consider that an animation with a weight === 0 is "actively" paused
            return true;
        }

        // Animating
        var running = false;
        var runtimeAnimations = this._runtimeAnimations;
        var index: number;

        for (index = 0; index < runtimeAnimations.length; index++) {
            var animation = runtimeAnimations[index];
            var isRunning = animation.animate(delay - this._localDelayOffset, this.fromFrame,
                this.toFrame, this.loopAnimation, this._speedRatio, this._weight
            );
            running = running || isRunning;
        }

        this.animationStarted = running;

        if (!running) {
            if (this.disposeOnEnd) {
                // Remove from active animatables
                index = this._scene._activeAnimatables.indexOf(this);
                this._scene._activeAnimatables.splice(index, 1);

                // Dispose all runtime animations
                for (index = 0; index < runtimeAnimations.length; index++) {
                    runtimeAnimations[index].dispose();
                }
            }

            this._raiseOnAnimationEnd();

            if (this.disposeOnEnd) {
                this.onAnimationEnd = null;
                this.onAnimationLoop = null;
                this.onAnimationLoopObservable.clear();
                this.onAnimationEndObservable.clear();
            }
        }

        return running;
    }
}

declare module "../scene" {
    export interface Scene {
        /** @hidden */
        _registerTargetForLateAnimationBinding(runtimeAnimation: RuntimeAnimation, originalValue: any): void;

        /** @hidden */
        _processLateAnimationBindingsForMatrices(holder: {
            totalWeight: number,
            totalAdditiveWeight: number,
            animations: RuntimeAnimation[],
            additiveAnimations: RuntimeAnimation[],
            originalValue: Matrix
        }): any;

        /** @hidden */
        _processLateAnimationBindingsForQuaternions(holder: {
            totalWeight: number,
            totalAdditiveWeight: number,
            animations: RuntimeAnimation[],
            additiveAnimations: RuntimeAnimation[],
            originalValue: Quaternion
        }, refQuaternion: Quaternion): Quaternion;

        /** @hidden */
        _processLateAnimationBindings(): void;

        /**
         * Will start the animation sequence of a given target
         * @param target defines the target
         * @param from defines from which frame should animation start
         * @param to defines until which frame should animation run.
         * @param weight defines the weight to apply to the animation (1.0 by default)
         * @param loop defines if the animation loops
         * @param speedRatio defines the speed in which to run the animation (1.0 by default)
         * @param onAnimationEnd defines the function to be executed when the animation ends
         * @param animatable defines an animatable object. If not provided a new one will be created from the given params
         * @param targetMask defines if the target should be animated if animations are present (this is called recursively on descendant animatables regardless of return value)
         * @param onAnimationLoop defines the callback to call when an animation loops
         * @param isAdditive defines whether the animation should be evaluated additively (false by default)
         * @returns the animatable object created for this animation
         */
        beginWeightedAnimation(target: any, from: number, to: number, weight: number, loop?: boolean, speedRatio?: number,
            onAnimationEnd?: () => void, animatable?: Animatable, targetMask?: (target: any) => boolean, onAnimationLoop?: () => void, isAdditive?: boolean): Animatable;

        /**
         * Will start the animation sequence of a given target
         * @param target defines the target
         * @param from defines from which frame should animation start
         * @param to defines until which frame should animation run.
         * @param loop defines if the animation loops
         * @param speedRatio defines the speed in which to run the animation (1.0 by default)
         * @param onAnimationEnd defines the function to be executed when the animation ends
         * @param animatable defines an animatable object. If not provided a new one will be created from the given params
         * @param stopCurrent defines if the current animations must be stopped first (true by default)
         * @param targetMask defines if the target should be animate if animations are present (this is called recursively on descendant animatables regardless of return value)
         * @param onAnimationLoop defines the callback to call when an animation loops
         * @param isAdditive defines whether the animation should be evaluated additively (false by default)
         * @returns the animatable object created for this animation
         */
        beginAnimation(target: any, from: number, to: number, loop?: boolean, speedRatio?: number,
            onAnimationEnd?: () => void, animatable?: Animatable, stopCurrent?: boolean,
            targetMask?: (target: any) => boolean, onAnimationLoop?: () => void, isAdditive?: boolean): Animatable;

        /**
         * Will start the animation sequence of a given target and its hierarchy
         * @param target defines the target
         * @param directDescendantsOnly if true only direct descendants will be used, if false direct and also indirect (children of children, an so on in a recursive manner) descendants will be used.
         * @param from defines from which frame should animation start
         * @param to defines until which frame should animation run.
         * @param loop defines if the animation loops
         * @param speedRatio defines the speed in which to run the animation (1.0 by default)
         * @param onAnimationEnd defines the function to be executed when the animation ends
         * @param animatable defines an animatable object. If not provided a new one will be created from the given params
         * @param stopCurrent defines if the current animations must be stopped first (true by default)
         * @param targetMask defines if the target should be animated if animations are present (this is called recursively on descendant animatables regardless of return value)
         * @param onAnimationLoop defines the callback to call when an animation loops
         * @param isAdditive defines whether the animation should be evaluated additively (false by default)
         * @returns the list of created animatables
         */
        beginHierarchyAnimation(target: any, directDescendantsOnly: boolean, from: number, to: number, loop?: boolean, speedRatio?: number,
            onAnimationEnd?: () => void, animatable?: Animatable, stopCurrent?: boolean,
            targetMask?: (target: any) => boolean, onAnimationLoop?: () => void, isAdditive?: boolean): Animatable[];

        /**
         * Begin a new animation on a given node
         * @param target defines the target where the animation will take place
         * @param animations defines the list of animations to start
         * @param from defines the initial value
         * @param to defines the final value
         * @param loop defines if you want animation to loop (off by default)
         * @param speedRatio defines the speed ratio to apply to all animations
         * @param onAnimationEnd defines the callback to call when an animation ends (will be called once per node)
         * @param onAnimationLoop defines the callback to call when an animation loops
         * @param isAdditive defines whether the animation should be evaluated additively (false by default)
         * @returns the list of created animatables
         */
        beginDirectAnimation(target: any, animations: Animation[], from: number, to: number, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void, onAnimationLoop?: () => void, isAdditive?: boolean): Animatable;

        /**
         * Begin a new animation on a given node and its hierarchy
         * @param target defines the root node where the animation will take place
         * @param directDescendantsOnly if true only direct descendants will be used, if false direct and also indirect (children of children, an so on in a recursive manner) descendants will be used.
         * @param animations defines the list of animations to start
         * @param from defines the initial value
         * @param to defines the final value
         * @param loop defines if you want animation to loop (off by default)
         * @param speedRatio defines the speed ratio to apply to all animations
         * @param onAnimationEnd defines the callback to call when an animation ends (will be called once per node)
         * @param onAnimationLoop defines the callback to call when an animation loops
         * @param isAdditive defines whether the animation should be evaluated additively (false by default)
         * @returns the list of animatables created for all nodes
         */
        beginDirectHierarchyAnimation(target: Node, directDescendantsOnly: boolean, animations: Animation[], from: number, to: number, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void, onAnimationLoop?: () => void, isAdditive?: boolean): Animatable[];

        /**
         * Gets the animatable associated with a specific target
         * @param target defines the target of the animatable
         * @returns the required animatable if found
         */
        getAnimatableByTarget(target: any): Nullable<Animatable>;

        /**
         * Gets all animatables associated with a given target
         * @param target defines the target to look animatables for
         * @returns an array of Animatables
         */
        getAllAnimatablesByTarget(target: any): Array<Animatable>;

        /**
        * Stops and removes all animations that have been applied to the scene
        */
        stopAllAnimations(): void;

        /**
         * Gets the current delta time used by animation engine
         */
        deltaTime: number;
    }
}

Scene.prototype._animate = function(): void {
    if (!this.animationsEnabled) {
        return;
    }

    // Getting time
    var now = PrecisionDate.Now;
    if (!this._animationTimeLast) {
        if (this._pendingData.length > 0) {
            return;
        }
        this._animationTimeLast = now;
    }

    this.deltaTime = this.useConstantAnimationDeltaTime ? 16.0 : (now - this._animationTimeLast) * this.animationTimeScale;
    this._animationTimeLast = now;

    const animatables = this._activeAnimatables;
    if (animatables.length === 0) {
        return;
    }

    this._animationTime += this.deltaTime;
    const animationTime = this._animationTime;

    for (let index = 0; index < animatables.length; index++) {
        let animatable = animatables[index];

        if (!animatable._animate(animationTime) && animatable.disposeOnEnd) {
            index--; // Array was updated
        }
    }

    // Late animation bindings
    this._processLateAnimationBindings();
};

Scene.prototype.beginWeightedAnimation = function(target: any, from: number, to: number, weight = 1.0, loop?: boolean, speedRatio: number = 1.0,
    onAnimationEnd?: () => void, animatable?: Animatable, targetMask?: (target: any) => boolean, onAnimationLoop?: () => void, isAdditive = false): Animatable {

    let returnedAnimatable = this.beginAnimation(target, from, to, loop, speedRatio, onAnimationEnd, animatable, false, targetMask, onAnimationLoop, isAdditive);
    returnedAnimatable.weight = weight;

    return returnedAnimatable;
};

Scene.prototype.beginAnimation = function(target: any, from: number, to: number, loop?: boolean, speedRatio: number = 1.0,
    onAnimationEnd?: () => void, animatable?: Animatable, stopCurrent = true,
    targetMask?: (target: any) => boolean, onAnimationLoop?: () => void, isAdditive = false): Animatable {

    if (from > to && speedRatio > 0) {
        speedRatio *= -1;
    }

    if (stopCurrent) {
        this.stopAnimation(target, undefined, targetMask);
    }

    if (!animatable) {
        animatable = new Animatable(this, target, from, to, loop, speedRatio, onAnimationEnd, undefined, onAnimationLoop, isAdditive);
    }

    const shouldRunTargetAnimations = targetMask ? targetMask(target) : true;
    // Local animations
    if (target.animations && shouldRunTargetAnimations) {
        animatable.appendAnimations(target, target.animations);
    }

    // Children animations
    if (target.getAnimatables) {
        var animatables = target.getAnimatables();
        for (var index = 0; index < animatables.length; index++) {
            this.beginAnimation(animatables[index], from, to, loop, speedRatio, onAnimationEnd, animatable, stopCurrent, targetMask, onAnimationLoop);
        }
    }

    animatable.reset();

    return animatable;
};

Scene.prototype.beginHierarchyAnimation = function(target: any, directDescendantsOnly: boolean, from: number, to: number, loop?: boolean, speedRatio: number = 1.0,
    onAnimationEnd?: () => void, animatable?: Animatable, stopCurrent = true,
    targetMask?: (target: any) => boolean, onAnimationLoop?: () => void, isAdditive = false): Animatable[] {

    let children = target.getDescendants(directDescendantsOnly);

    let result = [];
    result.push(this.beginAnimation(target, from, to, loop, speedRatio, onAnimationEnd, animatable, stopCurrent, targetMask, undefined, isAdditive));
    for (var child of children) {
        result.push(this.beginAnimation(child, from, to, loop, speedRatio, onAnimationEnd, animatable, stopCurrent, targetMask, undefined, isAdditive));
    }

    return result;
};

Scene.prototype.beginDirectAnimation = function(target: any, animations: Animation[], from: number, to: number, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void, onAnimationLoop?: () => void, isAdditive = false): Animatable {
    if (speedRatio === undefined) {
        speedRatio = 1.0;
    }

    if (from > to && speedRatio > 0) {
        speedRatio *= -1;
    }

    var animatable = new Animatable(this, target, from, to, loop, speedRatio, onAnimationEnd, animations, onAnimationLoop, isAdditive);

    return animatable;
};

Scene.prototype.beginDirectHierarchyAnimation = function(target: Node, directDescendantsOnly: boolean, animations: Animation[], from: number, to: number, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void, onAnimationLoop?: () => void, isAdditive = false): Animatable[] {
    let children = target.getDescendants(directDescendantsOnly);

    let result = [];
    result.push(this.beginDirectAnimation(target, animations, from, to, loop, speedRatio, onAnimationEnd, onAnimationLoop, isAdditive));
    for (var child of children) {
        result.push(this.beginDirectAnimation(child, animations, from, to, loop, speedRatio, onAnimationEnd, onAnimationLoop, isAdditive));
    }

    return result;
};

Scene.prototype.getAnimatableByTarget = function(target: any): Nullable<Animatable> {
    for (var index = 0; index < this._activeAnimatables.length; index++) {
        if (this._activeAnimatables[index].target === target) {
            return this._activeAnimatables[index];
        }
    }

    return null;
};

Scene.prototype.getAllAnimatablesByTarget = function(target: any): Array<Animatable> {
    let result = [];
    for (var index = 0; index < this._activeAnimatables.length; index++) {
        if (this._activeAnimatables[index].target === target) {
            result.push(this._activeAnimatables[index]);
        }
    }

    return result;
};

/**
 * Will stop the animation of the given target
 * @param target - the target
 * @param animationName - the name of the animation to stop (all animations will be stopped if both this and targetMask are empty)
 * @param targetMask - a function that determines if the animation should be stopped based on its target (all animations will be stopped if both this and animationName are empty)
 */
Scene.prototype.stopAnimation = function(target: any, animationName?: string, targetMask?: (target: any) => boolean): void {
    var animatables = this.getAllAnimatablesByTarget(target);

    for (var animatable of animatables) {
        animatable.stop(animationName, targetMask);
    }
};

/**
 * Stops and removes all animations that have been applied to the scene
 */
Scene.prototype.stopAllAnimations = function(): void {
    if (this._activeAnimatables) {
        for (let i = 0; i < this._activeAnimatables.length; i++) {
            this._activeAnimatables[i].stop();
        }
        this._activeAnimatables = [];
    }

    for (var group of this.animationGroups) {
        group.stop();
    }
};

Scene.prototype._registerTargetForLateAnimationBinding = function(runtimeAnimation: RuntimeAnimation, originalValue: any): void {
    let target = runtimeAnimation.target;
    this._registeredForLateAnimationBindings.pushNoDuplicate(target);

    if (!target._lateAnimationHolders) {
        target._lateAnimationHolders = {};
    }

    if (!target._lateAnimationHolders[runtimeAnimation.targetPath]) {
        target._lateAnimationHolders[runtimeAnimation.targetPath] = {
            totalWeight: 0,
            totalAdditiveWeight: 0,
            animations: [],
            additiveAnimations: [],
            originalValue: originalValue
        };
    }

    if (runtimeAnimation.isAdditive) {
        target._lateAnimationHolders[runtimeAnimation.targetPath].additiveAnimations.push(runtimeAnimation);
        target._lateAnimationHolders[runtimeAnimation.targetPath].totalAdditiveWeight += runtimeAnimation.weight;
    } else {
        target._lateAnimationHolders[runtimeAnimation.targetPath].animations.push(runtimeAnimation);
        target._lateAnimationHolders[runtimeAnimation.targetPath].totalWeight += runtimeAnimation.weight;
    }
};

Scene.prototype._processLateAnimationBindingsForMatrices = function(holder: {
    totalWeight: number,
    totalAdditiveWeight: number,
    animations: RuntimeAnimation[],
    additiveAnimations: RuntimeAnimation[],
    originalValue: Matrix
}): any {
    if (holder.totalWeight === 0 && holder.totalAdditiveWeight === 0) {
        return holder.originalValue;
    }

    let normalizer = 1.0;
    let finalPosition = TmpVectors.Vector3[0];
    let finalScaling = TmpVectors.Vector3[1];
    let finalQuaternion = TmpVectors.Quaternion[0];
    let startIndex = 0;
    let originalAnimation = holder.animations[0];
    let originalValue = holder.originalValue;

    var scale = 1;
    let skipOverride = false;
    if (holder.totalWeight < 1.0) {
        // We need to mix the original value in
        scale = 1.0 - holder.totalWeight;
        originalValue.decompose(finalScaling, finalQuaternion, finalPosition);
    } else {
        startIndex = 1;
        // We need to normalize the weights
        normalizer = holder.totalWeight;
        scale = originalAnimation.weight / normalizer;
        if (scale == 1) {
            if (holder.totalAdditiveWeight) {
                skipOverride = true;
            } else {
                return originalAnimation.currentValue;
            }
        }

        originalAnimation.currentValue.decompose(finalScaling, finalQuaternion, finalPosition);
    }

    // Add up the override animations
    if (!skipOverride) {
        finalScaling.scaleInPlace(scale);
        finalPosition.scaleInPlace(scale);
        finalQuaternion.scaleInPlace(scale);

        for (var animIndex = startIndex; animIndex < holder.animations.length; animIndex++) {
            var runtimeAnimation = holder.animations[animIndex];
            if (runtimeAnimation.weight === 0) {
                continue;
            }

            var scale = runtimeAnimation.weight / normalizer;
            let currentPosition = TmpVectors.Vector3[2];
            let currentScaling = TmpVectors.Vector3[3];
            let currentQuaternion = TmpVectors.Quaternion[1];

            runtimeAnimation.currentValue.decompose(currentScaling, currentQuaternion, currentPosition);
            currentScaling.scaleAndAddToRef(scale, finalScaling);
            currentQuaternion.scaleAndAddToRef(scale, finalQuaternion);
            currentPosition.scaleAndAddToRef(scale, finalPosition);
        }
    }

    // Add up the additive animations
    for (let animIndex = 0; animIndex < holder.additiveAnimations.length; animIndex++) {
        var runtimeAnimation = holder.additiveAnimations[animIndex];
        if (runtimeAnimation.weight === 0) {
            continue;
        }

        let currentPosition = TmpVectors.Vector3[2];
        let currentScaling = TmpVectors.Vector3[3];
        let currentQuaternion = TmpVectors.Quaternion[1];

        runtimeAnimation.currentValue.decompose(currentScaling, currentQuaternion, currentPosition);
        currentScaling.multiplyToRef(finalScaling, currentScaling);
        Vector3.LerpToRef(finalScaling, currentScaling, runtimeAnimation.weight, finalScaling);
        finalQuaternion.multiplyToRef(currentQuaternion, currentQuaternion);
        Quaternion.SlerpToRef(finalQuaternion, currentQuaternion, runtimeAnimation.weight, finalQuaternion);
        currentPosition.scaleAndAddToRef(runtimeAnimation.weight, finalPosition);

    }

    let workValue = originalAnimation ? originalAnimation._animationState.workValue : TmpVectors.Matrix[0].clone();
    Matrix.ComposeToRef(finalScaling, finalQuaternion, finalPosition, workValue);
    return workValue;
};

Scene.prototype._processLateAnimationBindingsForQuaternions = function(holder: {
    totalWeight: number,
    totalAdditiveWeight: number,
    animations: RuntimeAnimation[],
    additiveAnimations: RuntimeAnimation[],
    originalValue: Quaternion
}, refQuaternion: Quaternion): Quaternion {
    if (holder.totalWeight === 0 && holder.totalAdditiveWeight === 0) {
        return refQuaternion;
    }

    let originalAnimation = holder.animations[0];
    let originalValue = holder.originalValue;
    let cumulativeQuaternion = refQuaternion;

    if (holder.totalWeight === 0 && holder.totalAdditiveWeight > 0) {
        cumulativeQuaternion.copyFrom(originalValue);
    } else if (holder.animations.length === 1) {
        Quaternion.SlerpToRef(originalValue, originalAnimation.currentValue, Math.min(1.0, holder.totalWeight), cumulativeQuaternion);

        if (holder.totalAdditiveWeight === 0) {
            return cumulativeQuaternion;
        }
    } else if (holder.animations.length > 1) {
        // Add up the override animations
        let normalizer = 1.0;
        let quaternions: Array<Quaternion>;
        let weights: Array<number>;

        if (holder.totalWeight < 1.0) {
            let scale = 1.0 - holder.totalWeight;

            quaternions = [];
            weights = [];

            quaternions.push(originalValue);
            weights.push(scale);
        } else {
            if (holder.animations.length === 2) { // Slerp as soon as we can
                Quaternion.SlerpToRef(holder.animations[0].currentValue, holder.animations[1].currentValue, holder.animations[1].weight / holder.totalWeight, refQuaternion);

                if (holder.totalAdditiveWeight === 0) {
                    return refQuaternion;
                }
            }

            quaternions = [];
            weights = [];
            normalizer = holder.totalWeight;
        }

        for (var animIndex = 0; animIndex < holder.animations.length; animIndex++) {
            let runtimeAnimation = holder.animations[animIndex];
            quaternions.push(runtimeAnimation.currentValue);
            weights.push(runtimeAnimation.weight / normalizer);
        }

        // https://gamedev.stackexchange.com/questions/62354/method-for-interpolation-between-3-quaternions

        let cumulativeAmount = 0;
        for (var index = 0; index < quaternions.length;) {
            if (!index) {
                Quaternion.SlerpToRef(quaternions[index], quaternions[index + 1], weights[index + 1] / (weights[index] + weights[index + 1]), refQuaternion);
                cumulativeQuaternion = refQuaternion;
                cumulativeAmount = weights[index] + weights[index + 1];
                index += 2;
                continue;
            }
            cumulativeAmount += weights[index];
            Quaternion.SlerpToRef(cumulativeQuaternion, quaternions[index], weights[index] / cumulativeAmount, cumulativeQuaternion);
            index++;
        }
    }

    // Add up the additive animations
    for (let animIndex = 0; animIndex < holder.additiveAnimations.length; animIndex++) {
        let runtimeAnimation = holder.additiveAnimations[animIndex];
        if (runtimeAnimation.weight === 0) {
            continue;
        }

        cumulativeQuaternion.multiplyToRef(runtimeAnimation.currentValue, TmpVectors.Quaternion[0]);
        Quaternion.SlerpToRef(cumulativeQuaternion, TmpVectors.Quaternion[0], runtimeAnimation.weight, cumulativeQuaternion);
    }

    return cumulativeQuaternion!;
};

Scene.prototype._processLateAnimationBindings = function(): void {
    if (!this._registeredForLateAnimationBindings.length) {
        return;
    }
    for (var index = 0; index < this._registeredForLateAnimationBindings.length; index++) {
        var target = this._registeredForLateAnimationBindings.data[index];

        for (var path in target._lateAnimationHolders) {
            var holder = target._lateAnimationHolders[path];
            let originalAnimation: RuntimeAnimation = holder.animations[0];
            let originalValue = holder.originalValue;

            let matrixDecomposeMode = Animation.AllowMatrixDecomposeForInterpolation && originalValue.m; // ie. data is matrix

            let finalValue: any = target[path];
            if (matrixDecomposeMode) {
                finalValue = this._processLateAnimationBindingsForMatrices(holder);
            } else {
                let quaternionMode = originalValue.w !== undefined;
                if (quaternionMode) {
                    finalValue = this._processLateAnimationBindingsForQuaternions(holder, finalValue || Quaternion.Identity());
                } else {

                    let startIndex = 0;
                    let normalizer = 1.0;

                    if (holder.totalWeight < 1.0) {
                        // We need to mix the original value in
                        if (originalAnimation && originalValue.scale) {
                            finalValue = originalValue.scale(1.0 - holder.totalWeight);
                        } else if (originalAnimation) {
                            finalValue = originalValue * (1.0 - holder.totalWeight);
                        } else if (originalValue.clone) {
                            finalValue = originalValue.clone();
                        } else {
                            finalValue = originalValue;
                        }
                    } else if (originalAnimation) {
                        // We need to normalize the weights
                        normalizer = holder.totalWeight;
                        let scale = originalAnimation.weight / normalizer;
                        if (scale !== 1) {
                            if (originalAnimation.currentValue.scale) {
                                finalValue = originalAnimation.currentValue.scale(scale);
                            } else {
                                finalValue = originalAnimation.currentValue * scale;
                            }
                        } else {
                            finalValue = originalAnimation.currentValue;
                        }

                        startIndex = 1;
                    }

                    // Add up the override animations
                    for (var animIndex = startIndex; animIndex < holder.animations.length; animIndex++) {
                        var runtimeAnimation = holder.animations[animIndex];
                        var scale = runtimeAnimation.weight / normalizer;

                        if (!scale) {
                            continue;
                        } else if (runtimeAnimation.currentValue.scaleAndAddToRef) {
                            runtimeAnimation.currentValue.scaleAndAddToRef(scale, finalValue);
                        } else {
                            finalValue += runtimeAnimation.currentValue * scale;
                        }
                    }

                    // Add up the additive animations
                    for (let animIndex = 0; animIndex < holder.additiveAnimations.length; animIndex++) {
                        var runtimeAnimation = holder.additiveAnimations[animIndex];
                        var scale: number = runtimeAnimation.weight;

                        if (!scale) {
                            continue;
                        } else if (runtimeAnimation.currentValue.scaleAndAddToRef) {
                            runtimeAnimation.currentValue.scaleAndAddToRef(scale, finalValue);
                        } else {
                            finalValue += runtimeAnimation.currentValue * scale;
                        }
                    }
                }
            }
            target[path] = finalValue;
        }

        target._lateAnimationHolders = {};
    }
    this._registeredForLateAnimationBindings.reset();
};

declare module "../Bones/bone" {
    export interface Bone {
        /**
         * Copy an animation range from another bone
         * @param source defines the source bone
         * @param rangeName defines the range name to copy
         * @param frameOffset defines the frame offset
         * @param rescaleAsRequired defines if rescaling must be applied if required
         * @param skelDimensionsRatio defines the scaling ratio
         * @returns true if operation was successful
         */
        copyAnimationRange(source: Bone, rangeName: string, frameOffset: number, rescaleAsRequired: boolean, skelDimensionsRatio: Nullable<Vector3>): boolean;
    }
}

Bone.prototype.copyAnimationRange = function(source: Bone, rangeName: string, frameOffset: number, rescaleAsRequired = false, skelDimensionsRatio: Nullable<Vector3> = null): boolean {
    // all animation may be coming from a library skeleton, so may need to create animation
    if (this.animations.length === 0) {
        this.animations.push(new Animation(this.name, "_matrix", source.animations[0].framePerSecond, Animation.ANIMATIONTYPE_MATRIX, 0));
        this.animations[0].setKeys([]);
    }

    // get animation info / verify there is such a range from the source bone
    var sourceRange = source.animations[0].getRange(rangeName);
    if (!sourceRange) {
        return false;
    }
    var from = sourceRange.from;
    var to = sourceRange.to;
    var sourceKeys = source.animations[0].getKeys();

    // rescaling prep
    var sourceBoneLength = source.length;
    var sourceParent = source.getParent();
    var parent = this.getParent();
    var parentScalingReqd = rescaleAsRequired && sourceParent && sourceBoneLength && this.length && sourceBoneLength !== this.length;
    var parentRatio = parentScalingReqd && parent && sourceParent ? parent.length / sourceParent.length : 1;

    var dimensionsScalingReqd = rescaleAsRequired && !parent && skelDimensionsRatio && (skelDimensionsRatio.x !== 1 || skelDimensionsRatio.y !== 1 || skelDimensionsRatio.z !== 1);

    var destKeys = this.animations[0].getKeys();

    // loop vars declaration
    var orig: { frame: number, value: Matrix };
    var origTranslation: Vector3;
    var mat: Matrix;

    for (var key = 0, nKeys = sourceKeys.length; key < nKeys; key++) {
        orig = sourceKeys[key];
        if (orig.frame >= from && orig.frame <= to) {
            if (rescaleAsRequired) {
                mat = orig.value.clone();

                // scale based on parent ratio, when bone has parent
                if (parentScalingReqd) {
                    origTranslation = mat.getTranslation();
                    mat.setTranslation(origTranslation.scaleInPlace(parentRatio));

                    // scale based on skeleton dimension ratio when root bone, and value is passed
                } else if (dimensionsScalingReqd && skelDimensionsRatio) {
                    origTranslation = mat.getTranslation();
                    mat.setTranslation(origTranslation.multiplyInPlace(skelDimensionsRatio));

                    // use original when root bone, and no data for skelDimensionsRatio
                } else {
                    mat = orig.value;
                }
            } else {
                mat = orig.value;
            }
            destKeys.push({ frame: orig.frame + frameOffset, value: mat });
        }
    }
    this.animations[0].createRange(rangeName, from + frameOffset, to + frameOffset);
    return true;
};