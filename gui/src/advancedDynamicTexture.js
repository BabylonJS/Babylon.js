/// <reference path="../../dist/preview release/babylon.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var BABYLON;
(function (BABYLON) {
    var GUI;
    (function (GUI) {
        var AdvancedDynamicTexture = (function (_super) {
            __extends(AdvancedDynamicTexture, _super);
            function AdvancedDynamicTexture(name, scene) {
                var _this = _super.call(this, name, {}, scene, false, BABYLON.Texture.NEAREST_SAMPLINGMODE, BABYLON.Engine.TEXTUREFORMAT_RGBA) || this;
                _this._dirty = false;
                _this._rootContainer = new GUI.Container("root");
                _this._resizeObserver = _this.getScene().getEngine().onResizeObservable.add(function () { return _this._onResize(); });
                _this._renderObserver = _this.getScene().onBeforeRenderObservable.add(function () { return _this._checkUpdate(); });
                _this._onResize();
                return _this;
            }
            Object.defineProperty(AdvancedDynamicTexture.prototype, "background", {
                get: function () {
                    return this._background;
                },
                set: function (value) {
                    if (this._background === value) {
                        return;
                    }
                    this._background = value;
                    this._markAsDirty();
                },
                enumerable: true,
                configurable: true
            });
            AdvancedDynamicTexture.prototype.addControl = function (control) {
                control._setRoot(this._rootContainer);
                this._rootContainer.addControl(control);
                return this;
            };
            AdvancedDynamicTexture.prototype.removeControl = function (control) {
                this._rootContainer.removeControl(control);
                return this;
            };
            AdvancedDynamicTexture.prototype.dispose = function () {
                this.getScene().onBeforeRenderObservable.remove(this._renderObserver);
                this.getScene().getEngine().onResizeObservable.remove(this._resizeObserver);
                _super.prototype.dispose.call(this);
            };
            AdvancedDynamicTexture.prototype._onResize = function () {
                // Check size
                var engine = this.getScene().getEngine();
                var textureSize = this.getSize();
                var renderWidth = engine.getRenderWidth();
                var renderHeight = engine.getRenderHeight();
                if (textureSize.width !== renderWidth || textureSize.height !== renderHeight) {
                    this.scaleTo(renderWidth, renderHeight);
                }
                // Update constant pixel resources            
                var scaleX = renderWidth / 1000.0;
                var scaleY = renderHeight / 1000.0;
                this._rootContainer._rescale(scaleX, scaleY);
                this._markAsDirty();
            };
            AdvancedDynamicTexture.prototype._markAsDirty = function () {
                this._dirty = true;
            };
            AdvancedDynamicTexture.prototype._checkUpdate = function () {
                if (!this._dirty) {
                    return;
                }
                this._dirty = false;
                this._render();
                this.update();
            };
            AdvancedDynamicTexture.prototype._render = function () {
                var engine = this.getScene().getEngine();
                var renderWidth = engine.getRenderWidth();
                var renderHeight = engine.getRenderHeight();
                // Clear
                var context = this.getContext();
                if (this._background) {
                    context.save();
                    context.fillStyle = this._background;
                    context.fillRect(0, 0, renderWidth, renderHeight);
                    context.restore();
                }
                else {
                    this.clear();
                }
                // Render
                var measure = new GUI.Measure(0, 0, renderWidth, renderHeight);
                this._rootContainer._draw(measure, context);
            };
            return AdvancedDynamicTexture;
        }(BABYLON.DynamicTexture));
        GUI.AdvancedDynamicTexture = AdvancedDynamicTexture;
    })(GUI = BABYLON.GUI || (BABYLON.GUI = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=advancedDynamicTexture.js.map
