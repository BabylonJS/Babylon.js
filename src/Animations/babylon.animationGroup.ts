module BABYLON {
    /**
     * This class defines the direct association between an animation and a target
     */
    export class TargetedAnimation {
        public animation: Animation;
        public target: any;
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
        private _speedRatio = 1;

        public onAnimationEndObservable = new Observable<TargetedAnimation>();

        /**
         * Define if the animations are started
         */
        public get isStarted(): boolean {
            return this._isStarted;
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

            for (var index = 0; index < this._animatables.length; index++) {
                let animatable = this._animatables[index];
                animatable.speedRatio = this._speedRatio;
            }
        }

        /**
         * Gets the targeted animations for this animation group
         */
        public get targetedAnimations(): Array<TargetedAnimation> {
            return this._targetedAnimations;
        }

        public constructor(public name: string, scene: Nullable<Scene> = null) {
            this._scene = scene || Engine.LastCreatedScene!;

            this._scene.animationGroups.push(this);
        }

        /**
         * Add an animation (with its target) in the group
         * @param animation defines the animation we want to add
         * @param target defines the target of the animation
         * @returns the {BABYLON.TargetedAnimation} object
         */
        public addTargetedAnimation(animation: Animation, target: any): TargetedAnimation {
            let targetedAnimation = {
                animation: animation,
                target: target
            };

            let keys = animation.getKeys();
            if (this._from > keys[0].frame) {
                this._from = keys[0].frame;
            }

            if (this._to < keys[keys.length - 1].frame) {
                this._to = keys[keys.length - 1].frame;
            }

            this._targetedAnimations.push(targetedAnimation);

            return targetedAnimation;
        }

        /**
         * This function will normalize every animation in the group to make sure they all go from beginFrame to endFrame
         * It can add constant keys at begin or end
         * @param beginFrame defines the new begin frame for all animations. It can't be bigger than the smallest begin frame of all animations
         * @param endFrame defines the new end frame for all animations. It can't be smaller than the largest end frame of all animations
         */
        public normalize(beginFrame = -Number.MAX_VALUE, endFrame = Number.MAX_VALUE): AnimationGroup {
            beginFrame = Math.max(beginFrame, this._from);
            endFrame = Math.min(endFrame, this._to);

            for (var index = 0; index < this._targetedAnimations.length; index++) {
                let targetedAnimation = this._targetedAnimations[index];
                let keys = targetedAnimation.animation.getKeys();
                let startKey = keys[0];
                let endKey = keys[keys.length - 1];

                if (startKey.frame > beginFrame) {
                    let newKey: IAnimationKey = {
                        frame: beginFrame,
                        value: startKey.value,
                        inTangent: startKey.inTangent,
                        outTangent: startKey.outTangent,
                        interpolation: startKey.interpolation
                    }
                    keys.splice(0, 0, newKey);
                }

                if (endKey.frame < endFrame) {
                    let newKey: IAnimationKey = {
                        frame: endFrame,
                        value: endKey.value,
                        inTangent: endKey.outTangent,
                        outTangent: endKey.outTangent,
                        interpolation: endKey.interpolation
                    }
                    keys.push(newKey);
                }
            }

            return this;
        }

        /**
         * Start all animations on given targets
         * @param loop defines if animations must loop
         * @param speedRatio defines the ratio to apply to animation speed (1 by default)
         */
        public start(loop = false, speedRatio = 1): AnimationGroup {
            if (this._isStarted || this._targetedAnimations.length === 0) {
                return this;
            }

            for (var index = 0; index < this._targetedAnimations.length; index++) {
                let targetedAnimation = this._targetedAnimations[index];
                this._animatables.push(this._scene.beginDirectAnimation(targetedAnimation.target, [targetedAnimation.animation], this._from, this._to, loop, speedRatio, () => {
                    this.onAnimationEndObservable.notifyObservers(targetedAnimation);
                }));
            }

            this._speedRatio = speedRatio;

            this._isStarted = true;

            return this;
        }

        /**
         * Pause all animations
         */
        public pause(): AnimationGroup {
            if (!this._isStarted) {
                return this;
            }

            for (var index = 0; index < this._animatables.length; index++) {
                let animatable = this._animatables[index];
                animatable.pause();
            }

            return this;
        }

        /**
         * Play all animations to initial state
         * This function will start() the animations if they were not started or will restart() them if they were paused
         * @param loop defines if animations must loop
         */
        public play(loop?: boolean): AnimationGroup {
            if (this.isStarted) {
                if (loop !== undefined) {
                    for (var index = 0; index < this._animatables.length; index++) {
                        let animatable = this._animatables[index];
                        animatable.loopAnimation = loop;
                    }
                }
                this.restart();
            } else {
                this.start(loop, this._speedRatio);
            }

            return this;
        }

        /**
         * Reset all animations to initial state
         */
        public reset(): AnimationGroup {
            if (!this._isStarted) {
                return this;
            }

            for (var index = 0; index < this._animatables.length; index++) {
                let animatable = this._animatables[index];
                animatable.reset();
            }

            return this;
        }

        /**
         * Restart animations from key 0
         */
        public restart(): AnimationGroup {
            if (!this._isStarted) {
                return this;
            }

            for (var index = 0; index < this._animatables.length; index++) {
                let animatable = this._animatables[index];
                animatable.restart();
            }

            return this;
        }

        /**
         * Stop all animations
         */
        public stop(): AnimationGroup {
            if (!this._isStarted) {
                return this;
            }

            for (var index = 0; index < this._animatables.length; index++) {
                let animatable = this._animatables[index];
                animatable.stop();
            }

            this._isStarted = false;

            return this;
        }

        /**
         * Dispose all associated resources
         */
        public dispose(): void {
            this._targetedAnimations = [];
            this._animatables = [];

            var index = this._scene.animationGroups.indexOf(this);

            if (index > -1) {
                this._scene.animationGroups.splice(index, 1);
            }
        }
    }
}