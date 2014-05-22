var BABYLON;
(function (BABYLON) {
    var PostProcessRenderEffect = (function () {
        function PostProcessRenderEffect(engine, name, postProcessType, ratio, samplingMode, singleInstance) {
            this.name = name;
            this._engine = engine;
            this._name = name;
            this._postProcessType = postProcessType;
            this._ratio = ratio || 1.0;
            this._samplingMode = samplingMode || null;
            this._singleInstance = singleInstance || true;

            this._cameras = [];

            this._postProcesses = [];
            this._indicesForCamera = [];

            this._renderPasses = [];
            this._renderEffectAsPasses = [];

            this.parameters = function (effect) {
            };
        }
        PostProcessRenderEffect.getInstance = function (engine, postProcessType, ratio, samplingMode) {
            var postProcess;
            var instance;
            var args = new Array();

            var parameters = PostProcessRenderEffect.getParametersNames(postProcessType);
            for (var i = 0; i < parameters.length; i++) {
                switch (parameters[i]) {
                    case "name":
                        args[i] = postProcessType.toString();
                        break;
                    case "ratio":
                        args[i] = ratio;
                        break;
                    case "camera":
                        args[i] = null;
                        break;
                    case "samplingMode":
                        args[i] = samplingMode;
                        break;
                    case "engine":
                        args[i] = engine;
                        break;
                    case "reusable":
                        args[i] = true;
                        break;
                    default:
                        args[i] = null;
                        break;
                }
            }

            postProcess = function () {
            };
            postProcess.prototype = postProcessType.prototype;

            instance = new postProcess();
            postProcessType.apply(instance, args);

            return instance;
        };

        PostProcessRenderEffect.getParametersNames = function (func) {
            var commentsRegex = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
            var functWithoutComments = eval(func).toString().replace(commentsRegex, '');

            var parameters = functWithoutComments.slice(functWithoutComments.indexOf('(') + 1, functWithoutComments.indexOf(')')).match(/([^\s,]+)/g);

            if (parameters === null)
                parameters = [];
            return parameters;
        };

        PostProcessRenderEffect.prototype._update = function () {
            for (var renderPassName in this._renderPasses) {
                this._renderPasses[renderPassName]._update();
            }
        };

        PostProcessRenderEffect.prototype.addPass = function (renderPass) {
            this._renderPasses[renderPass.name] = renderPass;

            this._linkParameters();
        };

        PostProcessRenderEffect.prototype.removePass = function (renderPass) {
            delete this._renderPasses[renderPass.name];

            this._linkParameters();
        };

        PostProcessRenderEffect.prototype.addRenderEffectAsPass = function (renderEffect) {
            this._renderEffectAsPasses[renderEffect.name] = renderEffect;

            this._linkParameters();
        };

        PostProcessRenderEffect.prototype.getPass = function (passName) {
            for (var renderPassName in this._renderPasses) {
                if (renderPassName == passName) {
                    return this._renderPasses[passName];
                }
            }
        };

        PostProcessRenderEffect.prototype.emptyPasses = function () {
            this._renderPasses.length = 0;

            this._linkParameters();
        };

        PostProcessRenderEffect.prototype.attachCameras = function (cameras) {
            var postProcess = null;

            cameras = BABYLON.Tools.MakeArray(cameras || this._cameras);

            for (var i = 0; i < cameras.length; i++) {
                if (this._singleInstance) {
                    postProcess = this._postProcesses[0] || PostProcessRenderEffect.getInstance(this._engine, this._postProcessType, this._ratio, this._samplingMode);
                    this._postProcesses[0] = postProcess;
                } else {
                    postProcess = this._postProcesses[cameras[i].name] || PostProcessRenderEffect.getInstance(this._engine, this._postProcessType, this._ratio, this._samplingMode);
                    this._postProcesses[cameras[i].name] = postProcess;
                }
                var index = cameras[i].attachPostProcess(postProcess);

                if (this._indicesForCamera[cameras[i].name] == null) {
                    this._indicesForCamera[cameras[i].name] = [];
                }

                this._indicesForCamera[cameras[i].name].push(index);

                if (this._cameras.indexOf(cameras[i]) == -1) {
                    this._cameras[cameras[i].name] = cameras[i];
                }

                for (var passName in this._renderPasses) {
                    this._renderPasses[passName].incRefCount();
                }
            }

            this._linkParameters();
        };

        PostProcessRenderEffect.prototype.detachCameras = function (cameras) {
            cameras = BABYLON.Tools.MakeArray(cameras || this._cameras);

            for (var i = 0; i < cameras.length; i++) {
                if (this._singleInstance) {
                    cameras[i].detachPostProcess(this._postProcesses[0], this._indicesForCamera[cameras[i].name]);
                } else {
                    cameras[i].detachPostProcess(this._postProcesses[cameras[i].name], this._indicesForCamera[cameras[i].name]);
                }

                var index = this._cameras.indexOf(cameras[i].name);

                this._indicesForCamera.splice(index, 1);
                this._cameras.splice(index, 1);

                for (var passName in this._renderPasses) {
                    this._renderPasses[passName].decRefCount();
                }
            }
        };

        PostProcessRenderEffect.prototype.enable = function (cameras) {
            cameras = BABYLON.Tools.MakeArray(cameras || this._cameras);

            for (var i = 0; i < cameras.length; i++) {
                for (var j = 0; j < this._indicesForCamera[cameras[i].name].length; j++) {
                    if (cameras[i]._postProcesses[this._indicesForCamera[cameras[i].name][j]] === undefined) {
                        if (this._singleInstance) {
                            cameras[i].attachPostProcess(this._postProcesses[0], this._indicesForCamera[cameras[i].name][j]);
                        } else {
                            cameras[i].attachPostProcess(this._postProcesses[cameras[i].name], this._indicesForCamera[cameras[i].name][j]);
                        }
                    }
                }

                for (var passName in this._renderPasses) {
                    this._renderPasses[passName].incRefCount();
                }
            }
        };

        PostProcessRenderEffect.prototype.disable = function (cameras) {
            cameras = BABYLON.Tools.MakeArray(cameras || this._cameras);

            for (var i = 0; i < cameras.length; i++) {
                if (this._singleInstance) {
                    cameras[i].detachPostProcess(this._postProcesses[0], this._indicesForCamera[cameras[i].name]);
                } else {
                    cameras[i].detachPostProcess(this._postProcesses[cameras[i].name], this._indicesForCamera[cameras[i].name]);
                }

                for (var passName in this._renderPasses) {
                    this._renderPasses[passName].decRefCount();
                }
            }
        };

        PostProcessRenderEffect.prototype.getPostProcess = function () {
            return this._postProcesses[0];
        };

        PostProcessRenderEffect.prototype._linkParameters = function () {
            var that = this;
            for (var index in this._postProcesses) {
                this._postProcesses[index].onApply = function (effect) {
                    that.parameters(effect);
                    that._linkTextures(effect);
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
    })();
    BABYLON.PostProcessRenderEffect = PostProcessRenderEffect;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.postProcessRenderEffect.js.map
