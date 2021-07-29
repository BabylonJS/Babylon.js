import { EngineInstrumentation } from "../../Instrumentation/engineInstrumentation";
import { SceneInstrumentation } from "../../Instrumentation/sceneInstrumentation";
import { Scene } from "../../scene";

/**
 * Defines the general structure of what is necessary for a collection strategy.
 */
export interface IPerfViewerCollectionStrategy {
    /**
     * The id of the strategy.
     */
    id: string;
    /**
     * Function which gets the data for the strategy.
     */
    getData: () => number;
}

// Temporary until implemented all getDatas.
const defaultGetDataImpl = () => 0;

/**
 * Initializer callback for a strategy
 */
export type PerfStrategyInitialization = (scene: Scene) => IPerfViewerCollectionStrategy;
/**
 * Defines the predefined strategies used in the performance viewer.
 */
export class PerfCollectionStrategy {
    /**
     * Gets the initializer for the strategy used for collection of fps metrics
     * @returns the initializer for the fps strategy
     */
    public static FpsStrategy(): PerfStrategyInitialization {
        return (scene) => {
            const engine = scene.getEngine();
            return {
                id: "fps",
                getData: () => engine.getFps(),
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of cpu utilization metrics.
     * @returns the initializer for the cpu utilization strategy
     */
    public static CpuStrategy(): PerfStrategyInitialization {
        return () => {
            return {
                id: "cpu utilization",
                getData: defaultGetDataImpl,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of total meshes metrics.
     * @returns the initializer for the total meshes strategy
     */
    public static TotalMeshesStrategy(): PerfStrategyInitialization {
        return (scene) => {
            return {
                id: "total meshes",
                getData: () => scene.meshes.length,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of active meshes metrics.
     * @returns the initializer for the active meshes strategy
     */
    public static ActiveMeshesStrategy(): PerfStrategyInitialization {
        return (scene) => {
            return {
                id: "active meshes",
                getData: () => scene.getActiveMeshes().length,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of active indices metrics.
     * @returns the initializer for the active indices strategy
     */
    public static ActiveIndiciesStrategy(): PerfStrategyInitialization {
        return (scene) => {
            return {
                id: "active indices",
                getData: () => scene.getActiveIndices(),
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of active faces metrics.
     * @returns the initializer for the active faces strategy
     */
    public static ActiveFacesStrategy(): PerfStrategyInitialization {
        return (scene) => {
            return {
                id: "active faces",
                getData: () => scene.getActiveIndices() / 3,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of active bones metrics.
     * @returns the initializer for the active bones strategy
     */
    public static ActiveBonesStrategy(): PerfStrategyInitialization {
        return (scene) => {
            return {
                id: "active bones",
                getData: () => scene.getActiveBones(),
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of active particles metrics.
     * @returns the initializer for the active particles strategy
     */
    public static ActiveParticlesStrategy(): PerfStrategyInitialization {
        return (scene) => {
            return {
                id: "active particles",
                getData: () => scene.getActiveParticles(),
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of draw calls metrics.
     * @returns the initializer for the draw calls strategy
     */
    public static DrawCallsStrategy(): PerfStrategyInitialization {
        return (scene) => {
            const sceneInstrumentation = new SceneInstrumentation(scene);
            return {
                id: "draw calls",
                getData: () => sceneInstrumentation.drawCallsCounter.current,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of total lights metrics.
     * @returns the initializer for the total lights strategy
     */
    public static TotalLightsStrategy(): PerfStrategyInitialization {
        return (scene) => {
            return {
                id: "total lights",
                getData: () => scene.lights.length,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of total vertices metrics.
     * @returns the initializer for the total vertices strategy
     */
    public static TotalVerticesStrategy(): PerfStrategyInitialization {
        return (scene) => {
            return {
                id: "total vertices",
                getData: () => scene.getTotalVertices(),
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of total materials metrics.
     * @returns the initializer for the total materials strategy
     */
    public static TotalMaterialsStrategy(): PerfStrategyInitialization {
        return (scene) => {
            return {
                id: "total materials",
                getData: () => scene.materials.length,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of total textures metrics.
     * @returns the initializer for the total textures strategy
     */
    public static TotalTexturesStrategy(): PerfStrategyInitialization {
        return (scene) => {
            return {
                id: "total textures",
                getData: () => scene.textures.length,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of absolute fps metrics.
     * @returns the initializer for the absolute fps strategy
     */
    public static AbsoluteFpsStrategy(): PerfStrategyInitialization {
        return (scene) => {
            const sceneInstrumentation = new SceneInstrumentation(scene);
            sceneInstrumentation.captureFrameTime = true;
            return {
                id: "absolute fps",
                getData: () => 1000.0 / sceneInstrumentation.frameTimeCounter.lastSecAverage,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of meshes selection time metrics.
     * @returns the initializer for the meshes selection time strategy
     */
    public static MeshesSelectionStrategy(): PerfStrategyInitialization {
        return (scene) => {
            const sceneInstrumentation = new SceneInstrumentation(scene);
            sceneInstrumentation.captureActiveMeshesEvaluationTime = true;
            return {
                id: "meshes selection time",
                getData: () => sceneInstrumentation.activeMeshesEvaluationTimeCounter.lastSecAverage,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of render targets time metrics.
     * @returns the initializer for the render targets time strategy
     */
    public static RenderTargetsStrategy(): PerfStrategyInitialization {
        return (scene) => {
            const sceneInstrumentation = new SceneInstrumentation(scene);
            sceneInstrumentation.captureRenderTargetsRenderTime = true;

            return {
                id: "render targets time",
                getData: () => sceneInstrumentation.renderTargetsRenderTimeCounter.lastSecAverage,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of particles time metrics.
     * @returns the initializer for the particles time strategy
     */
    public static ParticlesStrategy(): PerfStrategyInitialization {
        return (scene) => {
            const sceneInstrumentation = new SceneInstrumentation(scene);
            sceneInstrumentation.captureParticlesRenderTime = true;
            return {
                id: "particles time",
                getData: () => sceneInstrumentation.particlesRenderTimeCounter.lastSecAverage,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of sprites time metrics.
     * @returns the initializer for the sprites time strategy
     */
    public static SpritesStrategy(): PerfStrategyInitialization {
        return (scene) => {
            const sceneInstrumentation = new SceneInstrumentation(scene);
            sceneInstrumentation.captureSpritesRenderTime = true;
            return {
                id: "sprites time",
                getData: () => sceneInstrumentation.spritesRenderTimeCounter.lastSecAverage,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of animations time metrics.
     * @returns the initializer for the animations time strategy
     */
    public static AnimationsStrategy(): PerfStrategyInitialization {
        return (scene) => {
            const sceneInstrumentation = new SceneInstrumentation(scene);
            sceneInstrumentation.captureAnimationsTime = true;
            return {
                id: "animations time",
                getData: () => sceneInstrumentation.animationsTimeCounter.lastSecAverage,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of physics time metrics.
     * @returns the initializer for the physics time strategy
     */
    public static PhysicsStrategy(): PerfStrategyInitialization {
        return (scene) => {
            const sceneInstrumentation = new SceneInstrumentation(scene);
            sceneInstrumentation.capturePhysicsTime = true;
            return {
                id: "physics time",
                getData: () => sceneInstrumentation.physicsTimeCounter.lastSecAverage,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of render time metrics.
     * @returns the initializer for the render time strategy
     */
    public static RenderStrategy(): PerfStrategyInitialization {
        return (scene) => {
            const sceneInstrumentation = new SceneInstrumentation(scene);
            sceneInstrumentation.captureRenderTime = true;
            return {
                id: "render time",
                getData: () => sceneInstrumentation.renderTimeCounter.lastSecAverage,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of total frame time metrics.
     * @returns the initializer for the total frame time strategy
     */
    public static FrameTotalStrategy(): PerfStrategyInitialization {
        return (scene) => {
            const sceneInstrumentation = new SceneInstrumentation(scene);
            sceneInstrumentation.captureFrameTime = true;
            return {
                id: "total frame time",
                getData: () => sceneInstrumentation.frameTimeCounter.lastSecAverage,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of inter-frame time metrics.
     * @returns the initializer for the inter-frame time strategy
     */
    public static InterFrameStrategy(): PerfStrategyInitialization {
        return (scene) => {
            const sceneInstrumentation = new SceneInstrumentation(scene);
            sceneInstrumentation.captureInterFrameTime = true
            return {
                id: "inter-frame time",
                getData: () => sceneInstrumentation.interFrameTimeCounter.lastSecAverage,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of gpu frame time metrics.
     * @returns the initializer for the gpu frame time strategy
     */
    public static GpuFrameTimeStrategy(): PerfStrategyInitialization {
        return (scene) => {
            const engineInstrumentation = new EngineInstrumentation(scene.getEngine());
            engineInstrumentation.captureGPUFrameTime = true;
            return {
                id: "gpu frame time",
                getData: () => Math.max(engineInstrumentation.gpuFrameTimeCounter.lastSecAverage * 0.000001, 0),
            };
        };
    }
}