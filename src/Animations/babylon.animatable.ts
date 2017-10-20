module BABYLON {
    export class Animatable {
        private _localDelayOffset: Nullable<number> = null;
        private _pausedDelay: Nullable<number> = null;
        private _runtimeAnimations = new Array<RuntimeAnimation>();
        private _paused = false;
        private _scene: Scene;
        private _speedRatio = 1;

        public animationStarted = false;

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
        public getAnimations(): RuntimeAnimation[] {
            return this._runtimeAnimations;
        }

        public appendAnimations(target: any, animations: Animation[]): void {
            for (var index = 0; index < animations.length; index++) {
                var animation = animations[index];

                this._runtimeAnimations.push(new RuntimeAnimation(target, animation));
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
                var delay = adjustTime * 1000 / fps;
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
            } else if (this._pausedDelay !== null) {
                this._localDelayOffset += delay - this._pausedDelay;
                this._pausedDelay = null;
            }

            // Animating
            var running = false;
            var runtimeAnimations = this._runtimeAnimations;
            var index: number;

            for (index = 0; index < runtimeAnimations.length; index++) {
                var animation = runtimeAnimations[index];
                var isRunning = animation.animate(delay - this._localDelayOffset, this.fromFrame, this.toFrame, this.loopAnimation, this._speedRatio);
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
