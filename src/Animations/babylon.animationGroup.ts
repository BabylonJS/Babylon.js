module BABYLON {
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

        /**
         * This observable will notify when one animation have ended.
         */
        public onAnimationEndObservable = new Observable<TargetedAnimation>();

        /**
         * This observable will notify when all animations have ended.
         */
        public onAnimationGroupEndObservable = new Observable<AnimationGroup>();

        /**
         * This observable will notify when all animations have paused.
         */
        public onAnimationGroupPauseObservable = new Observable<AnimationGroup>();

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

        /**
         * returning the list of animatables controlled by this animation group.
         */
        public get animatables(): Array<Animatable> {
            return this._animatables;
        }

        /**
         * Instantiates a new Animation Group.
         * This helps managing several animations at once.
         * @see http://doc.babylonjs.com/how_to/group
         * @param name Defines the name of the group
         * @param scene Defines the scene the group belongs to
         */
        public constructor(
            /** The name of the animation group */
            public name: string,
            scene: Nullable<Scene> = null) {
            this._scene = scene || Engine.LastCreatedScene!;

            this._scene.animationGroups.push(this);
        }

        /**
         * Add an animation (with its target) in the group
         * @param animation defines the animation we want to add
         * @param target defines the target of the animation
         * @returns the TargetedAnimation object
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
         * @param beginFrame defines the new begin frame for all animations or the smallest begin frame of all animations if null (defaults to null)
         * @param endFrame defines the new end frame for all animations or the largest end frame of all animations if null (defaults to null)
         * @returns the animation group
         */
        public normalize(beginFrame: Nullable<number> = null, endFrame: Nullable<number> = null): AnimationGroup {
            if (beginFrame == null) { beginFrame = this._from; }
            if (endFrame == null) { endFrame = this._to; }

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
                    };
                    keys.splice(0, 0, newKey);
                }

                if (endKey.frame < endFrame) {
                    let newKey: IAnimationKey = {
                        frame: endFrame,
                        value: endKey.value,
                        inTangent: endKey.outTangent,
                        outTangent: endKey.outTangent,
                        interpolation: endKey.interpolation
                    };
                    keys.push(newKey);
                }
            }

            this._from = beginFrame;
            this._to = endFrame;

            return this;
        }

        /**
         * Start all animations on given targets
         * @param loop defines if animations must loop
         * @param speedRatio defines the ratio to apply to animation speed (1 by default)
         * @param from defines the from key (optional)
         * @param to defines the to key (optional)
         * @returns the current animation group
         */
        public start(loop = false, speedRatio = 1, from?: number, to?: number): AnimationGroup {
            if (this._isStarted || this._targetedAnimations.length === 0) {
                return this;
            }

            for (const targetedAnimation of this._targetedAnimations) {
                let animatable = this._scene.beginDirectAnimation(targetedAnimation.target, [targetedAnimation.animation], from !== undefined ? from : this._from, to !== undefined ? to : this._to, loop, speedRatio);
                animatable.onAnimationEnd = () => {
                    this.onAnimationEndObservable.notifyObservers(targetedAnimation);
                    this._checkAnimationGroupEnded(animatable);
                };
                this._animatables.push(animatable);
            }

            this._speedRatio = speedRatio;

            this._isStarted = true;

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

            for (var index = 0; index < this._animatables.length; index++) {
                let animatable = this._animatables[index];
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
                    for (var index = 0; index < this._animatables.length; index++) {
                        let animatable = this._animatables[index];
                        animatable.loopAnimation = loop;
                    }
                }
                this.restart();
            } else {
                this.stop();
                this.start(loop, this._speedRatio);
            }

            return this;
        }

        /**
         * Reset all animations to initial state
         * @returns the animation group
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
         * @returns the animation group
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
         * @returns the animation group
         */
        public stop(): AnimationGroup {
            if (!this._isStarted) {
                return this;
            }

            var list = this._animatables.slice();
            for (var index = 0; index < list.length; index++) {
                list[index].stop();
            }

            this._isStarted = false;

            return this;
        }

        /**
         * Set animation weight for all animatables
         * @param weight defines the weight to use
         * @return the animationGroup
         * @see http://doc.babylonjs.com/babylon101/animations#animation-weights
         */
        public setWeightForAllAnimatables(weight: number): AnimationGroup {
            for (var index = 0; index < this._animatables.length; index++) {
                let animatable = this._animatables[index];
                animatable.weight = weight;
            }

            return this;
        }

        /**
         * Synchronize and normalize all animatables with a source animatable
         * @param root defines the root animatable to synchronize with
         * @return the animationGroup
         * @see http://doc.babylonjs.com/babylon101/animations#animation-weights
         */
        public syncAllAnimationsWith(root: Animatable): AnimationGroup {
            for (var index = 0; index < this._animatables.length; index++) {
                let animatable = this._animatables[index];
                animatable.syncWith(root);
            }

            return this;
        }

        /**
         * Goes to a specific frame in this animation group
         * @param frame the frame number to go to
         * @return the animationGroup
         */
        public goToFrame(frame: number): AnimationGroup {
            if (!this._isStarted) {
                return this;
            }

            for (var index = 0; index < this._animatables.length; index++) {
                let animatable = this._animatables[index];
                animatable.goToFrame(frame);
            }

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

        private _checkAnimationGroupEnded(animatable: Animatable) {
            // animatable should be taken out of the array
            let idx = this._animatables.indexOf(animatable);
            if (idx > -1) {
                this._animatables.splice(idx, 1);
            }

            // all animatables were removed? animation group ended!
            if (this._animatables.length === 0) {
                this._isStarted = false;
                this.onAnimationGroupEndObservable.notifyObservers(this);
            }
        }

        // Statics
        /**
         * Returns a new AnimationGroup object parsed from the source provided.
         * @param parsedAnimationGroup defines the source
         * @param scene defines the scene that will receive the animationGroup
         * @returns a new AnimationGroup
         */
        public static Parse(parsedAnimationGroup: any, scene: Scene): AnimationGroup {
            var animationGroup = new BABYLON.AnimationGroup(parsedAnimationGroup.name, scene);
            for (var i = 0; i < parsedAnimationGroup.targetedAnimations.length; i++) {
                var targetedAnimation = parsedAnimationGroup.targetedAnimations[i];
                var animation = Animation.Parse(targetedAnimation.animation);
                var id = targetedAnimation.targetId;
                var targetNode = scene.getNodeByID(id);

                if (targetNode != null) {
                    animationGroup.addTargetedAnimation(animation, targetNode);
                }
            }

            if (parsedAnimationGroup.from !== null && parsedAnimationGroup.from !== null) {
                animationGroup.normalize(parsedAnimationGroup.from, parsedAnimationGroup.to);
            }

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
         * Creates a detailled string about the object
         * @param fullDetails defines if the output string will support multiple levels of logging within scene loading
         * @returns a string representing the object
         */
        public toString(fullDetails?: boolean): string {
            var ret = "Name: " + this.name;
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
}
