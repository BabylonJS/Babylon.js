var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    // Standard optimizations
    var SceneOptimization = (function () {
        function SceneOptimization(priority) {
            if (typeof priority === "undefined") { priority = 0; }
            this.priority = priority;
            this.apply = function (scene) {
                return true;
            };
        }
        return SceneOptimization;
    })();
    BABYLON.SceneOptimization = SceneOptimization;

    var TextureSceneOptimization = (function (_super) {
        __extends(TextureSceneOptimization, _super);
        function TextureSceneOptimization(priority, maximumSize) {
            if (typeof priority === "undefined") { priority = 0; }
            if (typeof maximumSize === "undefined") { maximumSize = 1024; }
            var _this = this;
            _super.call(this, priority);
            this.priority = priority;
            this.maximumSize = maximumSize;
            this.apply = function (scene) {
                var allDone = true;
                for (var index = 0; index < scene.textures.length; index++) {
                    var texture = scene.textures[index];

                    if (!texture.canRescale) {
                        continue;
                    }

                    var currentSize = texture.getSize();
                    var maxDimension = Math.max(currentSize.width, currentSize.height);

                    if (maxDimension > _this.maximumSize) {
                        texture.scale(0.5);
                        allDone = false;
                    }
                }

                return allDone;
            };
        }
        return TextureSceneOptimization;
    })(SceneOptimization);
    BABYLON.TextureSceneOptimization = TextureSceneOptimization;

    var HardwareScalingSceneOptimization = (function (_super) {
        __extends(HardwareScalingSceneOptimization, _super);
        function HardwareScalingSceneOptimization(priority, maximumScale) {
            if (typeof priority === "undefined") { priority = 0; }
            if (typeof maximumScale === "undefined") { maximumScale = 2; }
            var _this = this;
            _super.call(this, priority);
            this.priority = priority;
            this.maximumScale = maximumScale;
            this._currentScale = 1;
            this.apply = function (scene) {
                _this._currentScale++;

                scene.getEngine().setHardwareScalingLevel(_this._currentScale);

                return _this._currentScale >= _this.maximumScale;
            };
        }
        return HardwareScalingSceneOptimization;
    })(SceneOptimization);
    BABYLON.HardwareScalingSceneOptimization = HardwareScalingSceneOptimization;

    var ShadowsSceneOptimization = (function (_super) {
        __extends(ShadowsSceneOptimization, _super);
        function ShadowsSceneOptimization() {
            _super.apply(this, arguments);
            this.apply = function (scene) {
                scene.shadowsEnabled = false;
                return true;
            };
        }
        return ShadowsSceneOptimization;
    })(SceneOptimization);
    BABYLON.ShadowsSceneOptimization = ShadowsSceneOptimization;

    var PostProcessesSceneOptimization = (function (_super) {
        __extends(PostProcessesSceneOptimization, _super);
        function PostProcessesSceneOptimization() {
            _super.apply(this, arguments);
            this.apply = function (scene) {
                scene.postProcessesEnabled = false;
                return true;
            };
        }
        return PostProcessesSceneOptimization;
    })(SceneOptimization);
    BABYLON.PostProcessesSceneOptimization = PostProcessesSceneOptimization;

    var LensFlaresSceneOptimization = (function (_super) {
        __extends(LensFlaresSceneOptimization, _super);
        function LensFlaresSceneOptimization() {
            _super.apply(this, arguments);
            this.apply = function (scene) {
                scene.lensFlaresEnabled = false;
                return true;
            };
        }
        return LensFlaresSceneOptimization;
    })(SceneOptimization);
    BABYLON.LensFlaresSceneOptimization = LensFlaresSceneOptimization;

    var ParticlesSceneOptimization = (function (_super) {
        __extends(ParticlesSceneOptimization, _super);
        function ParticlesSceneOptimization() {
            _super.apply(this, arguments);
            this.apply = function (scene) {
                scene.particlesEnabled = false;
                return true;
            };
        }
        return ParticlesSceneOptimization;
    })(SceneOptimization);
    BABYLON.ParticlesSceneOptimization = ParticlesSceneOptimization;

    var RenderTargetsSceneOptimization = (function (_super) {
        __extends(RenderTargetsSceneOptimization, _super);
        function RenderTargetsSceneOptimization() {
            _super.apply(this, arguments);
            this.apply = function (scene) {
                scene.renderTargetsEnabled = false;
                return true;
            };
        }
        return RenderTargetsSceneOptimization;
    })(SceneOptimization);
    BABYLON.RenderTargetsSceneOptimization = RenderTargetsSceneOptimization;

    // Options
    var SceneOptimizerOptions = (function () {
        function SceneOptimizerOptions(targetFrameRate, trackerDuration) {
            if (typeof targetFrameRate === "undefined") { targetFrameRate = 60; }
            if (typeof trackerDuration === "undefined") { trackerDuration = 2000; }
            this.targetFrameRate = targetFrameRate;
            this.trackerDuration = trackerDuration;
            this.optimizations = new Array();
        }
        SceneOptimizerOptions.LowDegradationAllowed = function (targetFrameRate) {
            var result = new SceneOptimizerOptions(targetFrameRate);

            var priority = 0;
            result.optimizations.push(new ShadowsSceneOptimization(priority));
            result.optimizations.push(new LensFlaresSceneOptimization(priority));

            // Next priority
            priority++;
            result.optimizations.push(new PostProcessesSceneOptimization(priority));
            result.optimizations.push(new ParticlesSceneOptimization(priority));

            // Next priority
            priority++;
            result.optimizations.push(new TextureSceneOptimization(priority, 1024));

            return result;
        };

        SceneOptimizerOptions.ModerateDegradationAllowed = function (targetFrameRate) {
            var result = new SceneOptimizerOptions(targetFrameRate);

            var priority = 0;
            result.optimizations.push(new ShadowsSceneOptimization(priority));
            result.optimizations.push(new LensFlaresSceneOptimization(priority));

            // Next priority
            priority++;
            result.optimizations.push(new PostProcessesSceneOptimization(priority));
            result.optimizations.push(new ParticlesSceneOptimization(priority));

            // Next priority
            priority++;
            result.optimizations.push(new TextureSceneOptimization(priority, 512));

            // Next priority
            priority++;
            result.optimizations.push(new RenderTargetsSceneOptimization(priority));

            // Next priority
            priority++;
            result.optimizations.push(new HardwareScalingSceneOptimization(priority, 2));

            return result;
        };

        SceneOptimizerOptions.HighDegradationAllowed = function (targetFrameRate) {
            var result = new SceneOptimizerOptions(targetFrameRate);

            var priority = 0;
            result.optimizations.push(new ShadowsSceneOptimization(priority));
            result.optimizations.push(new LensFlaresSceneOptimization(priority));

            // Next priority
            priority++;
            result.optimizations.push(new PostProcessesSceneOptimization(priority));
            result.optimizations.push(new ParticlesSceneOptimization(priority));

            // Next priority
            priority++;
            result.optimizations.push(new TextureSceneOptimization(priority, 256));

            // Next priority
            priority++;
            result.optimizations.push(new RenderTargetsSceneOptimization(priority));

            // Next priority
            priority++;
            result.optimizations.push(new HardwareScalingSceneOptimization(priority, 4));

            return result;
        };
        return SceneOptimizerOptions;
    })();
    BABYLON.SceneOptimizerOptions = SceneOptimizerOptions;

    // Scene optimizer tool
    var SceneOptimizer = (function () {
        function SceneOptimizer() {
        }
        SceneOptimizer._CheckCurrentState = function (scene, options, currentPriorityLevel, onSuccess, onFailure) {
            // TODO: add an epsilon
            if (BABYLON.Tools.GetFps() >= options.targetFrameRate) {
                if (onSuccess) {
                    onSuccess();
                }

                return;
            }

            // Apply current level of optimizations
            var allDone = true;
            var noOptimizationApplied = true;
            for (var index = 0; index < options.optimizations.length; index++) {
                var optimization = options.optimizations[index];

                if (optimization.priority === currentPriorityLevel) {
                    noOptimizationApplied = false;
                    allDone = allDone && optimization.apply(scene);
                }
            }

            // If no optimization was applied, this is a failure :(
            if (noOptimizationApplied) {
                if (onFailure) {
                    onFailure();
                }

                return;
            }

            // If all optimizations were done, move to next level
            if (allDone) {
                currentPriorityLevel++;
            }

            // Let's the system running for a specific amount of time before checking FPS
            scene.executeWhenReady(function () {
                setTimeout(function () {
                    SceneOptimizer._CheckCurrentState(scene, options, currentPriorityLevel, onSuccess, onFailure);
                }, options.trackerDuration);
            });
        };

        SceneOptimizer.OptimizeAsync = function (scene, options, onSuccess, onFailure) {
            if (!options) {
                options = SceneOptimizerOptions.ModerateDegradationAllowed();
            }

            // Let's the system running for a specific amount of time before checking FPS
            scene.executeWhenReady(function () {
                setTimeout(function () {
                    SceneOptimizer._CheckCurrentState(scene, options, 0, onSuccess, onFailure);
                }, options.trackerDuration);
            });
        };
        return SceneOptimizer;
    })();
    BABYLON.SceneOptimizer = SceneOptimizer;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.sceneOptimizer.js.map
