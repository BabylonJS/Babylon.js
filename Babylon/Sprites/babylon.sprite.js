var BABYLON;
(function (BABYLON) {
    var Sprite = (function () {
        function Sprite(name, manager) {
            this.name = name;
            this.color = new BABYLON.Color4(1.0, 1.0, 1.0, 1.0);
            this.width = 1.0;
            this.height = 1.0;
            this.angle = 0;
            this.cellIndex = 0;
            this.invertU = 0;
            this.invertV = 0;
            this.animations = new Array();
            this._animationStarted = false;
            this._loopAnimation = false;
            this._fromIndex = 0;
            this._toIndex = 0;
            this._delay = 0;
            this._direction = 1;
            this._frameCount = 0;
            this._time = 0;
            this._manager = manager;
            this._manager.sprites.push(this);
            this.position = BABYLON.Vector3.Zero();
        }
        Object.defineProperty(Sprite.prototype, "size", {
            get: function () {
                return this.width;
            },
            set: function (value) {
                this.width = value;
                this.height = value;
            },
            enumerable: true,
            configurable: true
        });
        Sprite.prototype.playAnimation = function (from, to, loop, delay) {
            this._fromIndex = from;
            this._toIndex = to;
            this._loopAnimation = loop;
            this._delay = delay;
            this._animationStarted = true;
            this._direction = from < to ? 1 : -1;
            this.cellIndex = from;
            this._time = 0;
        };
        Sprite.prototype.stopAnimation = function () {
            this._animationStarted = false;
        };
        Sprite.prototype._animate = function (deltaTime) {
            if (!this._animationStarted)
                return;
            this._time += deltaTime;
            if (this._time > this._delay) {
                this._time = this._time % this._delay;
                this.cellIndex += this._direction;
                if (this.cellIndex == this._toIndex) {
                    if (this._loopAnimation) {
                        this.cellIndex = this._fromIndex;
                    }
                    else {
                        this._animationStarted = false;
                        if (this.disposeWhenFinishedAnimating) {
                            this.dispose();
                        }
                    }
                }
            }
        };
        Sprite.prototype.dispose = function () {
            for (var i = 0; i < this._manager.sprites.length; i++) {
                if (this._manager.sprites[i] == this) {
                    this._manager.sprites.splice(i, 1);
                }
            }
        };
        return Sprite;
    })();
    BABYLON.Sprite = Sprite;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.sprite.js.map