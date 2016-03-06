var BABYLON;
(function (BABYLON) {
    var PostProcessRenderEffect = (function () {
        function PostProcessRenderEffect(engine, name, getPostProcess, singleInstance) {
            this._engine = engine;
            this._name = name;
            this._singleInstance = singleInstance || true;
            this._getPostProcess = getPostProcess;
            this._cameras = [];
            this._indicesForCamera = [];
            this._postProcesses = {};
            this._renderPasses = {};
            this._renderEffectAsPasses = {};
        }
        Object.defineProperty(PostProcessRenderEffect.prototype, "isSupported", {
            get: function () {
                for (var index in this._postProcesses) {
                    if (!this._postProcesses[index].isSupported) {
                        return false;
                    }
                }
                return true;
            },
            enumerable: true,
            configurable: true
        });
        PostProcessRenderEffect.prototype._update = function () {
            for (var renderPassName in this._renderPasses) {
                this._renderPasses[renderPassName]._update();
            }
        };
        PostProcessRenderEffect.prototype.addPass = function (renderPass) {
            this._renderPasses[renderPass._name] = renderPass;
            this._linkParameters();
        };
        PostProcessRenderEffect.prototype.removePass = function (renderPass) {
            delete this._renderPasses[renderPass._name];
            this._linkParameters();
        };
        PostProcessRenderEffect.prototype.addRenderEffectAsPass = function (renderEffect) {
            this._renderEffectAsPasses[renderEffect._name] = renderEffect;
            this._linkParameters();
        };
        PostProcessRenderEffect.prototype.getPass = function (passName) {
            for (var renderPassName in this._renderPasses) {
                if (renderPassName === passName) {
                    return this._renderPasses[passName];
                }
            }
        };
        PostProcessRenderEffect.prototype.emptyPasses = function () {
            this._renderPasses = {};
            this._linkParameters();
        };
        PostProcessRenderEffect.prototype._attachCameras = function (cameras) {
            var cameraKey;
            var _cam = BABYLON.Tools.MakeArray(cameras || this._cameras);
            for (var i = 0; i < _cam.length; i++) {
                var camera = _cam[i];
                var cameraName = camera.name;
                if (this._singleInstance) {
                    cameraKey = 0;
                }
                else {
                    cameraKey = cameraName;
                }
                this._postProcesses[cameraKey] = this._postProcesses[cameraKey] || this._getPostProcess();
                var index = camera.attachPostProcess(this._postProcesses[cameraKey]);
                if (!this._indicesForCamera[cameraName]) {
                    this._indicesForCamera[cameraName] = [];
                }
                this._indicesForCamera[cameraName].push(index);
                if (this._cameras.indexOf(camera) === -1) {
                    this._cameras[cameraName] = camera;
                }
                for (var passName in this._renderPasses) {
                    this._renderPasses[passName]._incRefCount();
                }
            }
            this._linkParameters();
        };
        PostProcessRenderEffect.prototype._detachCameras = function (cameras) {
            var _cam = BABYLON.Tools.MakeArray(cameras || this._cameras);
            for (var i = 0; i < _cam.length; i++) {
                var camera = _cam[i];
                var cameraName = camera.name;
                camera.detachPostProcess(this._postProcesses[this._singleInstance ? 0 : cameraName], this._indicesForCamera[cameraName]);
                var index = this._cameras.indexOf(cameraName);
                this._indicesForCamera.splice(index, 1);
                this._cameras.splice(index, 1);
                for (var passName in this._renderPasses) {
                    this._renderPasses[passName]._decRefCount();
                }
            }
        };
        PostProcessRenderEffect.prototype._enable = function (cameras) {
            var _cam = BABYLON.Tools.MakeArray(cameras || this._cameras);
            for (var i = 0; i < _cam.length; i++) {
                var camera = _cam[i];
                var cameraName = camera.name;
                for (var j = 0; j < this._indicesForCamera[cameraName].length; j++) {
                    if (camera._postProcesses[this._indicesForCamera[cameraName][j]] === undefined) {
                        cameras[i].attachPostProcess(this._postProcesses[this._singleInstance ? 0 : cameraName], this._indicesForCamera[cameraName][j]);
                    }
                }
                for (var passName in this._renderPasses) {
                    this._renderPasses[passName]._incRefCount();
                }
            }
        };
        PostProcessRenderEffect.prototype._disable = function (cameras) {
            var _cam = BABYLON.Tools.MakeArray(cameras || this._cameras);
            for (var i = 0; i < _cam.length; i++) {
                var camera = _cam[i];
                var cameraName = camera.Name;
                camera.detachPostProcess(this._postProcesses[this._singleInstance ? 0 : cameraName], this._indicesForCamera[cameraName]);
                for (var passName in this._renderPasses) {
                    this._renderPasses[passName]._decRefCount();
                }
            }
        };
        PostProcessRenderEffect.prototype.getPostProcess = function (camera) {
            if (this._singleInstance) {
                return this._postProcesses[0];
            }
            else {
                return this._postProcesses[camera.name];
            }
        };
        PostProcessRenderEffect.prototype._linkParameters = function () {
            var _this = this;
            for (var index in this._postProcesses) {
                if (this.applyParameters) {
                    this.applyParameters(this._postProcesses[index]);
                }
                this._postProcesses[index].onBeforeRender = function (effect) {
                    _this._linkTextures(effect);
                };
            }
        };
        PostProcessRenderEffect.prototype._linkTextures = function (effect) {
            for (var renderPassName in this._renderPasses) {
                effect.setTexture(renderPassName, this._renderPasses[renderPassName].getRenderTexture());
            }
            for (var renderEffectName in this._renderEffectAsPasses) {
                effect.setTextureFromPostProcess(renderEffectName + "Sampler", this._renderEffectAsPasses[renderEffectName].getPostProcess());
            }
        };
        return PostProcessRenderEffect;
    }());
    BABYLON.PostProcessRenderEffect = PostProcessRenderEffect;
})(BABYLON || (BABYLON = {}));
