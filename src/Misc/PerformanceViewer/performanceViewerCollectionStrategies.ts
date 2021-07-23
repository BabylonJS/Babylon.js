import { Engine } from "../../Engines";
import { EngineInstrumentation } from "../../Instrumentation/engineInstrumentation";
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

export type PerfStrategyInitialization = (scene: Scene, engine: Engine) => IPerfViewerCollectionStrategy;
/**
 * Defines the predefined strategies used in the performance viewer.
 */
 export class PerfCollectionStrategy {
    /**
     * Gets the initializer for the strategy used for collection of fps metrics
     * @returns the initializer for the fps strategy
     */
    public static FpsStrategy(): PerfStrategyInitialization {
        return (_, engine) => {
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
        return () => {
            return {
                id: "total meshes",
                getData: defaultGetDataImpl,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of active meshes metrics.
     * @returns the initializer for the active meshes strategy
     */
    public static ActiveMeshesStrategy(): PerfStrategyInitialization {
        return () => {
            return {
                id: "active meshes",
                getData: defaultGetDataImpl,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of active indices metrics.
     * @returns the initializer for the active indices strategy
     */
    public static ActiveIndiciesStrategy(): PerfStrategyInitialization {
        return () => {
            return {
                id: "active indices",
                getData: defaultGetDataImpl,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of active faces metrics.
     * @returns the initializer for the active faces strategy
     */
    public static ActiveFacesStrategy(): PerfStrategyInitialization {
        return () => {
            return {
                id: "active faces",
                getData: defaultGetDataImpl,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of active bones metrics.
     * @returns the initializer for the active bones strategy
     */
    public static ActiveBonesStrategy(): PerfStrategyInitialization {
        return () => {
            return {
                id: "active bones",
                getData: defaultGetDataImpl,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of active particles metrics.
     * @returns the initializer for the active particles strategy
     */
    public static ActiveParticlesStrategy(): PerfStrategyInitialization {
        return () => {
            return {
                id: "active particles",
                getData: defaultGetDataImpl,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of draw calls metrics.
     * @returns the initializer for the draw calls strategy
     */
    public static DrawCallsStrategy(): PerfStrategyInitialization {
        return () => {
            return {
                id: "draw calls",
                getData: defaultGetDataImpl,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of total lights metrics.
     * @returns the initializer for the total lights strategy
     */
    public static TotalLightsStrategy(): PerfStrategyInitialization {
        return () => {
            return {
                id: "total lights",
                getData: defaultGetDataImpl,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of total vertices metrics.
     * @returns the initializer for the total vertices strategy
     */
    public static TotalVerticesStrategy(): PerfStrategyInitialization {
        return () => {
            return {
                id: "total vertices",
                getData: defaultGetDataImpl,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of total materials metrics.
     * @returns the initializer for the total materials strategy
     */
    public static TotalMaterialsStrategy(): PerfStrategyInitialization {
        return () => {
            return {
                id: "total materials",
                getData: defaultGetDataImpl,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of total textures metrics.
     * @returns the initializer for the total textures strategy
     */
    public static TotalTexturesStrategy(): PerfStrategyInitialization {
        return () => {
            return {
                id: "total textures",
                getData: defaultGetDataImpl,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of absolute fps metrics.
     * @returns the initializer for the absolute fps strategy
     */
    public static AbsoluteFpsStrategy(): PerfStrategyInitialization {
        return () => {
            return {
                id: "absolute fps",
                getData: defaultGetDataImpl,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of meshes selection time metrics.
     * @returns the initializer for the meshes selection time strategy
     */
    public static MeshesSelectionStrategy(): PerfStrategyInitialization {
        return () => {
            return {
                id: "meshes selection time",
                getData: defaultGetDataImpl,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of render targets time metrics.
     * @returns the initializer for the render targets time strategy
     */
    public static RenderTargetsStrategy(): PerfStrategyInitialization {
        return () => {
            return {
                id: "render targets time",
                getData: defaultGetDataImpl,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of particles time metrics.
     * @returns the initializer for the particles time strategy
     */
    public static ParticlesStrategy(): PerfStrategyInitialization {
        return () => {
            return {
                id: "particles time",
                getData: defaultGetDataImpl,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of sprites time metrics.
     * @returns the initializer for the sprites time strategy
     */
    public static SpritesStrategy(): PerfStrategyInitialization {
        return () => {
            return {
                id: "sprites time",
                getData: defaultGetDataImpl,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of animations time metrics.
     * @returns the initializer for the animations time strategy
     */
    public static AnimationsStrategy(): PerfStrategyInitialization {
        return () => {
            return {
                id: "animations time",
                getData: defaultGetDataImpl,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of physics time metrics.
     * @returns the initializer for the physics time strategy
     */
    public static PhysicsStrategy(): PerfStrategyInitialization {
        return () => {
            return {
                id: "physics time",
                getData: defaultGetDataImpl,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of render time metrics.
     * @returns the initializer for the render time strategy
     */
    public static RenderStrategy(): PerfStrategyInitialization {
        return () => {
            return {
                id: "render time",
                getData: defaultGetDataImpl,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of total frame time metrics.
     * @returns the initializer for the total frame time strategy
     */
    public static FrameTotalStrategy(): PerfStrategyInitialization {
        return () => {
            return {
                id: "total frame time",
                getData: defaultGetDataImpl,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of inter-frame time metrics.
     * @returns the initializer for the inter-frame time strategy
     */
    public static InterFrameStrategy(): PerfStrategyInitialization {
        return () => {
            return {
                id: "inter-frame time",
                getData: defaultGetDataImpl,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of gpu frame time metrics.
     * @returns the initializer for the gpu frame time strategy
     */
    public static GpuFrameTimeStrategy(): PerfStrategyInitialization {
        return (_, engine) => {
            const engineInstrumentation = new EngineInstrumentation(engine);
            engineInstrumentation.captureGPUFrameTime = true;
            return {
                id:  "gpu frame time",
                getData: () => Math.max(engineInstrumentation.gpuFrameTimeCounter.lastSecAverage * 0.000001, 0),
            };
        };
    }
}