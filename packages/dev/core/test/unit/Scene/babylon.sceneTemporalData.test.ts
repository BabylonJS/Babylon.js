import { NullEngine } from "core/Engines/nullEngine";
import { Constants } from "core/Engines/constants";
import { RegisterEngineMultiview } from "core/Engines/Extensions/engine.multiview.pure";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { PrePassConfiguration } from "core/Materials/prePassConfiguration";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { type UniformBuffer } from "core/Materials/uniformBuffer";
import { type Effect } from "core/Materials/effect";
import { type Mesh } from "core/Meshes/mesh";
import { TAAMaterialManager } from "core/PostProcesses/RenderPipeline/Pipelines/taaMaterialManager";
import { ObjectRenderer } from "core/Rendering/objectRenderer";
import { Scene } from "core/scene";
import { vi } from "vitest";

describe("Scene uniform buffer: temporal data of the view", () => {
    let engine: NullEngine;
    let scene: Scene;
    let camA: FreeCamera;
    let camB: FreeCamera;

    beforeEach(() => {
        engine = new NullEngine();
        vi.spyOn(engine, "supportsUniformBuffers", "get").mockReturnValue(true);
        scene = new Scene(engine);
        camA = new FreeCamera("camA", new Vector3(0, 2, -10), scene);
        camB = new FreeCamera("camB", new Vector3(5, 2, -10), scene);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    // renders a pass of the camera's view and returns the view-projection, and the previous view-projection and jitter written for it
    const pass = (camera: FreeCamera, x?: number) => {
        if (x !== undefined) {
            camera.position.x = x;
        }
        scene.activeCamera = camera;
        scene.updateTransformMatrix();
        return written(scene.getSceneUniformBuffer());
    };

    const written = (ubo: UniformBuffer) => {
        const updateMatrix = vi.spyOn(ubo, "updateMatrix");
        const updateFloat2 = vi.spyOn(ubo, "updateFloat2");
        scene.finalizeSceneUbo();
        const previous = updateMatrix.mock.calls.find((c) => c[0] === "previousViewProjection")![1] as Matrix;
        const jitter = updateFloat2.mock.calls.find((c) => c[0] === "taaJitter")!;
        const result = { viewProjection: Array.from(scene.getTransformMatrix().asArray()), previous: Array.from(previous.asArray()), jitter: [jitter[1], jitter[2]] };
        updateMatrix.mockRestore();
        updateFloat2.mockRestore();
        return result;
    };

    it("has the temporal fields in the scene, render target and multiview layouts", () => {
        RegisterEngineMultiview();
        (scene as any)._createMultiviewUbo();
        const renderer = new ObjectRenderer("renderer", scene);
        const ubos: UniformBuffer[] = [
            scene.createSceneUniformBuffer(),
            (scene as any)._multiviewSceneUbo,
            (renderer as any)._createSceneUBO("rt", false),
            (renderer as any)._createSceneUBO("rt mv", true),
        ];
        for (const ubo of ubos) {
            expect(ubo.has("previousViewProjection")).toBe(true);
            expect(ubo.has("taaJitter")).toBe(true);
        }
        renderer.dispose();
    });

    it("starts the history of a camera with its current view-projection", () => {
        const first = pass(camA);
        expect(first.previous).toEqual(first.viewProjection);
    });

    it("gives a moving camera its view-projection of the previous frame, and no motion once it stops", () => {
        const frame1 = pass(camA, 0);
        engine.endFrame();
        const frame2 = pass(camA, 1);
        expect(frame2.previous).toEqual(frame1.viewProjection);
        expect(frame2.previous).not.toEqual(frame2.viewProjection);
        engine.endFrame();
        const frame3 = pass(camA, 1);
        expect(frame3.previous).toEqual(frame2.viewProjection);
    });

    it("keeps one history per camera when several cameras render in a frame", () => {
        pass(camA, 0);
        const b1 = pass(camB, 5);
        engine.endFrame();
        pass(camA, 1);
        const b2 = pass(camB, 6);
        expect(b2.previous).toEqual(b1.viewProjection);
    });

    it("starts the history again for a camera that did not render in the previous frame", () => {
        pass(camA, 0);
        engine.endFrame();
        pass(camB);
        engine.endFrame();
        const back = pass(camA, 3);
        expect(back.previous).toEqual(back.viewProjection);
    });

    it("gives no camera motion and no jitter to a pass that does not render the camera's view", () => {
        pass(camA, 0);
        engine.endFrame();
        pass(camA, 1);
        camA._taaJitter.set(0.25, -0.5);
        camA._taaJitterFrameId = engine.frameId;
        scene.setTransformMatrix(Matrix.LookAtLH(new Vector3(0, 50, 0), Vector3.Zero(), Vector3.Forward()), Matrix.OrthoLH(20, 20, 1, 100));
        const other = written(scene.getSceneUniformBuffer());
        expect(other.previous).toEqual(other.viewProjection);
        expect(other.jitter).toEqual([0, 0]);
    });

    it("writes the TAA jitter of the camera in the frame it was computed in and in the next one only", () => {
        camA._taaJitter.set(0.25, -0.5);
        camA._taaJitterFrameId = engine.frameId;
        expect(pass(camA).jitter).toEqual([0.25, -0.5]);
        // computed after the draws of its frame (prepass): the next frame still applies it
        engine.endFrame();
        expect(pass(camA).jitter).toEqual([0.25, -0.5]);
        // the TAA stopped computing it
        engine.endFrame();
        expect(pass(camA).jitter).toEqual([0, 0]);
    });

    describe("TAA jitter plugin", () => {
        it("reads the jitter from the scene uniform buffer in WGSL and from the material uniforms in GLSL", () => {
            const material = new StandardMaterial("std", scene);
            const manager = new TAAMaterialManager(scene);
            const plugin = material.pluginManager!.getPlugin<any>("TAAJitter")!;
            expect(plugin.getUniforms(ShaderLanguage.WGSL)).toEqual({});
            expect(plugin.getCustomCode("vertex", ShaderLanguage.WGSL).CUSTOM_VERTEX_MAIN_END).toContain("scene.taaJitter");
            expect(plugin.getUniforms(ShaderLanguage.GLSL).ubo).toEqual([{ name: "taa_jitter", size: 2, type: "vec2" }]);
            manager.dispose();
        });
    });

    describe("prepass velocity", () => {
        it("binds the previous view-projection to GLSL effects only", () => {
            (scene as any).prePassRenderer = {
                enabled: true,
                currentRTisSceneRT: true,
                getIndex: (type: number) => (type === Constants.PREPASS_VELOCITY_TEXTURE_TYPE ? 0 : -1),
            };
            pass(camA);
            const mesh = { uniqueId: 1 } as Mesh;
            for (const shaderLanguage of [ShaderLanguage.WGSL, ShaderLanguage.GLSL]) {
                const effect = { shaderLanguage, setMatrix: vi.fn() } as unknown as Effect;
                new PrePassConfiguration().bindForSubMesh(effect, scene, mesh, Matrix.Identity(), false);
                const names = (effect.setMatrix as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
                expect(names).toEqual(shaderLanguage === ShaderLanguage.WGSL ? ["previousWorld"] : ["previousViewProjection", "previousWorld"]);
            }
            (scene as any).prePassRenderer = null;
        });
    });
});
