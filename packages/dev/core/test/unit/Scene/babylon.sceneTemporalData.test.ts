import { NullEngine } from "core/Engines/nullEngine";
import { Constants } from "core/Engines/constants";
import { RegisterEngineMultiview } from "core/Engines/Extensions/engine.multiview.pure";
import { Initialize, Process } from "core/Engines/Processors/shaderProcessor";
import { RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import { type _IProcessingOptions } from "core/Engines/Processors/shaderProcessingOptions";
import { ShaderStore } from "core/Engines/shaderStore";
import { WebGPUShaderProcessingContext } from "core/Engines/WebGPU/webgpuShaderProcessingContext";
import { WebGPUShaderProcessorWGSL } from "core/Engines/WebGPU/webgpuShaderProcessorsWGSL";
import { Camera } from "core/Cameras/camera";
import { FreeCamera } from "core/Cameras/freeCamera";
import { FrameGraph } from "core/FrameGraph/frameGraph";
import { FrameGraphRenderContext } from "core/FrameGraph/frameGraphRenderContext";
import { FrameGraphTAATask } from "core/FrameGraph/Tasks/PostProcesses/taaTask";
import { FrameGraphObjectRendererTask } from "core/FrameGraph/Tasks/Rendering/objectRendererTask";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { PrePassConfiguration } from "core/Materials/prePassConfiguration";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { type UniformBuffer } from "core/Materials/uniformBuffer";
import { type Effect } from "core/Materials/effect";
import { type Mesh } from "core/Meshes/mesh";
import { TAAMaterialManager } from "core/PostProcesses/RenderPipeline/Pipelines/taaMaterialManager";
import { ThinTAAPostProcess } from "core/PostProcesses/thinTAAPostProcess";
import { ObjectRenderer } from "core/Rendering/objectRenderer";
import { Scene } from "core/scene";
import { vi } from "vitest";

import "core/Engines/Extensions/engine.multiRender";
import "core/ShadersWGSL/gaussianSplatting.vertex";

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

    const written = (ubo: UniformBuffer) => writtenBy(ubo, () => scene.finalizeSceneUbo());

    const writtenBy = (ubo: UniformBuffer, finalize: () => UniformBuffer) => {
        const updateMatrix = vi.spyOn(ubo, "updateMatrix");
        const updateFloat2 = vi.spyOn(ubo, "updateFloat2");
        finalize();
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

    // an object renderer that draws camA's view
    const renderer = (name: string) => {
        const objectRenderer = new ObjectRenderer(name, scene);
        objectRenderer.activeCamera = camA;
        objectRenderer.renderList = [];
        return objectRenderer;
    };

    // renders camA's view through the object renderer into a target of this aspect ratio, and returns what was written for it
    const rendered = (objectRenderer: ObjectRenderer, aspect: number) => {
        const getAspectRatio = vi.spyOn(engine, "getAspectRatio").mockReturnValue(aspect);
        objectRenderer.initRender(256, 256);
        const result = written(scene.getSceneUniformBuffer());
        objectRenderer.finishRender();
        getAspectRatio.mockRestore();
        return result;
    };

    it("keeps one history per pass for two passes of a camera with different aspect ratios", () => {
        const wide = renderer("wide");
        const square = renderer("square");
        const wide1 = rendered(wide, 2);
        const square1 = rendered(square, 1);
        expect(wide1.viewProjection).not.toEqual(square1.viewProjection);
        // nothing moves: no camera motion in either pass
        engine.endFrame();
        const wide2 = rendered(wide, 2);
        const square2 = rendered(square, 1);
        expect(wide2.previous).toEqual(wide2.viewProjection);
        expect(square2.previous).toEqual(square2.viewProjection);
        // the camera moves: each pass gets its own view-projection of the previous frame
        engine.endFrame();
        camA.position.x = 1;
        expect(rendered(wide, 2).previous).toEqual(wide2.viewProjection);
        expect(rendered(square, 1).previous).toEqual(square2.viewProjection);
        wide.dispose();
        square.dispose();
    });

    describe("readiness checks", () => {
        it("do not advance the history: a check at one pose and the first render at another, in the same frame", () => {
            const objectRenderer = renderer("renderer");
            objectRenderer.isReadyForRendering(256, 256);
            camA.position.x = 3;
            const first = rendered(objectRenderer, 1);
            expect(first.previous).toEqual(first.viewProjection);
            // the history goes on from the first render
            engine.endFrame();
            camA.position.x = 4;
            expect(rendered(objectRenderer, 1).previous).toEqual(first.viewProjection);
            objectRenderer.dispose();
        });

        it("do not make a camera that was only checked look like it rendered in the previous frames", () => {
            const objectRenderer = renderer("renderer");
            for (const x of [0, 1, 2]) {
                camA.position.x = x;
                objectRenderer.isReadyForRendering(256, 256);
                engine.endFrame();
            }
            camA.position.x = 3;
            objectRenderer.isReadyForRendering(256, 256);
            const first = rendered(objectRenderer, 1);
            expect(first.previous).toEqual(first.viewProjection);
            objectRenderer.dispose();
        });
    });

    describe("explicit reset", () => {
        // the history weight the TAA binds for its resolve: 1 drops the accumulated color
        const taaFactor = (taa: ThinTAAPostProcess) => {
            const effect = taa.drawWrapper.effect!;
            const setFloat = vi.spyOn(effect, "setFloat").mockImplementation(() => effect);
            // no default bindings: the null engine compiles no pipeline for the effect
            taa.bind(true);
            const factor = setFloat.mock.calls.find((c) => c[0] === "factor")![1];
            setFloat.mockRestore();
            return factor;
        };

        it("starts the camera's history again in every pass, and the TAA drops its color history in the same frame", () => {
            const taa = new ThinTAAPostProcess("taa", scene);
            taa.camera = camA;
            // it keeps its history while the camera moves (reprojected with the velocity)
            taa.disableOnCameraMove = false;
            const objectRenderer = renderer("renderer");
            const frame = (x: number) => {
                camA.position.x = x;
                const result = { main: pass(camA), renderer: rendered(objectRenderer, 1), factor: taaFactor(taa) };
                engine.endFrame();
                return result;
            };
            frame(0);
            expect(frame(1).factor).toBe(taa.factor);
            // a cut: the view jumps
            camA.resetViewHistory();
            const cut = frame(50);
            expect(cut.main.previous).toEqual(cut.main.viewProjection);
            expect(cut.renderer.previous).toEqual(cut.renderer.viewProjection);
            expect(cut.factor).toBe(1);
            // then the history and the accumulation go on
            const after = frame(51);
            expect(after.main.previous).toEqual(cut.main.viewProjection);
            expect(after.renderer.previous).toEqual(cut.renderer.viewProjection);
            expect(after.factor).toBe(taa.factor);
            objectRenderer.dispose();
            taa.dispose();
        });

        it("resets the cameras of the rig with their parent", () => {
            const rig = new FreeCamera("rig", new Vector3(0, 2, -10), scene);
            rig.setCameraRigMode(Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL, { interaxialDistance: 0.0637 });
            const eyes = rig._rigCameras as FreeCamera[];
            for (const eye of eyes) {
                pass(eye);
            }
            engine.endFrame();
            rig.resetViewHistory();
            for (const eye of eyes) {
                eye.position.x += 50;
                const cut = pass(eye);
                expect(cut.previous).toEqual(cut.viewProjection);
            }
        });
    });

    describe("frame graph TAA with a stereo rig", () => {
        it("gives the TAA jitter to each eye, and keeps a history per eye", async () => {
            vi.spyOn(engine, "buildTextureLayout").mockImplementation((textureStatus) => textureStatus.map((enabled, index) => (enabled ? index + 1 : 0)));
            const rig = new FreeCamera("rig", new Vector3(0, 2, -10), scene);
            rig.setCameraRigMode(Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL, { interaxialDistance: 0.0637 });
            scene.activeCamera = rig;

            const frameGraph = new FrameGraph(scene);
            const color = frameGraph.textureManager.createRenderTargetTexture("color", {
                size: { width: 64, height: 64 },
                options: {
                    createMipMaps: false,
                    types: [Constants.TEXTURETYPE_UNSIGNED_BYTE],
                    formats: [Constants.TEXTUREFORMAT_RGBA],
                    samples: 1,
                    useSRGBBuffers: [false],
                    creationFlags: [0],
                    labels: ["color"],
                },
                sizeIsPercentage: false,
            });
            const objects = new FrameGraphObjectRendererTask("objects", frameGraph, scene);
            objects.targetTexture = color;
            objects.camera = rig;
            objects.objectList = { meshes: [], particleSystems: [] };
            frameGraph.addTask(objects);
            const taa = new FrameGraphTAATask("taa", frameGraph);
            taa.sourceTexture = objects.outputTexture;
            taa.objectRendererTask = objects;
            taa.postProcess.reprojectHistory = true;
            frameGraph.addTask(taa);
            // the null engine creates no GPU textures: the graph gets empty ones, and the TAA resolve itself is not drawn
            vi.spyOn(engine, "_createInternalTexture").mockImplementation(
                (_size, _options, _delay, source) => new InternalTexture(engine, source ?? InternalTextureSource.RenderTarget)
            );
            vi.spyOn(engine, "createMultipleRenderTarget").mockImplementation((size, options) => {
                const target = new RenderTargetWrapper(true, false, size, engine);
                target.setTextures(Array.from({ length: options.textureCount ?? 1 }, () => new InternalTexture(engine, InternalTextureSource.MultiRenderTarget)));
                return target;
            });
            vi.spyOn(FrameGraphRenderContext.prototype, "setTextureSamplingMode").mockImplementation(() => {});
            vi.spyOn(FrameGraphRenderContext.prototype, "applyFullScreenEffect").mockImplementation(() => true);
            await frameGraph.buildAsync(false);
            scene.frameGraph = frameGraph;

            // what each eye's passes get written, frame by frame
            const eyes: Record<string, ReturnType<typeof written>[]> = {};
            const finalize = scene.finalizeSceneUbo.bind(scene);
            vi.spyOn(scene, "finalizeSceneUbo").mockImplementation(() => {
                const name = scene.activeCamera?.name;
                if (name === "rig_L" || name === "rig_R") {
                    (eyes[name] ??= [])[engine.frameId] = writtenBy(scene.getSceneUniformBuffer(), finalize);
                    return scene.getSceneUniformBuffer();
                }
                return finalize();
            });

            // the TAA learns its camera in the first frame and computes the jitter before the draws of the next ones
            for (let frame = 0; frame < 3; frame++) {
                scene.render();
                engine.endFrame();
            }
            const last = engine.frameId - 1;
            const jitter = [rig._taaJitter.x, rig._taaJitter.y];
            expect(jitter).not.toEqual([0, 0]);
            for (const eye of ["rig_L", "rig_R"]) {
                expect(eyes[eye][last].jitter).toEqual(jitter);
                // a still rig: no camera motion in either eye, each one with its own view
                expect(eyes[eye][last].previous).toEqual(eyes[eye][last].viewProjection);
            }
            expect(eyes["rig_L"][last].viewProjection).not.toEqual(eyes["rig_R"][last].viewProjection);
            scene.frameGraph = null;
            frameGraph.dispose();
        });
    });

    describe("Gaussian splatting velocity in WGSL", () => {
        // the splat vertex shader as the WebGPU shader processor builds it for a geometry pass with velocity
        const processed = (compound: boolean) => {
            const processingContext = new WebGPUShaderProcessingContext(ShaderLanguage.WGSL);
            const options = {
                defines: ["#define PREPASS", "#define PREPASS_VELOCITY", `#define IS_COMPOUND ${compound ? 1 : 0}`, "#define MAX_PART_COUNT 16", "#define SH_DEGREE 0"],
                indexParameters: {},
                isFragment: false,
                shouldUseHighPrecisionShader: true,
                processor: new WebGPUShaderProcessorWGSL(),
                supportsUniformBuffers: true,
                shadersRepository: "",
                includesShadersStore: ShaderStore.IncludesShadersStoreWGSL,
                version: "100",
                platformName: "WEBGPU",
                processingContext,
                isNDCHalfZRange: true,
                useReverseDepthBuffer: false,
            } as unknown as _IProcessingOptions;
            let code = "";
            Initialize(options);
            Process(ShaderStore.ShadersStoreWGSL["gaussianSplattingVertexShader"], options, (processedCode) => (code = processedCode), engine);
            return { code, leftOverUniforms: processingContext.leftOverUniforms.map((uniform) => uniform.name) };
        };

        it.each([false, true])("reads the previous view-projection from the scene uniform buffer (compound: %s)", (compound) => {
            const { code, leftOverUniforms } = processed(compound);
            expect(code).toContain("scene.previousViewProjection");
            expect(code).not.toContain("uniforms.previousViewProjection");
            expect(leftOverUniforms).not.toContain("previousViewProjection");
            // the world matrices of the previous frame are still the material's
            expect(leftOverUniforms).toContain(compound ? "previousPartWorld" : "previousWorld");
        });
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
