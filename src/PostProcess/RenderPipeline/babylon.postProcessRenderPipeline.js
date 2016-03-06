var BABYLON;
(function (BABYLON) {
    var PostProcessRenderPipeline = (function () {
        function PostProcessRenderPipeline(engine, name) {
            this._engine = engine;
            this._name = name;
            this._renderEffects = {};
            this._renderEffectsForIsolatedPass = {};
            this._cameras = [];
        }
        Object.defineProperty(PostProcessRenderPipeline.prototype, "isSupported", {
            get: function () {
                for (var renderEffectName in this._renderEffects) {
                    if (!this._renderEffects[renderEffectName].isSupported) {
                        return false;
                    }
                }
                return true;
            },
            enumerable: true,
            configurable: true
        });
        PostProcessRenderPipeline.prototype.addEffect = function (renderEffect) {
            this._renderEffects[renderEffect._name] = renderEffect;
        };
        PostProcessRenderPipeline.prototype._enableEffect = function (renderEffectName, cameras) {
            var renderEffects = this._renderEffects[renderEffectName];
            if (!renderEffects) {
                return;
            }
            renderEffects._enable(BABYLON.Tools.MakeArray(cameras || this._cameras));
        };
        PostProcessRenderPipeline.prototype._disableEffect = function (renderEffectName, cameras) {
            var renderEffects = this._renderEffects[renderEffectName];
            if (!renderEffects) {
                return;
            }
            renderEffects._disable(BABYLON.Tools.MakeArray(cameras || this._cameras));
        };
        PostProcessRenderPipeline.prototype._attachCameras = function (cameras, unique) {
            var _cam = BABYLON.Tools.MakeArray(cameras || this._cameras);
            var indicesToDelete = [];
            var i;
            for (i = 0; i < _cam.length; i++) {
                var camera = _cam[i];
                var cameraName = camera.name;
                if (this._cameras.indexOf(camera) === -1) {
                    this._cameras[cameraName] = camera;
                }
                else if (unique) {
                    indicesToDelete.push(i);
                }
            }
            for (i = 0; i < indicesToDelete.length; i++) {
                cameras.splice(indicesToDelete[i], 1);
            }
            for (var renderEffectName in this._renderEffects) {
                this._renderEffects[renderEffectName]._attachCameras(_cam);
            }
        };
        PostProcessRenderPipeline.prototype._detachCameras = function (cameras) {
            var _cam = BABYLON.Tools.MakeArray(cameras || this._cameras);
            for (var renderEffectName in this._renderEffects) {
                this._renderEffects[renderEffectName]._detachCameras(_cam);
            }
            for (var i = 0; i < _cam.length; i++) {
                this._cameras.splice(this._cameras.indexOf(_cam[i]), 1);
            }
        };
        PostProcessRenderPipeline.prototype._enableDisplayOnlyPass = function (passName, cameras) {
            var _this = this;
            var _cam = BABYLON.Tools.MakeArray(cameras || this._cameras);
            var pass = null;
            var renderEffectName;
            for (renderEffectName in this._renderEffects) {
                pass = this._renderEffects[renderEffectName].getPass(passName);
                if (pass != null) {
                    break;
                }
            }
            if (pass === null) {
                return;
            }
            for (renderEffectName in this._renderEffects) {
                this._renderEffects[renderEffectName]._disable(_cam);
            }
            pass._name = PostProcessRenderPipeline.PASS_SAMPLER_NAME;
            for (var i = 0; i < _cam.length; i++) {
                var camera = _cam[i];
                var cameraName = camera.name;
                this._renderEffectsForIsolatedPass[cameraName] = this._renderEffectsForIsolatedPass[cameraName] || new BABYLON.PostProcessRenderEffect(this._engine, PostProcessRenderPipeline.PASS_EFFECT_NAME, function () { return new BABYLON.DisplayPassPostProcess(PostProcessRenderPipeline.PASS_EFFECT_NAME, 1.0, null, null, _this._engine, true); });
                this._renderEffectsForIsolatedPass[cameraName].emptyPasses();
                this._renderEffectsForIsolatedPass[cameraName].addPass(pass);
                this._renderEffectsForIsolatedPass[cameraName]._attachCameras(camera);
            }
        };
        PostProcessRenderPipeline.prototype._disableDisplayOnlyPass = function (cameras) {
            var _this = this;
            var _cam = BABYLON.Tools.MakeArray(cameras || this._cameras);
            for (var i = 0; i < _cam.length; i++) {
                var camera = _cam[i];
                var cameraName = camera.name;
                this._renderEffectsForIsolatedPass[cameraName] = this._renderEffectsForIsolatedPass[cameraName] || new BABYLON.PostProcessRenderEffect(this._engine, PostProcessRenderPipeline.PASS_EFFECT_NAME, function () { return new BABYLON.DisplayPassPostProcess(PostProcessRenderPipeline.PASS_EFFECT_NAME, 1.0, null, null, _this._engine, true); });
                this._renderEffectsForIsolatedPass[cameraName]._disable(camera);
            }
            for (var renderEffectName in this._renderEffects) {
                this._renderEffects[renderEffectName]._enable(_cam);
            }
        };
        PostProcessRenderPipeline.prototype._update = function () {
            for (var renderEffectName in this._renderEffects) {
                this._renderEffects[renderEffectName]._update();
            }
            for (var i = 0; i < this._cameras.length; i++) {
                var cameraName = this._cameras[i].name;
                if (this._renderEffectsForIsolatedPass[cameraName]) {
                    this._renderEffectsForIsolatedPass[cameraName]._update();
                }
            }
        };
        PostProcessRenderPipeline.prototype.dispose = function () {
            // Must be implemented by children 
        };
        PostProcessRenderPipeline.PASS_EFFECT_NAME = "passEffect";
        PostProcessRenderPipeline.PASS_SAMPLER_NAME = "passSampler";
        return PostProcessRenderPipeline;
    }());
    BABYLON.PostProcessRenderPipeline = PostProcessRenderPipeline;
})(BABYLON || (BABYLON = {}));
