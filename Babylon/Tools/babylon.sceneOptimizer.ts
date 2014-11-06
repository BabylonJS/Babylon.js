module BABYLON {
    // Standard optimizations
    export class SceneOptimization {
        public apply = (scene: Scene): boolean => {
            return true; // Return true if everything that can be done was applied
        };

        constructor(public priority: number = 0) {
        }
    }

    export class TextureSceneOptimization extends SceneOptimization {
        constructor(public maximumSize: number = 1024, public priority: number = 0) {
            super(priority);
        }

        public apply = (scene: Scene): boolean => {

            var allDone = true;
            for (var index = 0; index < scene.textures.length; index++) {
                var texture = scene.textures[index];

                if (!texture.canRescale) {
                    continue;
                }

                var currentSize = texture.getSize();
                var maxDimension = Math.max(currentSize.width, currentSize.height);

                if (maxDimension > this.maximumSize) {
                    texture.scale(0.5);
                    allDone = false;
                }
            }

            return allDone;
        }
    }

    export class HardwareScalingSceneOptimization extends SceneOptimization {
        private _currentScale = 1;

        constructor(public maximumScale: number = 2, public priority: number = 0) {
            super(priority);
        }

        public apply = (scene: Scene): boolean => {
            this._currentScale++;

            scene.getEngine().setHardwareScalingLevel(this._currentScale);

            return this._currentScale >= this.maximumScale;
        };
    }

    export class ShadowsSceneOptimization extends SceneOptimization {
        public apply = (scene: Scene): boolean => {
            scene.shadowsEnabled = false;
            return true;
        };
    }

    export class PostProcessesSceneOptimization extends SceneOptimization {
        public apply = (scene: Scene): boolean => {
            scene.postProcessesEnabled = false;
            return true;
        };
    }

    export class LensFlaresSceneOptimization extends SceneOptimization {
        public apply = (scene: Scene): boolean => {
            scene.lensFlaresEnabled = false;
            return true;
        };
    }

    export class ParticlesSceneOptimization extends SceneOptimization {
        public apply = (scene: Scene): boolean => {
            scene.particlesEnabled = false;
            return true;
        };
    }

    // Options
    export class SceneOptimizerOptions {
        public optimizations = new Array<SceneOptimization>();

        constructor(public targetFrameRate: number = 60, public trackerDuration: number = 2000) {
        }

        public static LowDegradationAllowed(targetFrameRate?: number): SceneOptimizerOptions {
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
        }

        public static ModerateDegradationAllowed(targetFrameRate?: number): SceneOptimizerOptions {
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
            result.optimizations.push(new HardwareScalingSceneOptimization(priority, 2));

            return result;
        }

        public static HighDegradationAllowed(targetFrameRate?: number): SceneOptimizerOptions {
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
            result.optimizations.push(new HardwareScalingSceneOptimization(priority, 4));

            return result;
        }
    }


    // Scene optimizer tool
    export class SceneOptimizer {

        static _CheckCurrentState(scene: Scene, options: SceneOptimizerOptions, currentPriorityLevel: number, onSuccess?: () => void, onFailure?: () => void) {
            // TODO: add an epsilon
            if (Tools.GetFps() >= options.targetFrameRate) {
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
            scene.executeWhenReady(() => {
                setTimeout(() => {
                    SceneOptimizer._CheckCurrentState(scene, options, currentPriorityLevel, onSuccess, onFailure);
                }, options.trackerDuration);
            });
        }

        public static OptimizeAsync(scene: Scene, options?: SceneOptimizerOptions, onSuccess?: () => void, onFailure?: () => void): void {
            if (!options) {
                options = SceneOptimizerOptions.ModerateDegradationAllowed();
            }

            // Let's the system running for a specific amount of time before checking FPS
            scene.executeWhenReady(() => {
                setTimeout(() => {
                    SceneOptimizer._CheckCurrentState(scene, options, 0, onSuccess, onFailure);
                }, options.trackerDuration);
            });
        }
    }
} 