var BABYLON;
(function (BABYLON) {
    var Internals;
    (function (Internals) {
        var _StencilState = (function () {
            function _StencilState() {
                this._isStencilTestDirty = false;
                this._isStencilMaskDirty = false;
                this._isStencilFuncDirty = false;
                this._isStencilOpDirty = false;
                this.reset();
            }
            Object.defineProperty(_StencilState.prototype, "isDirty", {
                get: function () {
                    return this._isStencilTestDirty || this._isStencilMaskDirty || this._isStencilFuncDirty || this._isStencilOpDirty;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(_StencilState.prototype, "stencilFunc", {
                get: function () {
                    return this._stencilFunc;
                },
                set: function (value) {
                    if (this._stencilFunc === value) {
                        return;
                    }
                    this._stencilFunc = value;
                    this._isStencilFuncDirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(_StencilState.prototype, "stencilFuncRef", {
                get: function () {
                    return this._stencilFuncRef;
                },
                set: function (value) {
                    if (this._stencilFuncRef === value) {
                        return;
                    }
                    this._stencilFuncRef = value;
                    this._isStencilFuncDirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(_StencilState.prototype, "stencilFuncMask", {
                get: function () {
                    return this._stencilFuncMask;
                },
                set: function (value) {
                    if (this._stencilFuncMask === value) {
                        return;
                    }
                    this._stencilFuncMask = value;
                    this._isStencilFuncDirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(_StencilState.prototype, "stencilOpStencilFail", {
                get: function () {
                    return this._stencilOpStencilFail;
                },
                set: function (value) {
                    if (this._stencilOpStencilFail === value) {
                        return;
                    }
                    this._stencilOpStencilFail = value;
                    this._isStencilOpDirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(_StencilState.prototype, "stencilOpDepthFail", {
                get: function () {
                    return this._stencilOpDepthFail;
                },
                set: function (value) {
                    if (this._stencilOpDepthFail === value) {
                        return;
                    }
                    this._stencilOpDepthFail = value;
                    this._isStencilOpDirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(_StencilState.prototype, "stencilOpStencilDepthPass", {
                get: function () {
                    return this._stencilOpStencilDepthPass;
                },
                set: function (value) {
                    if (this._stencilOpStencilDepthPass === value) {
                        return;
                    }
                    this._stencilOpStencilDepthPass = value;
                    this._isStencilOpDirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(_StencilState.prototype, "stencilMask", {
                get: function () {
                    return this._stencilMask;
                },
                set: function (value) {
                    if (this._stencilMask === value) {
                        return;
                    }
                    this._stencilMask = value;
                    this._isStencilMaskDirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(_StencilState.prototype, "stencilTest", {
                get: function () {
                    return this._stencilTest;
                },
                set: function (value) {
                    if (this._stencilTest === value) {
                        return;
                    }
                    this._stencilTest = value;
                    this._isStencilTestDirty = true;
                },
                enumerable: true,
                configurable: true
            });
            _StencilState.prototype.reset = function () {
                this._stencilTest = false;
                this._stencilMask = 0xFF;
                this._stencilFunc = 0x0207; //WebGLRenderingContext.ALWAYS;
                this._stencilFuncRef = 1;
                this._stencilFuncMask = 0xFF;
                this._stencilOpStencilFail = 0x1E00; //WebGLRenderingContext.KEEP;
                this._stencilOpDepthFail = 0x1E00; //WebGLRenderingContext.KEEP;
                this._stencilOpStencilDepthPass = 0x1E01; //WebGLRenderingContext.REPLACE;
                this._isStencilTestDirty = true;
                this._isStencilMaskDirty = true;
                this._isStencilFuncDirty = true;
                this._isStencilOpDirty = true;
            };
            _StencilState.prototype.apply = function (gl) {
                if (!this.isDirty) {
                    return;
                }
                // Stencil test
                if (this._isStencilTestDirty) {
                    if (this.stencilTest) {
                        gl.enable(gl.STENCIL_TEST);
                    }
                    else {
                        gl.disable(gl.STENCIL_TEST);
                    }
                    this._isStencilTestDirty = false;
                }
                // Stencil mask
                if (this._isStencilMaskDirty) {
                    gl.stencilMask(this.stencilMask);
                    this._isStencilMaskDirty = false;
                }
                // Stencil func
                if (this._isStencilFuncDirty) {
                    gl.stencilFunc(this.stencilFunc, this.stencilFuncRef, this.stencilFuncMask);
                    this._isStencilFuncDirty = false;
                }
                // Stencil op
                if (this._isStencilOpDirty) {
                    gl.stencilOp(this.stencilOpStencilFail, this.stencilOpDepthFail, this.stencilOpStencilDepthPass);
                    this._isStencilOpDirty = false;
                }
            };
            return _StencilState;
        })();
        Internals._StencilState = _StencilState;
    })(Internals = BABYLON.Internals || (BABYLON.Internals = {}));
})(BABYLON || (BABYLON = {}));
