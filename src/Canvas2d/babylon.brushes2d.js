var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    /**
     * Base class implemting the ILocable interface.
     * The particularity of this class is to call the protected onLock() method when the instance is about to be locked for good.
     */
    var LockableBase = (function () {
        function LockableBase() {
        }
        LockableBase.prototype.isLocked = function () {
            return this._isLocked;
        };
        LockableBase.prototype.lock = function () {
            if (this._isLocked) {
                return true;
            }
            this.onLock();
            this._isLocked = true;
            return false;
        };
        /**
         * Protected handler that will be called when the instance is about to be locked.
         */
        LockableBase.prototype.onLock = function () {
        };
        return LockableBase;
    })();
    BABYLON.LockableBase = LockableBase;
    /**
     * This classs implements a Brush that will be drawn with a uniform solid color (i.e. the same color everywhere in the content where the brush is assigned to).
     */
    var SolidColorBrush2D = (function (_super) {
        __extends(SolidColorBrush2D, _super);
        function SolidColorBrush2D(color, lock) {
            if (lock === void 0) { lock = false; }
            _super.call(this);
            this._color = color;
            if (lock) {
                {
                    this.lock();
                }
            }
        }
        SolidColorBrush2D.prototype.isTransparent = function () {
            return this._color && this._color.a < 1.0;
        };
        Object.defineProperty(SolidColorBrush2D.prototype, "color", {
            /**
             * The color used by this instance to render
             * @returns the color object. Note that it's not a clone of the actual object stored in the instance so you MUST NOT modify it, otherwise unexpected behavior might occurs.
             */
            get: function () {
                return this._color;
            },
            set: function (value) {
                if (this.isLocked()) {
                    return;
                }
                this._color = value;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Return a unique identifier of the instance, which is simply the hexadecimal representation (CSS Style) of the solid color.
         */
        SolidColorBrush2D.prototype.toString = function () {
            return this._color.toHexString();
        };
        SolidColorBrush2D = __decorate([
            BABYLON.className("SolidColorBrush2D")
        ], SolidColorBrush2D);
        return SolidColorBrush2D;
    })(LockableBase);
    BABYLON.SolidColorBrush2D = SolidColorBrush2D;
    var GradientColorBrush2D = (function (_super) {
        __extends(GradientColorBrush2D, _super);
        function GradientColorBrush2D(color1, color2, translation, rotation, scale, lock) {
            if (translation === void 0) { translation = BABYLON.Vector2.Zero(); }
            if (rotation === void 0) { rotation = 0; }
            if (scale === void 0) { scale = 1; }
            if (lock === void 0) { lock = false; }
            _super.call(this);
            this._color1 = color1;
            this._color2 = color2;
            this._translation = translation;
            this._rotation = rotation;
            this._scale = scale;
            if (lock) {
                this.lock();
            }
        }
        GradientColorBrush2D.prototype.isTransparent = function () {
            return (this._color1 && this._color1.a < 1.0) || (this._color2 && this._color2.a < 1.0);
        };
        Object.defineProperty(GradientColorBrush2D.prototype, "color1", {
            get: function () {
                return this._color1;
            },
            set: function (value) {
                if (this.isLocked()) {
                    return;
                }
                this._color1 = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GradientColorBrush2D.prototype, "color2", {
            get: function () {
                return this._color2;
            },
            set: function (value) {
                if (this.isLocked()) {
                    return;
                }
                this._color2 = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GradientColorBrush2D.prototype, "translation", {
            get: function () {
                return this._translation;
            },
            set: function (value) {
                if (this.isLocked()) {
                    return;
                }
                this._translation = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GradientColorBrush2D.prototype, "rotation", {
            get: function () {
                return this._rotation;
            },
            set: function (value) {
                if (this.isLocked()) {
                    return;
                }
                this._rotation = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GradientColorBrush2D.prototype, "scale", {
            get: function () {
                return this._scale;
            },
            set: function (value) {
                if (this.isLocked()) {
                    return;
                }
                this._scale = value;
            },
            enumerable: true,
            configurable: true
        });
        GradientColorBrush2D.prototype.toString = function () {
            return "C1:" + this._color1 + ";C2:" + this._color2 + ";T:" + this._translation.toString() + ";R:" + this._rotation + ";S:" + this._scale + ";";
        };
        GradientColorBrush2D.BuildKey = function (color1, color2, translation, rotation, scale) {
            return "C1:" + color1 + ";C2:" + color2 + ";T:" + translation.toString() + ";R:" + rotation + ";S:" + scale + ";";
        };
        GradientColorBrush2D = __decorate([
            BABYLON.className("GradientColorBrush2D")
        ], GradientColorBrush2D);
        return GradientColorBrush2D;
    })(LockableBase);
    BABYLON.GradientColorBrush2D = GradientColorBrush2D;
})(BABYLON || (BABYLON = {}));
