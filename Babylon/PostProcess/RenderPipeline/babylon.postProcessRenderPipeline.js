var BABYLON;
(function (BABYLON) {
    var PostProcessRenderPipeline = (function () {
        function PostProcessRenderPipeline(engine, name) {
            this._engine = engine;
            this._name = name;

            this._renderEffects = [];
            this._renderEffectsForIsolatedPass = [];

            this._cameras = [];
        }
        PostProcessRenderPipeline.prototype.addEffect = function (renderEffect) {
            this._renderEffects[renderEffect._name] = renderEffect;
        };

        PostProcessRenderPipeline.prototype.enableEffect = function (renderEffectName, cameras) {
            var renderEffects = this._renderEffects[renderEffectName];

            if (!renderEffects) {
                return;
            }

            renderEffects.enable(BABYLON.Tools.MakeArray(cameras || this._cameras));
        };

        PostProcessRenderPipeline.prototype.disableEffect = function (renderEffectName, cameras) {
            var renderEffects = this._renderEffects[renderEffectName];

            if (!renderEffects) {
                return;
            }

            renderEffects.disable(BABYLON.Tools.MakeArray(cameras || this._cameras));
        };

        PostProcessRenderPipeline.prototype.attachCameras = function (cameras, unique) {
            var _cam = BABYLON.Tools.MakeArray(cameras || this._cameras);

            var indicesToDelete = [];

            for (var i = 0; i < _cam.length; i++) {
                var camera = _cam[i];
                var cameraName = camera.name;

                if (this._cameras.indexOf(camera) === -1) {
                    this._cameras[cameraName] = camera;
                } else if (unique) {
                    indicesToDelete.push(i);
                }
            }

            for (var i = 0; i < indicesToDelete.length; i++) {
                cameras.splice(indicesToDelete[i], 1);
            }

            for (var renderEffectName in this._renderEffects) {
                this._renderEffects[renderEffectName]._attachCameras(_cam);
            }
        };

        PostProcessRenderPipeline.prototype.detachCameras = function (cameras) {
            var _cam = BABYLON.Tools.MakeArray(cameras || this._cameras);

            for (var renderEffectName in this._renderEffects) {
                this._renderEffects[renderEffectName]._detachCameras(_cam);
            }

            for (var i = 0; i < _cam.length; i++) {
                this._cameras.splice(this._cameras.indexOf(_cam[i]), 1);
            }
        };

        PostProcessRenderPipeline.prototype.enableDisplayOnlyPass = function (passName, cameras) {
            var _cam = BABYLON.Tools.MakeArray(cameras || this._cameras);

            var pass = null;

            for (var renderEffectName in this._renderEffects) {
                pass = this._renderEffects[renderEffectName].getPass(passName);

                if (pass != null) {
                    break;
                }
            }

            if (pass == null) {
                return;
            }

            for (var renderEffectName in this._renderEffects) {
                this._renderEffects[renderEffectName]._disable(_cam);
            }

            pass._name = PostProcessRenderPipeline.PASS_SAMPLER_NAME;

            for (var i = 0; i < _cam.length; i++) {
                this._renderEffectsForIsolatedPass[_cam[i].name] = this._renderEffectsForIsolatedPass[_cam[i].name] || new BABYLON.PostProcessRenderEffect(this._engine, PostProcessRenderPipeline.PASS_EFFECT_NAME, "BABYLON.DisplayPassPostProcess", 1.0, null, null);
                this._renderEffectsForIsolatedPass[_cam[i].name].emptyPasses();
                this._renderEffectsForIsolatedPass[_cam[i].name].addPass(pass);
                this._renderEffectsForIsolatedPass[_cam[i].name]._attachCameras(_cam[i]);
            }
        };

        PostProcessRenderPipeline.prototype.disableDisplayOnlyPass = function (cameras) {
            var _cam = BABYLON.Tools.MakeArray(cameras || this._cameras);

            for (var i = 0; i < _cam.length; i++) {
                this._renderEffectsForIsolatedPass[_cam[i].name] = this._renderEffectsForIsolatedPass[_cam[i].name] || new BABYLON.PostProcessRenderEffect(this._engine, PostProcessRenderPipeline.PASS_EFFECT_NAME, "BABYLON.DisplayPassPostProcess", 1.0, null, null);
                this._renderEffectsForIsolatedPass[_cam[i].name]._disable(_cam[i]);
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
                if (this._renderEffectsForIsolatedPass[this._cameras[i].name]) {
                    this._renderEffectsForIsolatedPass[this._cameras[i].name]._update();
                }
            }
        };
        PostProcessRenderPipeline.PASS_EFFECT_NAME = "passEffect";
        PostProcessRenderPipeline.PASS_SAMPLER_NAME = "passSampler";
        return PostProcessRenderPipeline;
    })();
    BABYLON.PostProcessRenderPipeline = PostProcessRenderPipeline;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.postProcessRenderPipeline.js.map
