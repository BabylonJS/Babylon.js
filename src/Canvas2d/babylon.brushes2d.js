var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
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
    }());
    BABYLON.LockableBase = LockableBase;
    /**
     * This classs implements a Border that will be drawn with a uniform solid color (i.e. the same color everywhere in the border).
     */
    var SolidColorBorder2D = (function (_super) {
        __extends(SolidColorBorder2D, _super);
        function SolidColorBorder2D(color, lock) {
            if (lock === void 0) { lock = false; }
            _super.call(this);
            this._color = color;
            if (lock) {
                this.lock();
            }
        }
        Object.defineProperty(SolidColorBorder2D.prototype, "color", {
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
        SolidColorBorder2D.prototype.toString = function () {
            return this._color.toHexString();
        };
        return SolidColorBorder2D;
    }(LockableBase));
    BABYLON.SolidColorBorder2D = SolidColorBorder2D;
    /**
     * This class implements a Fill that will be drawn with a uniform solid color (i.e. the same everywhere inside the primitive).
     */
    var SolidColorFill2D = (function (_super) {
        __extends(SolidColorFill2D, _super);
        function SolidColorFill2D(color, lock) {
            if (lock === void 0) { lock = false; }
            _super.call(this);
            this._color = color;
            if (lock) {
                this.lock();
            }
        }
        Object.defineProperty(SolidColorFill2D.prototype, "color", {
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
        SolidColorFill2D.prototype.toString = function () {
            return this._color.toHexString();
        };
        return SolidColorFill2D;
    }(LockableBase));
    BABYLON.SolidColorFill2D = SolidColorFill2D;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.brushes2d.js.map