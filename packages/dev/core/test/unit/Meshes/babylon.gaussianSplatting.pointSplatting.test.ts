import { NullEngine } from "core/Engines/nullEngine";
import { ShaderStore } from "core/Engines/shaderStore";
import { WebGPUEngine } from "core/Engines/webgpuEngine";
import { GaussianSplattingDebugMaterialPlugin } from "core/Materials/GaussianSplatting/gaussianSplattingDebugMaterialPlugin";
import { GaussianSplattingSolidColorMaterialPlugin } from "core/Materials/GaussianSplatting/gaussianSplattingSolidColorMaterialPlugin";
import "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { GaussianSplattingMaterial } from "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { GaussianSplattingMeshBase } from "core/Meshes/GaussianSplatting/gaussianSplattingMeshBase";
import { GaussianSplattingCompoundMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingCompoundMesh";
import { GaussianPointSplattingRenderer } from "core/Meshes/GaussianSplatting/gaussianPointSplattingRenderer";
import { GaussianPointSplattingController } from "core/Meshes/GaussianSplatting/gaussianPointSplattingController";
import { PassPostProcess } from "core/PostProcesses/passPostProcess";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import "core/Rendering/depthRendererSceneComponent";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { Color3 } from "core/Maths/math.color";
import { Plane } from "core/Maths/math.plane";
import { FreeCamera } from "core/Cameras/freeCamera";
import { FromHalfFloat } from "core/Misc/halfFloat";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";
import { describe, expect, it, onTestFinished, vi } from "vitest";

/**
 * Installs a point-splatting controller on a mesh without enabling a mode (no WebGPU engine needed).
 * @param mesh the mesh to attach a controller to
 * @returns the installed controller
 */
function CreateController(mesh: GaussianSplattingMesh): GaussianPointSplattingController {
    const controller = new GaussianPointSplattingController(mesh);
    mesh["_pointController"] = controller;
    return controller;
}

/**
 * Creates a color-mode controller whose mock renderer starts at the given accumulation generation.
 * The scene and engine are disposed when the test finishes.
 * @param generation the initial accumulation generation
 * @returns the mesh, its controller and the mock renderer
 */
function CreateAutoScaleSetup(generation: number): { mesh: GaussianSplattingMesh; controller: GaussianPointSplattingController; renderer: GaussianPointSplattingRenderer } {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const mesh = new GaussianSplattingMesh("splat", null, scene);
    const controller = CreateController(mesh);
    const renderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
    renderer["_accumGeneration"] = generation;
    controller["_renderer"] = renderer;
    controller["_colorMode"] = true;
    onTestFinished(() => {
        controller["_renderer"] = null;
        scene.dispose();
        engine.dispose();
    });
    return { mesh, controller, renderer };
}

describe("GaussianSplattingMesh point-splatting settings", () => {
    it("renders compute-owned passes without waiting for or posting worker sorts", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const camera = new FreeCamera("camera", new Vector3(0, 0, -3), scene);
        camera.setTarget(Vector3.Zero());
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        mesh.disableDepthSort = true;
        mesh.updateData(new ArrayBuffer(32));
        const controller = CreateController(mesh);
        const renderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
        vi.spyOn(renderer, "supportsWorkload").mockReturnValue(true);
        controller["_renderer"] = renderer;
        controller["_colorMode"] = true;
        controller["_depthMode"] = true;
        controller["_runCompute"] = vi.fn();
        mesh["_disableDepthSort"] = false;
        mesh["_readyToDisplay"] = false;
        const post = vi.fn();
        mesh["_worker"] = { postMessage: post, terminate: vi.fn() } as Worker;
        const before = vi.fn();
        const after = vi.fn();
        mesh.onBeforeRenderObservable.add(before);
        mesh.onAfterRenderObservable.add(after);
        const depth = scene.enableDepthRenderer(camera);
        scene.setTransformMatrix(camera.getViewMatrix(), camera.getProjectionMatrix());
        engine.currentRenderPassId = camera.renderPassId;
        expect(mesh.isReady(true)).toBe(true);
        mesh["_cameraViewInfos"].get(camera.uniqueId)!.splatIndexBufferSet = false;
        mesh["_canPostToWorker"] = false;
        mesh.render(mesh.subMeshes[0], true);
        camera.position.x = 1;
        camera.computeWorldMatrix(true);
        mesh._postToWorker(true);
        expect(mesh.isReady(true)).toBe(true);
        engine.currentRenderPassId = depth.getDepthMap().renderPassId;
        mesh.render(mesh.subMeshes[0], false);
        expect(post).not.toHaveBeenCalled();
        expect(before).toHaveBeenCalledTimes(2);
        expect(after).toHaveBeenCalledTimes(2);
        expect(mesh["_hasRenderedOnce"]).toBe(false);

        mesh.setMaterialForRenderPass(engine.currentRenderPassId, mesh.material!);
        expect(controller.handlesCurrentPass).toBe(false);
        mesh.setMaterialForRenderPass(engine.currentRenderPassId, undefined);

        // The depth renderer's own classic GS depth material does not displace the point depth path.
        depth["_ensureGaussianSplattingDepthMaterial"](mesh, engine.currentRenderPassId);
        expect(mesh.getMaterialForRenderPass(engine.currentRenderPassId)).toBeTruthy();
        expect(controller.handlesCurrentPass).toBe(true);
        controller["_depthMode"] = false;
        expect(controller.handlesCurrentPass).toBe(false);
        controller["_depthMode"] = true;
        mesh.setMaterialForRenderPass(engine.currentRenderPassId, undefined);

        // Other passes retain the classic worker path and its first-sort readiness gate.
        engine.currentRenderPassId = 12345;
        expect(controller.handlesCurrentPass).toBe(false);
        mesh._postToWorker(true);
        expect(post).toHaveBeenCalledWith(expect.objectContaining({ command: "sort" }), expect.any(Array));
        expect(mesh.isReady(false)).toBe(false);
        await vi.waitFor(() => expect(depth["_shadersLoaded"]).toBe(true));
        controller["_renderer"] = null;
        scene.dispose();
        engine.dispose();
    });

    it("registers the compute and blit shaders through the public mesh entry point", () => {
        expect(WebGPUEngine.prototype.createComputeContext).toBeTypeOf("function");
        for (const name of [
            "gpsPreprocessComputeShader",
            "gpsScanBlocksComputeShader",
            "gpsScanSumsComputeShader",
            "gpsScanAddComputeShader",
            "gpsPartitionComputeShader",
            "gpsSplatComputeShader",
            "gpsResolveComputeShader",
            "gpsHiZBuildComputeShader",
            "gaussianPointSplattingBlitVertexShader",
            "gaussianPointSplattingBlitPixelShader",
            "gaussianPointSplattingDepthBlitPixelShader",
        ]) {
            expect(ShaderStore.ShadersStoreWGSL[name]).toBeDefined();
        }
    });

    it("exposes completed point-render progress without exposing renderer internals", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        const controller = CreateController(mesh);
        const renderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
        renderer["_frameIndex"] = 12;
        renderer["_accumGeneration"] = 3;
        renderer["_upsampleN"] = 2;

        expect(mesh.pointSplattingProgress).toBeNull();
        controller["_renderer"] = renderer;
        controller["_colorMode"] = true;
        expect(mesh.pointSplattingProgress).toBeNull();
        controller["_resultReady"] = true;
        controller["_progressReady"] = true;
        controller["_progressFrameCount"] = 12;
        controller["_progressGeneration"] = 3;
        controller["_progressCycleLength"] = 4;
        expect(mesh.pointSplattingProgress).toEqual({
            renderedFrameCount: 12,
            accumulationVersion: 3,
            pixelCycleLength: 4,
        });

        // An unrendered reset must not pair a new generation with the previous counters.
        mesh.pointSplattingRenderScale = 0.5;
        expect(renderer.accumulationVersion).toBe(4);
        expect(mesh.pointSplattingProgress).toEqual({
            renderedFrameCount: 12,
            accumulationVersion: 3,
            pixelCycleLength: 4,
        });

        // Frame start invalidates the compute result, but progress stays readable until the next compute runs.
        const streaming = vi.spyOn(mesh, "_pointStreamingUnsupported", "get").mockReturnValue(true);
        controller["_ensureCompute"]();
        streaming.mockRestore();
        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(controller["_resultReady"]).toBe(false);
        expect(mesh.pointSplattingProgress).toEqual({
            renderedFrameCount: 12,
            accumulationVersion: 3,
            pixelCycleLength: 4,
        });

        controller["_renderer"] = null;
        controller.dispose();
        expect(controller["_progressReady"]).toBe(false);
        scene.dispose();
        engine.dispose();
    });

    it("sizes accumulation to the camera's first post-process or output target", () => {
        const engine = new NullEngine({ renderWidth: 400, renderHeight: 200 });
        const scene = new Scene(engine);
        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        scene.activeCamera = camera;
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        const controller = CreateController(mesh);

        const size = controller["_getOutputSize"]();
        expect(size).toEqual({ width: 400, height: 200 });
        expect(controller["_getOutputSize"]()).toBe(size);

        const lowResScene = new PassPostProcess("lowResScene", 0.5, camera);
        lowResScene.activate(camera);
        expect(controller["_getOutputSize"]()).toEqual({ width: 200, height: 100 });
        scene.postProcessesEnabled = false;
        expect(controller["_getOutputSize"]()).toEqual({ width: 400, height: 200 });
        scene.postProcessesEnabled = true;
        lowResScene.dispose();
        expect(controller["_getOutputSize"]()).toEqual({ width: 400, height: 200 });

        camera.outputRenderTarget = new RenderTargetTexture("target", 200, scene);
        expect(controller["_getOutputSize"]()).toEqual({ width: 200, height: 200 });
        camera.outputRenderTarget.dispose();
        camera.outputRenderTarget = null;
        expect(controller["_getOutputSize"]()).toEqual({ width: 400, height: 200 });

        scene.dispose();
        engine.dispose();
    });

    it("reuses debug part data until settings, part count or the clipping box change", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const material = new GaussianSplattingMaterial("splat", scene);
        const debug = new GaussianSplattingDebugMaterialPlugin(material);

        const first = debug.getResolvedPartData(2, engine);
        expect(debug.getResolvedPartData(2, engine)).toBe(first);
        expect(debug.getResolvedPartData(1, engine)).not.toBe(first);
        debug.opacityScale = 0.5;
        const changed = debug.getResolvedPartData(2, engine);
        expect(changed).not.toBe(first);
        expect(changed.data).not.toEqual(first.data);

        debug.clippingBox = { min: new Vector3(-1, -1, -1), max: new Vector3(1, 1, 1) };
        const boxed = debug.getResolvedPartData(1, engine);
        expect(boxed.data[0]).toBe(-1);
        debug.clippingBox.min.x = 5;
        const updated = debug.getResolvedPartData(1, engine);
        expect(updated).not.toBe(boxed);
        expect(updated.data[0]).toBe(5);
        expect(debug.getResolvedPartData(1, engine)).toBe(updated);
        // Fractional values must compare equal to their own snapshot.
        debug.clippingBox.max.y = 0.1;
        const fractional = debug.getResolvedPartData(1, engine);
        expect(fractional).not.toBe(updated);
        expect(debug.getResolvedPartData(1, engine)).toBe(fractional);

        scene.dispose();
        engine.dispose();
    });

    it("keeps the jitter visit stride coprime to every supported upscale cycle", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        const controller = CreateController(mesh);

        for (let n = 1; n <= 8; n++) {
            const total = n * n;
            const stride = controller["_coprimeStride"](total);
            expect(new Set(Array.from({ length: total }, (_, i) => (i * stride) % total)).size).toBe(total);
        }

        scene.dispose();
        engine.dispose();
    });

    it("packs the expected SH coefficients for degrees 1 through 4", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        const controller = CreateController(mesh);
        const textures = Array.from({ length: 5 }, (_, t) => Uint8Array.from({ length: 32 }, (_, i) => t * 32 + i));

        expect(controller["_packSh"](undefined, 0, 2)).toBeNull();
        for (const [degree, scalars] of [
            [1, 9],
            [2, 24],
            [3, 45],
            [4, 72],
        ]) {
            const packed = controller["_packSh"](textures, degree, 2)!;
            const bytes = new Uint8Array(packed.buffer);
            const stride = Math.ceil(scalars / 4) * 4;
            expect(bytes.length).toBe(stride * 2);
            for (let i = 0; i < 2; i++) {
                for (let k = 0; k < scalars; k++) {
                    expect(bytes[i * stride + k]).toBe(textures[Math.floor(k / 16)][i * 16 + (k % 16)]);
                }
            }
        }

        scene.dispose();
        engine.dispose();
    });

    it("keeps the decoded part count separate from the number of parts owning splats", () => {
        const engine = new NullEngine();
        (engine.getCaps() as { maxVertexUniformVectors: number }).maxVertexUniformVectors = 256;
        (engine.getCaps() as { maxTextureSize: number }).maxTextureSize = 16;
        const scene = new Scene(engine);
        const mesh = new GaussianSplattingCompoundMesh("splat", null, scene);
        const controller = CreateController(mesh);
        const data = new ArrayBuffer(32);
        const source = new GaussianSplattingMesh("source", null, scene);
        source.disableDepthSort = true;
        source.updateData(data);
        mesh.disableDepthSort = true;
        const second = new GaussianSplattingMesh("source2", null, scene);
        second.disableDepthSort = true;
        second.updateData(data);
        mesh.addParts([source, second]);
        mesh["_splatsData"] = data;
        controller["_decodedSplatsData"] = data;
        controller["_splatCount"] = 1;
        controller["_partCount"] = 1;
        controller["_decodedPartCount"] = 2;
        controller["_decodedRevision"] = mesh._splatDataRevision;
        controller["_decodedShDegree"] = mesh._shDegree;

        expect(mesh.partCount).toBe(2);
        expect(() => controller["_syncData"]()).not.toThrow();

        scene.dispose();
        engine.dispose();
    });

    it("bounds the view-space depth span by the parts and the camera interval", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        const controller = CreateController(mesh);
        const view = Matrix.Identity().m;
        controller["_partLocalMin"] = new Float32Array([-1, -1, -1]);
        controller["_partLocalMax"] = new Float32Array([1, 1, 1]);
        controller["_partScratch"].set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 2, 1]);

        expect(controller["_viewZSpan"](view, 0.5, 10)).toEqual([1, 3]);
        // Clamped to the camera interval, including when the camera is inside a part.
        controller["_partScratch"][14] = 0;
        expect(controller["_viewZSpan"](view, 0.5, 10)).toEqual([0.5, 1]);
        expect(controller["_viewZSpan"](view, 0.5, 10, false)).toEqual([-1, 1]);
        scene.useRightHandedSystem = true;
        controller["_partScratch"][14] = -2;
        expect(controller["_viewZSpan"](view, 0.5, 10)).toEqual([1, 3]);
        scene.useRightHandedSystem = false;

        // A single splat has no depth extent, so the span widens around it.
        controller["_partLocalMin"] = new Float32Array([0, 0, 0]);
        controller["_partLocalMax"] = new Float32Array([0, 0, 0]);
        controller["_partScratch"][14] = 10;
        const [spanMin, spanMax] = controller["_viewZSpan"](view, 0.1, 0);
        expect(spanMin).toBeLessThan(10);
        expect(spanMax).toBeGreaterThan(10);
        expect(spanMax - spanMin).toBeLessThan(1);

        // Nothing visible falls back to the camera interval.
        controller["_partLocalMin"] = new Float32Array([NaN, NaN, NaN]);
        expect(controller["_viewZSpan"](view, 0.1, 5)).toEqual([0.1, 5]);

        scene.dispose();
        engine.dispose();
    });

    it("decodes splats like the classic _makeSplat without a GPU", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        const controller = CreateController(mesh);
        const renderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
        const upload = vi.spyOn(renderer, "updateSplats").mockImplementation(() => {});
        controller["_renderer"] = renderer;

        // Local mean, color, opacity and a degenerate (zero-scale) covariance.
        const degenerate = new ArrayBuffer(32);
        new Float32Array(degenerate).set([1, 2, 3, 0, 0, 0]);
        new Uint8Array(degenerate).set([10, 20, 30, 255, 255, 128, 128, 128], 24);
        controller["_decode"](degenerate);
        const [means, cov, colors, sh, degree, count] = upload.mock.calls[0];
        expect(Array.from(means)).toEqual([1, 2, 3, 0]);
        expect(cov[3]).toBe(0x3f800000);
        expect(colors[0] >>> 0).toBe(0xff1e140a);
        expect(sh).toBeNull();
        expect(degree).toBe(0);
        expect(count).toBe(1);

        const scaled = new ArrayBuffer(32);
        new Float32Array(scaled).set([0, 0, 0, 0.75, 0.375, 0.1875]);
        // Rotation bytes decode as (b-127.5)/127.5, so 128 is the closest encodable value to identity.
        new Uint8Array(scaled).set([255, 255, 255, 255, 0, 128, 128, 128], 24);
        controller["_decode"](scaled);
        const scaledCov = upload.mock.calls[1][1];
        // `_makeSplat` doubles the scale, so the factor is (2*0.75)^2 = 2.25.
        expect(new Float32Array(new Uint32Array([scaledCov[3]]).buffer)[0]).toBeCloseTo(2.25, 3);
        // Normalized diagonal is scale-invariant: s00/factor = 1, s11/factor = 0.25, s22/factor = 0.0625.
        expect(FromHalfFloat(scaledCov[0] & 0xffff)).toBeCloseTo(1, 3);
        expect(FromHalfFloat(scaledCov[1] >>> 16)).toBeCloseTo(0.25, 3);
        expect(FromHalfFloat(scaledCov[2] >>> 16)).toBeCloseTo(0.0625, 3);

        controller["_renderer"] = null;
        scene.dispose();
        engine.dispose();
    });

    it("uses the classic atlas means for appended parts with mixed Y conventions", () => {
        const engine = new NullEngine();
        vi.spyOn(engine, "updateTextureData").mockImplementation(() => {});
        (engine.getCaps() as { maxVertexUniformVectors: number }).maxVertexUniformVectors = 256;
        (engine.getCaps() as { maxTextureSize: number }).maxTextureSize = 16;
        const scene = new Scene(engine);
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        mesh.disableDepthSort = true;
        const first = new ArrayBuffer(32);
        new Float32Array(first).set([1, 2, 3, 1, 1, 1]);
        new Uint8Array(first).fill(128, 24);
        mesh.updateData(first);
        const other = new GaussianSplattingMesh("other", null, scene);
        other.disableDepthSort = true;
        const second = new ArrayBuffer(32);
        new Float32Array(second).set([4, 5, 6, 1, 1, 1]);
        new Uint8Array(second).fill(128, 24);
        other.updateData(second);
        const proxy = mesh.addPart(other);
        const controller = CreateController(mesh);
        const renderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
        const upload = vi.spyOn(renderer, "updateSplats").mockImplementation(() => {});
        controller["_renderer"] = renderer;
        controller["_syncData"]();
        const positions = mesh._getPointDecodeInputs().positions!;
        const means = upload.mock.lastCall![0];
        expect(Array.from(means.subarray(0, 3))).toEqual(Array.from(positions.subarray(0, 3)));
        const offset = proxy._splatsDataOffset * 4;
        expect(Array.from(means.subarray(offset, offset + 3))).toEqual([4, 5, 6]);
        expect(Array.from(controller["_partLocalMin"].subarray(3, 6))).toEqual([4, 5, 6]);
        controller["_renderer"] = null;
        mesh["_partProxies"] = mesh["_partProxies"].filter((part) => !!part);
        scene.dispose();
        engine.dispose();
    });

    it("filters point opacity by source and compound part ranges", () => {
        const engine = new NullEngine();
        (engine.getCaps() as { maxVertexUniformVectors: number }).maxVertexUniformVectors = 256;
        (engine.getCaps() as { maxTextureSize: number }).maxTextureSize = 16;
        const scene = new Scene(engine);
        const renderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
        const upload = vi.spyOn(renderer, "updateSplats").mockImplementation(() => {});
        vi.spyOn(renderer, "resetAccumulation").mockImplementation(() => {});
        const syncAlphas = (controller: GaussianPointSplattingController) => {
            controller["_syncData"]();
            return Array.from(upload.mock.lastCall![2], (color) => color >>> 24);
        };

        const mesh = new GaussianSplattingMesh("splat", null, scene);
        const controller = CreateController(mesh);
        mesh.disableDepthSort = true;
        const data = new ArrayBuffer(3 * 32);
        const bytes = new Uint8Array(data);
        for (let i = 0; i < 3; i++) {
            bytes[i * 32 + 27] = 255;
            bytes.fill(128, i * 32 + 28, i * 32 + 32);
        }
        mesh.updateData(data);
        controller["_renderer"] = renderer;
        mesh.setSplatIndexRanges([{ offset: 1, count: 1 }]);
        expect(syncAlphas(controller)).toEqual([0, 255, 0]);
        mesh.setSplatIndexRanges([
            { offset: 2, count: 1 },
            { offset: 0, count: 1 },
        ]);
        expect(syncAlphas(controller)).toEqual([255, 0, 255]);
        mesh.setSplatIndexRanges([]);
        expect(syncAlphas(controller)).toEqual([0, 0, 0]);
        mesh.setSplatIndexRanges(null);
        expect(syncAlphas(controller)).toEqual([255, 255, 255]);
        controller["_renderer"] = null;

        const compound = new GaussianSplattingCompoundMesh("compound", null, scene);
        const compoundController = CreateController(compound);
        compound.disableDepthSort = true;
        compound.addParts(
            ["first", "second"].map((name) => {
                const source = new GaussianSplattingMesh(name, null, scene);
                source.disableDepthSort = true;
                const sourceData = new ArrayBuffer(32);
                new Uint8Array(sourceData)[27] = 255;
                source.updateData(sourceData);
                return source;
            })
        );
        compoundController["_renderer"] = renderer;
        compound.setPartSplatRanges(1, []);
        expect(syncAlphas(compoundController)).toEqual([255, 0]);
        compound.setPartSplatRanges(1, null);
        expect(syncAlphas(compoundController)).toEqual([255, 255]);

        compoundController["_renderer"] = null;
        scene.dispose();
        engine.dispose();
    });

    it("decodes once for both modes, re-decodes on data changes, and releases compute after both modes are off", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        const controller = CreateController(mesh);
        mesh.disableDepthSort = true;
        const data = new ArrayBuffer(32);
        const bytes = new Uint8Array(data);
        bytes[27] = 255;
        bytes.fill(128, 28, 32);
        mesh.updateData(data);
        const renderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
        vi.spyOn(renderer, "supportsWorkload").mockReturnValue(true);
        const upload = vi.spyOn(renderer, "updateSplats").mockImplementation(() => {});
        const dispose = vi.spyOn(renderer, "dispose").mockImplementation(() => {});
        controller["_renderer"] = renderer;

        controller["_colorMode"] = true;
        controller["_ensureCompute"]();
        controller["_depthMode"] = true;
        controller["_ensureCompute"]();
        expect(upload).toHaveBeenCalledTimes(1);

        bytes[27] = 64;
        mesh.updateData(data);
        expect(mesh._splatsData).toBe(controller["_decodedSplatsData"]);
        controller["_syncData"]();
        expect(upload).toHaveBeenCalledTimes(2);
        expect(upload.mock.lastCall![2][0] >>> 24).toBe(64);
        mesh._shDegree = 1;
        controller["_syncData"]();
        expect(upload).toHaveBeenCalledTimes(3);

        controller["_colorMode"] = false;
        controller["_releaseComputeIfIdle"]();
        expect(dispose).not.toHaveBeenCalled();
        controller["_depthMode"] = false;
        controller["_releaseComputeIfIdle"]();
        expect(dispose).toHaveBeenCalledOnce();
        expect(controller["_renderer"]).toBeNull();
        expect(controller["_computeObserver"]).toBeNull();

        scene.dispose();
        engine.dispose();
    });

    it("reuploads unchanged data and discards stale GPU state after device restoration", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        mesh.disableDepthSort = true;
        mesh.updateData(new ArrayBuffer(32));
        const controller = CreateController(mesh);
        const oldRenderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
        vi.spyOn(oldRenderer, "supportsWorkload").mockReturnValue(true);
        vi.spyOn(oldRenderer, "updateSplats").mockImplementation(() => {});
        const dispose = vi.spyOn(oldRenderer, "dispose").mockImplementation(() => {});
        controller["_renderer"] = oldRenderer;
        controller["_colorMode"] = true;
        controller["_ensureCompute"]();
        controller["_enableColorBlit"]();
        controller["_depthMode"] = true;
        controller["_enableDepthBlit"]();
        const oldBlit = controller["_blit"];
        const oldDepthBlit = controller["_depthBlit"];
        const source = controller["_decodedSplatsData"];
        const oldRequest = controller["_autoRequestId"];
        controller["_resultReady"] = true;
        controller["_progressReady"] = true;
        controller["_budgetReadPending"] = true;
        controller["_autoN"] = 8;
        const newRenderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
        const upload = vi.spyOn(newRenderer, "updateSplats").mockImplementation(() => {});
        controller["_ensureCompute"] = vi.fn(() => {
            controller["_renderer"] = newRenderer;
            controller["_syncData"]();
        });

        engine.onContextRestoredObservable.notifyObservers(engine);
        expect(dispose).toHaveBeenCalledOnce();
        expect(controller["_renderer"]).toBe(newRenderer);
        expect(controller["_blit"]).not.toBe(oldBlit);
        expect(controller["_depthBlit"]).not.toBe(oldDepthBlit);
        expect(upload).toHaveBeenCalledOnce();
        expect(controller["_decodedSplatsData"]).toBe(source);
        expect(controller["_autoRequestId"]).toBeGreaterThan(oldRequest);
        expect(controller["_resultReady"]).toBe(false);
        expect(mesh.pointSplattingProgress).toBeNull();
        expect(controller["_budgetReadPending"]).toBe(false);
        expect(controller["_autoN"]).toBe(2);
        const observer = controller["_restoreObserver"]!;
        controller["_renderer"] = null;
        controller.dispose();
        await vi.waitFor(() => expect(engine.onContextRestoredObservable.observers).not.toContain(observer));
        scene.dispose();
        engine.dispose();
    });

    it("skips decoding for streamed parts and for workloads beyond the device limits", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        new FreeCamera("camera", Vector3.Zero(), scene);
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        mesh.disableDepthSort = true;
        mesh.updateData(new ArrayBuffer(64));
        const controller = CreateController(mesh);
        const renderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
        const supports = vi.spyOn(renderer, "supportsWorkload").mockReturnValue(false);
        const upload = vi.spyOn(renderer, "updateSplats").mockImplementation(() => {});
        controller["_renderer"] = renderer;
        const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});

        // Streamed parts never reach the CPU data, so their reserved padding must not be decoded.
        mesh["_hasStreamingPart"] = true;
        controller["_ensureCompute"]();
        expect(supports).not.toHaveBeenCalled();
        controller["_colorMode"] = true;
        controller["_depthMode"] = true;
        expect(controller["_computeActive"]).toBe(false);
        mesh["_hasStreamingPart"] = false;

        controller["_ensureCompute"]();
        expect(supports).toHaveBeenCalledWith(2, 0, expect.any(Number), expect.any(Number));
        expect(upload).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledTimes(1);

        supports.mockReturnValue(true);
        controller["_ensureCompute"]();
        expect(upload).toHaveBeenCalledTimes(1);

        warn.mockRestore();
        controller["_renderer"] = null;
        scene.dispose();
        engine.dispose();
    });

    it.each(["raw SOG", "standalone stream"] as const)("falls back in both passes for %s without CPU data", async (source) => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        scene.setTransformMatrix(camera.getViewMatrix(), camera.getProjectionMatrix());
        const mesh = new GaussianSplattingMesh("gpu-only", null, scene);
        mesh["_useSog"] = source === "raw SOG";
        mesh._vertexCount = 4;
        const controller = CreateController(mesh);
        controller["_colorMode"] = true;
        controller["_depthMode"] = true;
        const depth = scene.enableDepthRenderer(camera);
        const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});

        engine.currentRenderPassId = camera.renderPassId;
        expect(controller.drawColorPass(true)).toBe(false);
        engine.currentRenderPassId = depth.getDepthMap().renderPassId;
        expect(controller.drawColorPass(false)).toBe(false);
        expect(warn).toHaveBeenCalledOnce();
        expect(controller["_computeActive"]).toBe(false);

        warn.mockRestore();
        await vi.waitFor(() => expect(depth["_shadersLoaded"]).toBe(true));
        scene.dispose();
        engine.dispose();
    });

    it("caps the auto upsample factor at eight and only marks a generation measured after its reset frame", async () => {
        const { controller, renderer } = CreateAutoScaleSetup(0);
        vi.spyOn(renderer, "readPointCountAsync").mockResolvedValue(1_000_000_000);
        await controller["_convergeAutoScaleAsync"](2, 0, true, 0);
        expect(controller["_autoN"]).toBe(8);
        expect(controller["_budgetReadPending"]).toBe(false);
        // Restart once for the corrected factor, then mark the new generation measured.
        expect(renderer.accumulationVersion).toBe(1);
        expect(controller["_autoMeasuredGeneration"]).toBe(1);

        // The reset frame may over-count, so it only steers N (which still restarts accumulation).
        const reset = CreateAutoScaleSetup(4);
        vi.spyOn(reset.renderer, "readPointCountAsync").mockResolvedValue(1_000_000_000);
        await reset.controller["_convergeAutoScaleAsync"](2, 4, false, 0);
        expect(reset.controller["_autoN"]).toBe(8);
        expect(reset.controller["_autoMeasuredGeneration"]).toBe(-1);
        expect(reset.renderer.accumulationVersion).toBe(5);
    });

    it("ignores auto-scale readbacks made stale by a restart, a render scale change or a renderer replacement", async () => {
        // Accumulation restarted while the readback was in flight: adopt the factor but do not mark it measured.
        const restarted = CreateAutoScaleSetup(4);
        let finishRestarted!: (value: number) => void;
        vi.spyOn(restarted.renderer, "readPointCountAsync").mockImplementation(() => new Promise<number>((resolve) => (finishRestarted = resolve)));
        const pending = restarted.controller["_convergeAutoScaleAsync"](2, 4, true, 0);
        restarted.renderer.resetAccumulation();
        finishRestarted(1_000_000_000);
        await pending;
        expect(restarted.controller["_autoMeasuredGeneration"]).toBe(-1);
        expect(restarted.controller["_autoN"]).toBe(8);
        expect(restarted.renderer.accumulationVersion).toBe(6);

        // The render scale changed: neither adopt the factor nor restart again.
        const rescaled = CreateAutoScaleSetup(0);
        let finishRescaled!: (value: number) => void;
        vi.spyOn(rescaled.renderer, "readPointCountAsync").mockImplementation(() => new Promise<number>((resolve) => (finishRescaled = resolve)));
        rescaled.controller["_updateAutoScale"](2, 0, true);
        rescaled.mesh.pointSplattingRenderScale = 0.5;
        rescaled.mesh.pointSplattingRenderScale = "auto";
        expect(rescaled.renderer.accumulationVersion).toBe(2);
        finishRescaled(1_000_000_000);
        await Promise.resolve();
        await Promise.resolve();
        expect(rescaled.controller["_autoN"]).toBe(2);
        expect(rescaled.renderer.accumulationVersion).toBe(2);
        expect(rescaled.controller["_budgetReadPending"]).toBe(false);

        // The renderer was released and replaced: only the new renderer's readback counts.
        const { controller, renderer: oldRenderer } = CreateAutoScaleSetup(0);
        let finishOld!: (value: number) => void;
        vi.spyOn(oldRenderer, "readPointCountAsync").mockImplementation(() => new Promise<number>((resolve) => (finishOld = resolve)));
        vi.spyOn(oldRenderer, "dispose").mockImplementation(() => {});
        controller["_updateAutoScale"](2, 0, true);
        controller["_colorMode"] = false;
        controller["_releaseComputeIfIdle"]();
        const newRenderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
        newRenderer["_accumGeneration"] = 0;
        let finishNew!: (value: number) => void;
        vi.spyOn(newRenderer, "readPointCountAsync").mockImplementation(() => new Promise<number>((resolve) => (finishNew = resolve)));
        controller["_renderer"] = newRenderer;
        controller["_colorMode"] = true;
        controller["_updateAutoScale"](2, 0, true);
        finishOld(1_000_000_000);
        await Promise.resolve();
        expect(controller["_autoN"]).toBe(2);
        expect(controller["_budgetReadPending"]).toBe(true);
        finishNew(1_000_000_000);
        await Promise.resolve();
        expect(controller["_autoN"]).toBe(8);
        expect(controller["_budgetReadPending"]).toBe(false);
    });

    it("restarts accumulation only when a point setting actually changes", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        const controller = CreateController(mesh);
        const renderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
        renderer["_accumGeneration"] = 7;
        renderer["_hasPrevVp"] = true;
        const reset = vi.spyOn(renderer, "resetAccumulation");
        controller["_renderer"] = renderer;
        controller["_autoMeasuredGeneration"] = 7;

        mesh.pointSplattingRenderScale = 0.5;
        expect(reset).toHaveBeenCalledTimes(1);
        expect(renderer.accumulationVersion).toBe(8);
        expect(controller["_autoMeasuredGeneration"]).toBe(-1);
        // Clearing the previous view-projection would make renderToBuffer reset again next frame.
        expect(renderer["_hasPrevVp"]).toBe(true);
        mesh.pointSplattingRenderScale = 0.5;
        expect(reset).toHaveBeenCalledTimes(1);

        expect(mesh.pointSplattingScale).toBe(1);
        mesh.pointSplattingScale = 2;
        expect(reset).toHaveBeenCalledTimes(2);
        mesh.pointSplattingScale = 2;
        expect(reset).toHaveBeenCalledTimes(2);

        expect(mesh.pointSplattingOcclusionCulling).toBe(false);
        mesh.pointSplattingOcclusionCulling = true;
        expect(renderer.occlusionCulling).toBe(true);
        expect(reset).toHaveBeenCalledTimes(3);
        mesh.pointSplattingOcclusionCulling = true;
        expect(reset).toHaveBeenCalledTimes(3);

        controller["_renderer"] = null;
        scene.dispose();
        engine.dispose();
    });

    it("uploads material alpha and the current world transform of each part", () => {
        const engine = new NullEngine();
        (engine.getCaps() as { maxVertexUniformVectors: number }).maxVertexUniformVectors = 256;
        (engine.getCaps() as { maxTextureSize: number }).maxTextureSize = 16;
        const scene = new Scene(engine);
        const renderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
        vi.spyOn(renderer, "updateSplats").mockImplementation(() => {});
        const setParts = vi.spyOn(renderer, "setPartData").mockImplementation(() => {});

        const mesh = new GaussianSplattingCompoundMesh("splat", null, scene);
        const controller = CreateController(mesh);
        mesh.disableDepthSort = true;
        const proxies = mesh.addParts(
            ["first", "second"].map((name) => {
                const source = new GaussianSplattingMesh(name, null, scene);
                source.disableDepthSort = true;
                const data = new ArrayBuffer(32);
                new Uint8Array(data)[27] = 255;
                source.updateData(data);
                return source;
            })
        );
        mesh.computeWorldMatrix(true);
        const material = new GaussianSplattingMaterial("material", scene);
        material.alpha = 0.5;
        mesh.material = material;
        controller["_renderer"] = renderer;
        controller["_syncData"]();
        proxies[1].position.x = 5;
        controller["_uploadParts"]();
        const parts = setParts.mock.lastCall![0];
        expect(parts[40 + 12]).toBe(5);
        expect(parts[16]).toBeCloseTo(0.5);
        expect(parts[40 + 16]).toBeCloseTo(0.5);
        controller["_renderer"] = null;

        // A non-compound mesh moved during the frame: getWorldMatrix() alone would return the cached matrix.
        const single = new GaussianSplattingMesh("single", null, scene);
        const singleController = CreateController(single);
        single.computeWorldMatrix(true);
        singleController["_renderer"] = renderer;
        singleController["_partCount"] = 1;
        single.getWorldMatrix();
        single.position.y = 3;
        singleController["_uploadParts"]();
        expect(setParts.mock.lastCall![0][13]).toBe(3);

        singleController["_renderer"] = null;
        scene.dispose();
        engine.dispose();
    });

    it("falls back to the classic path for views the point path cannot reproduce", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        const controller = CreateController(mesh);
        expect(controller["_hasUnsupportedView"]()).toBe(true);

        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        scene.setTransformMatrix(camera.getViewMatrix(), camera.getProjectionMatrix());
        expect(controller["_hasUnsupportedView"]()).toBe(false);
        camera.projectionPlaneTilt = 0.1;
        scene.setTransformMatrix(camera.getViewMatrix(), camera.getProjectionMatrix());
        expect(controller["_hasUnsupportedView"]()).toBe(false);
        camera.projectionPlaneTilt = 0;
        scene.setTransformMatrix(camera.getViewMatrix(), camera.getProjectionMatrix());
        expect(controller["_hasUnsupportedView"]()).toBe(false);
        scene.clipPlane = new Plane(0, 1, 0, 0);
        expect(controller["_hasUnsupportedView"]()).toBe(true);
        scene.clipPlane = null;
        mesh.material!.clipPlane6 = new Plane(0, 1, 0, 0);
        expect(controller["_hasUnsupportedView"]()).toBe(true);
        mesh.material!.clipPlane6 = null;
        expect(controller["_hasUnsupportedView"]()).toBe(false);
        camera._rigCameras.push(new FreeCamera("eye", Vector3.Zero(), scene));
        expect(controller["_hasUnsupportedView"]()).toBe(true);

        scene.dispose();
        engine.dispose();
    });

    it("computes at draw time, shares matching passes, and recomputes changed views without classic rendering", async () => {
        const engine = new NullEngine({ renderWidth: 400, renderHeight: 200 });
        const scene = new Scene(engine);
        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        const controller = CreateController(mesh);
        const depthRenderer = scene.enableDepthRenderer(camera);
        controller["_colorMode"] = true;
        controller["_depthMode"] = true;
        controller["_renderScale"] = 1;
        controller["_enableColorBlit"]();
        controller["_enableDepthBlit"]();
        const renderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
        vi.spyOn(renderer, "supportsWorkload").mockReturnValue(true);
        controller["_renderer"] = renderer;
        const compute = vi.fn(() => {
            controller["_vpMatrix"].copyFrom(scene.getTransformMatrix());
            const { width, height } = controller["_getOutputSize"]();
            controller["_computedWidth"] = width;
            controller["_computedHeight"] = height;
            controller["_resultReady"] = true;
        });
        controller["_runCompute"] = compute;
        controller["_ensureCompute"]();
        const colorMesh = controller["_blitMesh"]!;
        const depthMesh = controller["_depthBlitMesh"]!;
        vi.spyOn(controller["_blit"]!, "isReady").mockReturnValue(true);
        vi.spyOn(controller["_depthBlit"]!, "isReady").mockReturnValue(true);
        const colorDraw = vi.spyOn(colorMesh, "render").mockReturnValue(colorMesh);
        const depthDraw = vi.spyOn(depthMesh, "render").mockReturnValue(depthMesh);
        const originalClassic = GaussianSplattingMeshBase.prototype["_drawColorPass"];
        const classic = vi.fn<typeof originalClassic>().mockReturnValue(mesh);
        GaussianSplattingMeshBase.prototype["_drawColorPass"] = classic;
        onTestFinished(() => {
            GaussianSplattingMeshBase.prototype["_drawColorPass"] = originalClassic;
        });

        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(compute).not.toHaveBeenCalled();
        // A late callback updates the camera before the first compositor draws.
        camera.position.x = 1;
        scene.setTransformMatrix(camera.getViewMatrix(), camera.getProjectionMatrix());
        engine.currentRenderPassId = depthRenderer.getDepthMap().renderPassId;
        mesh["_drawColorPass"](mesh, depthMesh.subMeshes[0], false);
        expect(compute).toHaveBeenCalledTimes(1);
        expect(controller["_vpMatrix"].equals(scene.getTransformMatrix())).toBe(true);
        expect(depthDraw).toHaveBeenCalledTimes(1);

        engine.currentRenderPassId = camera.renderPassId;
        mesh["_drawColorPass"](mesh, colorMesh.subMeshes[0], true);
        expect(compute).toHaveBeenCalledTimes(1);
        expect(colorDraw).toHaveBeenCalledTimes(1);

        // A genuinely different target projection needs another point dispatch, not a classic pass.
        scene.setTransformMatrix(camera.getViewMatrix(), Matrix.PerspectiveFovLH(camera.fov, 1, camera.minZ, camera.maxZ));
        engine.currentRenderPassId = depthRenderer.getDepthMap().renderPassId;
        mesh["_drawColorPass"](mesh, depthMesh.subMeshes[0], false);
        expect(compute).toHaveBeenCalledTimes(2);
        expect(controller["_vpMatrix"].equals(scene.getTransformMatrix())).toBe(true);
        expect(depthDraw).toHaveBeenCalledTimes(2);

        camera.position.x = 2;
        scene.setTransformMatrix(camera.getViewMatrix(), camera.getProjectionMatrix());
        mesh["_drawColorPass"](mesh, depthMesh.subMeshes[0], false);
        expect(compute).toHaveBeenCalledTimes(3);
        expect(depthDraw).toHaveBeenCalledTimes(3);

        camera.outputRenderTarget = new RenderTargetTexture("resized", 200, scene);
        mesh["_drawColorPass"](mesh, depthMesh.subMeshes[0], false);
        expect(compute).toHaveBeenCalledTimes(4);
        expect(controller["_computedWidth"]).toBe(200);
        expect(controller["_computedHeight"]).toBe(200);

        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(compute).toHaveBeenCalledTimes(4);
        mesh["_drawColorPass"](mesh, depthMesh.subMeshes[0], false);
        expect(compute).toHaveBeenCalledTimes(5);
        expect(classic).not.toHaveBeenCalled();

        await vi.waitFor(() => expect(depthRenderer["_shadersLoaded"]).toBe(true));
        controller["_renderer"] = null;
        scene.dispose();
        engine.dispose();
    });

    it("waits for compute and compositor readiness without inserting classic passes", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        const controller = CreateController(mesh);
        const depth = scene.enableDepthRenderer(camera);
        controller["_colorMode"] = true;
        controller["_depthMode"] = true;
        controller["_enableColorBlit"]();
        controller["_enableDepthBlit"]();
        scene.setTransformMatrix(camera.getViewMatrix(), camera.getProjectionMatrix());
        const compute = vi.fn(() => {});
        controller["_runCompute"] = compute;
        const colorMesh = controller["_blitMesh"]!;
        const depthMesh = controller["_depthBlitMesh"]!;
        const colorReady = vi.spyOn(controller["_blit"]!, "isReady").mockReturnValue(false);
        const depthReady = vi.spyOn(controller["_depthBlit"]!, "isReady").mockReturnValue(false);
        const colorDraw = vi.spyOn(colorMesh, "render").mockReturnValue(colorMesh);
        const depthDraw = vi.spyOn(depthMesh, "render").mockReturnValue(depthMesh);
        const originalClassic = GaussianSplattingMeshBase.prototype["_drawColorPass"];
        const classic = vi.fn<typeof originalClassic>().mockReturnValue(mesh);
        GaussianSplattingMeshBase.prototype["_drawColorPass"] = classic;
        onTestFinished(() => {
            GaussianSplattingMeshBase.prototype["_drawColorPass"] = originalClassic;
        });

        engine.currentRenderPassId = camera.renderPassId;
        mesh["_drawColorPass"](mesh, colorMesh.subMeshes[0], true);
        engine.currentRenderPassId = depth.getDepthMap().renderPassId;
        mesh["_drawColorPass"](mesh, depthMesh.subMeshes[0], false);
        expect(compute).toHaveBeenCalledTimes(2);
        expect(colorDraw).not.toHaveBeenCalled();
        expect(depthDraw).not.toHaveBeenCalled();

        controller["_vpMatrix"].copyFrom(scene.getTransformMatrix());
        controller["_computedWidth"] = engine.getRenderWidth();
        controller["_computedHeight"] = engine.getRenderHeight();
        controller["_resultReady"] = true;
        engine.currentRenderPassId = camera.renderPassId;
        mesh["_drawColorPass"](mesh, colorMesh.subMeshes[0], true);
        engine.currentRenderPassId = depth.getDepthMap().renderPassId;
        mesh["_drawColorPass"](mesh, depthMesh.subMeshes[0], false);
        expect(compute).toHaveBeenCalledTimes(2);
        expect(colorReady).toHaveBeenCalled();
        expect(depthReady).toHaveBeenCalled();
        expect(colorDraw).not.toHaveBeenCalled();
        expect(depthDraw).not.toHaveBeenCalled();
        expect(classic).not.toHaveBeenCalled();

        await vi.waitFor(() => expect(depth["_shadersLoaded"]).toBe(true));
        scene.dispose();
        engine.dispose();
    });

    it("preserves applicable fog in classic color while keeping point depth", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        const controller = CreateController(mesh);
        const depth = scene.enableDepthRenderer(camera);
        controller["_colorMode"] = true;
        controller["_depthMode"] = true;
        controller["_runCompute"] = vi.fn();
        engine.currentRenderPassId = camera.renderPassId;
        scene.fogMode = Scene.FOGMODE_EXP;
        expect(controller.drawColorPass(true)).toBe(false);
        engine.currentRenderPassId = depth.getDepthMap().renderPassId;
        expect(controller.drawColorPass(false)).toBe(true);
        engine.currentRenderPassId = camera.renderPassId;
        scene.fogEnabled = false;
        expect(controller.drawColorPass(true)).toBe(true);
        scene.fogEnabled = true;
        mesh.applyFog = false;
        expect(controller.drawColorPass(true)).toBe(true);
        mesh.applyFog = true;
        mesh.material!.fogEnabled = false;
        expect(controller.drawColorPass(true)).toBe(true);
        mesh.material!.fogEnabled = true;
        scene.fogMode = Scene.FOGMODE_NONE;
        expect(controller.drawColorPass(true)).toBe(true);
        await vi.waitFor(() => expect(depth["_shadersLoaded"]).toBe(true));
        scene.dispose();
        engine.dispose();
    });

    it("preserves an enabled solid-color override without disabling point depth", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        const plugin = new GaussianSplattingSolidColorMaterialPlugin(mesh.material as GaussianSplattingMaterial, [Color3.Red()]);
        const controller = CreateController(mesh);
        const depth = scene.enableDepthRenderer(camera);
        controller["_colorMode"] = true;
        controller["_depthMode"] = true;
        controller["_resultReady"] = true;
        controller["_enableColorBlit"]();
        controller["_enableDepthBlit"]();
        scene.setTransformMatrix(camera.getViewMatrix(), camera.getProjectionMatrix());
        controller["_vpMatrix"].copyFrom(scene.getTransformMatrix());
        controller["_computedWidth"] = engine.getRenderWidth();
        controller["_computedHeight"] = engine.getRenderHeight();
        const colorMesh = controller["_blitMesh"]!;
        const depthMesh = controller["_depthBlitMesh"]!;
        vi.spyOn(controller["_blit"]!, "isReady").mockReturnValue(true);
        vi.spyOn(controller["_depthBlit"]!, "isReady").mockReturnValue(true);
        const colorDraw = vi.spyOn(colorMesh, "render").mockReturnValue(colorMesh);
        const depthDraw = vi.spyOn(depthMesh, "render").mockReturnValue(depthMesh);

        engine.currentRenderPassId = camera.renderPassId;
        expect(controller.drawColorPass(true)).toBe(false);
        expect(colorDraw).not.toHaveBeenCalled();
        engine.currentRenderPassId = depth.getDepthMap().renderPassId;
        expect(controller.drawColorPass(false)).toBe(true);
        expect(depthDraw).toHaveBeenCalledTimes(1);
        plugin.isEnabled = false;
        engine.currentRenderPassId = camera.renderPassId;
        expect(controller.drawColorPass(true)).toBe(true);
        expect(colorDraw).toHaveBeenCalledTimes(1);

        await vi.waitFor(() => expect(depth["_shadersLoaded"]).toBe(true));
        scene.dispose();
        engine.dispose();
    });

    it("passes camera, projection and material state to the compute and compositors", async () => {
        const engine = new NullEngine();
        engine.getCaps().fragmentDepthSupported = true;
        const scene = new Scene(engine);
        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        camera.maxZ = 1000;
        scene.setTransformMatrix(camera.getViewMatrix(), camera.getProjectionMatrix());
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        mesh.disableDepthSort = true;
        const data = new ArrayBuffer(32);
        new Float32Array(data)[2] = 20;
        mesh.updateData(data);
        const controller = CreateController(mesh);
        controller["_colorMode"] = true;
        controller["_depthMode"] = true;
        controller["_renderScale"] = 1;
        controller["_enableColorBlit"]();
        controller["_enableDepthBlit"]();
        const renderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
        vi.spyOn(renderer, "supportsWorkload").mockReturnValue(true);
        vi.spyOn(renderer, "updateSplats").mockImplementation(() => {});
        vi.spyOn(renderer, "resetAccumulation").mockImplementation(() => {});
        vi.spyOn(renderer, "setPartData").mockImplementation(() => {});
        const setProjection = vi.spyOn(renderer, "setProjectionMatrix").mockImplementation(() => {});
        const setCamera = vi.spyOn(renderer, "setCamera").mockImplementation(() => {});
        const renderToBuffer = vi.spyOn(renderer, "renderToBuffer").mockReturnValue(true);
        vi.spyOn(renderer, "renderedFrameCount", "get").mockReturnValue(0);
        vi.spyOn(renderer, "accumulationVersion", "get").mockReturnValue(0);
        vi.spyOn(renderer, "pixelCycleLength", "get").mockReturnValue(1);
        vi.spyOn(renderer, "outputWidth", "get").mockReturnValue(4);
        vi.spyOn(renderer, "outputHeight", "get").mockReturnValue(4);
        vi.spyOn(renderer, "accumBuffer", "get").mockReturnValue({} as never);
        vi.spyOn(renderer, "accumDepthBuffer", "get").mockReturnValue({} as never);
        controller["_renderer"] = renderer;
        const blit = controller["_blit"]!;
        vi.spyOn(blit, "setAccumBuffer").mockImplementation(() => {});
        vi.spyOn(blit, "setAccumDepthBuffer").mockImplementation(() => {});
        const setInverseProjection = vi.spyOn(blit, "setInverseProjection");
        const depthBlit = controller["_depthBlit"]!;
        vi.spyOn(depthBlit, "setAccumBuffer").mockImplementation(() => {});
        vi.spyOn(depthBlit, "setAccumDepthBuffer").mockImplementation(() => {});
        const setDepthInverseProjection = vi.spyOn(depthBlit, "setInverseProjection");
        const setLogDepth = vi.spyOn(blit, "setLogarithmicDepthConstant");
        controller["_ensureCompute"]();

        await vi.waitFor(() => {
            controller["_runCompute"]();
            expect(renderToBuffer).toHaveBeenCalled();
        });
        expect(setLogDepth).toHaveBeenLastCalledWith(0);

        (mesh.material as GaussianSplattingMaterial).useLogarithmicDepth = true;
        controller["_runCompute"]();
        expect(setLogDepth).toHaveBeenLastCalledWith(2 / Math.log2(1001));
        const projection = camera.getProjectionMatrix();
        expect(setProjection.mock.lastCall![0]).toBe(projection);
        expect(setInverseProjection.mock.lastCall![0].equals(Matrix.Invert(projection))).toBe(true);

        // Matches the classic material: a zero kernel size falls back to the default.
        (mesh.material as GaussianSplattingMaterial).kernelSize = 0;
        controller["_runCompute"]();
        expect(renderer.kernelSize).toBe(GaussianSplattingMaterial.KernelSize);

        const customProjection = Matrix.PerspectiveFovLH(camera.fov, 3, camera.minZ, camera.maxZ);
        customProjection.setRowFromFloats(0, customProjection.m[0], customProjection.m[1], 0.03, 0.02);
        customProjection.setRowFromFloats(1, customProjection.m[4], customProjection.m[5], -0.04, 0.1);
        scene.setTransformMatrix(camera.getViewMatrix(), customProjection);
        controller["_runCompute"]();
        expect(setCamera.mock.lastCall![0]).toBe(scene.getViewMatrix());
        expect(setCamera.mock.lastCall![1].equals(scene.getTransformMatrix())).toBe(true);
        expect(setProjection.mock.lastCall![0]).toBe(customProjection);
        expect(setInverseProjection.mock.lastCall![0].equals(Matrix.Invert(customProjection))).toBe(true);
        expect(setDepthInverseProjection.mock.lastCall![0].equals(Matrix.Invert(customProjection))).toBe(true);
        expect(setCamera.mock.lastCall![4]).toBeCloseTo((engine.getRenderWidth() * customProjection.m[0]) / 2);

        // An ignored camera maxZ is an infinite far plane, so a splat beyond maxZ stays in the depth span.
        camera.maxZ = 5;
        camera.ignoreCameraMaxZ = true;
        scene.setTransformMatrix(camera.getViewMatrix(), camera.getProjectionMatrix(true));
        controller["_runCompute"]();
        const [, , , far, , , , , , , vzMax] = setCamera.mock.lastCall!;
        expect(far).toBe(0);
        expect(vzMax).toBeGreaterThan(5);

        controller["_renderer"] = null;
        scene.dispose();
        engine.dispose();
    });

    it.each([
        { rightHanded: false, reverse: false, custom: false },
        { rightHanded: true, reverse: false, custom: false },
        { rightHanded: false, reverse: true, custom: false },
        { rightHanded: true, reverse: true, custom: false },
        { rightHanded: false, reverse: false, custom: true },
        { rightHanded: true, reverse: false, custom: true },
        { rightHanded: false, reverse: true, custom: true },
        { rightHanded: true, reverse: true, custom: true },
    ])("bounds projected depth with handedness=$rightHanded, reverse=$reverse, custom=$custom", ({ rightHanded, reverse, custom }) => {
        const projection = Matrix.Identity();
        const near = reverse ? 20 : 0.1;
        const far = reverse ? 0.1 : 20;
        if (rightHanded) {
            Matrix.PerspectiveFovRHToRef(1, 1.5, near, far, projection, true, true, 0.2, reverse);
        } else {
            Matrix.PerspectiveFovLHToRef(1, 1.5, near, far, projection, true, true, 0.2, reverse);
        }
        if (custom) {
            projection.setRowFromFloats(0, projection.m[0], projection.m[1], 0.07, 0.03);
            projection.setRowFromFloats(1, projection.m[4], projection.m[5], -0.04, projection.m[7] - 0.05);
        }
        const renderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
        renderer["_projZ"] = new Float32Array(4);
        Object.defineProperty(renderer, "_projectedDepthSpan", { value: new Float32Array([0, 1]) });
        renderer.rightHandedSystem = rightHanded;
        renderer.setCamera(Matrix.Identity(), projection, 0.1, 20, 1, 1, 0, 0, 0, 2, 6);
        renderer.setProjectionMatrix(projection, Matrix.Invert(projection), reverse);
        expect(renderer["_projectedDepth"]).toBe(true);
        const [min, max] = renderer["_getProjectedDepthSpan"]();
        for (const z of [2, 4, 6]) {
            for (const y of [-0.5, 0, 0.5]) {
                const ndc = Vector3.TransformCoordinates(new Vector3(0.3, y, rightHanded ? -z : z), projection);
                const depth = Math.max(0, Math.min(1, reverse ? 1 - ndc.z : ndc.z));
                expect(depth).toBeGreaterThanOrEqual(min - 1e-6);
                expect(depth).toBeLessThanOrEqual(max + 1e-6);
            }
        }
        renderer.setProjectionZ(1, 1, -0.1, 0);
        expect(renderer["_projectedDepth"]).toBe(false);
        expect(renderer["_projection"]).toBeNull();
    });

    it("bounds projected depth for padded jitter samples and when a projected horizon crosses the model", () => {
        const createRenderer = (projection: Matrix, vzMin: number, vzMax: number) => {
            const renderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
            renderer["_projZ"] = new Float32Array(4);
            Object.defineProperty(renderer, "_projectedDepthSpan", { value: new Float32Array(2) });
            renderer.setCamera(Matrix.Identity(), projection, 0.1, 20, 1, 1, 0, 0, 0, vzMin, vzMax);
            renderer.setProjectionMatrix(projection, Matrix.Invert(projection));
            return renderer;
        };

        // Non-divisible output sizes pad the last jitter samples past the NDC edge.
        const perspective = Matrix.Identity();
        Matrix.PerspectiveFovLHToRef(1, 1.5, 0.1, 20, perspective, true, true, 0.2);
        const padded = createRenderer(perspective, 2, 6);
        const maxY = (2 * Math.ceil(239 / 4) * 4) / 239 - 1;
        const y = (maxY * 2) / (perspective.m[5] - maxY * perspective.m[7]);
        const depth = Vector3.TransformCoordinates(new Vector3(0, y, 2), perspective).z;
        expect(depth).toBeGreaterThanOrEqual(padded["_getProjectedDepthSpan"](1, maxY)[0] - 1e-6);

        const horizon = Matrix.Identity();
        horizon.setRowFromFloats(0, 1, 0, 0.1, 0);
        horizon.setRowFromFloats(2, 0, 0, 1, -1);
        const crossing = createRenderer(horizon, 0.5, 2);
        expect(crossing["_projectedDepth"]).toBe(true);
        const span = crossing["_getProjectedDepthSpan"]();
        expect(Array.from(span)).toEqual([0, 1]);
        expect(crossing["_getProjectedDepthSpan"]()).toBe(span);
    });

    it("rejects workloads that exceed the device storage buffer limits", () => {
        const renderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
        Object.defineProperty(renderer, "_engine", { value: { currentLimits: { maxStorageBufferBindingSize: 134217728, maxBufferSize: 268435456 } } });

        expect(renderer.supportsWorkload(1_000_000, 0, 1920, 1080)).toBe(true);
        // 64 bytes of screen data per Gaussian.
        expect(renderer.supportsWorkload(3_000_000, 0, 1920, 1080)).toBe(false);
        // 16 bytes of accumulated color per output pixel.
        expect(renderer.supportsWorkload(1_000_000, 0, 5120, 2880)).toBe(false);
        // Degree-4 SH packs 72 bytes per Gaussian, more than the screen data.
        expect(renderer.supportsWorkload(2_000_000, 3, 1920, 1080)).toBe(true);
        expect(renderer.supportsWorkload(2_000_000, 4, 1920, 1080)).toBe(false);
    });

    it("serializes the point settings but not the internal compositors", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        const controller = CreateController(mesh);
        mesh.pointSplattingScale = 2;
        mesh.pointSplattingRenderScale = 0.5;
        mesh.pointSplattingOcclusionCulling = true;
        controller["_enableColorBlit"]();
        controller["_enableDepthBlit"]();
        expect(controller["_blit"]!.doNotSerialize).toBe(true);
        expect(controller["_depthBlit"]!.doNotSerialize).toBe(true);
        expect(controller["_blitMesh"]!.doNotSerialize).toBe(true);
        expect(controller["_depthBlitMesh"]!.doNotSerialize).toBe(true);
        // The color compositor blends without forcing depth writes.
        expect(controller["_blit"]!.needAlphaBlending()).toBe(true);
        expect(controller["_blit"]!.forceDepthWrite).toBe(false);

        const parsed = GaussianSplattingMesh.Parse(mesh.serialize(), scene);
        expect(parsed.pointSplattingScale).toBe(2);
        expect(parsed.pointSplattingRenderScale).toBe(0.5);
        expect(parsed.pointSplattingOcclusionCulling).toBe(true);

        scene.dispose();
        engine.dispose();
    });
});
