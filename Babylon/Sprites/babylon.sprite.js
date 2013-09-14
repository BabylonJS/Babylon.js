var BABYLON = BABYLON || {};

(function () {
    BABYLON.Sprite = function (name, manager) {
        this.name = name;
        this._manager = manager;

        this._manager.sprites.push(this);

        this.position = BABYLON.Vector3.Zero();
        this.color = new BABYLON.Color4(1.0, 1.0, 1.0, 1.0);

        this._frameCount = 0;
    };

    // Members
    BABYLON.Sprite.prototype.position = null;
    BABYLON.Sprite.prototype.size = 1.0;
    BABYLON.Sprite.prototype.angle = 0;
    BABYLON.Sprite.prototype.cellIndex = 0;
    BABYLON.Sprite.prototype.invertU = 0;
    BABYLON.Sprite.prototype.invertV = 0;
    BABYLON.Sprite.prototype.disposeWhenFinishedAnimating = false;

    BABYLON.Sprite.prototype._animationStarted = false;
    BABYLON.Sprite.prototype._loopAnimation = false;
    BABYLON.Sprite.prototype._fromIndex = false;
    BABYLON.Sprite.prototype._toIndex = false;
    BABYLON.Sprite.prototype._delay = false;
    BABYLON.Sprite.prototype._direction = 1;

    // Methods
    BABYLON.Sprite.prototype.playAnimation = function (from, to, loop, delay) {
        this._fromIndex = from;
        this._toIndex = to;
        this._loopAnimation = loop;
        this._delay = delay;
        this._animationStarted = true;

        this._direction = from < to ? 1 : -1;

        this.cellIndex = from;
        this._time = 0;
    };

    BABYLON.Sprite.prototype.stopAnimation = function () {
        this._animationStarted = false;
    };

    BABYLON.Sprite.prototype._animate = function (deltaTime) {
        if (!this._animationStarted)
            return;

        this._time += deltaTime;
        if (this._time > this._delay) {
            this._time = this._time % this._delay;
            this.cellIndex += this._direction;
            if (this.cellIndex == this._toIndex) {
                if (this._loopAnimation) {
                    this.cellIndex = this._fromIndex;
                } else {
                    this._animationStarted = false;
                    if (this.disposeWhenFinishedAnimating) {
                        this.dispose();
                    }
                }
            }
        }
    };

    BABYLON.Sprite.prototype.dispose = function () {
        for (var i = 0; i < this._manager.sprites.length; i++) {
            if (this._manager.sprites[i] == this) {
                this._manager.sprites.splice(i, 1);
            }
        }
    };

})();