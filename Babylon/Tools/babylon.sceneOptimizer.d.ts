declare module BABYLON {
    class SceneOptimization {
        public priority: number;
        public apply: (scene: Scene) => boolean;
        constructor(priority?: number);
    }
    class TextureOptimization extends SceneOptimization {
        public priority: number;
        public maximumSize: number;
        constructor(priority?: number, maximumSize?: number);
        public apply: (scene: Scene) => boolean;
    }
    class HardwareScalingOptimization extends SceneOptimization {
        public priority: number;
        public maximumScale: number;
        private _currentScale;
        constructor(priority?: number, maximumScale?: number);
        public apply: (scene: Scene) => boolean;
    }
    class ShadowsOptimization extends SceneOptimization {
        public apply: (scene: Scene) => boolean;
    }
    class PostProcessesOptimization extends SceneOptimization {
        public apply: (scene: Scene) => boolean;
    }
    class LensFlaresOptimization extends SceneOptimization {
        public apply: (scene: Scene) => boolean;
    }
    class ParticlesOptimization extends SceneOptimization {
        public apply: (scene: Scene) => boolean;
    }
    class RenderTargetsOptimization extends SceneOptimization {
        public apply: (scene: Scene) => boolean;
    }
    class MergeMeshesOptimization extends SceneOptimization {
        private _canBeMerged;
        public apply: (scene: Scene) => boolean;
    }
    class SceneOptimizerOptions {
        public targetFrameRate: number;
        public trackerDuration: number;
        public optimizations: SceneOptimization[];
        constructor(targetFrameRate?: number, trackerDuration?: number);
        static LowDegradationAllowed(targetFrameRate?: number): SceneOptimizerOptions;
        static ModerateDegradationAllowed(targetFrameRate?: number): SceneOptimizerOptions;
        static HighDegradationAllowed(targetFrameRate?: number): SceneOptimizerOptions;
    }
    class SceneOptimizer {
        static _CheckCurrentState(scene: Scene, options: SceneOptimizerOptions, currentPriorityLevel: number, onSuccess?: () => void, onFailure?: () => void): void;
        static OptimizeAsync(scene: Scene, options?: SceneOptimizerOptions, onSuccess?: () => void, onFailure?: () => void): void;
    }
}
