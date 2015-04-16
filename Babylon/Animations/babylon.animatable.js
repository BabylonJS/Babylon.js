var BABYLON;
(function (BABYLON) {
    var Animatable = (function () {
        function Animatable(scene, target, fromFrame, toFrame, loopAnimation, speedRatio, onAnimationEnd, animations) {
            if (fromFrame === void 0) { fromFrame = 0; }
            if (toFrame === void 0) { toFrame = 100; }
            if (loopAnimation === void 0) { loopAnimation = false; }
            if (speedRatio === void 0) { speedRatio = 1.0; }
            this.target = target;
            this.fromFrame = fromFrame;
            this.toFrame = toFrame;
            this.loopAnimation = loopAnimation;
            this.speedRatio = speedRatio;
            this.onAnimationEnd = onAnimationEnd;
            this._animations = new Array();
            this._paused = false;
            this.animationStarted = false;
            if (animations) {
                this.appendAnimations(target, animations);
            }
            this._scene = scene;
            scene._activeAnimatables.push(this);
        }
        // Methods
        Animatable.prototype.appendAnimations = function (target, animations) {
            for (var index = 0; index < animations.length; index++) {
                var animation = animations[index];
                animation._target = target;
                this._animations.push(animation);
            }
        };
        Animatable.prototype.getAnimationByTargetProperty = function (property) {
            var animations = this._animations;
            for (var index = 0; index < animations.length; index++) {
                if (animations[index].targetProperty === property) {
                    return animations[index];
                }
            }
            return null;
        };
        Animatable.prototype.pause = function () {
            if (this._paused) {
                return;
            }
            this._paused = true;
        };
        Animatable.prototype.restart = function () {
            this._paused = false;
        };
        Animatable.prototype.stop = function () {
            var index = this._scene._activeAnimatables.indexOf(this);
            if (index > -1) {
                this._scene._activeAnimatables.splice(index, 1);
            }
            if (this.onAnimationEnd) {
                this.onAnimationEnd();
            }
        };
        Animatable.prototype._animate = function (delay) {
            if (this._paused) {
                if (!this._pausedDelay) {
                    this._pausedDelay = delay;
                }
                return true;
            }
            if (!this._localDelayOffset) {
                this._localDelayOffset = delay;
            }
            else if (this._pausedDelay) {
                this._localDelayOffset += delay - this._pausedDelay;
                this._pausedDelay = null;
            }
            // Animating
            var running = false;
            var animations = this._animations;
            for (var index = 0; index < animations.length; index++) {
                var animation = animations[index];
                var isRunning = animation.animate(delay - this._localDelayOffset, this.fromFrame, this.toFrame, this.loopAnimation, this.speedRatio);
                running = running || isRunning;
            }
            if (!running) {
                // Remove from active animatables
                index = this._scene._activeAnimatables.indexOf(this);
                this._scene._activeAnimatables.splice(index, 1);
            }
            if (!running && this.onAnimationEnd) {
                this.onAnimationEnd();
            }
            return running;
        };
        return Animatable;
    })();
    BABYLON.Animatable = Animatable;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.animatable.js.map