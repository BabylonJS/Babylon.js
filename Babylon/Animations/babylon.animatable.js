var BABYLON;
(function (BABYLON) {
    (function (Internals) {
        var Animatable = (function () {
            function Animatable(target, fromFrame, toFrame, loopAnimation, speedRatio, onAnimationEnd, animations) {
                if (typeof fromFrame === "undefined") { fromFrame = 0; }
                if (typeof toFrame === "undefined") { toFrame = 100; }
                if (typeof loopAnimation === "undefined") { loopAnimation = false; }
                if (typeof speedRatio === "undefined") { speedRatio = 1.0; }
                this.target = target;
                this.fromFrame = fromFrame;
                this.toFrame = toFrame;
                this.loopAnimation = loopAnimation;
                this.speedRatio = speedRatio;
                this.onAnimationEnd = onAnimationEnd;
                this.animationStarted = false;
                this._animations = animations;
            }
            // Methods
            Animatable.prototype._animate = function (delay) {
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
            };
            return Animatable;
        })();
        Internals.Animatable = Animatable;
    })(BABYLON.Internals || (BABYLON.Internals = {}));
    var Internals = BABYLON.Internals;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.animatable.js.map
