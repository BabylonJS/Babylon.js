import { EngineInstrumentation } from "../../Instrumentation/engineInstrumentation";
import { Scene } from "../../scene";
import { PerfCollectionType } from "./perfCollectionType";

/**
 * Defines the general structure of what is necessary for a collection strategy.
 */
export interface IPerfViewerCollectionStrategy {
    /**
     * The id the collection uses, used for mapping purposes.
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
 * Function to get a mapping of PerfCollectionType to strategy.
 * @param scene the scene to collect data on.
 * @param engineInstrumentation engineInstrumentation which is initialized from the scene, also used to collect data on.
 * @returns a mapping of PerfCollectionType to strategy.
 */
export function collectionTypeToPredefinedStrategies(scene: Scene, engineInstrumentation: EngineInstrumentation): Record<PerfCollectionType, IPerfViewerCollectionStrategy> {
    const fpsStrategy: IPerfViewerCollectionStrategy = {
        id: "fps",
        getData: () => scene.getEngine().getFps(),
    };

    const cpuStrategy: IPerfViewerCollectionStrategy = {
        id: "cpu usage",
        getData: defaultGetDataImpl,
    };

    const totalMeshesStrategy: IPerfViewerCollectionStrategy = {
        id: "total meshes",
        getData: defaultGetDataImpl,
    };

    const activeMeshesStrategy: IPerfViewerCollectionStrategy = {
        id: "active meshes",
        getData: defaultGetDataImpl,
    };

    const activeIndiciesStrategy: IPerfViewerCollectionStrategy = {
        id: "active indices",
        getData: defaultGetDataImpl,
    };

    const activeFacesStrategy: IPerfViewerCollectionStrategy = {
        id: "active faces",
        getData: defaultGetDataImpl,
    };

    const activeBonesStrategy: IPerfViewerCollectionStrategy = {
        id: "active bones",
        getData: defaultGetDataImpl,
    };

    const activeParticlesStrategy: IPerfViewerCollectionStrategy = {
        id: "active particles",
        getData: defaultGetDataImpl,
    };

    const drawCallsStrategy: IPerfViewerCollectionStrategy = {
        id: "draw calls",
        getData: defaultGetDataImpl,
    };

    const totalLightsStrategy: IPerfViewerCollectionStrategy = {
        id: "total lights",
        getData: defaultGetDataImpl,
    };

    const totalVerticesStrategy: IPerfViewerCollectionStrategy = {
        id: "total vertices",
        getData: defaultGetDataImpl,
    };

    const totalMaterialsStrategy: IPerfViewerCollectionStrategy = {
        id: "total materials",
        getData: defaultGetDataImpl,
    };

    const totalTexturesStrategy: IPerfViewerCollectionStrategy = {
        id: "total textures",
        getData: defaultGetDataImpl,
    };

    const absoluteFpsStrategy: IPerfViewerCollectionStrategy = {
        id: "absolute fps",
        getData: defaultGetDataImpl,
    };

    const meshesSelectionStrategy: IPerfViewerCollectionStrategy = {
        id: "meshes selection time",
        getData: defaultGetDataImpl,
    };

    const renderTargetsStrategy: IPerfViewerCollectionStrategy = {
        id: "render targets time",
        getData: defaultGetDataImpl,
    };

    const particlesStrategy: IPerfViewerCollectionStrategy = {
        id: "particles time",
        getData: defaultGetDataImpl,
    };

    const spritesStrategy: IPerfViewerCollectionStrategy = {
        id: "sprites time",
        getData: defaultGetDataImpl,
    };

    const animationsStrategy: IPerfViewerCollectionStrategy = {
        id: "animations time",
        getData: defaultGetDataImpl,
    };

    const physicsStrategy: IPerfViewerCollectionStrategy = {
        id: "physics time",
        getData: defaultGetDataImpl,
    };

    const renderStrategy: IPerfViewerCollectionStrategy = {
        id: "render time",
        getData: defaultGetDataImpl,
    };

    const frameTotalStrategy: IPerfViewerCollectionStrategy = {
        id: "total frame time",
        getData: defaultGetDataImpl,
    };

    const interFrameStrategy: IPerfViewerCollectionStrategy = {
        id: "inter-frame time",
        getData: defaultGetDataImpl,
    };

    const gpuFrameTimeStrategy: IPerfViewerCollectionStrategy = {
        id: "gpu frame time",
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