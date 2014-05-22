var BABYLON;
(function (BABYLON) {
    var PostProcessRenderPipeline = (function () {
        function PostProcessRenderPipeline(engine, name) {
            this._engine = engine;
            this.name = name;

            this._renderEffects = [];
            this._renderEffectsPasses = [];

            this._cameras = [];
        }
        PostProcessRenderPipeline.prototype.addEffect = function (renderEffect) {
            this._renderEffects[renderEffect.name] = renderEffect;
        };

        PostProcessRenderPipeline.prototype.enableEffect = function (renderEffectName, cameras) {
            cameras = BABYLON.Tools.MakeArray(cameras || this._cameras);

            var renderEffects = this._renderEffects[renderEffectName];

            if (!renderEffects) {
                return;
            }

            renderEffects.enable(cameras);
        };

        PostProcessRenderPipeline.prototype.disableEffect = function (renderEffectName, cameras) {
            cameras = BABYLON.Tools.MakeArray(cameras || this._cameras);

            var renderEffects = this._renderEffects[renderEffectName];

            if (!renderEffects) {
                return;
            }

            renderEffects.disable(cameras);
        };

        PostProcessRenderPipeline.prototype.attachCameras = function (cameras, unique) {
            cameras = BABYLON.Tools.MakeArray(cameras || this._cameras);

            var indicesToDelete = [];

            for (var i = 0; i < cameras.length; i++) {
                if (this._cameras.indexOf(cameras[i]) == -1) {
                    this._cameras[cameras[i].name] = cameras[i];
                } else if (unique) {
                    indicesToDelete.push(i);
                }
            }

            for (var i = 0; i < indicesToDelete.length; i++) {
                cameras.splice(indicesToDelete[i], 1);
            }

            for (var renderEffectName in this._renderEffects) {
                this._renderEffects[renderEffectName].attachCameras(cameras);
            }
        };

        PostProcessRenderPipeline.prototype.detachCameras = function (cameras) {
            cameras = BABYLON.Tools.MakeArray(cameras || this._cameras);

            for (var renderEffectName in this._renderEffects) {
                this._renderEffects[renderEffectName].detachCameras(cameras);
            }

            for (var i = 0; i < cameras.length; i++) {
                this._cameras.splice(this._cameras.indexOf(cameras[i]), 1);
            }
        };

        PostProcessRenderPipeline.prototype.enableDisplayOnlyPass = function (passName, cameras) {
            cameras = BABYLON.Tools.MakeArray(cameras || this._cameras);

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
                this._renderEffects[renderEffectName].disable(cameras);
            }

            pass._name = PostProcessRenderPipeline.PASS_SAMPLER_NAME;

            for (var i = 0; i < cameras.length; i++) {
                this._renderEffectsPasses[cameras[i].name] = this._renderEffectsPasses[cameras[i].name] || new BABYLON.PostProcessRenderEffect(this._engine, PostProcessRenderPipeline.PASS_EFFECT_NAME, "BABYLON.DisplayPassPostProcess", 1.0, null, null);
                this._renderEffectsPasses[cameras[i].name].emptyPasses();
                this._renderEffectsPasses[cameras[i].name].addPass(pass);
                this._renderEffectsPasses[cameras[i].name].attachCameras(cameras[i]);
            }
        };

        PostProcessRenderPipeline.prototype.disableDisplayOnlyPass = function (cameras) {
            cameras = BABYLON.Tools.MakeArray(cameras || this._cameras);

            for (var i = 0; i < cameras.length; i++) {
                this._renderEffectsPasses[cameras[i].name] = this._renderEffectsPasses[cameras[i].name] || new BABYLON.PostProcessRenderEffect(this._engine, PostProcessRenderPipeline.PASS_EFFECT_NAME, "BABYLON.DisplayPassPostProcess", 1.0, null, null);
                this._renderEffectsPasses[cameras[i].name].disable(cameras[i]);
            }

            for (var renderEffectName in this._renderEffects) {
                this._renderEffects[renderEffectName].enable(cameras);
            }
        };

        PostProcessRenderPipeline.prototype._update = function () {
            for (var renderEffectName in this._renderEffects) {
                this._renderEffects[renderEffectName]._update();
            }

            for (var i = 0; i < this._cameras.length; i++) {
                if (this._renderEffectsPasses[this._cameras[i].name]) {
                    this._renderEffectsPasses[this._cameras[i].name]._update();
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
