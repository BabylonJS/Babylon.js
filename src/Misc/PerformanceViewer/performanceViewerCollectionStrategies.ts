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
    /**
     * Optional function which handles any necessary initialization.
     */
    initialization?: () => void;
}

// Temporary until implemented all getDatas.
const defaultGetDataImpl = () => 0;

/**
 * Defines the predefined strategies used in the performance viewer.
 */
 export class PerfCollectionStrategy {
    /**
     * Gets the strategy used for collection of fps metrics
     * @param scene the scene used for collection of metrics.
     * @returns the fps strategy
     */
    public static FpsStrategy(scene: Scene): IPerfViewerCollectionStrategy {
        return {
            id: "fps",
            getData: () => scene.getEngine().getFps(),
        };
    }

    /**
     * Gets the strategy used for collection of cpu utilization metrics.
     * @returns the cpu utilization strategy
     */
    public static CpuStrategy(): IPerfViewerCollectionStrategy {
        return {
            id: "cpu utilization",
            getData: defaultGetDataImpl,
        };
    }

    /**
     * Gets the strategy used for collection of total meshes metrics.
     * @returns the total meshes strategy
     */
    public static TotalMeshesStrategy(): IPerfViewerCollectionStrategy {
        return {
            id: "total meshes",
            getData: defaultGetDataImpl,
        };
    }

    /**
     * Gets the strategy used for collection of active meshes metrics.
     * @returns the active meshes strategy
     */
    public static ActiveMeshesStrategy(): IPerfViewerCollectionStrategy {
        return {
            id: "active meshes",
            getData: defaultGetDataImpl,
        };
    }

    /**
     * Gets the strategy used for collection of active indices metrics.
     * @returns the active indices strategy
     */
    public static ActiveIndiciesStrategy(): IPerfViewerCollectionStrategy {
        return {
            id: "active indices",
            getData: defaultGetDataImpl,
        };
    }

    /**
     * Gets the strategy used for collection of active faces metrics.
     * @returns the active faces strategy
     */
    public static ActiveFacesStrategy(): IPerfViewerCollectionStrategy {
        return {
            id: "active faces",
            getData: defaultGetDataImpl,
        };
    }

    /**
     * Gets the strategy used for collection of active bones metrics.
     * @returns the active bones strategy
     */
    public static ActiveBonesStrategy(): IPerfViewerCollectionStrategy {
        return {
            id: "active bones",
            getData: defaultGetDataImpl,
        };
    }

    /**
     * Gets the strategy used for collection of active particles metrics.
     * @returns the active particles strategy
     */
    public static ActiveParticlesStrategy(): IPerfViewerCollectionStrategy {
        return {
            id: "active particles",
            getData: defaultGetDataImpl,
        };
    }

    /**
     * Gets the strategy used for collection of draw calls metrics.
     * @returns the draw calls strategy
     */
    public static DrawCallsStrategy(): IPerfViewerCollectionStrategy {
        return {
            id: "draw calls",
            getData: defaultGetDataImpl,
        };
    }

    /**
     * Gets the strategy used for collection of total lights metrics.
     * @returns the total lights strategy
     */
    public static TotalLightsStrategy(): IPerfViewerCollectionStrategy {
        return {
            id: "total lights",
            getData: defaultGetDataImpl,
        };
    }

    /**
     * Gets the strategy used for collection of total vertices metrics.
     * @returns the total vertices strategy
     */
    public static TotalVerticesStrategy(): IPerfViewerCollectionStrategy {
        return {
            id: "total vertices",
            getData: defaultGetDataImpl,
        };
    }

    /**
     * Gets the strategy used for collection of total materials metrics.
     * @returns the total materials strategy
     */
    public static TotalMaterialsStrategy(): IPerfViewerCollectionStrategy {
        return {
            id: "total materials",
            getData: defaultGetDataImpl,
        };
    }

    /**
     * Gets the strategy used for collection of total textures metrics.
     * @returns the total textures strategy
     */
    public static TotalTexturesStrategy(): IPerfViewerCollectionStrategy {
        return {
            id: "total textures",
            getData: defaultGetDataImpl,
        };
    }

    /**
     * Gets the strategy used for collection of absolute fps metrics.
     * @returns the absolute fps strategy
     */
    public static AbsoluteFpsStrategy(): IPerfViewerCollectionStrategy {
        return {
            id: "absolute fps",
            getData: defaultGetDataImpl,
        };
    }

    /**
     * Gets the strategy used for collection of meshes selection time metrics.
     * @returns the meshes selection time strategy
     */
    public static MeshesSelectionStrategy(): IPerfViewerCollectionStrategy {
        return {
            id: "meshes selection time",
            getData: defaultGetDataImpl,
        };
    }

    /**
     * Gets the strategy used for collection of render targets time metrics.
     * @returns the render targets time strategy
     */
    public static RenderTargetsStrategy(): IPerfViewerCollectionStrategy {
        return {
            id: "render targets time",
            getData: defaultGetDataImpl,
        };
    }

    /**
     * Gets the strategy used for collection of particles time metrics.
     * @returns the particles time strategy
     */
    public static ParticlesStrategy(): IPerfViewerCollectionStrategy {
        return {
            id: "particles time",
            getData: defaultGetDataImpl,
        };
    }

    /**
     * Gets the strategy used for collection of sprites time metrics.
     * @returns the sprites time strategy
     */
    public static SpritesStrategy(): IPerfViewerCollectionStrategy {
        return {
            id: "sprites time",
            getData: defaultGetDataImpl,
        };
    }

    /**
     * Gets the strategy used for collection of animations time metrics.
     * @returns the animations time strategy
     */
    public static AnimationsStrategy(): IPerfViewerCollectionStrategy {
        return {
            id: "animations time",
            getData: defaultGetDataImpl,
        };
    }

    /**
     * Gets the strategy used for collection of physics time metrics.
     * @returns the physics time strategy
     */
    public static PhysicsStrategy(): IPerfViewerCollectionStrategy {
        return {
            id: "physics time",
            getData: defaultGetDataImpl,
        };
    }

    /**
     * Gets the strategy used for collection of render time metrics.
     * @returns the render time strategy
     */
    public static RenderStrategy(): IPerfViewerCollectionStrategy {
        return {
            id: "render time",
            getData: defaultGetDataImpl,
        };
    }

    /**
     * Gets the strategy used for collection of total frame time metrics.
     * @returns the total frame time strategy
     */
    public static FrameTotalStrategy(): IPerfViewerCollectionStrategy {
        return {
            id: "total frame time",
            getData: defaultGetDataImpl,
        };
    }

    /**
     * Gets the strategy used for collection of inter-frame time metrics.
     * @returns the inter-frame time strategy
     */
    public static InterFrameStrategy(): IPerfViewerCollectionStrategy {
        return {
            id: "inter-frame time",
            getData: defaultGetDataImpl,
        };
    }

    /**
     * Gets the strategy used for collection of gpu frame time metrics.
     * @param engineInstrumentation engine instrumentation object used for collection of metrics.
     * @returns the gpu frame time strategy
     */
    public static GpuFrameTimeStrategy(engineInstrumentation: EngineInstrumentation): IPerfViewerCollectionStrategy {
        return {
            id:  "gpu frame time",
            getData: () => Math.max(engineInstrumentation.gpuFrameTimeCounter.lastSecAverage * 0.000001, 0),
            initialization:  () => {
                engineInstrumentation.captureGPUFrameTime = true;
            }
        };
    }
}