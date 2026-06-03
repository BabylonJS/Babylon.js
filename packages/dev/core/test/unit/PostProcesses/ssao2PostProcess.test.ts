import { FreeCamera } from "core/Cameras/freeCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { Vector3 } from "core/Maths/math.vector";
import { SSAO2RenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline";
import { PostProcessRenderPipelineManager } from "core/PostProcesses/RenderPipeline/postProcessRenderPipelineManager";
import { RegisterPostProcessRenderPipelineManagerSceneComponent } from "core/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent.pure";
import { ThinSSAO2PostProcess } from "core/PostProcesses/thinSSAO2PostProcess";
import { GeometryBufferRenderer } from "core/Rendering/geometryBufferRenderer.pure";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function getSSAO2PostProcess(pipeline: SSAO2RenderingPipeline): ThinSSAO2PostProcess {
    return (pipeline as unknown as { _thinSSAORenderingPipeline: { _ssaoPostProcess: ThinSSAO2PostProcess } })._thinSSAORenderingPipeline._ssaoPostProcess;
}

describe("ThinSSAO2PostProcess", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        RegisterPostProcessRenderPipelineManagerSceneComponent(PostProcessRenderPipelineManager);
        engine = new NullEngine();
        engine.getCaps().drawBuffersExtension = true;
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("should compile world-space normal sampling only when requested", () => {
        const postProcess = new ThinSSAO2PostProcess("ssao", scene);
        const getDefines = () => (postProcess as unknown as { _getDefinesForSSAO: () => string })._getDefinesForSSAO();
        const updateEffectSpy = vi.spyOn(postProcess, "updateEffect");

        expect(ThinSSAO2PostProcess.Uniforms).toContain("normalWorldToView");
        expect(postProcess.normalsInWorldSpace).toBe(false);
        expect(getDefines()).not.toContain("NORMAL_WORLDSPACE");

        postProcess.normalsInWorldSpace = false;

        expect(updateEffectSpy).not.toHaveBeenCalled();
        expect(getDefines()).not.toContain("NORMAL_WORLDSPACE");

        postProcess.normalsInWorldSpace = true;

        expect(updateEffectSpy).toHaveBeenCalledTimes(1);
        expect(getDefines()).toContain("#define NORMAL_WORLDSPACE");

        postProcess.normalsInWorldSpace = true;

        expect(updateEffectSpy).toHaveBeenCalledTimes(1);
        expect(getDefines()).toContain("#define NORMAL_WORLDSPACE");

        postProcess.normalsInWorldSpace = false;

        expect(updateEffectSpy).toHaveBeenCalledTimes(2);
        expect(getDefines()).not.toContain("NORMAL_WORLDSPACE");

        postProcess.dispose();
    });

    it("should bind world-space normal transform as a mat3", () => {
        const postProcess = new ThinSSAO2PostProcess("ssao", scene);
        const camera = new FreeCamera("camera", new Vector3(1, 2, -3), scene);
        camera.rotation.set(0.1, 0.2, 0.3);
        postProcess.camera = camera;
        postProcess.textureWidth = 4;
        postProcess.textureHeight = 4;
        postProcess.normalsInWorldSpace = true;

        const effect = {
            dispose: vi.fn(),
            setArray3: vi.fn(),
            setFloat: vi.fn(),
            setFloat2: vi.fn(),
            setFloat4: vi.fn(),
            setMatrix: vi.fn(),
            setMatrix3x3: vi.fn(),
            setTexture: vi.fn(),
        };
        (postProcess as unknown as { _drawWrapper: { effect: typeof effect } })._drawWrapper.effect = effect;

        postProcess.bind(true);

        const normalWorldToView = effect.setMatrix3x3.mock.calls.find(([name]) => name === "normalWorldToView")?.[1] as Float32Array;
        const viewMatrix = camera.getViewMatrix().m;

        expect(effect.setMatrix).not.toHaveBeenCalledWith("normalWorldToView", expect.anything());
        expect(normalWorldToView).toBeInstanceOf(Float32Array);
        expect(Array.from(normalWorldToView)).toEqual([
            viewMatrix[0],
            viewMatrix[1],
            viewMatrix[2],
            viewMatrix[4],
            viewMatrix[5],
            viewMatrix[6],
            viewMatrix[8],
            viewMatrix[9],
            viewMatrix[10],
        ]);

        postProcess.dispose();
        camera.dispose();
    });

    it("should sync late geometry-buffer normal-space changes", () => {
        engine._features.supportSSAO2 = true;
        const geometryBufferRenderer = Object.create(GeometryBufferRenderer.prototype) as GeometryBufferRenderer;
        geometryBufferRenderer.generateNormalsInWorldSpace = false;
        const pipeline = new SSAO2RenderingPipeline("ssao", scene, 1, undefined, geometryBufferRenderer);
        const postProcess = getSSAO2PostProcess(pipeline);

        expect(postProcess.normalsInWorldSpace).toBe(false);

        geometryBufferRenderer.generateNormalsInWorldSpace = true;
        pipeline.isReady();

        expect(postProcess.normalsInWorldSpace).toBe(true);

        geometryBufferRenderer.generateNormalsInWorldSpace = false;
        pipeline.isReady();

        expect(postProcess.normalsInWorldSpace).toBe(false);

        pipeline.dispose(true);
    });

    it("should sync late prepass normal-space changes", () => {
        engine._features.supportSSAO2 = true;
        const pipeline = new SSAO2RenderingPipeline("ssao", scene, 1);
        const postProcess = getSSAO2PostProcess(pipeline);
        const prePassRenderer = scene.prePassRenderer!;

        expect(postProcess.normalsInWorldSpace).toBe(false);

        prePassRenderer.generateNormalsInWorldSpace = true;
        pipeline.isReady();

        expect(postProcess.normalsInWorldSpace).toBe(true);

        prePassRenderer.generateNormalsInWorldSpace = false;
        pipeline.isReady();

        expect(postProcess.normalsInWorldSpace).toBe(false);

        pipeline.dispose();
    });
});
