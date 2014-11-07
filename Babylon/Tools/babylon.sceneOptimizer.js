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

    var TextureOptimization = (function (_super) {
        __extends(TextureOptimization, _super);
        function TextureOptimization(priority, maximumSize) {
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
        return TextureOptimization;
    })(SceneOptimization);
    BABYLON.TextureOptimization = TextureOptimization;

    var HardwareScalingOptimization = (function (_super) {
        __extends(HardwareScalingOptimization, _super);
        function HardwareScalingOptimization(priority, maximumScale) {
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
        return HardwareScalingOptimization;
    })(SceneOptimization);
    BABYLON.HardwareScalingOptimization = HardwareScalingOptimization;

    var ShadowsOptimization = (function (_super) {
        __extends(ShadowsOptimization, _super);
        function ShadowsOptimization() {
            _super.apply(this, arguments);
            this.apply = function (scene) {
                scene.shadowsEnabled = false;
                return true;
            };
        }
        return ShadowsOptimization;
    })(SceneOptimization);
    BABYLON.ShadowsOptimization = ShadowsOptimization;

    var PostProcessesOptimization = (function (_super) {
        __extends(PostProcessesOptimization, _super);
        function PostProcessesOptimization() {
            _super.apply(this, arguments);
            this.apply = function (scene) {
                scene.postProcessesEnabled = false;
                return true;
            };
        }
        return PostProcessesOptimization;
    })(SceneOptimization);
    BABYLON.PostProcessesOptimization = PostProcessesOptimization;

    var LensFlaresOptimization = (function (_super) {
        __extends(LensFlaresOptimization, _super);
        function LensFlaresOptimization() {
            _super.apply(this, arguments);
            this.apply = function (scene) {
                scene.lensFlaresEnabled = false;
                return true;
            };
        }
        return LensFlaresOptimization;
    })(SceneOptimization);
    BABYLON.LensFlaresOptimization = LensFlaresOptimization;

    var ParticlesOptimization = (function (_super) {
        __extends(ParticlesOptimization, _super);
        function ParticlesOptimization() {
            _super.apply(this, arguments);
            this.apply = function (scene) {
                scene.particlesEnabled = false;
                return true;
            };
        }
        return ParticlesOptimization;
    })(SceneOptimization);
    BABYLON.ParticlesOptimization = ParticlesOptimization;

    var RenderTargetsOptimization = (function (_super) {
        __extends(RenderTargetsOptimization, _super);
        function RenderTargetsOptimization() {
            _super.apply(this, arguments);
            this.apply = function (scene) {
                scene.renderTargetsEnabled = false;
                return true;
            };
        }
        return RenderTargetsOptimization;
    })(SceneOptimization);
    BABYLON.RenderTargetsOptimization = RenderTargetsOptimization;

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
            result.optimizations.push(new ShadowsOptimization(priority));
            result.optimizations.push(new LensFlaresOptimization(priority));

            // Next priority
            priority++;
            result.optimizations.push(new PostProcessesOptimization(priority));
            result.optimizations.push(new ParticlesOptimization(priority));

            // Next priority
            priority++;
            result.optimizations.push(new TextureOptimization(priority, 1024));

            return result;
        };

        SceneOptimizerOptions.ModerateDegradationAllowed = function (targetFrameRate) {
            var result = new SceneOptimizerOptions(targetFrameRate);

            var priority = 0;
            result.optimizations.push(new ShadowsOptimization(priority));
            result.optimizations.push(new LensFlaresOptimization(priority));

            // Next priority
            priority++;
            result.optimizations.push(new PostProcessesOptimization(priority));
            result.optimizations.push(new ParticlesOptimization(priority));

            // Next priority
            priority++;
            result.optimizations.push(new TextureOptimization(priority, 512));

            // Next priority
            priority++;
            result.optimizations.push(new RenderTargetsOptimization(priority));

            // Next priority
            priority++;
            result.optimizations.push(new HardwareScalingOptimization(priority, 2));

            return result;
        };

        SceneOptimizerOptions.HighDegradationAllowed = function (targetFrameRate) {
            var result = new SceneOptimizerOptions(targetFrameRate);

            var priority = 0;
            result.optimizations.push(new ShadowsOptimization(priority));
            result.optimizations.push(new LensFlaresOptimization(priority));

            // Next priority
            priority++;
            result.optimizations.push(new PostProcessesOptimization(priority));
            result.optimizations.push(new ParticlesOptimization(priority));

            // Next priority
            priority++;
            result.optimizations.push(new TextureOptimization(priority, 256));

            // Next priority
            priority++;
            result.optimizations.push(new RenderTargetsOptimization(priority));

            // Next priority
            priority++;
            result.optimizations.push(new HardwareScalingOptimization(priority, 4));

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
