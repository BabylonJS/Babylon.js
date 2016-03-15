var BABYLON;
(function (BABYLON) {
    var Internals;
    (function (Internals) {
        var _AlphaState = (function () {
            function _AlphaState() {
                this._isAlphaBlendDirty = false;
                this._isBlendFunctionParametersDirty = false;
                this._alphaBlend = false;
                this._blendFunctionParameters = new Array(4);
            }
            Object.defineProperty(_AlphaState.prototype, "isDirty", {
                get: function () {
                    return this._isAlphaBlendDirty || this._isBlendFunctionParametersDirty;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(_AlphaState.prototype, "alphaBlend", {
                get: function () {
                    return this._alphaBlend;
                },
                set: function (value) {
                    if (this._alphaBlend === value) {
                        return;
                    }
                    this._alphaBlend = value;
                    this._isAlphaBlendDirty = true;
                },
                enumerable: true,
                configurable: true
            });
            _AlphaState.prototype.setAlphaBlendFunctionParameters = function (value0, value1, value2, value3) {
                if (this._blendFunctionParameters[0] === value0 &&
                    this._blendFunctionParameters[1] === value1 &&
                    this._blendFunctionParameters[2] === value2 &&
                    this._blendFunctionParameters[3] === value3) {
                    return;
                }
                this._blendFunctionParameters[0] = value0;
                this._blendFunctionParameters[1] = value1;
                this._blendFunctionParameters[2] = value2;
                this._blendFunctionParameters[3] = value3;
                this._isBlendFunctionParametersDirty = true;
            };
            _AlphaState.prototype.reset = function () {
                this._alphaBlend = false;
                this._blendFunctionParameters[0] = null;
                this._blendFunctionParameters[1] = null;
                this._blendFunctionParameters[2] = null;
                this._blendFunctionParameters[3] = null;
                this._isAlphaBlendDirty = true;
                this._isBlendFunctionParametersDirty = false;
            };
            _AlphaState.prototype.apply = function (gl) {
                if (!this.isDirty) {
                    return;
                }
                // Alpha blend
                if (this._isAlphaBlendDirty) {
                    if (this._alphaBlend) {
                        gl.enable(gl.BLEND);
                    }
                    else {
                        gl.disable(gl.BLEND);
                    }
                    this._isAlphaBlendDirty = false;
                }
                // Alpha function
                if (this._isBlendFunctionParametersDirty) {
                    gl.blendFuncSeparate(this._blendFunctionParameters[0], this._blendFunctionParameters[1], this._blendFunctionParameters[2], this._blendFunctionParameters[3]);
                    this._isBlendFunctionParametersDirty = false;
                }
            };
            return _AlphaState;
        })();
        Internals._AlphaState = _AlphaState;
    })(Internals = BABYLON.Internals || (BABYLON.Internals = {}));
})(BABYLON || (BABYLON = {}));
