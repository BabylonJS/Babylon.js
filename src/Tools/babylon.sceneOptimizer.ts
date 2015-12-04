module BABYLON {
    // Standard optimizations
    export class SceneOptimization {
        public apply = (scene: Scene): boolean => {
            return true; // Return true if everything that can be done was applied
        };

        constructor(public priority: number = 0) {
        }
    }

    export class TextureOptimization extends SceneOptimization {
        constructor(public priority: number = 0, public maximumSize: number = 1024) {
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

    export class HardwareScalingOptimization extends SceneOptimization {
        private _currentScale = 1;

        constructor(public priority: number = 0, public maximumScale: number = 2) {
            super(priority);
        }

        public apply = (scene: Scene): boolean => {
            this._currentScale++;

            scene.getEngine().setHardwareScalingLevel(this._currentScale);

            return this._currentScale >= this.maximumScale;
        };
    }

    export class ShadowsOptimization extends SceneOptimization {
        public apply = (scene: Scene): boolean => {
            scene.shadowsEnabled = false;
            return true;
        };
    }

    export class PostProcessesOptimization extends SceneOptimization {
        public apply = (scene: Scene): boolean => {
            scene.postProcessesEnabled = false;
            return true;
        };
    }

    export class LensFlaresOptimization extends SceneOptimization {
        public apply = (scene: Scene): boolean => {
            scene.lensFlaresEnabled = false;
            return true;
        };
    }

    export class ParticlesOptimization extends SceneOptimization {
        public apply = (scene: Scene): boolean => {
            scene.particlesEnabled = false;
            return true;
        };
    }

    export class RenderTargetsOptimization extends SceneOptimization {
        public apply = (scene: Scene): boolean => {
            scene.renderTargetsEnabled = false;
            return true;
        };
    }

    export class MergeMeshesOptimization extends SceneOptimization {
        static _UpdateSelectionTree = false;

        public static get UpdateSelectionTree(): boolean {
            return MergeMeshesOptimization._UpdateSelectionTree;
        }

        public static set UpdateSelectionTree(value: boolean) {
            MergeMeshesOptimization._UpdateSelectionTree = value;
        }

        private _canBeMerged = (abstractMesh: AbstractMesh): boolean => {
            if (!(abstractMesh instanceof Mesh)) {
                return false;
            }

            var mesh = <Mesh>abstractMesh;

            if (!mesh.isVisible || !mesh.isEnabled()) {
                return false;
            }

            if (mesh.instances.length > 0) {
                return false;
            }

            if (mesh.skeleton || mesh.hasLODLevels) {
                return false;
            }

            if (mesh.parent) {
                return false;
            }

            return true;
        }

        public apply = (scene: Scene, updateSelectionTree?: boolean): boolean => {

            var globalPool = scene.meshes.slice(0);
            var globalLength = globalPool.length;

            for (var index = 0; index < globalLength; index++) {
                var currentPool = new Array<Mesh>();
                var current = globalPool[index];

                // Checks
                if (!this._canBeMerged(current)) {
                    continue;
                }

                currentPool.push(<Mesh>current);

                // Find compatible meshes
                for (var subIndex = index + 1; subIndex < globalLength; subIndex++) {
                    var otherMesh = globalPool[subIndex];

                    if (!this._canBeMerged(otherMesh)) {
                        continue;
                    }

                    if (otherMesh.material !== current.material) {
                        continue;
                    }

                    if (otherMesh.checkCollisions !== current.checkCollisions) {
                        continue;
                    }

                    currentPool.push(<Mesh>otherMesh);
                    globalLength--;

                    globalPool.splice(subIndex, 1);

                    subIndex--;
                }

                if (currentPool.length < 2) {
                    continue;
                }

                // Merge meshes
                Mesh.MergeMeshes(currentPool);
            }

            if (updateSelectionTree != undefined) {
                if (updateSelectionTree) {
                    scene.createOrUpdateSelectionOctree();
                }
            }
            else if (MergeMeshesOptimization.UpdateSelectionTree) {
                scene.createOrUpdateSelectionOctree();
            }

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
            result.optimizations.push(new MergeMeshesOptimization(priority));
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
        }

        public static ModerateDegradationAllowed(targetFrameRate?: number): SceneOptimizerOptions {
            var result = new SceneOptimizerOptions(targetFrameRate);

            var priority = 0;
            result.optimizations.push(new MergeMeshesOptimization(priority));
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
        }

        public static HighDegradationAllowed(targetFrameRate?: number): SceneOptimizerOptions {
            var result = new SceneOptimizerOptions(targetFrameRate);

            var priority = 0;
            result.optimizations.push(new MergeMeshesOptimization(priority));
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
        }
    }


    // Scene optimizer tool
    export class SceneOptimizer {

        static _CheckCurrentState(scene: Scene, options: SceneOptimizerOptions, currentPriorityLevel: number, onSuccess?: () => void, onFailure?: () => void) {
            // TODO: add an epsilon
            if (scene.getEngine().getFps() >= options.targetFrameRate) {
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