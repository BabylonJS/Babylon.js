module BABYLON {
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
        private _syncRoot: Animatable;

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
        public get syncRoot(): Animatable {
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
            public onAnimationLoop?: Nullable<() => void>) {
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

                this._runtimeAnimations.push(new RuntimeAnimation(target, animation, this._scene, this));
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
         * @see http://doc.babylonjs.com/babylon101/animations#animation-blending
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
         * @see http://doc.babylonjs.com/babylon101/animations#animation-blending
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
                var adjustTime = frame - currentFrame;
                var delay = adjustTime * 1000 / (fps * this.speedRatio);
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
                    this.toFrame, this.loopAnimation, this._speedRatio, this._weight,
                    () => {
                        this.onAnimationLoopObservable.notifyObservers(this);
                        if (this.onAnimationLoop) {
                            this.onAnimationLoop();
                        }
                    }
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
}
