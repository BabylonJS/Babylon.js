module BABYLON.Internals {
    export class Animatable {
        private _localDelayOffset: number;
        private _animations: any;

        public animationStarted = false;

        constructor(public target, public fromFrame: number = 0, public toFrame: number = 100, public loopAnimation: boolean = false, public speedRatio: number = 1.0, public onAnimationEnd?, animations?: any) {
            this._animations = animations;
        }

        // Methods
        public _animate(delay: number): boolean {
            if (!this._localDelayOffset) {
                this._localDelayOffset = delay;
            }

            // Animating
            var running = false;
            var animations = this._animations || this.target.animations;
            for (var index = 0; index < animations.length; index++) {
                var isRunning = animations[index].animate(this.target, delay - this._localDelayOffset, this.fromFrame, this.toFrame, this.loopAnimation, this.speedRatio);
                running = running || isRunning;
            }

            if (!running && this.onAnimationEnd) {
                this.onAnimationEnd();
            }

            return running;
        }
    }
} 