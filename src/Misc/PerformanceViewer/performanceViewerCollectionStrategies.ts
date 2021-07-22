import { EngineInstrumentation } from "../../Instrumentation/engineInstrumentation";
import { Scene } from "../../scene";
import { PerfCollectionType } from "./perfCollectionType";

/**
 * Defines the general structure of what is necessary for a collection strategy.
 */
export interface IPerfViewerCollectionStrategy {
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
 * Function to get a mapping of PerfCollectionType to strategy.
 * @param scene the scene to collect data on.
 * @param engineInstrumentation engineInstrumentation which is initialized from the scene, also used to collect data on.
 * @returns a mapping of PerfCollectionType to strategy.
 */
export function collectionTypeToPredefinedStrategies(scene: Scene, engineInstrumentation: EngineInstrumentation): Record<PerfCollectionType, IPerfViewerCollectionStrategy> {
    const fpsStrategy: IPerfViewerCollectionStrategy = {
        getData: () => scene.getEngine().getFps(),
    };

    const cpuStrategy: IPerfViewerCollectionStrategy = {
        getData: defaultGetDataImpl,
    };

    const totalMeshesStrategy: IPerfViewerCollectionStrategy = {
        getData: defaultGetDataImpl,
    };

    const activeMeshesStrategy: IPerfViewerCollectionStrategy = {
        getData: defaultGetDataImpl,
    };

    const activeIndiciesStrategy: IPerfViewerCollectionStrategy = {
        getData: defaultGetDataImpl,
    };

    const activeFacesStrategy: IPerfViewerCollectionStrategy = {
        getData: defaultGetDataImpl,
    };

    const activeBonesStrategy: IPerfViewerCollectionStrategy = {
        getData: defaultGetDataImpl,
    };

    const activeParticlesStrategy: IPerfViewerCollectionStrategy = {
        getData: defaultGetDataImpl,
    };

    const drawCallsStrategy: IPerfViewerCollectionStrategy = {
        getData: defaultGetDataImpl,
    };

    const totalLightsStrategy: IPerfViewerCollectionStrategy = {
        getData: defaultGetDataImpl,
    };

    const totalVerticesStrategy: IPerfViewerCollectionStrategy = {
        getData: defaultGetDataImpl,
    };

    const totalMaterialsStrategy: IPerfViewerCollectionStrategy = {
        getData: defaultGetDataImpl,
    };

    const totalTexturesStrategy: IPerfViewerCollectionStrategy = {
        getData: defaultGetDataImpl,
    };

    const absoluteFpsStrategy: IPerfViewerCollectionStrategy = {
        getData: defaultGetDataImpl,
    };

    const meshesSelectionStrategy: IPerfViewerCollectionStrategy = {
        getData: defaultGetDataImpl,
    };

    const renderTargetsStrategy: IPerfViewerCollectionStrategy = {
        getData: defaultGetDataImpl,
    };

    const particlesStrategy: IPerfViewerCollectionStrategy = {
        getData: defaultGetDataImpl,
    };

    const spritesStrategy: IPerfViewerCollectionStrategy = {
        getData: defaultGetDataImpl,
    };

    const animationsStrategy: IPerfViewerCollectionStrategy = {
        getData: defaultGetDataImpl,
    };

    const physicsStrategy: IPerfViewerCollectionStrategy = {
        getData: defaultGetDataImpl,
    };

    const renderStrategy: IPerfViewerCollectionStrategy = {
        getData: defaultGetDataImpl,
    };

    const frameTotalStrategy: IPerfViewerCollectionStrategy = {
        getData: defaultGetDataImpl,
    };

    const interFrameStrategy: IPerfViewerCollectionStrategy = {
        getData: defaultGetDataImpl,
    };

    const gpuFrameTimeStrategy: IPerfViewerCollectionStrategy = {
        getData: () => Math.max(engineInstrumentation.gpuFrameTimeCounter.lastSecAverage * 0.000001, 0),
        initialization:  () => {
            engineInstrumentation.captureGPUFrameTime = true;
        }
    };

    return {
        [PerfCollectionType.Fps]: fpsStrategy,
        [PerfCollectionType.Cpu]: cpuStrategy,
        [PerfCollectionType.TotalMeshes]: totalMeshesStrategy,
        [PerfCollectionType.ActiveMeshes]: activeMeshesStrategy,
        [PerfCollectionType.ActiveIndicies]: activeIndiciesStrategy,
        [PerfCollectionType.ActiveFaces]: activeFacesStrategy,
        [PerfCollectionType.ActiveBones]: activeBonesStrategy,
        [PerfCollectionType.ActiveParticles]: activeParticlesStrategy,
        [PerfCollectionType.DrawCalls]: drawCallsStrategy,
        [PerfCollectionType.TotalLights]: totalLightsStrategy,
        [PerfCollectionType.TotalVertices]: totalVerticesStrategy,
        [PerfCollectionType.TotalMaterials]: totalMaterialsStrategy,
        [PerfCollectionType.TotalTextures]: totalTexturesStrategy,
        [PerfCollectionType.AbsoluteFps]: absoluteFpsStrategy,
        [PerfCollectionType.MeshesSelection]: meshesSelectionStrategy,
        [PerfCollectionType.RenderTargets]: renderTargetsStrategy,
        [PerfCollectionType.Particles]: particlesStrategy,
        [PerfCollectionType.Sprites]: spritesStrategy,
        [PerfCollectionType.Animations]: animationsStrategy,
        [PerfCollectionType.Physics]: physicsStrategy,
        [PerfCollectionType.Render]: renderStrategy,
        [PerfCollectionType.FrameTotal]: frameTotalStrategy,
        [PerfCollectionType.InterFrame]: interFrameStrategy,
        [PerfCollectionType.GpuFrameTime]: gpuFrameTimeStrategy,
    };
}