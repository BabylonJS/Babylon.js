var BABYLON;
(function (BABYLON) {
    var Internals;
    (function (Internals) {
        var _DepthCullingState = (function () {
            function _DepthCullingState() {
                this._isDepthTestDirty = false;
                this._isDepthMaskDirty = false;
                this._isDepthFuncDirty = false;
                this._isCullFaceDirty = false;
                this._isCullDirty = false;
                this._isZOffsetDirty = false;
            }
            Object.defineProperty(_DepthCullingState.prototype, "isDirty", {
                get: function () {
                    return this._isDepthFuncDirty || this._isDepthTestDirty || this._isDepthMaskDirty || this._isCullFaceDirty || this._isCullDirty || this._isZOffsetDirty;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(_DepthCullingState.prototype, "zOffset", {
                get: function () {
                    return this._zOffset;
                },
                set: function (value) {
                    if (this._zOffset === value) {
                        return;
                    }
                    this._zOffset = value;
                    this._isZOffsetDirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(_DepthCullingState.prototype, "cullFace", {
                get: function () {
                    return this._cullFace;
                },
                set: function (value) {
                    if (this._cullFace === value) {
                        return;
                    }
                    this._cullFace = value;
                    this._isCullFaceDirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(_DepthCullingState.prototype, "cull", {
                get: function () {
                    return this._cull;
                },
                set: function (value) {
                    if (this._cull === value) {
                        return;
                    }
                    this._cull = value;
                    this._isCullDirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(_DepthCullingState.prototype, "depthFunc", {
                get: function () {
                    return this._depthFunc;
                },
                set: function (value) {
                    if (this._depthFunc === value) {
                        return;
                    }
                    this._depthFunc = value;
                    this._isDepthFuncDirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(_DepthCullingState.prototype, "depthMask", {
                get: function () {
                    return this._depthMask;
                },
                set: function (value) {
                    if (this._depthMask === value) {
                        return;
                    }
                    this._depthMask = value;
                    this._isDepthMaskDirty = true;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(_DepthCullingState.prototype, "depthTest", {
                get: function () {
                    return this._depthTest;
                },
                set: function (value) {
                    if (this._depthTest === value) {
                        return;
                    }
                    this._depthTest = value;
                    this._isDepthTestDirty = true;
                },
                enumerable: true,
                configurable: true
            });
            _DepthCullingState.prototype.reset = function () {
                this._depthMask = true;
                this._depthTest = true;
                this._depthFunc = null;
                this._cull = null;
                this._cullFace = null;
                this._zOffset = 0;
                this._isDepthTestDirty = true;
                this._isDepthMaskDirty = true;
                this._isDepthFuncDirty = false;
                this._isCullFaceDirty = false;
                this._isCullDirty = false;
                this._isZOffsetDirty = false;
            };
            _DepthCullingState.prototype.apply = function (gl) {
                if (!this.isDirty) {
                    return;
                }
                // Cull
                if (this._isCullDirty) {
                    if (this.cull) {
                        gl.enable(gl.CULL_FACE);
                    }
                    else {
                        gl.disable(gl.CULL_FACE);
                    }
                    this._isCullDirty = false;
                }
                // Cull face
                if (this._isCullFaceDirty) {
                    gl.cullFace(this.cullFace);
                    this._isCullFaceDirty = false;
                }
                // Depth mask
                if (this._isDepthMaskDirty) {
                    gl.depthMask(this.depthMask);
                    this._isDepthMaskDirty = false;
                }
                // Depth test
                if (this._isDepthTestDirty) {
                    if (this.depthTest) {
                        gl.enable(gl.DEPTH_TEST);
                    }
                    else {
                        gl.disable(gl.DEPTH_TEST);
                    }
                    this._isDepthTestDirty = false;
                }
                // Depth func
                if (this._isDepthFuncDirty) {
                    gl.depthFunc(this.depthFunc);
                    this._isDepthFuncDirty = false;
                }
                // zOffset
                if (this._isZOffsetDirty) {
                    if (this.zOffset) {
                        gl.enable(gl.POLYGON_OFFSET_FILL);
                        gl.polygonOffset(this.zOffset, 0);
                    }
                    else {
                        gl.disable(gl.POLYGON_OFFSET_FILL);
                    }
                    this._isZOffsetDirty = false;
                }
            };
            return _DepthCullingState;
        })();
        Internals._DepthCullingState = _DepthCullingState;
    })(Internals = BABYLON.Internals || (BABYLON.Internals = {}));
})(BABYLON || (BABYLON = {}));
