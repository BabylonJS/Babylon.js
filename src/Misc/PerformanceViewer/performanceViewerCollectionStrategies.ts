import { EngineInstrumentation } from "../../Instrumentation/engineInstrumentation";
import { Scene } from "../../scene";
import { PrecisionDate } from "../precisionDate";

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
     * Function which does any necessary cleanup. Called when performanceViewerCollector.dispose() is called.
     */
    dispose: () => void;
}
// Dispose which does nothing.
const defaultDisposeImpl = () => {};

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
                dispose: defaultDisposeImpl,
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
                dispose: defaultDisposeImpl,
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
                dispose: defaultDisposeImpl,
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
                dispose: defaultDisposeImpl,
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
                dispose: defaultDisposeImpl,
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
                dispose: defaultDisposeImpl,
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
                dispose: defaultDisposeImpl,
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
                dispose: defaultDisposeImpl,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of draw calls metrics.
     * @returns the initializer for the draw calls strategy
     */
    public static DrawCallsStrategy(): PerfStrategyInitialization {
        return (scene) => {
            let drawCalls = 0;
            const onBeforeAnimationsObserver = scene.onBeforeAnimationsObservable.add(() => {
                scene.getEngine()._drawCalls.fetchNewFrame();
            });

            const onAfterRenderObserver = scene.onAfterRenderObservable.add(() => {
                drawCalls = scene.getEngine()._drawCalls.current
            });

            return {
                id: "draw calls",
                getData: () => drawCalls,
                dispose: () => {
                    scene.onBeforeAnimationsObservable.remove(onBeforeAnimationsObserver);
                    scene.onAfterRenderObservable.remove(onAfterRenderObserver);
                },
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
                dispose: defaultDisposeImpl,
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
                dispose: defaultDisposeImpl,
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
                dispose: defaultDisposeImpl,
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
                dispose: defaultDisposeImpl,
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of absolute fps metrics.
     * @returns the initializer for the absolute fps strategy
     */
    public static AbsoluteFpsStrategy(): PerfStrategyInitialization {
        return (scene) => {
            let startTime = PrecisionDate.Now;
            let timeTaken = 1;
            const onBeforeAnimationsObserver = scene.onBeforeAnimationsObservable.add(() => {
                startTime = PrecisionDate.Now;
            });

            const onAfterRenderObserver = scene.onAfterRenderObservable.add(() => {
                timeTaken = PrecisionDate.Now - startTime;
            });

            return {
                id: "absolute fps",
                getData: () => 1000.0 / timeTaken,
                dispose: () => {
                    scene.onBeforeAnimationsObservable.remove(onBeforeAnimationsObserver);
                    scene.onAfterRenderObservable.remove(onAfterRenderObserver);
                },
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of meshes selection time metrics.
     * @returns the initializer for the meshes selection time strategy
     */
    public static MeshesSelectionStrategy(): PerfStrategyInitialization {
        return (scene) => {
            let startTime = PrecisionDate.Now;
            let timeTaken = 0;
            const onBeforeActiveMeshesObserver = scene.onBeforeActiveMeshesEvaluationObservable.add(() => {
                startTime = PrecisionDate.Now;
            });

            const onAfterActiveMeshesObserver = scene.onAfterActiveMeshesEvaluationObservable.add(() => {
                timeTaken = PrecisionDate.Now - startTime;
            });

            return {
                id: "meshes selection time",
                getData: () => timeTaken,
                dispose: () => {
                    scene.onBeforeActiveMeshesEvaluationObservable.remove(onBeforeActiveMeshesObserver);
                    scene.onAfterActiveMeshesEvaluationObservable.remove(onAfterActiveMeshesObserver);
                },
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of render targets time metrics.
     * @returns the initializer for the render targets time strategy
     */
    public static RenderTargetsStrategy(): PerfStrategyInitialization {
        return (scene) => {
            let startTime = PrecisionDate.Now;
            let timeTaken = 0;
            const onBeforeRenderTargetsObserver = scene.onBeforeRenderTargetsRenderObservable.add(() => {
                startTime = PrecisionDate.Now;
            });

            const onAfterRenderTargetsObserver = scene.onAfterRenderTargetsRenderObservable.add(() => {
                timeTaken = PrecisionDate.Now - startTime;
            });

            return {
                id: "render targets time",
                getData: () => timeTaken,
                dispose: () => {
                    scene.onBeforeRenderTargetsRenderObservable.remove(onBeforeRenderTargetsObserver);
                    scene.onAfterRenderTargetsRenderObservable.remove(onAfterRenderTargetsObserver);
                },
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of particles time metrics.
     * @returns the initializer for the particles time strategy
     */
    public static ParticlesStrategy(): PerfStrategyInitialization {
        return (scene) => {
            let startTime = PrecisionDate.Now;
            let timeTaken = 0;
            const onBeforeParticlesObserver = scene.onBeforeParticlesRenderingObservable.add(() => {
                startTime = PrecisionDate.Now;
            });

            const onAfterParticlesObserver = scene.onAfterParticlesRenderingObservable.add(() => {
                timeTaken = PrecisionDate.Now - startTime;
            });

            return {
                id: "particles time",
                getData: () => timeTaken,
                dispose: () => {
                    scene.onBeforeParticlesRenderingObservable.remove(onBeforeParticlesObserver);
                    scene.onAfterParticlesRenderingObservable.remove(onAfterParticlesObserver);
                },
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of sprites time metrics.
     * @returns the initializer for the sprites time strategy
     */
    public static SpritesStrategy(): PerfStrategyInitialization {
        return (scene) => {
            let startTime = PrecisionDate.Now;
            let timeTaken = 0;
            const onBeforeSpritesObserver = scene.onBeforeSpritesRenderingObservable.add(() => {
                startTime = PrecisionDate.Now;
            });

            const onAfterSpritesObserver = scene.onAfterSpritesRenderingObservable.add(() => {
                timeTaken = PrecisionDate.Now - startTime;
            });

            return {
                id: "sprites time",
                getData: () => timeTaken,
                dispose: () => {
                    scene.onBeforeSpritesRenderingObservable.remove(onBeforeSpritesObserver);
                    scene.onAfterSpritesRenderingObservable.remove(onAfterSpritesObserver);
                },
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of animations time metrics.
     * @returns the initializer for the animations time strategy
     */
    public static AnimationsStrategy(): PerfStrategyInitialization {
        return (scene) => {
            let startTime = PrecisionDate.Now;
            let timeTaken = 0;
            const onBeforeAnimationsObserver = scene.onBeforeAnimationsObservable.add(() => {
                startTime = PrecisionDate.Now;
            });

            const onAfterAnimationsObserver = scene.onAfterAnimationsObservable.add(() => {
                timeTaken = PrecisionDate.Now - startTime;
            });

            return {
                id: "animations time",
                getData: () => timeTaken,
                dispose: () => {
                    scene.onBeforeAnimationsObservable.remove(onBeforeAnimationsObserver);
                    scene.onAfterAnimationsObservable.remove(onAfterAnimationsObserver);
                },
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of physics time metrics.
     * @returns the initializer for the physics time strategy
     */
    public static PhysicsStrategy(): PerfStrategyInitialization {
        return (scene) => {
            let startTime = PrecisionDate.Now;
            let timeTaken = 0;
            const onBeforePhysicsObserver = scene.onBeforePhysicsObservable.add(() => {
                startTime = PrecisionDate.Now;
            });

            const onAfterPhysicsObserver = scene.onAfterPhysicsObservable.add(() => {
                timeTaken = PrecisionDate.Now - startTime;
            });

            return {
                id: "physics time",
                getData: () => timeTaken,
                dispose: () => {
                    scene.onBeforePhysicsObservable.remove(onBeforePhysicsObserver);
                    scene.onAfterPhysicsObservable.remove(onAfterPhysicsObserver);
                },
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of render time metrics.
     * @returns the initializer for the render time strategy
     */
    public static RenderStrategy(): PerfStrategyInitialization {
        return (scene) => {
            let startTime = PrecisionDate.Now;
            let timeTaken = 0;
            const onBeforeDrawPhaseObserver = scene.onBeforeDrawPhaseObservable.add(() => {
                startTime = PrecisionDate.Now;
            });

            const onAfterDrawPhaseObserver = scene.onAfterDrawPhaseObservable.add(() => {
                timeTaken = PrecisionDate.Now - startTime;
            });

            return {
                id: "render time",
                getData: () => timeTaken,
                dispose: () => {
                    scene.onBeforeDrawPhaseObservable.remove(onBeforeDrawPhaseObserver);
                    scene.onAfterDrawPhaseObservable.remove(onAfterDrawPhaseObserver);
                },
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of total frame time metrics.
     * @returns the initializer for the total frame time strategy
     */
    public static FrameTotalStrategy(): PerfStrategyInitialization {
        return (scene) => {
            let startTime = PrecisionDate.Now;
            let timeTaken = 0;
            const onBeforeAnimationsObserver = scene.onBeforeAnimationsObservable.add(() => {
                startTime = PrecisionDate.Now;
            });

            const onAfterRenderObserver = scene.onAfterRenderObservable.add(() => {
                timeTaken = PrecisionDate.Now - startTime;
            });

            return {
                id: "total frame time",
                getData: () => timeTaken,
                dispose: () => {
                    scene.onBeforeAnimationsObservable.remove(onBeforeAnimationsObserver);
                    scene.onAfterRenderObservable.remove(onAfterRenderObserver);
                },
            };
        };
    }

    /**
     * Gets the initializer for the strategy used for collection of inter-frame time metrics.
     * @returns the initializer for the inter-frame time strategy
     */
    public static InterFrameStrategy(): PerfStrategyInitialization {
        return (scene) => {
            let startTime = PrecisionDate.Now;
            let timeTaken = 0;

            const onBeforeAnimationsObserver = scene.onBeforeAnimationsObservable.add(() => {
                timeTaken = PrecisionDate.Now - startTime;
            });

            const onAfterRenderObserver = scene.onAfterRenderObservable.add(() => {
                startTime = PrecisionDate.Now;
            });
  
            return {
                id: "inter-frame time",
                getData: () => timeTaken,
                dispose: () => {
                    scene.onBeforeAnimationsObservable.remove(onBeforeAnimationsObserver);
                    scene.onAfterRenderObservable.remove(onAfterRenderObserver);
                },
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
                getData: () => Math.max(engineInstrumentation.gpuFrameTimeCounter.current * 0.000001, 0),
                dispose: () => {
                    engineInstrumentation.dispose();
                },
            };
        };
    }
}