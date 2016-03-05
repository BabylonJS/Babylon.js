module BABYLON {
    export class Animatable {
        private _localDelayOffset: number;
        private _pausedDelay: number;
        private _animations = new Array<Animation>();
        private _paused = false;
        private _scene: Scene;

        public animationStarted = false;

        constructor(scene: Scene, public target, public fromFrame: number = 0, public toFrame: number = 100, public loopAnimation: boolean = false, public speedRatio: number = 1.0, public onAnimationEnd?, animations?: any) {
            if (animations) {
                this.appendAnimations(target, animations);
            }

            this._scene = scene;
            scene._activeAnimatables.push(this);
        }

        // Methods
        public getAnimations(): Animation[] {
            return this._animations;
        }

        public appendAnimations(target: any, animations: Animation[]): void {
            for (var index = 0; index < animations.length; index++) {
                var animation = animations[index];

                animation._target = target;
                this._animations.push(animation);
            }
        }

        public getAnimationByTargetProperty(property: string) {
            var animations = this._animations;

            for (var index = 0; index < animations.length; index++) {
                if (animations[index].targetProperty === property) {
                    return animations[index];
                }
            }

            return null;
        }

        public reset(): void {
            var animations = this._animations;

            for (var index = 0; index < animations.length; index++) {
                animations[index].reset();
            }

            this._localDelayOffset = null;
            this._pausedDelay = null;
        }

        public enableBlending(blendingSpeed: number): void {
            var animations = this._animations;

            for (var index = 0; index < animations.length; index++) {
                animations[index].enableBlending = true;
                animations[index].blendingSpeed = blendingSpeed;
            }
        }

        public disableBlending(): void {
            var animations = this._animations;

            for (var index = 0; index < animations.length; index++) {
                animations[index].enableBlending = false;
            }
        }

        public goToFrame(frame: number): void {
            var animations = this._animations;

            for (var index = 0; index < animations.length; index++) {
                animations[index].goToFrame(frame);
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

        public stop(): void {
            var index = this._scene._activeAnimatables.indexOf(this);

            if (index > -1) {
                this._scene._activeAnimatables.splice(index, 1);

                var animations = this._animations;
                for (var index = 0; index < animations.length; index++) {
                    animations[index].reset();
                }

                if (this.onAnimationEnd) {
                    this.onAnimationEnd();
                }
            }
        }

        public _animate(delay: number): boolean {
            if (this._paused) {
                this.animationStarted = false;
                if (!this._pausedDelay) {
                    this._pausedDelay = delay;
                }
                return true;
            }

            if (!this._localDelayOffset) {
                this._localDelayOffset = delay;
            } else if (this._pausedDelay) {
                this._localDelayOffset += delay - this._pausedDelay;
                this._pausedDelay = null;
            }

            // Animating
            var running = false;
            var animations = this._animations;
            var index: number;

            for (index = 0; index < animations.length; index++) {
                var animation = animations[index];
                var isRunning = animation.animate(delay - this._localDelayOffset, this.fromFrame, this.toFrame, this.loopAnimation, this.speedRatio);
                running = running || isRunning;
            }

            this.animationStarted = running;

            if (!running) {
                // Remove from active animatables
                index = this._scene._activeAnimatables.indexOf(this);
                this._scene._activeAnimatables.splice(index, 1);
            }

            if (!running && this.onAnimationEnd) {
                this.onAnimationEnd();
                this.onAnimationEnd = null;
            }

            return running;
        }
    }
} 