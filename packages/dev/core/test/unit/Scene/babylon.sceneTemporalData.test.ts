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
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
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
        // the temporal data is for WGSL shaders, so it is kept on WebGPU only
        vi.spyOn(engine, "isWebGPU", "get").mockReturnValue(true);
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

    it("has the temporal fields in the scene and render target layouts", () => {
        const renderer = new ObjectRenderer("renderer", scene);
        const ubos: UniformBuffer[] = [scene.createSceneUniformBuffer(), (renderer as any)._createSceneUBO("rt", false)];
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
        const manager = new TAAMaterialManager(scene);
        manager.jitter.set(0.25, -0.5);
        pass(camA, 0);
        engine.endFrame();
        expect(pass(camA, 1).jitter).toEqual([0.25, -0.5]);
        scene.setTransformMatrix(Matrix.LookAtLH(new Vector3(0, 50, 0), Vector3.Zero(), Vector3.Forward()), Matrix.OrthoLH(20, 20, 1, 100));
        const other = written(scene.getSceneUniformBuffer());
        expect(other.previous).toEqual(other.viewProjection);
        expect(other.jitter).toEqual([0, 0]);
        manager.dispose();
    });

    // a reprojecting TAA of camA: its material manager holds the jitter
    const reprojectingTAA = () => {
        const taa = new ThinTAAPostProcess("taa", scene);
        taa.textureWidth = 64;
        taa.textureHeight = 64;
        taa.reprojectHistory = true;
        taa.camera = camA;
        return { taa, manager: (taa as any)._taaMaterialManager as TAAMaterialManager };
    };

    it("gives the jitter of a TAA to its camera's views only, in the frame it computed it and in the next one", () => {
        const { taa, manager } = reprojectingTAA();
        taa._updateJitter();
        const jitter = [manager.jitter.x, manager.jitter.y];
        expect(jitter).not.toEqual([0, 0]);
        expect(pass(camA).jitter).toEqual(jitter);
        expect(pass(camB).jitter).toEqual([0, 0]);
        // computed after the draws of its frame (prepass): the next frame still applies it
        engine.endFrame();
        expect(pass(camA).jitter).toEqual(jitter);
        // the TAA stopped computing it
        engine.endFrame();
        expect(pass(camA).jitter).toEqual([0, 0]);
        taa.dispose();
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

    it("seeds a new history from the pass's final view: the target's projection applied after initRender", () => {
        const objectRenderer = renderer("renderer");
        objectRenderer.initRender(256, 256);
        // the target recomputes the projection for its own size before the draws, which finalize the scene UBO again
        const getAspectRatio = vi.spyOn(engine, "getAspectRatio").mockReturnValue(3);
        scene.setTransformMatrix(camA.getViewMatrix(), camA.getProjectionMatrix(true));
        const first = written(scene.getSceneUniformBuffer());
        getAspectRatio.mockRestore();
        objectRenderer.finishRender();
        expect(first.previous).toEqual(first.viewProjection);
        // the history goes on from that final view
        engine.endFrame();
        expect(rendered(objectRenderer, 3).previous).toEqual(first.viewProjection);
        objectRenderer.dispose();
    });

    it("reuses the history of a pass that renders every other frame: no camera motion when it resumes, in the same matrices", () => {
        const texture = new RenderTargetTexture("texture", 256, scene);
        texture.activeCamera = camA;
        texture.renderList = [];
        texture.refreshRate = 2;
        scene.customRenderTargets.push(texture);
        scene.activeCamera = camA;
        // what the render target's pass gets written, frame by frame
        const frames: ReturnType<typeof written>[] = [];
        const finalize = scene.finalizeSceneUbo.bind(scene);
        vi.spyOn(scene, "finalizeSceneUbo").mockImplementation(() => {
            if (scene._viewPassId === texture.renderPassId) {
                frames[engine.frameId] = writtenBy(scene.getSceneUniformBuffer(), finalize);
                return scene.getSceneUniformBuffer();
            }
            return finalize();
        });
        // the camera moves every frame
        const histories: unknown[][] = [];
        for (let frame = 0; frame < 5; frame++) {
            camA.position.x = frame;
            scene.render();
            const history = camA._viewHistories.get(texture.renderPassId)!;
            histories.push([history, history.previous, history.current]);
            engine.endFrame();
        }
        expect(Object.keys(frames)).toEqual(["0", "2", "4"]);
        for (const frame of [2, 4]) {
            // the pass did not render in the previous frame: no camera motion
            expect(frames[frame].previous).toEqual(frames[frame].viewProjection);
            expect(frames[frame].viewProjection).not.toEqual(frames[frame - 2].viewProjection);
            // the same record, with the same matrices
            histories[frame].forEach((object, index) => expect(object).toBe(histories[0][index]));
        }
        texture.dispose();
    });

    // camA's view behind each public readiness check: the object renderer's, and the render target texture's, with its bind observables
    const readinessChecks: Array<[string, () => { objectRenderer: ObjectRenderer; check: () => void; dispose: () => void }]> = [
        [
            "ObjectRenderer.isReadyForRendering",
            () => {
                const objectRenderer = renderer("renderer");
                return { objectRenderer, check: () => objectRenderer.isReadyForRendering(256, 256), dispose: () => objectRenderer.dispose() };
            },
        ],
        [
            "RenderTargetTexture.isReadyForRendering",
            () => {
                const texture = new RenderTargetTexture("texture", 256, scene);
                texture.activeCamera = camA;
                texture.renderList = [];
                return { objectRenderer: (texture as any)._objectRenderer, check: () => texture.isReadyForRendering(), dispose: () => texture.dispose() };
            },
        ],
    ];

    describe.each(readinessChecks)("readiness checks: %s", (_, checked) => {
        it("do not advance the history: checks at other poses before and after the first render, in the same frame", () => {
            const { objectRenderer, check, dispose } = checked();
            check();
            camA.position.x = 3;
            const first = rendered(objectRenderer, 1);
            expect(first.previous).toEqual(first.viewProjection);
            camA.position.x = 5;
            check();
            // the history goes on from the first render
            engine.endFrame();
            camA.position.x = 4;
            expect(rendered(objectRenderer, 1).previous).toEqual(first.viewProjection);
            dispose();
        });

        it("do not make a camera that was only checked look like it rendered in the previous frames", () => {
            const { objectRenderer, check, dispose } = checked();
            for (const x of [0, 1, 2]) {
                camA.position.x = x;
                check();
                engine.endFrame();
            }
            camA.position.x = 3;
            check();
            const first = rendered(objectRenderer, 1);
            expect(first.previous).toEqual(first.viewProjection);
            dispose();
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

        it("drops the color history at a reset of the camera it switches to", () => {
            const taa = new ThinTAAPostProcess("taa", scene);
            taa.disableOnCameraMove = false;
            taa.camera = camA;
            taaFactor(taa);
            expect(taaFactor(taa)).toBe(taa.factor);
            taa.camera = camB;
            camB.resetViewHistory();
            expect(taaFactor(taa)).toBe(1);
            expect(taaFactor(taa)).toBe(taa.factor);
            taa.dispose();
        });

        it("keeps the reset of each eye when it alternates between the eyes of a rig", () => {
            const rig = new FreeCamera("rig", new Vector3(0, 2, -10), scene);
            rig.setCameraRigMode(Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL, { interaxialDistance: 0.0637 });
            const [left, right] = rig._rigCameras;
            const taa = new ThinTAAPostProcess("taa", scene);
            taa.disableOnCameraMove = false;
            const factorFor = (eye: Camera) => {
                taa.camera = eye;
                return taaFactor(taa);
            };
            factorFor(left);
            factorFor(right);
            right.resetViewHistory();
            expect(factorFor(left)).toBe(taa.factor);
            expect(factorFor(right)).toBe(1);
            expect(factorFor(right)).toBe(taa.factor);
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

    describe("frame graph TAA", () => {
        // an object renderer task drawing the camera and a reprojecting TAA task, built in the null engine
        const taaGraph = async (camera: Camera) => {
            vi.spyOn(engine, "buildTextureLayout").mockImplementation((textureStatus) => textureStatus.map((enabled, index) => (enabled ? index + 1 : 0)));
            scene.activeCamera = camera;
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
            objects.camera = camera;
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
            return { frameGraph, objects, manager: (taa.postProcess as any)._taaMaterialManager as TAAMaterialManager };
        };

        // what the passes of these cameras get written, frame by frame
        const capture = (...names: string[]) => {
            const cameras: Record<string, ReturnType<typeof written>[]> = {};
            const finalize = scene.finalizeSceneUbo.bind(scene);
            vi.spyOn(scene, "finalizeSceneUbo").mockImplementation(() => {
                const name = scene.activeCamera?.name;
                if (name !== undefined && names.includes(name)) {
                    (cameras[name] ??= [])[engine.frameId] = writtenBy(scene.getSceneUniformBuffer(), finalize);
                    return scene.getSceneUniformBuffer();
                }
                return finalize();
            });
            return cameras;
        };

        it("gives the TAA jitter to each eye of a stereo rig, and keeps a history per eye", async () => {
            const rig = new FreeCamera("rig", new Vector3(0, 2, -10), scene);
            rig.setCameraRigMode(Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL, { interaxialDistance: 0.0637 });
            const { frameGraph, manager } = await taaGraph(rig);
            const eyes = capture("rig_L", "rig_R");

            // the TAA computes the jitter before the draws of each frame
            for (let frame = 0; frame < 3; frame++) {
                scene.render();
                engine.endFrame();
            }
            const last = engine.frameId - 1;
            const jitter = [manager.jitter.x, manager.jitter.y];
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

        it("gives the jitter to the camera the object renderer draws, also in the first frame after a switch", async () => {
            const { frameGraph, objects, manager } = await taaGraph(camA);
            const cameras = capture("camB");
            for (let frame = 0; frame < 2; frame++) {
                scene.render();
                engine.endFrame();
            }
            objects.camera = camB;
            scene.render();
            const switched = cameras["camB"][engine.frameId];
            expect(switched.jitter).not.toEqual([0, 0]);
            expect(switched.jitter).toEqual([manager.jitter.x, manager.jitter.y]);
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

        it("gives the jitter of a manager used on its own to the WGSL passes of every camera's view, until it changes", () => {
            const material = new StandardMaterial("std", scene);
            const manager = new TAAMaterialManager(scene);
            manager.jitter.set(0.25, -0.5);
            // the WGSL material gets it from the scene uniform buffer only
            expect(material.shaderLanguage).toBe(ShaderLanguage.WGSL);
            const materialUbo = { updateFloat2: vi.fn() } as unknown as UniformBuffer;
            material.pluginManager!.getPlugin<any>("TAAJitter")!.hardBindForSubMesh(materialUbo);
            expect(materialUbo.updateFloat2).not.toHaveBeenCalled();
            // the passes of the scene's cameras, and of a render target
            expect(pass(camA).jitter).toEqual([0.25, -0.5]);
            expect(pass(camB).jitter).toEqual([0.25, -0.5]);
            const objectRenderer = renderer("renderer");
            expect(rendered(objectRenderer, 1).jitter).toEqual([0.25, -0.5]);
            // no frame limit: it applies until the application changes it
            engine.endFrame();
            engine.endFrame();
            expect(pass(camA).jitter).toEqual([0.25, -0.5]);
            manager.jitter.set(-0.125, 0.375);
            expect(pass(camA).jitter).toEqual([-0.125, 0.375]);
            // disabled, then disposed: no jitter
            manager.isEnabled = false;
            expect(pass(camA).jitter).toEqual([0, 0]);
            manager.isEnabled = true;
            manager.dispose();
            expect(pass(camA).jitter).toEqual([0, 0]);
            objectRenderer.dispose();
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

    describe("WebGL", () => {
        it("keeps the scene uniform buffers and the cameras as they were: GLSL shaders do not read the temporal data", () => {
            const webGLEngine = new NullEngine();
            vi.spyOn(webGLEngine, "supportsUniformBuffers", "get").mockReturnValue(true);
            const webGLScene = new Scene(webGLEngine);
            const camera = new FreeCamera("camera", new Vector3(0, 2, -10), webGLScene);
            webGLScene.activeCamera = camera;
            webGLScene.updateTransformMatrix();
            const ubo = webGLScene.getSceneUniformBuffer();
            const updateMatrix = vi.spyOn(ubo, "updateMatrix");
            const updateFloat2 = vi.spyOn(ubo, "updateFloat2");
            webGLScene.finalizeSceneUbo();
            expect(updateMatrix).not.toHaveBeenCalled();
            expect(updateFloat2).not.toHaveBeenCalled();
            expect(camera._viewHistories.size).toBe(0);
            // the layouts: scene, multiview and render targets
            RegisterEngineMultiview();
            (webGLScene as any)._createMultiviewUbo();
            const renderer = new ObjectRenderer("renderer", webGLScene);
            const ubos: UniformBuffer[] = [
                webGLScene.createSceneUniformBuffer(),
                (webGLScene as any)._multiviewSceneUbo,
                (renderer as any)._createSceneUBO("rt", false),
                (renderer as any)._createSceneUBO("rt mv", true),
            ];
            for (const layout of ubos) {
                expect(layout.has("previousViewProjection")).toBe(false);
                expect(layout.has("taaJitter")).toBe(false);
            }
            renderer.dispose();
            webGLScene.dispose();
            webGLEngine.dispose();
        });
    });
});
