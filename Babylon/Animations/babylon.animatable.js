var BABYLON = BABYLON || {};

(function () {
    BABYLON._Animatable = function (target, from, to, loop, speedRatio) {
        this.target = target;
        this.fromFrame = from;
        this.toFrame = to;
        this.loopAnimation = loop;
        this.speedRatio = speedRatio ? speedRatio : 1.0;
    };
    
    // Members
    BABYLON._Animatable.prototype.target = null;
    BABYLON._Animatable.prototype.animationStarted = false;
    BABYLON._Animatable.prototype.loopAnimation = false;
    BABYLON._Animatable.prototype.fromFrame = 0;
    BABYLON._Animatable.prototype.toFrame = 100;
    BABYLON._Animatable.prototype.speedRatio = 1.0;
    
    // Methods
    BABYLON._Animatable.prototype._animate = function (delay) {
        if (!this._localDelayOffset) {
            this._localDelayOffset = delay;
        }

        // Animating
        var running = false;
        var animations = this.target.animations;
        for (var index = 0; index < animations.length; index++) {
            var isRunning = animations[index].animate(this.target, delay - this._localDelayOffset, this.fromFrame, this.toFrame, this.loopAnimation, this.speedRatio);
            running = running || isRunning;            
        }

        return running;
    };
})();
