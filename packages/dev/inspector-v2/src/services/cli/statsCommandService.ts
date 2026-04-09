import { EngineInstrumentation } from "core/Instrumentation/engineInstrumentation";
import { SceneInstrumentation } from "core/Instrumentation/sceneInstrumentation";
import { type ServiceDefinition } from "../../modularity/serviceDefinition";
import { type ISceneContext, SceneContextIdentity } from "../sceneContext";
import { type IInspectableCommandRegistry, InspectableCommandRegistryIdentity } from "./inspectableCommandRegistry";

// Side-effect imports for engine query support (needed by EngineInstrumentation).
import "core/Engines/AbstractEngine/abstractEngine.timeQuery";
import "core/Engines/Extensions/engine.query";

/**
 * Service that registers CLI commands for querying scene and engine statistics.
 */
export const StatsCommandServiceDefinition: ServiceDefinition<[], [IInspectableCommandRegistry, ISceneContext]> = {
    friendlyName: "Stats Command Service",
    consumes: [InspectableCommandRegistryIdentity, SceneContextIdentity],
    factory: (commandRegistry, sceneContext) => {
        let sceneInstrumentation: SceneInstrumentation | undefined;
        let engineInstrumentation: EngineInstrumentation | undefined;

        function disposeInstrumentation() {
            sceneInstrumentation?.dispose();
            sceneInstrumentation = undefined;
            engineInstrumentation?.dispose();
            engineInstrumentation = undefined;
        }

        const startPerfReg = commandRegistry.addCommand({
            id: "start-perf-instrumentation",
            description: "Start scene and engine performance instrumentation for frame stats collection.",
            executeAsync: async () => {
                const scene = sceneContext.currentScene;
                if (!scene) {
                    throw new Error("No active scene.");
                }

                // Dispose any stale instrumentation (e.g. scene changed).
                if (sceneInstrumentation && sceneInstrumentation.scene !== scene) {
                    disposeInstrumentation();
                }

                if (sceneInstrumentation) {
                    return "Performance instrumentation is already running.";
                }

                sceneInstrumentation = new SceneInstrumentation(scene);
                sceneInstrumentation.captureActiveMeshesEvaluationTime = true;
                sceneInstrumentation.captureRenderTargetsRenderTime = true;
                sceneInstrumentation.captureFrameTime = true;
                sceneInstrumentation.captureRenderTime = true;
                sceneInstrumentation.captureInterFrameTime = true;
                sceneInstrumentation.captureParticlesRenderTime = true;
                sceneInstrumentation.captureSpritesRenderTime = true;
                sceneInstrumentation.capturePhysicsTime = true;
                sceneInstrumentation.captureAnimationsTime = true;

                engineInstrumentation = new EngineInstrumentation(scene.getEngine());
                engineInstrumentation.captureGPUFrameTime = true;

                return "Performance instrumentation started.";
            },
        });

        const stopPerfReg = commandRegistry.addCommand({
            id: "stop-perf-instrumentation",
            description: "Stop scene and engine performance instrumentation.",
            executeAsync: async () => {
                if (!sceneInstrumentation && !engineInstrumentation) {
                    return "Performance instrumentation is not running.";
                }

                disposeInstrumentation();
                return "Performance instrumentation stopped.";
            },
        });

        const countStatsReg = commandRegistry.addCommand({
            id: "get-count-stats",
            description: "Get scene entity counts (meshes, lights, vertices, draw calls, etc.).",
            executeAsync: async () => {
                const scene = sceneContext.currentScene;
                if (!scene) {
                    throw new Error("No active scene.");
                }

                let activeMeshesCount = scene.getActiveMeshes().length;
                for (const objectRenderer of scene.objectRenderers) {
                    activeMeshesCount += objectRenderer.getActiveMeshes().length;
                }

                const activeIndices = scene.getActiveIndices();

                return JSON.stringify(
                    {
                        totalMeshes: scene.meshes.length,
                        activeMeshes: activeMeshesCount,
                        activeIndices,
                        activeFaces: Math.floor(activeIndices / 3),
                        activeBones: scene.getActiveBones(),
                        activeParticles: scene.getActiveParticles(),
                        drawCalls: scene.getEngine()._drawCalls.current,
                        totalLights: scene.lights.length,
                        totalVertices: scene.getTotalVertices(),
                        totalMaterials: scene.materials.length,
                        totalTextures: scene.textures.length,
                    },
                    null,
                    2
                );
            },
        });

        const frameStatsReg = commandRegistry.addCommand({
            id: "get-frame-stats",
            description: "Get frame timing statistics. Requires start-perf-instrumentation to be run first.",
            executeAsync: async () => {
                if (!sceneInstrumentation || !engineInstrumentation) {
                    throw new Error("Performance instrumentation is not running. Run start-perf-instrumentation first.");
                }

                const si = sceneInstrumentation;
                const ei = engineInstrumentation;

                const round = (v: number) => Math.round(v * 100) / 100;

                return JSON.stringify(
                    {
                        absoluteFPS: Math.floor(1000.0 / si.frameTimeCounter.lastSecAverage),
                        meshesSelectionMs: round(si.activeMeshesEvaluationTimeCounter.lastSecAverage),
                        renderTargetsMs: round(si.renderTargetsRenderTimeCounter.lastSecAverage),
                        particlesMs: round(si.particlesRenderTimeCounter.lastSecAverage),
                        spritesMs: round(si.spritesRenderTimeCounter.lastSecAverage),
                        animationsMs: round(si.animationsTimeCounter.lastSecAverage),
                        physicsMs: round(si.physicsTimeCounter.lastSecAverage),
                        renderMs: round(si.renderTimeCounter.lastSecAverage),
                        frameMs: round(si.frameTimeCounter.lastSecAverage),
                        interFrameMs: round(si.interFrameTimeCounter.lastSecAverage),
                        gpuFrameMs: round(ei.gpuFrameTimeCounter.lastSecAverage * 0.000001),
                        gpuFrameAverageMs: round(ei.gpuFrameTimeCounter.average * 0.000001),
                    },
                    null,
                    2
                );
            },
        });

        const systemStatsReg = commandRegistry.addCommand({
            id: "get-system-stats",
            description: "Get engine capabilities and system information.",
            executeAsync: async () => {
                const scene = sceneContext.currentScene;
                if (!scene) {
                    throw new Error("No active scene.");
                }

                const engine = scene.getEngine();
                const caps = engine.getCaps();

                return JSON.stringify(
                    {
                        resolution: `${engine.getRenderWidth()} x ${engine.getRenderHeight()}`,
                        hardwareScalingLevel: engine.getHardwareScalingLevel(),
                        engine: engine.description,
                        driver: engine.extractDriverInfo(),
                        capabilities: {
                            stdDerivatives: caps.standardDerivatives,
                            compressedTextures: caps.s3tc !== undefined,
                            hardwareInstances: caps.instancedArrays,
                            textureFloat: caps.textureFloat,
                            textureHalfFloat: caps.textureHalfFloat,
                            renderToTextureFloat: caps.textureFloatRender,
                            renderToTextureHalfFloat: caps.textureHalfFloatRender,
                            indices32Bit: caps.uintIndices,
                            fragmentDepth: caps.fragmentDepthSupported,
                            highPrecisionShaders: caps.highPrecisionShaderSupported,
                            drawBuffers: caps.drawBuffersExtension,
                            vertexArrayObject: caps.vertexArrayObject,
                            timerQuery: caps.timerQuery !== undefined,
                            stencil: engine.isStencilEnable,
                            parallelShaderCompilation: caps.parallelShaderCompile != null,
                            maxTexturesUnits: caps.maxTexturesImageUnits,
                            maxTexturesSize: caps.maxTextureSize,
                            maxAnisotropy: caps.maxAnisotropy,
                        },
                    },
                    null,
                    2
                );
            },
        });

        return {
            dispose: () => {
                startPerfReg.dispose();
                stopPerfReg.dispose();
                countStatsReg.dispose();
                frameStatsReg.dispose();
                systemStatsReg.dispose();
                disposeInstrumentation();
            },
        };
    },
};
