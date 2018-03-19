﻿module BABYLON {
    export class Animatable {
        private _localDelayOffset: Nullable<number> = null;
        private _pausedDelay: Nullable<number> = null;
        private _runtimeAnimations = new Array<RuntimeAnimation>();
        private _paused = false;
        private _scene: Scene;
        private _speedRatio = 1;
        private _weight = -1.0;
        private _syncRoot: Animatable;

        public animationStarted = false;

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


        constructor(scene: Scene, public target: any, public fromFrame: number = 0, public toFrame: number = 100, public loopAnimation: boolean = false, speedRatio: number = 1.0, public onAnimationEnd?: Nullable<() => void>, animations?: any) {
            if (animations) {
                this.appendAnimations(target, animations);
            }

            this._speedRatio = speedRatio;
            this._scene = scene;
            scene._activeAnimatables.push(this);
        }

        // Methods
        /**
         * Synchronize and normalize current Animatable with a source Animatable.
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

        public getAnimations(): RuntimeAnimation[] {
            return this._runtimeAnimations;
        }

        public appendAnimations(target: any, animations: Animation[]): void {
            for (var index = 0; index < animations.length; index++) {
                var animation = animations[index];

                this._runtimeAnimations.push(new RuntimeAnimation(target, animation, this._scene, this));
            }
        }

        public getAnimationByTargetProperty(property: string): Nullable<Animation> {
            var runtimeAnimations = this._runtimeAnimations;

            for (var index = 0; index < runtimeAnimations.length; index++) {
                if (runtimeAnimations[index].animation.targetProperty === property) {
                    return runtimeAnimations[index].animation;
                }
            }

            return null;
        }

        public getRuntimeAnimationByTargetProperty(property: string): Nullable<RuntimeAnimation> {
            var runtimeAnimations = this._runtimeAnimations;

            for (var index = 0; index < runtimeAnimations.length; index++) {
                if (runtimeAnimations[index].animation.targetProperty === property) {
                    return runtimeAnimations[index];
                }
            }

            return null;
        }

        public reset(): void {
            var runtimeAnimations = this._runtimeAnimations;

            for (var index = 0; index < runtimeAnimations.length; index++) {
                runtimeAnimations[index].reset();
            }

            // Reset to original value
            for (index = 0; index < runtimeAnimations.length; index++) {
                var animation = runtimeAnimations[index];
                animation.animate(0, this.fromFrame, this.toFrame, false, this._speedRatio);
            }

            this._localDelayOffset = null;
            this._pausedDelay = null;
        }

        public enableBlending(blendingSpeed: number): void {
            var runtimeAnimations = this._runtimeAnimations;

            for (var index = 0; index < runtimeAnimations.length; index++) {
                runtimeAnimations[index].animation.enableBlending = true;
                runtimeAnimations[index].animation.blendingSpeed = blendingSpeed;
            }
        }

        public disableBlending(): void {
            var runtimeAnimations = this._runtimeAnimations;

            for (var index = 0; index < runtimeAnimations.length; index++) {
                runtimeAnimations[index].animation.enableBlending = false;
            }
        }

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

        public pause(): void {
            if (this._paused) {
                return;
            }
            this._paused = true;
        }

        public restart(): void {
            this._paused = false;
        }

        public stop(animationName?: string): void {

            if (animationName) {

                var idx = this._scene._activeAnimatables.indexOf(this);

                if (idx > -1) {

                    var runtimeAnimations = this._runtimeAnimations;

                    for (var index = runtimeAnimations.length - 1; index >= 0; index--) {
                        if (typeof animationName === "string" && runtimeAnimations[index].animation.name != animationName) {
                            continue;
                        }

                        runtimeAnimations[index].dispose();
                        runtimeAnimations.splice(index, 1);
                    }

                    if (runtimeAnimations.length == 0) {
                        this._scene._activeAnimatables.splice(idx, 1);

                        if (this.onAnimationEnd) {
                            this.onAnimationEnd();
                        }
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

                    if (this.onAnimationEnd) {
                        this.onAnimationEnd();
                    }
                }

            }
        }

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
                var isRunning = animation.animate(delay - this._localDelayOffset, this.fromFrame, this.toFrame, this.loopAnimation, this._speedRatio, this._weight);
                running = running || isRunning;
            }

            this.animationStarted = running;

            if (!running) {
                // Remove from active animatables
                index = this._scene._activeAnimatables.indexOf(this);
                this._scene._activeAnimatables.splice(index, 1);

                // Dispose all runtime animations
                for (index = 0; index < runtimeAnimations.length; index++) {
                    runtimeAnimations[index].dispose();
                }
            }

            if (!running && this.onAnimationEnd) {
                this.onAnimationEnd();
                this.onAnimationEnd = null;
            }

            return running;
        }
    }
} 
